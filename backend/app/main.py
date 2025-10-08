"""Main FastAPI application."""
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime
from typing import Union
import logging

from app.config import settings
from app.models import (
    TransactionBatch,
    FraudDetectionResponse,
    RefusalResponse,
    HealthCheckResponse,
    ErrorResponse,
    LLMExplanationRequest,
    LLMExplanationResponse,
    PatternAnalysisRequest,
    PatternAnalysisResponse,
)
from app.fraud_detector import fraud_detector
from app.observability import setup_observability, instrument_app
from app.openrouter_service import openrouter_service

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


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler."""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            error="Internal Server Error",
            detail=str(exc) if settings.debug else "An unexpected error occurred",
            timestamp=datetime.utcnow(),
        ).model_dump(),
    )


@app.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """Health check endpoint."""
    return HealthCheckResponse(
        status="healthy",
        version=settings.app_version,
        timestamp=datetime.utcnow(),
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
            "explain": "/api/explain",
            "llm_explain": "/api/llm/explain",
            "pattern_analysis": "/api/llm/patterns",
            "cases": "/api/cases",
            "schema": "/api/schema",
        },
        "llm_status": {
            "service_available": openrouter_service.is_available(),
            "model": openrouter_service.model if openrouter_service.is_available() else None
        },
    }


@app.post(
    "/api/analyze",
    response_model=Union[FraudDetectionResponse, RefusalResponse],
    status_code=status.HTTP_200_OK,
)
async def analyze_transactions(batch: TransactionBatch):
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


@app.get("/api/explain")
async def explain_model():
    """
    Placeholder endpoint for model explanation.
    
    In a full implementation, this would provide:
    - Model architecture details
    - Feature importance
    - Decision boundaries
    - Performance metrics
    """
    return {
        "model": "Fraud Detection ML Model",
        "version": "1.0.0",
        "description": "Machine learning model for credit card fraud detection",
        "features": [
            "transaction_amount",
            "merchant_category",
            "transaction_time",
            "location",
            "merchant_reputation",
        ],
        "classification_thresholds": {
            "legitimate": "risk_score < 0.45",
            "suspicious": "0.45 <= risk_score < 0.75",
            "fraudulent": "risk_score >= 0.75",
        },
        "note": "This is a placeholder endpoint. Full implementation pending.",
    }


@app.get("/api/cases")
async def get_case_examples():
    """
    Placeholder endpoint for fraud case examples.
    
    In a full implementation, this would provide:
    - Historical fraud cases
    - Common fraud patterns
    - Prevention strategies
    - Statistical analysis
    """
    return {
        "total_cases": 0,
        "examples": [],
        "patterns": [
            {
                "name": "High-value late-night transactions",
                "description": "Transactions over $5000 occurring between 2am-5am",
                "risk_level": "high",
            },
            {
                "name": "International gambling",
                "description": "Gambling transactions from international locations",
                "risk_level": "high",
            },
            {
                "name": "Rapid succession purchases",
                "description": "Multiple transactions within minutes",
                "risk_level": "medium",
            },
        ],
        "note": "This is a placeholder endpoint. Full implementation pending.",
    }


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
        logger.info(f"Generating LLM explanation for transaction {request.transaction_data.get('transaction_id', 'unknown')}")
        
        if not openrouter_service.is_available():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="LLM explanation service is not available. Please check OpenRouter configuration.",
            )
        
        explanation = await openrouter_service.explain_fraud_prediction(
            request.transaction_data,
            request.fraud_probability,
            request.risk_factors,
            request.model_features
        )
        
        # Determine risk level
        if request.fraud_probability > 0.75:
            risk_level = "HIGH"
        elif request.fraud_probability > 0.45:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"
        
        response = LLMExplanationResponse(
            transaction_id=request.transaction_data.get("transaction_id", "unknown"),
            explanation=explanation,
            fraud_probability=request.fraud_probability,
            risk_level=risk_level,
            model_used=openrouter_service.model,
            generated_at=datetime.utcnow()
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
            request.transactions,
            request.predictions
        )
        
        # Calculate statistics
        high_risk_count = sum(1 for p in request.predictions if p > 0.75)
        medium_risk_count = sum(1 for p in request.predictions if 0.45 <= p <= 0.75)
        low_risk_count = len(request.predictions) - high_risk_count - medium_risk_count
        avg_risk = sum(request.predictions) / len(request.predictions) if request.predictions else 0.0
        
        response = PatternAnalysisResponse(
            analysis=analysis,
            transaction_count=len(request.transactions),
            high_risk_count=high_risk_count,
            medium_risk_count=medium_risk_count,
            low_risk_count=low_risk_count,
            average_risk_score=round(avg_risk, 3),
            model_used=openrouter_service.model,
            generated_at=datetime.utcnow()
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