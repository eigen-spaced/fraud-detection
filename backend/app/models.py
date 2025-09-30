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


class FraudAnalysis(BaseModel):
    """Individual transaction fraud analysis result."""
    
    transaction_id: str
    classification: FraudClassification
    risk_score: float = Field(..., ge=0.0, le=1.0)
    risk_factors: List[str] = Field(default_factory=list)
    explanation: str
    
    @field_validator("risk_score")
    @classmethod
    def validate_risk_score(cls, v: float) -> float:
        """Ensure risk score is within bounds and has reasonable precision."""
        return round(max(0.0, min(1.0, v)), 3)


class Citation(BaseModel):
    """Citation with domain validation."""
    
    source: str = Field(..., min_length=1, max_length=500)
    url: Optional[str] = Field(None, max_length=1000)
    
    @field_validator("url")
    @classmethod
    def validate_url_domain(cls, v: Optional[str]) -> Optional[str]:
        """Validate URL is from allowed domain."""
        if v is None:
            return v
        
        from app.config import settings
        from urllib.parse import urlparse
        
        try:
            parsed = urlparse(v)
            domain = parsed.netloc.lower()
            
            # Remove www. prefix for comparison
            if domain.startswith("www."):
                domain = domain[4:]
            
            # Check if domain is in allowed list
            allowed = any(
                domain == allowed_domain or domain.endswith(f".{allowed_domain}")
                for allowed_domain in settings.allowed_citation_domains
            )
            
            if not allowed:
                raise ValueError(f"Domain {domain} is not in allowed citation list")
            
            return v
        except Exception as e:
            raise ValueError(f"Invalid URL or domain validation failed: {str(e)}")


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