"""Fraud detection service with ML simulation and red-team detection."""
import re
from typing import List, Tuple, Optional
from datetime import datetime, timedelta
from app.models import (
    Transaction,
    FraudAnalysis,
    FraudClassification,
    FraudDetectionResponse,
    Citation,
    RefusalResponse,
)
from app.config import settings
import logging

logger = logging.getLogger(__name__)


class FraudDetectionService:
    """Service for detecting fraudulent transactions."""
    
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
        self.red_team_pattern = re.compile(
            "|".join(self.RED_TEAM_PATTERNS),
            re.IGNORECASE
        )
    
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
                       f"Maximum {settings.max_pii_fields_allowed} PII fields allowed per transaction."
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
                           f"merchant name. Request refused for security reasons."
                )
            
            # Check device fingerprint
            if txn.device_fingerprint and self.check_red_team_attack(txn.device_fingerprint):
                return RefusalResponse(
                    reason="Security Policy Violation",
                    details=f"Potential prompt injection detected in transaction {txn.transaction_id} "
                           f"device fingerprint. Request refused for security reasons."
                )
        
        return None
    
    def simulate_ml_model(self, transaction: Transaction) -> Tuple[float, List[str]]:
        """
        Simulate ML model prediction for fraud detection.
        Returns (risk_score, risk_factors).
        
        In production, this would call an actual ML model.
        """
        risk_score = 0.0
        risk_factors = []
        
        # Amount-based risk
        if transaction.amount > 5000:
            risk_score += 0.3
            risk_factors.append(f"High transaction amount: ${transaction.amount:.2f}")
        elif transaction.amount > 1000:
            risk_score += 0.15
            risk_factors.append(f"Elevated transaction amount: ${transaction.amount:.2f}")
        
        # Time-based risk (transactions late at night)
        hour = transaction.timestamp.hour
        if 2 <= hour <= 5:
            risk_score += 0.2
            risk_factors.append(f"Unusual time: {hour}:00 (late night)")
        
        # Category-based risk
        high_risk_categories = ["gambling", "crypto", "wire_transfer", "atm_withdrawal"]
        if any(cat in transaction.merchant_category.lower() for cat in high_risk_categories):
            risk_score += 0.25
            risk_factors.append(f"High-risk category: {transaction.merchant_category}")
        
        # Location-based risk (international keywords)
        international_keywords = ["international", "foreign", "overseas"]
        if any(keyword in transaction.location.lower() for keyword in international_keywords):
            risk_score += 0.2
            risk_factors.append(f"International location: {transaction.location}")
        
        # Suspicious merchant names
        suspicious_keywords = ["temp", "test", "cash", "quick", "instant"]
        if any(keyword in transaction.merchant_name.lower() for keyword in suspicious_keywords):
            risk_score += 0.15
            risk_factors.append(f"Suspicious merchant name: {transaction.merchant_name}")
        
        # Cap risk score at 1.0
        risk_score = min(1.0, risk_score)
        
        if not risk_factors:
            risk_factors.append("No significant risk factors detected")
        
        return risk_score, risk_factors
    
    def classify_transaction(self, risk_score: float) -> FraudClassification:
        """Classify transaction based on risk score."""
        if risk_score >= 0.75:
            return FraudClassification.FRAUDULENT
        elif risk_score >= 0.45:
            return FraudClassification.SUSPICIOUS
        else:
            return FraudClassification.LEGITIMATE
    
    def generate_explanation(
        self,
        transaction: Transaction,
        classification: FraudClassification,
        risk_score: float,
        risk_factors: List[str],
    ) -> str:
        """Generate human-readable explanation for the classification."""
        merchant = transaction.merchant_name
        amount = transaction.amount
        
        if classification == FraudClassification.FRAUDULENT:
            explanation = (
                f"This ${amount:.2f} transaction at {merchant} is classified as FRAUDULENT "
                f"(risk score: {risk_score:.1%}). "
            )
        elif classification == FraudClassification.SUSPICIOUS:
            explanation = (
                f"This ${amount:.2f} transaction at {merchant} is classified as SUSPICIOUS "
                f"(risk score: {risk_score:.1%}). "
            )
        else:
            explanation = (
                f"This ${amount:.2f} transaction at {merchant} appears LEGITIMATE "
                f"(risk score: {risk_score:.1%}). "
            )
        
        # Add risk factors
        if len(risk_factors) > 0 and risk_factors[0] != "No significant risk factors detected":
            explanation += "Key concerns: " + "; ".join(risk_factors) + "."
        else:
            explanation += "No significant red flags detected."
        
        return explanation
    
    def generate_summary(
        self,
        analyses: List[FraudAnalysis],
        total_transactions: int,
    ) -> str:
        """Generate overall summary of fraud detection analysis."""
        fraudulent = sum(1 for a in analyses if a.classification == FraudClassification.FRAUDULENT)
        suspicious = sum(1 for a in analyses if a.classification == FraudClassification.SUSPICIOUS)
        legitimate = sum(1 for a in analyses if a.classification == FraudClassification.LEGITIMATE)
        
        avg_risk = sum(a.risk_score for a in analyses) / len(analyses)
        
        summary = f"Analyzed {total_transactions} transactions: "
        
        if fraudulent > 0:
            summary += f"{fraudulent} fraudulent, "
        if suspicious > 0:
            summary += f"{suspicious} suspicious, "
        summary += f"{legitimate} legitimate. "
        
        summary += f"Average risk score: {avg_risk:.1%}. "
        
        if fraudulent > 0:
            summary += "⚠️ IMMEDIATE ACTION REQUIRED for fraudulent transactions. "
        elif suspicious > 0:
            summary += "⚠️ Review recommended for suspicious transactions. "
        else:
            summary += "✓ All transactions appear safe."
        
        return summary
    
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
                       f"Received {len(transactions)} transactions."
            )
        
        # Check PII policy
        pii_refusal = self.check_pii_policy(transactions)
        if pii_refusal:
            return pii_refusal
        
        # Check for red-team attacks
        red_team_refusal = self.check_red_team_in_transactions(transactions)
        if red_team_refusal:
            return red_team_refusal
        
        # Analyze each transaction
        analyses = []
        warnings = []
        
        for txn in transactions:
            try:
                risk_score, risk_factors = self.simulate_ml_model(txn)
                classification = self.classify_transaction(risk_score)
                explanation = self.generate_explanation(txn, classification, risk_score, risk_factors)
                
                analysis = FraudAnalysis(
                    transaction_id=txn.transaction_id,
                    classification=classification,
                    risk_score=risk_score,
                    risk_factors=risk_factors,
                    explanation=explanation,
                )
                analyses.append(analysis)
                
            except Exception as e:
                logger.error(f"Error analyzing transaction {txn.transaction_id}: {str(e)}")
                warnings.append(f"Failed to analyze transaction {txn.transaction_id}")
        
        # Calculate statistics
        fraudulent_count = sum(
            1 for a in analyses if a.classification == FraudClassification.FRAUDULENT
        )
        suspicious_count = sum(
            1 for a in analyses if a.classification == FraudClassification.SUSPICIOUS
        )
        legitimate_count = sum(
            1 for a in analyses if a.classification == FraudClassification.LEGITIMATE
        )
        
        avg_risk_score = sum(a.risk_score for a in analyses) / len(analyses) if analyses else 0.0
        
        # Generate summary
        summary = self.generate_summary(analyses, len(transactions))
        
        # Add sample citations (in production, these would come from actual sources)
        citations = [
            Citation(
                source="Credit Card Fraud Detection Best Practices",
                url="https://example.com/fraud-detection-guide"
            ),
            Citation(
                source="ML-based Transaction Risk Assessment",
                url="https://trusted-source.com/ml-risk-models"
            ),
        ]
        
        return FraudDetectionResponse(
            summary=summary,
            total_transactions=len(transactions),
            fraudulent_count=fraudulent_count,
            suspicious_count=suspicious_count,
            legitimate_count=legitimate_count,
            average_risk_score=avg_risk_score,
            analyses=analyses,
            citations=citations,
            warnings=warnings,
        )


# Singleton instance
fraud_detector = FraudDetectionService()