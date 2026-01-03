"""Pydantic models for fraud detection API."""

from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime


class FraudClassification(str, Enum):
    """Enum-locked fraud classification."""

    LEGITIMATE = "legitimate"
    SUSPICIOUS = "suspicious"
    FRAUDULENT = "fraudulent"
    UNKNOWN = "unknown"


class Transaction(BaseModel):
    """Credit card transaction model with validation."""

    model_config = ConfigDict(str_strip_whitespace=True)

    transaction_id: str = Field(..., min_length=1, max_length=100)
    timestamp: datetime
    amount: float = Field(..., gt=0, le=1000000)
    merchant_name: str = Field(..., min_length=1, max_length=200)
    merchant_category: str = Field(..., min_length=1, max_length=100)
    card_number: str = Field(..., pattern=r"^\d{4}$")  # Last 4 digits only
    cardholder_name: Optional[str] = Field(None, max_length=100)
    location: str = Field(..., min_length=1, max_length=200)
    device_fingerprint: Optional[str] = Field(None, max_length=500)
    ip_address: Optional[str] = Field(None, max_length=45)

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: float) -> float:
        """Ensure amount has reasonable precision."""
        return round(v, 2)

    @field_validator("card_number")
    @classmethod
    def validate_card_number(cls, v: str) -> str:
        """Ensure only last 4 digits are provided (PII protection)."""
        if not v.isdigit():
            raise ValueError("Card number must contain only digits")
        if len(v) != 4:
            raise ValueError("Only last 4 digits of card number are allowed")
        return v


class TransactionBatch(BaseModel):
    """Batch of transactions for fraud detection."""

    transactions: List[Transaction] = Field(..., min_length=1, max_length=100)

    @field_validator("transactions")
    @classmethod
    def validate_batch_size(cls, v: List[Transaction]) -> List[Transaction]:
        """Enforce batch size limits."""
        if len(v) > 100:
            raise ValueError("Maximum 100 transactions allowed per request")
        return v


class ShapFeatureExplanation(BaseModel):
    """SHAP-based feature explanation with human-readable details."""

    feature_name: str = Field(..., min_length=1)
    shap_value: float = Field(..., description="SHAP importance value")
    feature_value: float = Field(..., description="Actual feature value")
    human_title: str = Field(..., min_length=1, description="Human-readable feature title")
    human_detail: str = Field(..., min_length=1, description="Detailed explanation")
    icon: str = Field(..., min_length=1, max_length=10, description="Emoji icon")
    severity: str = Field(..., pattern=r"^(low|medium|high)$", description="Risk severity level")


class FraudAnalysis(BaseModel):
    """Individual transaction fraud analysis result with SHAP explanations."""

    transaction_id: str
    classification: FraudClassification
    risk_score: float = Field(..., ge=0.0, le=1.0)
    risk_factors: List[str] = Field(default_factory=list)  # Legacy risk factors
    explanation: str
    shap_explanations: List[ShapFeatureExplanation] = Field(
        default_factory=list, description="SHAP-based feature explanations"
    )

    @field_validator("risk_score")
    @classmethod
    def validate_risk_score(cls, v: float) -> float:
        """Ensure risk score is within bounds and has reasonable precision."""
        return round(max(0.0, min(1.0, v)), 3)


class Citation(BaseModel):
    """Citation for fraud detection sources."""

    source: str = Field(..., min_length=1, max_length=500)
    url: Optional[str] = Field(None, max_length=1000)


class FraudDetectionResponse(BaseModel):
    """Complete fraud detection analysis response with JSON Schema compliance."""

    summary: str = Field(..., min_length=1)
    total_transactions: int = Field(..., ge=1)
    fraudulent_count: int = Field(..., ge=0)
    suspicious_count: int = Field(..., ge=0)
    legitimate_count: int = Field(..., ge=0)
    average_risk_score: float = Field(..., ge=0.0, le=1.0)
    analyses: List[FraudAnalysis]
    citations: List[Citation] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)

    @field_validator("average_risk_score")
    @classmethod
    def validate_average_risk_score(cls, v: float) -> float:
        """Ensure average risk score is within bounds."""
        return round(max(0.0, min(1.0, v)), 3)


class RefusalResponse(BaseModel):
    """Response when request is refused due to policy violations."""

    refused: bool = True
    reason: str
    details: Optional[str] = None


class HealthCheckResponse(BaseModel):
    """Health check response."""

    status: str
    version: str
    timestamp: datetime


class ErrorResponse(BaseModel):
    """Standard error response."""

    error: str
    detail: Optional[str] = None
    timestamp: datetime


class LLMExplanationRequest(BaseModel):
    """Request model for LLM-powered explanation."""

    transaction_data: Dict[str, Any]
    fraud_probability: float = Field(..., ge=0.0, le=1.0)
    risk_factors: List[str] = Field(default_factory=list)
    model_features: Optional[Dict[str, Any]] = None

    @field_validator("fraud_probability")
    @classmethod
    def validate_fraud_probability(cls, v: float) -> float:
        """Ensure fraud probability is within bounds."""
        return round(max(0.0, min(1.0, v)), 3)


class LLMExplanationResponse(BaseModel):
    """Response model for LLM-powered explanation."""

    transaction_id: str
    explanation: str
    fraud_probability: float
    risk_level: str
    model_used: str
    generated_at: datetime


class PatternAnalysisRequest(BaseModel):
    """Request model for transaction pattern analysis."""

    transactions: List[Dict[str, Any]]
    predictions: List[float] = Field(..., min_length=1)

    @field_validator("predictions")
    @classmethod
    def validate_predictions(cls, v: List[float]) -> List[float]:
        """Ensure all predictions are within bounds."""
        return [round(max(0.0, min(1.0, pred)), 3) for pred in v]


class PatternAnalysisResponse(BaseModel):
    """Response model for transaction pattern analysis."""

    analysis: str
    transaction_count: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    average_risk_score: float
    model_used: str
    generated_at: datetime


class EngineeredTransactionResponse(BaseModel):
    """Response model for a single engineered transaction from database."""

    trans_num: str
    is_fraud: int
    
    # Original transaction data
    cc_num: Optional[str] = None  # text in database
    acct_num: Optional[int] = None  # bigint in database
    merchant: Optional[str] = None
    category: Optional[str] = None
    lat: Optional[float] = None
    long: Optional[float] = None
    merch_lat: Optional[float] = None
    merch_long: Optional[float] = None
    
    # Engineered features
    amt: float
    hour_of_day: int
    is_late_night_fraud_window: int
    is_late_evening_fraud_window: int
    log_trans_in_last_1h: float
    log_trans_in_last_24h: float
    log_trans_in_last_7d: float
    log_amt_per_card_avg_ratio_1h: float
    log_amt_per_card_avg_ratio_24h: float
    log_amt_per_card_avg_ratio_7d: float
    log_amt_per_category_avg_ratio_1h: float
    log_amt_per_category_avg_ratio_24h: float
    log_amt_per_category_avg_ratio_7d: float
    amt_diff_from_card_median_1d: float
    amt_diff_from_card_median_7d: float


class TransactionSampleResponse(BaseModel):
    """Response model for transaction sample endpoint."""

    transactions: List[EngineeredTransactionResponse]
    count: int
    scenario: str
    timestamp: datetime


class DatabaseStatsResponse(BaseModel):
    """Response model for database statistics endpoint."""

    total_transactions: int = Field(..., ge=0)
    fraud_count: int = Field(..., ge=0)
    legit_count: int = Field(..., ge=0)
    fraud_percentage: float = Field(..., ge=0.0, le=100.0)
    timestamp: datetime

