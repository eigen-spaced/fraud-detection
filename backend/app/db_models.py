"""Database models for storing analyzed transactions."""

import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlmodel import Field, SQLModel, Column, JSON

from typing import Optional

from sqlmodel import SQLModel, Field
from datetime import datetime
from decimal import Decimal
from typing import Optional


class RawTransaction(SQLModel, table=True):
    """The original Sparkov data (The Audit Table)."""

    __tablename__ = "raw_transactions"

    id: Optional[int] = Field(default=None, primary_key=True)
    trans_num: str = Field(index=True, unique=True)
    cc_num: str = Field(index=True)
    merchant: str
    category: str
    amt: Decimal
    trans_date: str
    trans_time: str
    lat: float
    long: float
    is_fraud: int = Field(index=True)


class EngineeredTransaction(SQLModel, table=True):
    """The 'Model-Ready' data used for inference (The Feature Store)."""

    __tablename__ = "engineered_transactions"

    # Primary key - no auto-incrementing id in this table
    trans_num: str = Field(primary_key=True, index=True)
    is_fraud: int = Field(index=True)

    # Original transaction data
    cc_num: Optional[str] = None  # text in database
    acct_num: Optional[int] = None  # bigint in database
    merchant: Optional[str] = None
    category: Optional[str] = None
    lat: Optional[float] = None
    long: Optional[float] = None
    merch_lat: Optional[float] = None
    merch_long: Optional[float] = None

    # Model Features (Exact match for your FeatureEngineer class)
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
