"""
Class to convert our raw data into data that can be fed into the XGBoost model
to get predictions
"""

import pandas as pd
import numpy as np
import logging

logger = logging.getLogger(__name__)

class FeatureEngineer:
    def __init__(self):
        self.epsilon = 1e-6
        self.time_windows = ["1h", "24h", "7d"]
        self.median_windows = ["1d", "7d"]

    def engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        logger.info("🚀 Starting vectorized feature engineering...")

        # 1. Setup Datetime & Sort (Critical for rolling windows)
        df["trans_datetime"] = pd.to_datetime(
            df["trans_date"].astype(str) + " " + df["trans_time"].astype(str)
        )
        # Ensure cc_num is a string and sort by time
        df["cc_num"] = df["cc_num"].astype(str)
        df = df.sort_values(["cc_num", "trans_datetime"]).reset_index(drop=True)

        # 2. Vectorized Time Window Counts
        # We use groupby + rolling + count. No .apply() needed.
        for window in self.time_windows:
            df[f"trans_in_last_{window}"] = (
                df.groupby("cc_num")
                .rolling(window, on="trans_datetime")["trans_num"]
                .count()
                .values  # Faster than reset_index/merge
            )

        # 3. Vectorized Rolling Averages (Card & Category)
        # Using closed="left" avoids including the current transaction in its own average
        for w in self.time_windows:
            # Card-level
            rolling_avg = df.groupby("cc_num").rolling(
                window=w, on="trans_datetime", closed="left"
            )["amt"].mean().values
            df[f"amt_per_card_avg_ratio_{w}"] = df["amt"] / (np.nan_to_num(rolling_avg) + self.epsilon)

            # Category-level
            rolling_cat_avg = df.groupby(["cc_num", "category"]).rolling(
                window=w, on="trans_datetime", closed="left"
            )["amt"].mean().values
            df[f"amt_per_category_avg_ratio_{w}"] = df["amt"] / (np.nan_to_num(rolling_cat_avg) + self.epsilon)

        # 4. Vectorized Medians
        for w in self.median_windows:
            rolling_med = df.groupby("cc_num").rolling(
                window=w, on="trans_datetime", closed="left"
            )["amt"].median().values
            df[f"amt_diff_from_card_median_{w}"] = df["amt"] - np.nan_to_num(rolling_med)

        # 5. Temporal Features (Standard Pandas - very fast)
        df["hour_of_day"] = df["trans_datetime"].dt.hour
        df["is_late_night_fraud_window"] = df["hour_of_day"].isin([0, 1, 2, 3]).astype(int)
        df["is_late_evening_fraud_window"] = df["hour_of_day"].isin([22, 23]).astype(int)

        # 6. Log Normalization
        skewed = [c for c in df.columns if "ratio" in c or "trans_in_last" in c]
        for col in skewed:
            df[f"log_{col}"] = np.log1p(df[col].clip(lower=0))

        return df.fillna(0.0)

# class FeatureEngineer:
#     def __init__(self):
#         self.epsilon = 1e-6
#         self.time_windows = ["1h", "24h", "7d"]
#         self.median_windows = ["1d", "7d"]
#
#         # Columns that the XGBoost model actually sees
#         self.final_model_features = [
#             "amt",
#             "hour_of_day",
#             "is_late_night_fraud_window",
#             "is_late_evening_fraud_window",
#             "log_trans_in_last_1h",
#             "log_trans_in_last_24h",
#             "log_trans_in_last_7d",
#             "log_amt_per_card_avg_ratio_1h",
#             "log_amt_per_card_avg_ratio_24h",
#             "log_amt_per_card_avg_ratio_7d",
#             "log_amt_per_category_avg_ratio_1h",
#             "log_amt_per_category_avg_ratio_24h",
#             "log_amt_per_category_avg_ratio_7d",
#             "amt_diff_from_card_median_1d",
#             "amt_diff_from_card_median_7d",
#         ]
#
#     def engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
#         """Apply your notebook rolling logic to the dataframe."""
#         logger.info("Starting stateful feature engineering...")
#
#         # Setup Datetime
#         df["trans_datetime"] = pd.to_datetime(
#             df["trans_date"].astype(str) + " " + df["trans_time"].astype(str)
#         )
#         df = df.sort_values(["cc_num", "trans_datetime"]).reset_index(drop=True)
#
#         # Time Window Counts (per card)
#         def add_counts(g):
#             g = g.set_index("trans_datetime")
#             g["trans_in_last_1h"] = g["trans_num"].rolling("1h").count()
#             g["trans_in_last_24h"] = g["trans_num"].rolling("24h").count()
#             g["trans_in_last_7d"] = g["trans_num"].rolling("7d").count()
#             return g.reset_index()
#
#         df = df.groupby("cc_num", group_keys=False).apply(add_counts)
#
#         # Hour-based features
#         df["hour_of_day"] = df["trans_datetime"].dt.hour
#         df["is_late_night_fraud_window"] = df["hour_of_day"].isin([0, 1, 2, 3]).astype(int)
#         df["is_late_evening_fraud_window"] = df["hour_of_day"].isin([22, 23]).astype(int)
#
#         # Rolling Ratios (Card & Category)
#         def calc_ratios(group):
#             for w in self.time_windows:
#                 rolling_avg = group.rolling(window=w, on="trans_datetime", closed="left")[
#                     "amt"
#                 ].mean()
#                 group[f"amt_per_card_avg_ratio_{w}"] = group["amt"] / (
#                     rolling_avg.fillna(0) + self.epsilon
#                 )
#             return group
#
#         df = df.groupby("cc_num", group_keys=False).apply(calc_ratios)
#
#         def calc_cat_ratios(group):
#             for w in self.time_windows:
#                 rolling_avg = group.rolling(window=w, on="trans_datetime", closed="left")[
#                     "amt"
#                 ].mean()
#                 group[f"amt_per_category_avg_ratio_{w}"] = group["amt"] / (
#                     rolling_avg.fillna(0) + self.epsilon
#                 )
#             return group
#
#         df = df.groupby(["cc_num", "category"], group_keys=False).apply(calc_cat_ratios)
#
#         # Median Differences
#         def calc_medians(group):
#             for w in self.median_windows:
#                 rolling_median = group.rolling(window=w, on="trans_datetime", closed="left")[
#                     "amt"
#                 ].median()
#                 group[f"amt_diff_from_card_median_{w}"] = group["amt"] - rolling_median.fillna(0)
#             return group
#
#         df = df.groupby("cc_num", group_keys=False).apply(calc_medians)
#
#         # Log Transforms (Normalization)
#         skewed = [c for c in df.columns if "ratio" in c or "trans_in_last" in c]
#         for col in skewed:
#             df[f"log_{col}"] = np.log1p(df[col].clip(lower=0))
#
#         return df.fillna(0.0)
