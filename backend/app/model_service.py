"""
Main model service for fraud detection predictions.
Coordinates model loading, feature engineering, and predictions.
"""

import logging
from typing import List, Dict, Any, Optional
import numpy as np
import pandas as pd

from app.model_loader import model_loader
from app.feature_engineering import feature_engineer
from app.models import FraudAnalysis, FraudClassification, ShapFeatureExplanation
from app.xai.shap_explainer import shap_explainer_service

logger = logging.getLogger(__name__)


class ModelService:
    """Main service for fraud detection model predictions."""

    def __init__(self):
        """Initialize model service."""
        self._is_initialized = False

    def initialize(self) -> bool:
        """
        Initialize the model service by loading all required artifacts.

        Returns:
            bool: True if initialization successful, False otherwise
        """
        try:
            logger.info("Initializing Model Service...")

            # Load model artifacts
            success = model_loader.load_model_artifacts()

            if not success:
                logger.error("❌ Failed to load model artifacts")
                return False

            # Initialize SHAP explainer
            model_info = model_loader.get_model_info()
            if model_info.get("feature_names") and model_loader._model is not None:
                shap_success = shap_explainer_service.initialize(
                    model_loader._model, model_info["feature_names"]
                )
                if not shap_success:
                    logger.warning(
                        "SHAP explainer initialization failed, continuing without SHAP features"
                    )
            else:
                logger.warning(
                    "Model or feature names not available, SHAP explainer not initialized"
                )

            self._is_initialized = True
            logger.info("Model Service initialized successfully")

            return True

        except Exception as e:
            logger.error(f"❌ Model Service initialization failed: {str(e)}", exc_info=True)
            return False

    def predict_transactions(self, transactions: List[Dict[str, Any]]) -> List[FraudAnalysis]:
        """
        Predict fraud for a list of transactions.

        Args:
            transactions: List of transaction dictionaries in JSON format

        Returns:
            List[FraudAnalysis]: Fraud analysis results for each transaction
        """
        if not self._is_initialized:
            if not self.initialize():
                raise RuntimeError("Model service initialization failed")

        try:
            # Step 1: Convert JSON to features
            logger.info(f"🔄 Processing {len(transactions)} transactions...")
            X, y = feature_engineer.process_transactions(transactions)

            # Step 2: Validate features against expected model features
            model_info = model_loader.get_model_info()
            if model_info.get("feature_names"):
                feature_engineer.validate_features(X, model_info["feature_names"])

            # Step 3: Get predictions from model
            logger.info("🤖 Running model predictions...")
            probabilities, predictions = model_loader.predict_with_threshold(X.values)

            # Step 4: Generate analysis results
            results = []
            for i, (tx, prob, pred) in enumerate(zip(transactions, probabilities, predictions)):
                analysis = self._create_fraud_analysis(
                    transaction=tx,
                    probability=float(prob),
                    binary_prediction=int(pred),
                    feature_values=X.iloc[i].to_dict(),
                    features_df=X.iloc[[i]],  # Single row DataFrame for SHAP
                )
                results.append(analysis)

            logger.info(f"Prediction complete: {len(results)} analyses generated")

            return results

        except Exception as e:
            logger.error(f"Prediction failed: {str(e)}", exc_info=True)
            raise RuntimeError(f"Prediction failed: {str(e)}")

    def _create_fraud_analysis(
        self,
        transaction: Dict[str, Any],
        probability: float,
        binary_prediction: int,
        feature_values: Dict[str, float],
        features_df: Optional[pd.DataFrame] = None,
    ) -> FraudAnalysis:
        """
        Create a FraudAnalysis object from prediction results.

        Args:
            transaction: Original transaction data
            probability: Fraud probability [0.0, 1.0]
            binary_prediction: Binary prediction (0 or 1)
            feature_values: Feature values used for prediction

        Returns:
            FraudAnalysis: Fraud analysis result
        """
        try:
            # Determine classification based on probability ranges
            if probability >= 0.75:
                classification = FraudClassification.FRAUDULENT
                classification_text = "fraudulent"
            elif probability >= 0.45:
                classification = FraudClassification.SUSPICIOUS
                classification_text = "suspicious"
            else:
                classification = FraudClassification.LEGITIMATE
                classification_text = "legitimate"

            # Generate legacy risk factors based on feature analysis
            risk_factors = self._analyze_risk_factors(feature_values, probability)

            # Get transaction data first
            tx_data = transaction["transaction"]

            # Generate SHAP-based explanations if available
            shap_explanations = []
            if features_df is not None and shap_explainer_service.is_initialized:
                try:
                    shap_features = shap_explainer_service.get_shap_explanation(
                        features_df, top_n=4
                    )
                    shap_explanations = [
                        ShapFeatureExplanation(
                            feature_name=sf.feature_name,
                            shap_value=sf.shap_value,
                            feature_value=sf.feature_value,
                            human_title=sf.human_title,
                            human_detail=sf.human_detail,
                            icon=sf.icon,
                            severity=sf.severity,
                        )
                        for sf in shap_features
                    ]
                    logger.debug(
                        f"Generated {len(shap_explanations)} SHAP explanations for transaction {tx_data['id']}"
                    )
                except Exception as e:
                    logger.warning(
                        f"SHAP explanation generation failed for transaction {tx_data['id']}: {str(e)}"
                    )

            # Generate explanation
            explanation = self._generate_explanation(
                tx_data, probability, classification_text, risk_factors
            )

            return FraudAnalysis(
                transaction_id=tx_data["id"],
                classification=classification,
                risk_score=round(probability, 3),
                risk_factors=risk_factors,
                explanation=explanation,
                shap_explanations=shap_explanations,
            )

        except Exception as e:
            logger.error(f"❌ Failed to create fraud analysis: {str(e)}")
            # Return a fallback analysis
            return FraudAnalysis(
                transaction_id=transaction["transaction"]["id"],
                classification=FraudClassification.UNKNOWN,
                risk_score=0.5,
                risk_factors=["Analysis failed"],
                explanation="Unable to complete fraud analysis due to system error.",
            )

    def _analyze_risk_factors(
        self, feature_values: Dict[str, float], probability: float
    ) -> List[str]:
        """
        Analyze feature values to identify key risk factors.

        Args:
            feature_values: Dictionary of feature names and values
            probability: Overall fraud probability

        Returns:
            List[str]: List of human-readable risk factors
        """
        risk_factors = []

        try:
            # High-impact temporal features
            if (
                feature_values.get("log_trans_in_last_1h", 0) > 2.0
            ):  # More than ~7 transactions in 1h
                risk_factors.append("High transaction frequency in last hour")

            if (
                feature_values.get("log_trans_in_last_24h", 0) > 3.5
            ):  # More than ~30 transactions in 24h
                risk_factors.append("Unusually high transaction volume in 24 hours")

            # Amount ratio indicators
            if feature_values.get("log_amt_per_card_avg_ratio_1h", 0) > 10:
                risk_factors.append("Transaction amount significantly above card's recent average")

            if feature_values.get("log_amt_per_category_avg_ratio_1h", 0) > 10:
                risk_factors.append("Amount unusual for merchant category")

            # Temporal fraud windows
            if feature_values.get("is_late_night_fraud_window", 0) == 1:
                risk_factors.append("Transaction occurred during high-risk hours (11 PM - 5 AM)")

            # Spending deviation
            amt_diff = feature_values.get("amt_diff_from_card_median_7d", 0)
            if amt_diff > 500:
                risk_factors.append(f"Amount ${amt_diff:.2f} above recent median spending")
            elif amt_diff < -500:
                risk_factors.append(f"Amount ${abs(amt_diff):.2f} below recent median spending")

            # If high risk but no obvious factors identified, add general statement
            if probability > 0.7 and len(risk_factors) == 0:
                risk_factors.append("Complex pattern detected by ML model")

            # If low risk, add positive indicator
            if probability < 0.3:
                risk_factors.append("Transaction consistent with normal spending patterns")

        except Exception as e:
            logger.warning(f"Risk factor analysis failed: {str(e)}")
            risk_factors = ["Risk factor analysis unavailable"]

        return risk_factors

    def _generate_explanation(
        self,
        transaction_data: Dict[str, Any],
        probability: float,
        classification: str,
        risk_factors: List[str],
    ) -> str:
        """
        Generate human-readable explanation for the fraud prediction.

        Args:
            transaction_data: Transaction information
            probability: Fraud probability
            classification: Classification result
            risk_factors: List of risk factors

        Returns:
            str: Human-readable explanation
        """
        try:
            amount = transaction_data["amount"]
            merchant = transaction_data["merchant"]["name"]

            # Create base explanation
            explanation = f"This ${amount:.2f} transaction at {merchant} is classified as "
            explanation += f"{classification.upper()} (risk score: {probability:.1%}). "

            # Add risk factors with better formatting
            if risk_factors:
                if len(risk_factors) == 1:
                    explanation += f"Key concern: {risk_factors[0]}."
                else:
                    explanation += "\n\nKey concerns:\n"
                    for i, factor in enumerate(risk_factors, 1):
                        explanation += f"• {factor}\n"
                    # Remove the last newline
                    explanation = explanation.rstrip()

            return explanation

        except Exception as e:
            logger.warning(f"Explanation generation failed: {str(e)}")
            return f"Transaction classified as {classification} with {probability:.1%} fraud probability."

    def get_service_status(self) -> Dict[str, Any]:
        """Get the current status of the model service."""
        return {
            "initialized": self._is_initialized,
            "model_loaded": model_loader.is_loaded,
            "model_info": model_loader.get_model_info() if model_loader.is_loaded else {},
        }

    def health_check(self) -> bool:
        """Perform a health check on the model service."""
        try:
            if not self._is_initialized:
                return False

            if not model_loader.is_loaded:
                return False

            # Test with a small dummy prediction
            dummy_features = np.zeros((1, len(model_loader.feature_names)))
            _ = model_loader.predict_proba(dummy_features)

            return True

        except Exception as e:
            logger.error(f"Health check failed: {str(e)}")
            return False


# Global model service instance
model_service = ModelService()
