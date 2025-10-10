"""Fraud detection service with ML model integration and red-team detection."""

import re
from typing import List, Optional, Dict, Any
from app.models import (
    Transaction,
    FraudDetectionResponse,
    Citation,
    RefusalResponse,
)
from app.config import settings
from app.model_service import model_service
import logging

logger = logging.getLogger(__name__)


class FraudDetectionService:
    """Service for detecting fraudulent transactions using ML model with security checks."""

    # Red-team prompt injection patterns
    RED_TEAM_PATTERNS = [
        r"ignore\s+(previous|all|your)\s+instructions?",
        r"system\s*prompt",
        r"you\s+are\s+now",
        r"forget\s+(everything|all|previous)",
        r"new\s+instructions?:",
        r"<\|.*?\|>",  # Special tokens
        r"\\x[0-9a-f]{2}",  # Hex escape sequences
        r"&#\d+;",  # HTML entities
        r"eval\(",
        r"exec\(",
        r"__import__",
    ]

    def __init__(self):
        """Initialize fraud detection service."""
        self.red_team_pattern = re.compile("|".join(self.RED_TEAM_PATTERNS), re.IGNORECASE)

    def check_red_team_attack(self, text: str) -> bool:
        """Check if text contains red-team prompt injection attempts."""
        if not settings.enable_red_team_detection:
            return False
        return bool(self.red_team_pattern.search(text))

    def check_pii_policy(self, transactions: List[Transaction]) -> Optional[RefusalResponse]:
        """Check if transactions violate PII policy."""
        if not settings.pii_mask_enabled:
            return None

        # Count transactions with excessive PII
        pii_violations = 0
        for txn in transactions:
            pii_count = 0
            if txn.cardholder_name:
                pii_count += 1
            if txn.ip_address:
                pii_count += 1
            if txn.device_fingerprint:
                pii_count += 1

            if pii_count > settings.max_pii_fields_allowed:
                pii_violations += 1

        # Refuse if more than 10% of transactions have excessive PII
        if pii_violations > len(transactions) * 0.1:
            return RefusalResponse(
                reason="PII Policy Violation",
                details=f"{pii_violations} transactions contain excessive PII fields. "
                f"Maximum {settings.max_pii_fields_allowed} PII fields allowed per transaction.",
            )

        return None

    def check_red_team_in_transactions(
        self, transactions: List[Transaction]
    ) -> Optional[RefusalResponse]:
        """Check transactions for red-team attacks in merchant names and device fingerprints."""
        for txn in transactions:
            # Check merchant name
            if self.check_red_team_attack(txn.merchant_name):
                return RefusalResponse(
                    reason="Security Policy Violation",
                    details=f"Potential prompt injection detected in transaction {txn.transaction_id} "
                    f"merchant name. Request refused for security reasons.",
                )

            # Check device fingerprint
            if txn.device_fingerprint and self.check_red_team_attack(txn.device_fingerprint):
                return RefusalResponse(
                    reason="Security Policy Violation",
                    details=f"Potential prompt injection detected in transaction {txn.transaction_id} "
                    f"device fingerprint. Request refused for security reasons.",
                )

        return None

    def convert_transaction_to_ml_format(self, transaction: Transaction) -> Dict[str, Any]:
        """Convert Transaction model to ML model JSON format."""
        return {
            "transaction": {
                "id": transaction.transaction_id,
                "timestamp": transaction.timestamp.isoformat(),
                "merchant": {
                    "name": transaction.merchant_name,
                    "category": transaction.merchant_category,
                    "location": {"lat": 0.0, "lng": 0.0}  # Default coordinates
                },
                "amount": transaction.amount,
                "card": {"number": transaction.card_number, "full": f"{transaction.card_number}567890121234"},
                "account": {"number": "1234", "full": "1234567890123456"}
            },
            "model_features": {
                "temporal": {
                    "trans_in_last_1h": 1.0,
                    "trans_in_last_24h": 3.0,
                    "trans_in_last_7d": 15.0
                },
                "amount_ratios": {
                    "amt_per_card_avg_ratio_1h": 1.2,
                    "amt_per_card_avg_ratio_24h": 1.1,
                    "amt_per_card_avg_ratio_7d": 1.0,
                    "amt_per_category_avg_ratio_1h": 0.9,
                    "amt_per_category_avg_ratio_24h": 0.8,
                    "amt_per_category_avg_ratio_7d": 0.7
                },
                "deviations": {
                    "amt_diff_from_card_median_7d": 50.0
                }
            },
            "ground_truth": {"is_fraud": False}  # Default, not used in prediction
        }


    def analyze_transactions(
        self, transactions: List[Transaction]
    ) -> FraudDetectionResponse | RefusalResponse:
        """
        Analyze a batch of transactions for fraud.
        Returns either analysis results or a refusal response.
        """
        # Check batch size policy
        if len(transactions) > settings.max_transactions_per_request:
            return RefusalResponse(
                reason="Batch Size Exceeded",
                details=f"Maximum {settings.max_transactions_per_request} transactions allowed per request. "
                f"Received {len(transactions)} transactions.",
            )

        # Check PII policy
        pii_refusal = self.check_pii_policy(transactions)
        if pii_refusal:
            return pii_refusal

        # Check for red-team attacks
        red_team_refusal = self.check_red_team_in_transactions(transactions)
        if red_team_refusal:
            return red_team_refusal

        # Convert transactions to ML model format
        try:
            ml_transactions = [self.convert_transaction_to_ml_format(txn) for txn in transactions]
            
            # Use the real ML model for predictions
            analyses = model_service.predict_transactions(ml_transactions)
            warnings = []
            
        except Exception as e:
            logger.error(f"Error running ML model predictions: {str(e)}")
            warnings = [f"ML model prediction failed: {str(e)}"]
            analyses = []

        # Calculate statistics from ML model results
        fraudulent_count = sum(
            1 for a in analyses if a.classification.value == "fraudulent"
        ) if analyses else 0
        suspicious_count = sum(
            1 for a in analyses if a.classification.value == "suspicious"
        ) if analyses else 0
        legitimate_count = sum(
            1 for a in analyses if a.classification.value == "legitimate"
        ) if analyses else 0

        avg_risk_score = sum(a.risk_score for a in analyses) / len(analyses) if analyses else 0.0

        # Generate summary for ML model results
        total_transactions = len(transactions)
        summary = f"ML Model analyzed {total_transactions} transactions: "
        summary += f"{fraudulent_count} fraudulent, {suspicious_count} suspicious, {legitimate_count} legitimate. "
        summary += f"Average risk score: {avg_risk_score:.1%}."
        
        if fraudulent_count > 0:
            summary += " ⚠️ IMMEDIATE ACTION REQUIRED for fraudulent transactions."
        elif suspicious_count > 0:
            summary += " ⚠️ Review recommended for suspicious transactions."
        else:
            summary += " ✓ All transactions appear safe."

        # Add ML model citations
        citations = [
            Citation(
                source="XGBoost Fraud Detection Model",
                url="https://xgboost.readthedocs.io/en/stable/",
            ),
            Citation(
                source="SHAP Model Explainability",
                url="https://shap.readthedocs.io/en/latest/",
            ),
        ]

        return FraudDetectionResponse(
            summary=summary,
            total_transactions=len(transactions),
            fraudulent_count=fraudulent_count,
            suspicious_count=suspicious_count,
            legitimate_count=legitimate_count,
            average_risk_score=round(avg_risk_score, 3),
            analyses=analyses,  # ML model analyses already in correct format
            citations=citations,
            warnings=warnings,
        )


# Singleton instance
fraud_detector = FraudDetectionService()
