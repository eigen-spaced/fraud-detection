"""Application configuration settings."""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings with environment variable support."""

    # API Settings
    app_name: str = "Fraud Detection API"
    app_version: str = "0.1.0"
    debug: bool = True

    # CORS Settings
    cors_origins: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # Fraud Detection Settings
    max_transactions_per_request: int = 100

    # PII Masking Settings
    pii_mask_enabled: bool = True
    max_pii_fields_allowed: int = 2

    # Red Team Testing
    enable_red_team_detection: bool = True

    # OpenTelemetry
    otel_enabled: bool = False  # Disabled to reduce log noise
    otel_service_name: str = "fraud-detection-api"

    # OpenRouter Settings
    open_router_key: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
