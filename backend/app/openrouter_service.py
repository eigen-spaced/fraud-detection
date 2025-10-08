"""OpenRouter LLM service for transaction explanation and analysis."""

import logging
from typing import Dict, List, Any, Optional
from openai import OpenAI
from app.config import settings

logger = logging.getLogger(__name__)


class OpenRouterService:
    """Service for interacting with OpenRouter LLM models."""
    
    # Risk level thresholds (consistent with FraudDetectionService)
    HIGH_RISK_THRESHOLD = 0.85
    MEDIUM_RISK_THRESHOLD = 0.45

    def __init__(self):
        """Initialize OpenRouter service with API key."""
        if not settings.open_router_key:
            logger.warning("OpenRouter API key not configured")
            self.client = None
            return

        self.client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=settings.open_router_key,
        )
        self.model = "anthropic/claude-3.5-sonnet"  # Default model
        logger.info("OpenRouter service initialized")

    def is_available(self) -> bool:
        """Check if OpenRouter service is available."""
        return self.client is not None

    async def explain_fraud_prediction(
        self,
        transaction_data: Dict[str, Any],
        fraud_probability: float,
        risk_factors: List[str],
        model_features: Optional[Dict[str, Any]] = None,
    ) -> str:
        """
        Generate human-readable explanation for fraud prediction.

        Args:
            transaction_data: Transaction details
            fraud_probability: Fraud probability from ML model (0.0 to 1.0)
            risk_factors: List of risk factors identified
            model_features: Additional features used by the model

        Returns:
            Human-readable explanation string
        """
        if not self.is_available():
            return "LLM explanation service not available"

        try:
            # Construct prompt for explanation
            prompt = self._build_explanation_prompt(
                transaction_data, fraud_probability, risk_factors, model_features
            )

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self._get_system_prompt()},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3,
                max_tokens=500,
            )

            explanation = response.choices[0].message.content.strip()
            logger.info(
                f"Generated explanation for transaction {transaction_data.get('transaction_id', 'unknown')}"
            )
            return explanation

        except Exception as e:
            logger.error(f"Error generating explanation: {str(e)}")
            return f"Unable to generate explanation: {str(e)}"

    async def analyze_transaction_patterns(
        self, transactions: List[Dict[str, Any]], predictions: List[float]
    ) -> str:
        """
        Analyze patterns across multiple transactions.

        Args:
            transactions: List of transaction data
            predictions: List of fraud probabilities

        Returns:
            Summary analysis of transaction patterns
        """
        if not self.is_available():
            return "LLM pattern analysis service not available"

        try:
            prompt = self._build_pattern_analysis_prompt(transactions, predictions)

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert fraud analyst. Analyze transaction patterns and provide insights.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.2,
                max_tokens=800,
            )

            analysis = response.choices[0].message.content.strip()
            logger.info(f"Generated pattern analysis for {len(transactions)} transactions")
            return analysis

        except Exception as e:
            logger.error(f"Error generating pattern analysis: {str(e)}")
            return f"Unable to analyze patterns: {str(e)}"

    def _get_system_prompt(self) -> str:
        """Get system prompt for fraud explanation."""
        return """You are an expert fraud detection analyst. Your job is to explain fraud predictions in clear, professional language that both technical and non-technical users can understand.

        Rules:
        1. Be concise but thorough
        2. Focus on the most important risk factors
        3. Use plain English, avoid jargon
        4. Provide actionable insights when possible
        5. Always maintain a professional, objective tone
        6. Do not make definitive fraud accusations, use probability language
        7. Explain what the risk factors mean in practical terms"""

    def _build_explanation_prompt(
        self,
        transaction_data: Dict[str, Any],
        fraud_probability: float,
        risk_factors: List[str],
        model_features: Optional[Dict[str, Any]] = None,
    ) -> str:
        """Build prompt for transaction explanation."""

        # Format transaction details
        transaction_details = f"""
Transaction Details:
- ID: {transaction_data.get("transaction_id", "N/A")}
- Amount: ${transaction_data.get("amount", "N/A")}
- Merchant: {transaction_data.get("merchant_name", "N/A")}
- Category: {transaction_data.get("merchant_category", "N/A")}
- Location: {transaction_data.get("location", "N/A")}
- Timestamp: {transaction_data.get("timestamp", "N/A")}
"""

        # Format model prediction
        risk_level = self._get_risk_level(fraud_probability)
        prediction_info = f"""
Model Prediction:
- Fraud Probability: {fraud_probability:.2%}
- Risk Level: {risk_level}
"""

        # Format risk factors
        risk_factors_text = "\n".join([f"- {factor}" for factor in risk_factors])

        # Add model features if available
        features_text = ""
        if model_features:
            features_text = (
                f"\nAdditional Model Features:\n{self._format_model_features(model_features)}"
            )

        prompt = f"""Explain why this transaction received a fraud probability of {fraud_probability:.2%}.

{transaction_details}

{prediction_info}

Key Risk Factors:
{risk_factors_text}
{features_text}

Please provide a clear, professional explanation of why this transaction was flagged with this risk level. Focus on the most significant factors and what they mean in practical terms."""

        return prompt

    def _get_risk_level(self, fraud_probability: float) -> str:
        """Determine risk level based on fraud probability."""
        if fraud_probability > self.HIGH_RISK_THRESHOLD:
            return "HIGH"
        elif fraud_probability > self.MEDIUM_RISK_THRESHOLD:
            return "MEDIUM"
        else:
            return "LOW"

    def _build_pattern_analysis_prompt(
        self, transactions: List[Dict[str, Any]], predictions: List[float]
    ) -> str:
        """Build prompt for pattern analysis."""

        # Calculate summary statistics
        high_risk_count = sum(1 for p in predictions if p > self.HIGH_RISK_THRESHOLD)
        medium_risk_count = sum(
            1 for p in predictions if self.MEDIUM_RISK_THRESHOLD <= p <= self.HIGH_RISK_THRESHOLD
        )
        low_risk_count = len(predictions) - high_risk_count - medium_risk_count
        avg_risk = sum(predictions) / len(predictions) if predictions else 0

        # Get sample of high-risk transactions
        high_risk_samples = []
        for i, (tx, pred) in enumerate(zip(transactions, predictions)):
            if pred > self.HIGH_RISK_THRESHOLD and len(high_risk_samples) < 3:
                high_risk_samples.append(
                    f"- ${tx.get('amount', 'N/A')} at {tx.get('merchant_name', 'N/A')} ({pred:.2%} risk)"
                )

        prompt = f"""Analyze the following batch of {len(transactions)} transactions:

Summary:
- Total transactions: {len(transactions)}
- High risk (>75%): {high_risk_count}
- Medium risk (45-75%): {medium_risk_count}
- Low risk (<45%): {low_risk_count}
- Average risk score: {avg_risk:.2%}

High Risk Transaction Examples:
{chr(10).join(high_risk_samples) if high_risk_samples else "None"}

Please provide:
1. Overall risk assessment of this batch
2. Notable patterns or trends
3. Recommendations for further investigation
4. Any concerning patterns that stand out

Keep the analysis professional and actionable."""

        return prompt

    def _format_model_features(self, features: Dict[str, Any]) -> str:
        """Format model features for prompt inclusion."""
        formatted = []
        for key, value in features.items():
            if isinstance(value, (int, float)):
                formatted.append(f"- {key}: {value:.2f}")
            else:
                formatted.append(f"- {key}: {value}")
        return "\n".join(formatted)


# Global service instance
openrouter_service = OpenRouterService()
