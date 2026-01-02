"""
Feature engineering service for fraud detection.
Converts JSON transactions to DataFrame and applies feature preparation logic.
"""

import pandas as pd
import numpy as np
import logging
from typing import List, Dict, Any, Tuple

logger = logging.getLogger(__name__)


class FeatureEngineer:
    """Feature engineering service for fraud detection model."""

    def __init__(self):
        """Initialize feature engineer with configuration."""
        self.continuous_skewed_features = [
            "trans_in_last_1h",
            "trans_in_last_24h",
            "trans_in_last_7d",
            "amt_per_card_avg_ratio_1h",
            "amt_per_card_avg_ratio_24h",
            "amt_per_card_avg_ratio_7d",
            "amt_per_category_avg_ratio_1h",
            "amt_per_category_avg_ratio_24h",
            "amt_per_category_avg_ratio_7d",
        ]

        self.cols_to_drop_ids = [
            "is_fraud",
            "trans_datetime",
            "cc_num",
            "acct_num",
            "trans_num",
            "merchant",
            "category",
        ]

        self.cols_to_drop_redundant = self.continuous_skewed_features
        self.cols_to_drop = self.cols_to_drop_ids + self.cols_to_drop_redundant

    def json_to_dataframe(self, transactions: List[Dict[str, Any]]) -> pd.DataFrame:
        """
        Convert JSON transaction format to DataFrame format expected by model.

        Args:
            transactions: List of transaction dictionaries in JSON format

        Returns:
            pd.DataFrame: DataFrame with columns matching training data format
        """
        try:
            rows = []

            for tx in transactions:
                # Extract transaction data
                transaction = tx["transaction"]
                model_features = tx["model_features"]
                ground_truth = tx["ground_truth"]

                # Create row matching original DataFrame structure
                row = {
                    # ID fields (will be dropped before modeling)
                    "trans_num": transaction["id"],
                    "trans_datetime": pd.to_datetime(transaction["timestamp"]),
                    "cc_num": int(transaction["card"]["full"]),
                    "acct_num": int(transaction["account"]["full"]),
                    "merchant": transaction["merchant"]["name"],
                    "category": transaction["merchant"]["category"]
                    .lower()
                    .replace(" & ", "_")
                    .replace(" ", "_"),
                    # Basic transaction features
                    "amt": transaction["amount"],
                    "merch_lat": transaction["merchant"]["location"]["lat"],
                    "merch_long": transaction["merchant"]["location"]["lng"],
                    # Target variable
                    "is_fraud": int(ground_truth["is_fraud"]),
                    # Model features - temporal
                    "trans_in_last_1h": model_features["temporal"]["trans_in_last_1h"],
                    "trans_in_last_24h": model_features["temporal"]["trans_in_last_24h"],
                    "trans_in_last_7d": model_features["temporal"]["trans_in_last_7d"],
                    # Model features - amount ratios
                    "amt_per_card_avg_ratio_1h": model_features["amount_ratios"][
                        "amt_per_card_avg_ratio_1h"
                    ],
                    "amt_per_card_avg_ratio_24h": model_features["amount_ratios"][
                        "amt_per_card_avg_ratio_24h"
                    ],
                    "amt_per_card_avg_ratio_7d": model_features["amount_ratios"][
                        "amt_per_card_avg_ratio_7d"
                    ],
                    "amt_per_category_avg_ratio_1h": model_features["amount_ratios"][
                        "amt_per_category_avg_ratio_1h"
                    ],
                    "amt_per_category_avg_ratio_24h": model_features["amount_ratios"][
                        "amt_per_category_avg_ratio_24h"
                    ],
                    "amt_per_category_avg_ratio_7d": model_features["amount_ratios"][
                        "amt_per_category_avg_ratio_7d"
                    ],
                    # Model features - deviations
                    "amt_diff_from_card_median_7d": model_features["deviations"][
                        "amt_diff_from_card_median_7d"
                    ],
                }

                # Add any additional features that might exist in the original data
                # These would need to be computed from the transaction data in a real system
                # For now, we'll set them to reasonable defaults if they're missing

                # Extract hour of day from timestamp
                row["hour_of_day"] = row["trans_datetime"].hour
                row["day_of_week"] = row["trans_datetime"].weekday()
                row["is_late_night_fraud_window"] = (
                    1 if row["hour_of_day"] >= 23 or row["hour_of_day"] <= 5 else 0
                )
                row["is_late_evening_fraud_window"] = 1 if 18 <= row["hour_of_day"] <= 22 else 0

                # Set defaults for features we don't have
                row["time_since_last_trans_seconds"] = 0.0  # Would need transaction history
                row["trans_speed_kmh"] = 0.0  # Would need previous location
                row["amt_diff_from_card_median_1d"] = 0.0  # Would need recent history

                rows.append(row)

            df = pd.DataFrame(rows)
            logger.info(
                f"✅ Converted {len(transactions)} transactions to DataFrame with {df.shape[1]} columns"
            )

            return df

        except Exception as e:
            logger.error(f"Failed to convert JSON to DataFrame: {str(e)}", exc_info=True)
            raise ValueError(f"JSON to DataFrame conversion failed: {str(e)}")

    def prepare_features(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
        """
        Prepare features for model training/prediction by applying transformations.
        This replicates the exact logic from the training pipeline.

        Args:
            df: DataFrame with transaction data

        Returns:
            tuple: (X_features, y_target)
        """
        try:
            # Make a copy to avoid modifying original
            transformed_df = df.copy()

            target_col = "is_fraud"

            # 1. Handle NaNs in continuous features before transformation
            # Fill with 0.0 as it often implies 'no prior activity/difference'
            nan_fill_features = self.continuous_skewed_features + [
                "amt_diff_from_card_median_1d",
                "amt_diff_from_card_median_7d",
            ]
            for col in nan_fill_features:
                if col in transformed_df.columns:
                    transformed_df[col] = transformed_df[col].fillna(0.0)

            # 2. Apply log1p transformation to specified features, creating new columns
            features_to_drop_after_log = []
            for feature in self.continuous_skewed_features:
                if feature in transformed_df.columns:
                    new_log_feature_name = f"log_{feature}"
                    # Ensure values are non-negative before log1p
                    transformed_df[new_log_feature_name] = np.log1p(
                        transformed_df[feature].clip(lower=0)
                    )
                    features_to_drop_after_log.append(feature)  # Mark original for dropping

            # 3. Create feature matrix X and target vector y
            # Drop ID columns and original untransformed features
            X_full = transformed_df.drop(columns=self.cols_to_drop)
            y_full = transformed_df[target_col].astype(int)

            logger.info(f"✅ Features prepared: {X_full.shape[1]} features, {len(X_full)} samples")
            logger.info(f"   - Feature columns: {list(X_full.columns)}")

            return X_full, y_full

        except Exception as e:
            logger.error(f"❌ Feature preparation failed: {str(e)}", exc_info=True)
            raise ValueError(f"Feature preparation failed: {str(e)}")

    def process_transactions(
        self, transactions: List[Dict[str, Any]]
    ) -> Tuple[pd.DataFrame, pd.Series]:
        """
        Complete pipeline: JSON → DataFrame → Feature Preparation.

        Args:
            transactions: List of transaction dictionaries in JSON format

        Returns:
            tuple: (X_features, y_target) ready for model prediction
        """
        try:
            # Step 1: Convert JSON to DataFrame
            df = self.json_to_dataframe(transactions)

            # Step 2: Prepare features
            X, y = self.prepare_features(df)

            logger.info(f"Transaction processing complete: {X.shape} feature matrix ready")

            return X, y

        except Exception as e:
            logger.error(f"❌ Transaction processing failed: {str(e)}", exc_info=True)
            raise ValueError(f"Transaction processing failed: {str(e)}")

    def validate_features(self, X: pd.DataFrame, expected_features: List[str]) -> bool:
        """
        Validate that the feature matrix has the expected features.

        Args:
            X: Feature matrix
            expected_features: List of expected feature names

        Returns:
            bool: True if features match expected, False otherwise
        """
        try:
            actual_features = set(X.columns)
            expected_features = set(expected_features)

            missing_features = expected_features - actual_features
            extra_features = actual_features - expected_features

            if missing_features:
                logger.warning(f"Missing features: {missing_features}")

            if extra_features:
                logger.warning(f"Extra features: {extra_features}")

            # For now, we'll be lenient and just log warnings
            # In production, you might want to be stricter
            features_match = len(missing_features) == 0

            if features_match:
                logger.info("Feature validation passed")
            else:
                logger.warning("Feature validation has warnings")

            return features_match

        except Exception as e:
            logger.error(f"❌ Feature validation failed: {str(e)}")
            return False


# Global feature engineer instance
feature_engineer = FeatureEngineer()
