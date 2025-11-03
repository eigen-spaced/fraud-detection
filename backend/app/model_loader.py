"""
Model loader service for fraud detection XGBoost model.
Implements singleton pattern to load model once and reuse.
"""

import joblib
import logging
from pathlib import Path
from typing import Optional, List
import numpy as np
from sklearn.base import BaseEstimator

logger = logging.getLogger(__name__)


class ModelLoader:
    """Singleton class to load and manage the XGBoost fraud detection model."""

    _instance: Optional["ModelLoader"] = None
    _model: Optional[BaseEstimator] = None
    _optimal_threshold: Optional[float] = None
    _feature_names: Optional[List[str]] = None
    _is_loaded: bool = False

    def __new__(cls) -> "ModelLoader":
        """Implement singleton pattern."""
        if cls._instance is None:
            cls._instance = super(ModelLoader, cls).__new__(cls)
        return cls._instance

    def load_model_artifacts(
        self,
        model_path: str = "model_data/fraud_model.pkl",
        threshold_path: str = "model_data/optimal_threshold.pkl",
        features_path: str = "model_data/feature_names.pkl",
    ) -> bool:
        """
        Load all model artifacts (model, threshold, feature names).

        Args:
            model_path: Path to the trained XGBoost model
            threshold_path: Path to the optimal threshold
            features_path: Path to the feature names list

        Returns:
            bool: True if all artifacts loaded successfully, False otherwise
        """
        try:
            # Convert to Path objects
            model_path = Path(model_path)
            threshold_path = Path(threshold_path)
            features_path = Path(features_path)

            # Check if all files exist
            missing_files = []
            for path, name in [
                (model_path, "model"),
                (threshold_path, "threshold"),
                (features_path, "features"),
            ]:
                if not path.exists():
                    missing_files.append(f"{name}: {path}")

            if missing_files:
                logger.error(f"Missing model artifacts: {', '.join(missing_files)}")
                return False

            # Load model
            logger.info(f"Loading XGBoost model from {model_path}")
            self._model = joblib.load(model_path)

            # Load optimal threshold
            logger.info(f"Loading optimal threshold from {threshold_path}")
            self._optimal_threshold = joblib.load(threshold_path)

            # Load feature names
            logger.info(f"Loading feature names from {features_path}")
            self._feature_names = joblib.load(features_path)

            # Validate loaded artifacts
            if self._model is None:
                raise ValueError("Model is None after loading")

            if self._optimal_threshold is None:
                raise ValueError("Threshold is None after loading")

            if not isinstance(self._feature_names, list) or len(self._feature_names) == 0:
                raise ValueError("Feature names is not a valid list")

            # Check if model has predict_proba method (required for XGBoost)
            if not hasattr(self._model, "predict_proba"):
                raise ValueError("Model does not have predict_proba method")

            self._is_loaded = True
            logger.info("✅ Model loaded successfully:")
            logger.info(f"   - Model type: {type(self._model).__name__}")
            logger.info(f"   - Optimal threshold: {self._optimal_threshold:.4f}")
            logger.info(f"   - Feature count: {len(self._feature_names)}")

            return True

        except Exception as e:
            logger.error(f"❌ Failed to load model artifacts: {str(e)}", exc_info=True)
            self._is_loaded = False
            return False

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        """
        Get prediction probabilities from the model.

        Args:
            X: Feature matrix (n_samples, n_features)

        Returns:
            np.ndarray: Prediction probabilities for fraud class (n_samples,)
        """
        if not self._is_loaded or self._model is None:
            raise RuntimeError("Model not loaded. Call load_model_artifacts() first.")

        try:
            # Get probabilities for fraud class (class 1)
            y_proba = self._model.predict_proba(X)[:, 1]
            return y_proba

        except Exception as e:
            logger.error(f"Error during prediction: {str(e)}")
            raise RuntimeError(f"Model prediction failed: {str(e)}")

    def predict_with_threshold(self, X: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
        """
        Get both probabilities and binary predictions using optimal threshold.

        Args:
            X: Feature matrix (n_samples, n_features)

        Returns:
            tuple: (probabilities, binary_predictions)
        """
        if not self._is_loaded or self._optimal_threshold is None:
            raise RuntimeError("Model or threshold not loaded.")

        # Get probabilities
        y_proba = self.predict_proba(X)

        # Apply optimal threshold
        y_pred = (y_proba >= self._optimal_threshold).astype(int)

        return y_proba, y_pred

    def get_model_info(self) -> dict:
        """Get information about the loaded model."""
        return {
            "is_loaded": self._is_loaded,
            "model_type": type(self._model).__name__ if self._model else None,
            "optimal_threshold": self._optimal_threshold,
            "feature_count": len(self._feature_names) if self._feature_names else 0,
            "feature_names": self._feature_names.copy() if self._feature_names else [],
        }

    @property
    def is_loaded(self) -> bool:
        """Check if model is loaded and ready."""
        return self._is_loaded

    @property
    def feature_names(self) -> List[str]:
        """Get the expected feature names."""
        if not self._feature_names:
            raise RuntimeError("Feature names not loaded")
        return self._feature_names.copy()

    @property
    def optimal_threshold(self) -> float:
        """Get the optimal threshold."""
        if self._optimal_threshold is None:
            raise RuntimeError("Optimal threshold not loaded")
        return self._optimal_threshold


# Global model loader instance
model_loader = ModelLoader()
