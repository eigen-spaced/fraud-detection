"""
Pydantic models for ML model prediction API.
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime


class ModelPredictionRequest(BaseModel):
    """Request model for ML model predictions."""

    transactions: List[Dict[str, Any]] = Field(
        ...,
        min_length=1,
        max_length=100,
        description="List of transactions in JSON format from frontend",
    )


class ModelPredictionResponse(BaseModel):
    """Response model for ML model predictions."""

    summary: str
    total_transactions: int = Field(..., ge=1)
    fraudulent_count: int = Field(..., ge=0)
    suspicious_count: int = Field(..., ge=0)
    legitimate_count: int = Field(..., ge=0)
    average_risk_score: float = Field(..., ge=0.0, le=1.0)
    model_info: Dict[str, Any]
    analyses: List[Dict[str, Any]]  # FraudAnalysis objects serialized
    citations: List[Dict[str, Any]] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)


class ModelHealthResponse(BaseModel):
    """Response model for model health check."""

    status: str
    model_loaded: bool
    initialized: bool
    model_type: Optional[str] = None
    optimal_threshold: Optional[float] = None
    feature_count: int = 0
    timestamp: datetime


class ModelInfoResponse(BaseModel):
    """Response model for model information."""

    model_type: Optional[str] = None
    optimal_threshold: Optional[float] = None
    feature_count: int = 0
    feature_names: List[str] = Field(default_factory=list)
    is_loaded: bool = False
    service_initialized: bool = False


class ModelVersionResponse(BaseModel):
    """Response model for model version endpoint."""

    model_version: str = Field(..., description="Current model version")
    build_timestamp: str = Field(..., description="Model build timestamp (ISO 8601)")
    api_version: str = Field(..., description="API version")
    service_name: str = Field(..., description="Service name")
    model_type: Optional[str] = Field(None, description="Model type (e.g., XGBClassifier)")
    feature_count: int = Field(..., description="Number of features")
    optimal_threshold: Optional[float] = Field(None, description="Model's optimal threshold")
