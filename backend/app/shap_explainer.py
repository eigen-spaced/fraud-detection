"""
SHAP explainer service for fraud detection model.
Provides interpretable explanations for model predictions using SHAP values.
"""

import shap
import numpy as np
import pandas as pd
import logging
from typing import List, Dict, Any, Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class ShapFeature:
    """Represents a SHAP feature with its importance and human-readable explanation."""

    feature_name: str
    shap_value: float
    feature_value: float
    human_title: str
    human_detail: str
    icon: str
    severity: str  # 'low', 'medium', 'high'


class ShapExplainerService:
    """Service for generating SHAP-based explanations for fraud predictions."""

    def __init__(self):
        """Initialize SHAP explainer service."""
        self._explainer: Optional[shap.TreeExplainer] = None
        self._is_initialized = False
        self._feature_mapping = self._create_feature_mapping()

    def initialize(self, model, feature_names: List[str]) -> bool:
        """
        Initialize SHAP explainer with the trained model.

        Args:
            model: Trained XGBoost model
            feature_names: List of feature names used by the model

        Returns:
            bool: True if initialization successful, False otherwise
        """
        try:
            logger.info("🔍 Initializing SHAP TreeExplainer...")

            # Create SHAP explainer for tree-based models
            self._explainer = shap.TreeExplainer(model)
            self._feature_names = feature_names
            self._is_initialized = True

            logger.info(
                f"✅ SHAP explainer initialized successfully for {len(feature_names)} features"
            )
            return True

        except Exception as e:
            logger.error(f"❌ SHAP explainer initialization failed: {str(e)}", exc_info=True)
            return False

    def get_shap_explanation(self, features: pd.DataFrame, top_n: int = 4) -> List[ShapFeature]:
        """
        Get SHAP-based explanation for a single transaction prediction.

        Args:
            features: Feature DataFrame for single transaction (1 row)
            top_n: Number of top features to return

        Returns:
            List[ShapFeature]: Top contributing features with explanations
        """
        if not self._is_initialized or self._explainer is None:
            logger.error("SHAP explainer not initialized")
            return []

        try:
            # Get SHAP values for the transaction
            shap_values = self._explainer.shap_values(features)

            # For binary classification, shap_values is a single array
            if isinstance(shap_values, list):
                shap_values = shap_values[1]  # Use positive class (fraud)

            # Create feature importance DataFrame
            feature_importance = pd.DataFrame(
                {
                    "feature": features.columns,
                    "shap_value": shap_values[0] if shap_values.ndim > 1 else shap_values,
                    "feature_value": features.iloc[0].values,
                }
            ).sort_values("shap_value", key=abs, ascending=False)

            # Get top N features and convert to human-readable format
            top_features = feature_importance.head(top_n)
            explanations = []

            for _, row in top_features.iterrows():
                shap_feature = self._convert_to_human_explanation(
                    row["feature"], row["feature_value"], row["shap_value"]
                )
                explanations.append(shap_feature)

            logger.info(f"✅ Generated SHAP explanation with {len(explanations)} top features")
            return explanations

        except Exception as e:
            logger.error(f"❌ SHAP explanation generation failed: {str(e)}", exc_info=True)
            return []

    def _convert_to_human_explanation(
        self, feature_name: str, feature_value: float, shap_value: float
    ) -> ShapFeature:
        """
        Convert technical feature information to human-readable explanation.

        Args:
            feature_name: Technical feature name
            feature_value: Feature value
            shap_value: SHAP importance value

        Returns:
            ShapFeature: Human-readable feature explanation
        """
        # Get base mapping for the feature
        mapping = self._feature_mapping.get(
            feature_name,
            {
                "title_template": feature_name.replace("_", " ").title(),
                "detail_template": "Value: {value:.2f}",
                "icon": "📊",
                "severity_thresholds": {"low": 0.1, "medium": 0.2},
            },
        )

        # Determine severity based on absolute SHAP value
        abs_shap = abs(shap_value)
        thresholds = mapping.get("severity_thresholds", {"low": 0.1, "medium": 0.2})

        if abs_shap >= thresholds.get("high", 0.3):
            severity = "high"
        elif abs_shap >= thresholds.get("medium", 0.2):
            severity = "medium"
        else:
            severity = "low"

        # Generate human-readable title and detail
        title = self._format_title(feature_name, feature_value, mapping)
        detail = self._format_detail(feature_name, feature_value, shap_value, mapping)

        return ShapFeature(
            feature_name=feature_name,
            shap_value=round(shap_value, 3),
            feature_value=round(feature_value, 3),
            human_title=title,
            human_detail=detail,
            icon=mapping.get("icon", "📊"),
            severity=severity,
        )

    def _format_title(self, feature_name: str, feature_value: float, mapping: Dict) -> str:
        """Generate human-readable title for a feature."""
        template = mapping.get("title_template", feature_name)

        # Handle special cases with dynamic titles
        if feature_name == "log_amt_per_card_avg_ratio_1h":
            ratio = np.exp(feature_value)
            if ratio > 3:
                return "Major spending spike detected"
            elif ratio > 1.5:
                return "Unusual spending increase"
            else:
                return "Normal spending pattern"

        elif feature_name == "is_late_night_fraud_window":
            return "Late-night transaction" if feature_value == 1 else "Normal hours transaction"

        elif feature_name == "log_trans_in_last_1h":
            count = int(np.exp(feature_value))
            if count > 5:
                return "High transaction frequency"
            elif count > 2:
                return "Moderate transaction frequency"
            else:
                return "Normal transaction frequency"

        # Default formatting
        try:
            return template.format(value=feature_value)
        except Exception:
            return template

    def _format_detail(
        self, feature_name: str, feature_value: float, shap_value: float, mapping: Dict
    ) -> str:
        """Generate detailed human-readable explanation for a feature."""
        template = mapping.get("detail_template", "Value: {value:.2f}")

        # Handle special feature types
        if feature_name.startswith("log_amt_per_card_avg_ratio"):
            ratio = np.exp(feature_value)
            period = feature_name.split("_")[-1]  # 1h, 24h, 7d
            return f"Amount is {ratio:.1f}x higher than typical {period} spending"

        elif feature_name.startswith("log_amt_per_category_avg_ratio"):
            ratio = np.exp(feature_value)
            period = feature_name.split("_")[-1]
            return f"Amount is {ratio:.1f}x higher than category average ({period})"

        elif feature_name.startswith("log_trans_in_last"):
            count = int(np.exp(feature_value))
            period = feature_name.split("_")[-1]
            return f"{count} transactions in last {period}"

        elif feature_name == "is_late_night_fraud_window":
            return (
                "Transaction occurred during high-risk hours (11 PM - 6 AM)"
                if feature_value == 1
                else "Transaction during normal business hours"
            )

        elif feature_name == "is_late_evening_fraud_window":
            return (
                "Transaction during evening hours (6-10 PM)"
                if feature_value == 1
                else "Transaction outside evening hours"
            )

        elif feature_name == "amt_diff_from_card_median_7d":
            if feature_value > 0:
                return f"${feature_value:.2f} above recent median spending"
            elif feature_value < 0:
                return f"${abs(feature_value):.2f} below recent median spending"
            else:
                return "Amount matches recent median spending"

        elif feature_name == "hour_of_day":
            hour = int(feature_value)
            if 6 <= hour < 12:
                period = "morning"
            elif 12 <= hour < 18:
                period = "afternoon"
            elif 18 <= hour < 22:
                period = "evening"
            else:
                period = "late night/early morning"
            return f"Transaction at {hour}:00 ({period})"

        # Default formatting
        try:
            return template.format(value=feature_value, shap=shap_value)
        except Exception:
            return f"Value: {feature_value:.2f} (Impact: {shap_value:.3f})"

    def _create_feature_mapping(self) -> Dict[str, Dict[str, Any]]:
        """Create comprehensive mapping from technical features to human explanations."""
        return {
            # Amount ratio features
            "log_amt_per_card_avg_ratio_1h": {
                "title_template": "Spending pattern (1h)",
                "detail_template": "Amount vs 1-hour average",
                "icon": "💰",
                "severity_thresholds": {"low": 0.15, "medium": 0.25, "high": 0.4},
            },
            "log_amt_per_card_avg_ratio_24h": {
                "title_template": "Spending pattern (24h)",
                "detail_template": "Amount vs daily average",
                "icon": "💰",
                "severity_thresholds": {"low": 0.12, "medium": 0.2, "high": 0.35},
            },
            "log_amt_per_card_avg_ratio_7d": {
                "title_template": "Spending pattern (7d)",
                "detail_template": "Amount vs weekly average",
                "icon": "💰",
                "severity_thresholds": {"low": 0.1, "medium": 0.18, "high": 0.3},
            },
            # Category ratio features
            "log_amt_per_category_avg_ratio_1h": {
                "title_template": "Category spending (1h)",
                "detail_template": "Amount vs category average",
                "icon": "🏪",
                "severity_thresholds": {"low": 0.1, "medium": 0.2, "high": 0.35},
            },
            "log_amt_per_category_avg_ratio_24h": {
                "title_template": "Category spending (24h)",
                "detail_template": "Amount vs category average",
                "icon": "🏪",
                "severity_thresholds": {"low": 0.08, "medium": 0.15, "high": 0.25},
            },
            "log_amt_per_category_avg_ratio_7d": {
                "title_template": "Category spending (7d)",
                "detail_template": "Amount vs category average",
                "icon": "🏪",
                "severity_thresholds": {"low": 0.08, "medium": 0.15, "high": 0.25},
            },
            # Temporal features
            "log_trans_in_last_1h": {
                "title_template": "Transaction velocity",
                "detail_template": "Transactions in last hour",
                "icon": "🚗",
                "severity_thresholds": {"low": 0.1, "medium": 0.2, "high": 0.3},
            },
            "log_trans_in_last_24h": {
                "title_template": "Daily activity",
                "detail_template": "Transactions in last 24 hours",
                "icon": "📊",
                "severity_thresholds": {"low": 0.08, "medium": 0.15, "high": 0.25},
            },
            "log_trans_in_last_7d": {
                "title_template": "Weekly activity",
                "detail_template": "Transactions in last 7 days",
                "icon": "📈",
                "severity_thresholds": {"low": 0.05, "medium": 0.1, "high": 0.2},
            },
            # Time-based flags
            "is_late_night_fraud_window": {
                "title_template": "Transaction timing",
                "detail_template": "Late-night hours indicator",
                "icon": "🕐",
                "severity_thresholds": {"low": 0.1, "medium": 0.2, "high": 0.35},
            },
            "is_late_evening_fraud_window": {
                "title_template": "Evening timing",
                "detail_template": "Evening hours indicator",
                "icon": "🌆",
                "severity_thresholds": {"low": 0.05, "medium": 0.1, "high": 0.2},
            },
            "hour_of_day": {
                "title_template": "Time of day",
                "detail_template": "Hour of transaction",
                "icon": "🕐",
                "severity_thresholds": {"low": 0.05, "medium": 0.1, "high": 0.18},
            },
            "day_of_week": {
                "title_template": "Day of week",
                "detail_template": "Weekday pattern",
                "icon": "📅",
                "severity_thresholds": {"low": 0.03, "medium": 0.08, "high": 0.15},
            },
            # Amount deviation features
            "amt_diff_from_card_median_7d": {
                "title_template": "Spending deviation",
                "detail_template": "Difference from median",
                "icon": "📊",
                "severity_thresholds": {"low": 0.08, "medium": 0.15, "high": 0.25},
            },
            "amt_diff_from_card_median_1d": {
                "title_template": "Daily deviation",
                "detail_template": "Daily spending difference",
                "icon": "📊",
                "severity_thresholds": {"low": 0.05, "medium": 0.12, "high": 0.2},
            },
            # Basic features
            "amt": {
                "title_template": "Transaction amount",
                "detail_template": "${value:.2f}",
                "icon": "💵",
                "severity_thresholds": {"low": 0.05, "medium": 0.1, "high": 0.2},
            },
            "merch_lat": {
                "title_template": "Merchant location",
                "detail_template": "Latitude: {value:.6f}",
                "icon": "📍",
                "severity_thresholds": {"low": 0.03, "medium": 0.08, "high": 0.15},
            },
            "merch_long": {
                "title_template": "Merchant location",
                "detail_template": "Longitude: {value:.6f}",
                "icon": "📍",
                "severity_thresholds": {"low": 0.03, "medium": 0.08, "high": 0.15},
            },
            # Velocity features
            "time_since_last_trans_seconds": {
                "title_template": "Transaction timing",
                "detail_template": "Seconds since last transaction",
                "icon": "⏱️",
                "severity_thresholds": {"low": 0.05, "medium": 0.1, "high": 0.2},
            },
            "trans_speed_kmh": {
                "title_template": "Travel velocity",
                "detail_template": "Speed between transactions",
                "icon": "🚗",
                "severity_thresholds": {"low": 0.08, "medium": 0.15, "high": 0.3},
            },
        }

    @property
    def is_initialized(self) -> bool:
        """Check if SHAP explainer is initialized."""
        return self._is_initialized


# Global SHAP explainer service instance
shap_explainer_service = ShapExplainerService()
