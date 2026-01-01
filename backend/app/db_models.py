"""Database models for storing analyzed transactions."""

import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlmodel import Field, SQLModel, Column, JSON


class AnalyzedTransaction(SQLModel, table=True):
    """
    Database model for storing fraud analysis results.
    
    This table persists all analyzed transactions with their metadata,
    risk scores, and classifications for audit and historical analysis.
    """
    
    __tablename__ = "analyzed_transactions"
    
    # Primary key
    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
        nullable=False,
    )
    
    # Transaction identification
    transaction_id: str = Field(
        index=True,
        nullable=False,
        max_length=255,
        description="Original transaction ID from the payment system",
    )
    
    # Transaction details
    timestamp: datetime = Field(
        index=True,
        nullable=False,
        description="When the transaction occurred",
    )
    
    merchant_name: str = Field(
        nullable=False,
        max_length=500,
        description="Merchant or business name",
    )
    
    merchant_category: str = Field(
        nullable=False,
        max_length=100,
        description="Merchant category code or description",
    )
    
    amount: Decimal = Field(
        nullable=False,
        max_digits=10,
        decimal_places=2,
        description="Transaction amount in currency units",
    )
    
    # Fraud analysis results
    classification: str = Field(
        index=True,
        nullable=False,
        max_length=50,
        description="Fraud classification: fraudulent, suspicious, legitimate, unknown",
    )
    
    risk_score: float = Field(
        nullable=False,
        description="Fraud probability score between 0.0 and 1.0",
    )
    
    risk_factors: list[str] = Field(
        sa_column=Column(JSON),
        default_factory=list,
        description="List of identified risk factors",
    )
    
    explanation: str = Field(
        nullable=False,
        description="Human-readable explanation of the fraud assessment",
    )
    
    # Model metadata
    model_version: str = Field(
        nullable=False,
        max_length=50,
        description="Version of the ML model used for analysis",
    )
    
    # Audit timestamp
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        index=True,
        nullable=False,
        description="When this analysis was performed and recorded",
    )
    
    class Config:
        """SQLModel configuration."""
        json_schema_extra = {
            "example": {
                "transaction_id": "TXN123456",
                "timestamp": "2026-01-01T12:00:00Z",
                "merchant_name": "Online Electronics Store",
                "merchant_category": "electronics",
                "amount": "1250.00",
                "classification": "suspicious",
                "risk_score": 0.65,
                "risk_factors": ["High transaction amount", "Unusual time of day"],
                "explanation": "This transaction shows moderate fraud risk...",
                "model_version": "1.0.0",
            }
        }
