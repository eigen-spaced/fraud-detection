"""Main FastAPI application."""

import logging
from datetime import datetime, timezone
from typing import Union

from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.fraud_detector import fraud_detector
from app.model_service import model_service
from app.models import (
    DatabaseStatsResponse,
    EngineeredTransactionResponse,
    ErrorResponse,
    FraudDetectionResponse,
    HealthCheckResponse,
    LLMExplanationRequest,
    LLMExplanationResponse,
    PatternAnalysisRequest,
    PatternAnalysisResponse,
    RefusalResponse,
    TransactionBatch,
    TransactionSampleResponse,
)
from app.observability import instrument_app, setup_observability
from app.openrouter_service import openrouter_service
from app.prediction_models import (
    ModelHealthResponse,
    ModelInfoResponse,
    ModelPredictionRequest,
    ModelPredictionResponse,
    ModelVersionResponse,
)
from app.database import init_db, close_db, get_db
from app.db_service import save_batch_analyses, get_sample_transactions, get_database_stats
from app.model_loader import model_loader
from sqlalchemy.ext.asyncio import AsyncSession

# Configure logging
logger = logging.getLogger(__name__)

# Initialize observability
setup_observability()

# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="AI-powered credit card fraud detection API with MCP integration",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instrument app with OpenTelemetry
instrument_app(app)


@app.on_event("startup")
async def startup_event():
    """Initialize database on application startup."""
    try:
        await init_db()
        logger.info("✅ Application startup complete")
    except Exception as e:
        logger.error(f"❌ Startup failed: {str(e)}", exc_info=True)


@app.on_event("shutdown")
async def shutdown_event():
    """Close database connections on application shutdown."""
    try:
        await close_db()
        logger.info("✅ Application shutdown complete")
    except Exception as e:
        logger.error(f"❌ Shutdown failed: {str(e)}", exc_info=True)


def convert_json_to_ml_format(json_transaction: dict) -> dict:
    """Convert simple JSON transaction to ML model format."""
    return {
        "transaction": {
            "id": json_transaction.get("transaction_id", "unknown"),
            "timestamp": json_transaction.get("timestamp", "2023-01-01T12:00:00Z"),
            "merchant": {
                "name": json_transaction.get("merchant_name", "Unknown"),
                "category": json_transaction.get("merchant_category", "unknown"),
                "location": {"lat": 0.0, "lng": 0.0},  # Default coordinates
            },
            "amount": json_transaction.get("amount", 0.0),
            "card": {
                "number": json_transaction.get("card_number", "0000"),
                "full": f"{json_transaction.get('card_number', '0000')}567890121234",
            },
            "account": {"number": "1234", "full": "1234567890123456"},
        },
        "model_features": {
            "temporal": {
                "trans_in_last_1h": 1.0,
                "trans_in_last_24h": 3.0,
                "trans_in_last_7d": 15.0,
            },
            "amount_ratios": {
                "amt_per_card_avg_ratio_1h": 1.2,
                "amt_per_card_avg_ratio_24h": 1.1,
                "amt_per_card_avg_ratio_7d": 1.0,
                "amt_per_category_avg_ratio_1h": 0.9,
                "amt_per_category_avg_ratio_24h": 0.8,
                "amt_per_category_avg_ratio_7d": 0.7,
            },
            "deviations": {"amt_diff_from_card_median_7d": 50.0},
        },
        "ground_truth": {"is_fraud": False},  # Default, not used in prediction
    }


@app.exception_handler(Exception)
async def global_exception_handler(_, exc):
    """Global exception handler."""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            error="Internal Server Error",
            detail=str(exc) if settings.debug else "An unexpected error occurred",
            timestamp=datetime.now(timezone.utc),
        ).model_dump(),
    )


@app.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """Health check endpoint."""
    return HealthCheckResponse(
        status="healthy",
        version=settings.app_version,
        timestamp=datetime.now(timezone.utc),
    )


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "status": "running",
        "endpoints": {
            "health": "/health",
            "analyze": "/api/analyze",
            "predict": "/api/predict",
            "model_health": "/api/model/health",
            "model_info": "/api/model/info",
            "version": "/version",
            "llm_explain": "/api/llm/explain",
            "pattern_analysis": "/api/llm/patterns",
            "schema": "/api/schema",
            "transactions_sample": "/api/transactions/sample",
            "stats": "/api/stats",
        },
        "llm_status": {
            "service_available": openrouter_service.is_available(),
            "model": openrouter_service.model if openrouter_service.is_available() else None,
        },
    }


@app.post(
    "/api/analyze",
    response_model=Union[FraudDetectionResponse, RefusalResponse],
    status_code=status.HTTP_200_OK,
)
async def analyze_transactions(batch: TransactionBatch, db: AsyncSession = Depends(get_db)):
    """
    Analyze a batch of credit card transactions for fraud.

    This endpoint accepts a batch of transactions and returns:
    - Fraud classification for each transaction
    - Risk scores with numeric bounds [0.0, 1.0]
    - Human-readable explanations
    - Citations from allowed domains
    - Warnings for any issues

    The request may be refused if:
    - Batch size exceeds limit
    - PII policy is violated
    - Red-team prompt injection is detected
    """
    try:
        logger.info(f"Analyzing {len(batch.transactions)} transactions")

        result = fraud_detector.analyze_transactions(batch.transactions)

        if isinstance(result, RefusalResponse):
            logger.warning(f"Request refused: {result.reason}")
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content=result.model_dump(),
            )

        logger.info(
            f"Analysis complete: {result.fraudulent_count} fraudulent, "
            f"{result.suspicious_count} suspicious, {result.legitimate_count} legitimate"
        )

        # Persist results to database (non-blocking, log errors but don't fail)
        try:
            model_version = model_loader.version if model_loader.is_loaded else "unknown"
            saved = await save_batch_analyses(
                db,
                result.analyses,
                batch.transactions,
                model_version,
            )
            logger.info(f"Saved {saved} analyses to database")
        except Exception as db_error:
            logger.error(f"Database save failed: {str(db_error)}", exc_info=True)
            # Continue serving the response even if DB save fails

        return result

    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Error analyzing transactions: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to analyze transactions",
        )


@app.post(
    "/api/predict",
    response_model=ModelPredictionResponse,
    status_code=status.HTTP_200_OK,
)
async def predict_with_ml_model(
    request: ModelPredictionRequest, db: AsyncSession = Depends(get_db)
):
    """
    Predict fraud using the trained XGBoost model.

    This endpoint takes transactions in the JSON format from the frontend
    and returns predictions from the trained ML model with optimal threshold.

    Features:
    - Real XGBoost model predictions
    - Optimal threshold application
    - Feature engineering pipeline
    - Risk factor analysis
    - Human-readable explanations
    """
    try:
        logger.info(f"ML Model prediction requested for {len(request.transactions)} transactions")

        # Convert transactions to ML model format
        ml_transactions = [convert_json_to_ml_format(txn) for txn in request.transactions]

        # Get predictions from model service
        analyses = model_service.predict_transactions(ml_transactions)

        # Calculate summary statistics
        total_transactions = len(analyses)
        fraudulent_count = sum(1 for a in analyses if a.classification.value == "fraudulent")
        suspicious_count = sum(1 for a in analyses if a.classification.value == "suspicious")
        legitimate_count = total_transactions - fraudulent_count - suspicious_count

        # Calculate average risk score
        average_risk_score = (
            sum(a.risk_score for a in analyses) / total_transactions if analyses else 0.0
        )

        # Generate summary text
        summary = f"ML Model analyzed {total_transactions} transactions: "
        summary += f"{fraudulent_count} fraudulent, {suspicious_count} suspicious, {legitimate_count} legitimate. "
        summary += f"Average risk score: {average_risk_score:.1%}."

        # Get model info
        model_info = model_service.get_service_status()

        # Convert analyses to dict format
        analyses_dict = [a.model_dump() for a in analyses]

        response = ModelPredictionResponse(
            summary=summary,
            total_transactions=total_transactions,
            fraudulent_count=fraudulent_count,
            suspicious_count=suspicious_count,
            legitimate_count=legitimate_count,
            average_risk_score=round(average_risk_score, 3),
            model_info=model_info,
            analyses=analyses_dict,
            citations=[
                {
                    "source": "XGBoost Fraud Detection Model",
                    "url": "https://xgboost.readthedocs.io/en/stable/",
                }
            ],
            warnings=[],
        )

        logger.info(
            f"ML Model prediction complete: {fraudulent_count} fraudulent, "
            f"{suspicious_count} suspicious, {legitimate_count} legitimate"
        )

        # Persist results to database (non-blocking)
        try:
            model_version = model_loader.version if model_loader.is_loaded else "unknown"
            saved = await save_batch_analyses(
                db,
                analyses,
                request.transactions,
                model_version,
            )
            logger.info(f"Saved {saved} ML predictions to database")
        except Exception as db_error:
            logger.error(f"Database save failed: {str(db_error)}", exc_info=True)

        return response

    except Exception as e:
        logger.error(f"ML Model prediction failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ML Model prediction failed: {str(e)}",
        )


@app.get(
    "/api/model/health",
    response_model=ModelHealthResponse,
    status_code=status.HTTP_200_OK,
)
async def model_health_check():
    """
    Check the health status of the ML model service.

    Returns information about:
    - Model loading status
    - Service initialization
    - Model type and configuration
    - Health check results
    """
    try:
        service_status = model_service.get_service_status()
        health_ok = model_service.health_check()

        status_text = "healthy" if health_ok else "unhealthy"

        response = ModelHealthResponse(
            status=status_text,
            model_loaded=service_status.get("model_loaded", False),
            initialized=service_status.get("initialized", False),
            model_type=service_status.get("model_info", {}).get("model_type"),
            optimal_threshold=service_status.get("model_info", {}).get("optimal_threshold"),
            feature_count=service_status.get("model_info", {}).get("feature_count", 0),
            timestamp=datetime.now(timezone.utc),
        )

        return response

    except Exception as e:
        logger.error(f"Model health check failed: {str(e)}", exc_info=True)
        return ModelHealthResponse(
            status="error",
            model_loaded=False,
            initialized=False,
            feature_count=0,
            timestamp=datetime.now(timezone.utc),
        )


@app.get(
    "/api/model/info",
    response_model=ModelInfoResponse,
    status_code=status.HTTP_200_OK,
)
async def get_model_info():
    """
    Get detailed information about the loaded ML model.

    Returns:
    - Model type and configuration
    - Feature information
    - Loading status
    - Service status
    """
    try:
        service_status = model_service.get_service_status()
        model_info = service_status.get("model_info", {})

        response = ModelInfoResponse(
            model_type=model_info.get("model_type"),
            optimal_threshold=model_info.get("optimal_threshold"),
            feature_count=model_info.get("feature_count", 0),
            feature_names=model_info.get("feature_names", []),
            is_loaded=service_status.get("model_loaded", False),
            service_initialized=service_status.get("initialized", False),
        )

        return response

    except Exception as e:
        logger.error(f"Get model info failed: {str(e)}", exc_info=True)
        return ModelInfoResponse(is_loaded=False, service_initialized=False)


@app.get(
    "/version",
    response_model=ModelVersionResponse,
    status_code=status.HTTP_200_OK,
)
async def get_version():
    """
    Get model and API version information.

    Returns:
    - model_version: Current model version string
    - build_timestamp: Model build timestamp (ISO 8601)
    - api_version: API version
    - service_name: Application name
    - model_type: Model type (e.g., "XGBClassifier")
    - feature_count: Number of features
    - optimal_threshold: Model's optimal threshold
    """
    try:
        model_info = model_loader.get_model_info()

        response = ModelVersionResponse(
            model_version=model_info.get("version", "unknown"),
            build_timestamp=model_info.get("build_timestamp", "unknown"),
            api_version=settings.app_version,
            service_name=settings.app_name,
            model_type=model_info.get("model_type"),
            feature_count=model_info.get("feature_count", 0),
            optimal_threshold=model_info.get("optimal_threshold"),
        )

        return response

    except Exception as e:
        logger.error(f"Get version failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve version information",
        )


@app.get("/api/schema")
async def get_json_schema():
    """
    Get JSON schemas for request and response models.
    """
    return {
        "transaction_batch": TransactionBatch.model_json_schema(),
        "fraud_detection_response": FraudDetectionResponse.model_json_schema(),
        "refusal_response": RefusalResponse.model_json_schema(),
        "llm_explanation_request": LLMExplanationRequest.model_json_schema(),
        "llm_explanation_response": LLMExplanationResponse.model_json_schema(),
        "pattern_analysis_request": PatternAnalysisRequest.model_json_schema(),
        "pattern_analysis_response": PatternAnalysisResponse.model_json_schema(),
    }


@app.post(
    "/api/llm/explain",
    response_model=LLMExplanationResponse,
    status_code=status.HTTP_200_OK,
)
async def explain_transaction_with_llm(request: LLMExplanationRequest):
    """
    Generate LLM-powered explanation for a fraud prediction.

    This endpoint uses OpenRouter's LLM models to provide human-readable
    explanations for fraud detection predictions. It takes:
    - Transaction data
    - Fraud probability from ML model
    - Risk factors identified
    - Optional model features

    Returns a detailed explanation in natural language.
    """
    try:
        logger.info(
            f"Generating LLM explanation for transaction {request.transaction_data.get('transaction_id', 'unknown')}"
        )

        if not openrouter_service.is_available():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="LLM explanation service is not available. Please check OpenRouter configuration.",
            )

        explanation = await openrouter_service.explain_fraud_prediction(
            request.transaction_data,
            request.fraud_probability,
            request.risk_factors,
            request.model_features,
        )

        # Determine risk level using service method
        risk_level = openrouter_service._get_risk_level(request.fraud_probability)

        response = LLMExplanationResponse(
            transaction_id=request.transaction_data.get("transaction_id", "unknown"),
            explanation=explanation,
            fraud_probability=request.fraud_probability,
            risk_level=risk_level,
            model_used=openrouter_service.model,
            generated_at=datetime.now(timezone.utc),
        )

        logger.info(f"Generated explanation for transaction {response.transaction_id}")
        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating LLM explanation: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate explanation",
        )


@app.get(
    "/api/transactions/sample",
    response_model=TransactionSampleResponse,
    status_code=status.HTTP_200_OK,
)
async def get_transaction_sample(
    scenario: str,
    limit: int = 5,
    db: AsyncSession = Depends(get_db),
):
    """
    Get random sample transactions from the engineered_transactions table.

    Query Parameters:
        scenario: Filter scenario - 'fraud', 'legit', or 'mixed'
        limit: Number of transactions to return (default 5, max 100)

    Returns:
        Random sample of engineered transactions with all features
    """
    try:
        # Validate scenario
        if scenario not in ["fraud", "legit", "mixed"]:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Scenario must be 'fraud', 'legit', or 'mixed'",
            )

        # Validate limit
        if limit < 1 or limit > 100:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Limit must be between 1 and 100",
            )

        logger.info(f"Fetching {limit} transactions for scenario '{scenario}'")

        # Get transactions from database
        transactions = await get_sample_transactions(db, scenario, limit)

        if not transactions:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No transactions found for scenario '{scenario}'",
            )

        # Convert to response model
        transaction_responses = [
            EngineeredTransactionResponse(
                trans_num=t.trans_num,
                is_fraud=t.is_fraud,
                # Original transaction data
                cc_num=t.cc_num,
                acct_num=t.acct_num,
                merchant=t.merchant,
                category=t.category,
                lat=t.lat,
                long=t.long,
                merch_lat=t.merch_lat,
                merch_long=t.merch_long,
                # Engineered features
                amt=t.amt,
                hour_of_day=t.hour_of_day,
                is_late_night_fraud_window=t.is_late_night_fraud_window,
                is_late_evening_fraud_window=t.is_late_evening_fraud_window,
                log_trans_in_last_1h=t.log_trans_in_last_1h,
                log_trans_in_last_24h=t.log_trans_in_last_24h,
                log_trans_in_last_7d=t.log_trans_in_last_7d,
                log_amt_per_card_avg_ratio_1h=t.log_amt_per_card_avg_ratio_1h,
                log_amt_per_card_avg_ratio_24h=t.log_amt_per_card_avg_ratio_24h,
                log_amt_per_card_avg_ratio_7d=t.log_amt_per_card_avg_ratio_7d,
                log_amt_per_category_avg_ratio_1h=t.log_amt_per_category_avg_ratio_1h,
                log_amt_per_category_avg_ratio_24h=t.log_amt_per_category_avg_ratio_24h,
                log_amt_per_category_avg_ratio_7d=t.log_amt_per_category_avg_ratio_7d,
                amt_diff_from_card_median_1d=t.amt_diff_from_card_median_1d,
                amt_diff_from_card_median_7d=t.amt_diff_from_card_median_7d,
            )
            for t in transactions
        ]

        response = TransactionSampleResponse(
            transactions=transaction_responses,
            count=len(transaction_responses),
            scenario=scenario,
            timestamp=datetime.now(timezone.utc),
        )

        logger.info(f"Returning {len(transaction_responses)} transactions")
        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching transaction sample: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch transaction sample",
        )


@app.get(
    "/api/stats",
    response_model=DatabaseStatsResponse,
    status_code=status.HTTP_200_OK,
)
async def get_stats(db: AsyncSession = Depends(get_db)):
    """
    Get statistics about the engineered_transactions database.

    Returns:
        Total transaction count, fraud/legit breakdown, and fraud percentage
    """
    try:
        logger.info("Fetching database statistics")

        # Get stats from database
        stats = await get_database_stats(db)

        response = DatabaseStatsResponse(
            total_transactions=stats["total_transactions"],
            fraud_count=stats["fraud_count"],
            legit_count=stats["legit_count"],
            fraud_percentage=stats["fraud_percentage"],
            timestamp=datetime.now(timezone.utc),
        )

        logger.info(
            f"Database stats: {stats['total_transactions']} total, "
            f"{stats['fraud_count']} fraud, {stats['legit_count']} legit"
        )
        return response

    except Exception as e:
        logger.error(f"Error fetching database stats: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch database statistics",
        )


@app.post(
    "/api/llm/patterns",
    response_model=PatternAnalysisResponse,
    status_code=status.HTTP_200_OK,
)
async def analyze_transaction_patterns(request: PatternAnalysisRequest):
    """
    Analyze patterns across multiple transactions using LLM.

    This endpoint analyzes a batch of transactions and their fraud predictions
    to identify patterns, trends, and provide insights. It uses LLM models
    to generate human-readable analysis of the transaction batch.

    Useful for:
    - Batch analysis reporting
    - Identifying suspicious patterns
    - Risk assessment summaries
    - Investigation guidance
    """
    try:
        logger.info(f"Analyzing patterns for {len(request.transactions)} transactions")

        if not openrouter_service.is_available():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="LLM pattern analysis service is not available. Please check OpenRouter configuration.",
            )

        if len(request.transactions) != len(request.predictions):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Number of transactions must match number of predictions",
            )

        analysis = await openrouter_service.analyze_transaction_patterns(
            request.transactions, request.predictions
        )

        # Calculate statistics using service constants
        high_risk_count = sum(
            1 for p in request.predictions if p > openrouter_service.HIGH_RISK_THRESHOLD
        )
        medium_risk_count = sum(
            1
            for p in request.predictions
            if openrouter_service.MEDIUM_RISK_THRESHOLD
            <= p
            <= openrouter_service.HIGH_RISK_THRESHOLD
        )
        low_risk_count = len(request.predictions) - high_risk_count - medium_risk_count
        avg_risk = (
            sum(request.predictions) / len(request.predictions) if request.predictions else 0.0
        )

        response = PatternAnalysisResponse(
            analysis=analysis,
            transaction_count=len(request.transactions),
            high_risk_count=high_risk_count,
            medium_risk_count=medium_risk_count,
            low_risk_count=low_risk_count,
            average_risk_score=round(avg_risk, 3),
            model_used=openrouter_service.model,
            generated_at=datetime.now(timezone.utc),
        )

        logger.info(f"Generated pattern analysis for {response.transaction_count} transactions")
        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing transaction patterns: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to analyze transaction patterns",
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
