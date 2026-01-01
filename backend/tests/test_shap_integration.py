#!/usr/bin/env python3
"""
Test script for SHAP explainer integration with fraud detection model.
Verifies that SHAP explanations are generated correctly.
"""

import sys
import logging
from pathlib import Path

# Add the backend directory to Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.model_service import model_service
from app.model_loader import model_loader
from app.xai.shap_explainer import shap_explainer_service

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def load_sample_transactions():
    """Load sample transactions for testing."""
    sample_transactions = [
        {
            "transaction": {
                "id": "T001",
                "timestamp": "2023-12-08T23:45:00Z",
                "amount": 5000.00,
                "merchant": {
                    "name": "Online Casino Ltd",
                    "category": "gambling",
                    "location": {
                        "lat": 40.7589,
                        "lng": -73.9851
                    }
                },
                "card": {
                    "number": "1234",
                    "full": 1234567890123456
                },
                "account": {
                    "number": "5678",
                    "full": 9876543210
                }
            },
            "model_features": {
                "temporal": {
                    "trans_in_last_1h": 8.0,
                    "trans_in_last_24h": 15.0,
                    "trans_in_last_7d": 25.0
                },
                "amount_ratios": {
                    "amt_per_card_avg_ratio_1h": 15.2,
                    "amt_per_card_avg_ratio_24h": 12.8,
                    "amt_per_card_avg_ratio_7d": 8.5,
                    "amt_per_category_avg_ratio_1h": 22.1,
                    "amt_per_category_avg_ratio_24h": 18.7,
                    "amt_per_category_avg_ratio_7d": 14.3
                },
                "deviations": {
                    "amt_diff_from_card_median_7d": 4500.0
                }
            },
            "ground_truth": {
                "is_fraud": 1
            }
        },
        {
            "transaction": {
                "id": "T002",
                "timestamp": "2023-12-08T14:30:00Z",
                "amount": 45.99,
                "merchant": {
                    "name": "Grocery Store",
                    "category": "grocery",
                    "location": {
                        "lat": 40.7128,
                        "lng": -74.0060
                    }
                },
                "card": {
                    "number": "1234",
                    "full": 1234567890123456
                },
                "account": {
                    "number": "5678",
                    "full": 9876543210
                }
            },
            "model_features": {
                "temporal": {
                    "trans_in_last_1h": 1.0,
                    "trans_in_last_24h": 3.0,
                    "trans_in_last_7d": 12.0
                },
                "amount_ratios": {
                    "amt_per_card_avg_ratio_1h": 1.1,
                    "amt_per_card_avg_ratio_24h": 0.95,
                    "amt_per_card_avg_ratio_7d": 1.05,
                    "amt_per_category_avg_ratio_1h": 1.15,
                    "amt_per_category_avg_ratio_24h": 0.98,
                    "amt_per_category_avg_ratio_7d": 1.02
                },
                "deviations": {
                    "amt_diff_from_card_median_7d": -5.50
                }
            },
            "ground_truth": {
                "is_fraud": 0
            }
        }
    ]
    
    return sample_transactions


def test_model_service_initialization():
    """Test that model service initializes correctly."""
    logger.info("=" * 60)
    logger.info("Testing Model Service Initialization")
    logger.info("=" * 60)
    
    # Initialize model service
    success = model_service.initialize()
    
    if success:
        logger.info("✅ Model service initialized successfully")
        
        # Check service status
        status = model_service.get_service_status()
        logger.info(f"Model loaded: {status['model_loaded']}")
        logger.info(f"Service initialized: {status['initialized']}")
        
        if status.get('model_info'):
            model_info = status['model_info']
            logger.info(f"Model type: {model_info.get('model_type')}")
            logger.info(f"Feature count: {model_info.get('feature_count')}")
            logger.info(f"Optimal threshold: {model_info.get('optimal_threshold')}")
        
        return True
    else:
        logger.error("❌ Model service initialization failed")
        return False


def test_shap_initialization():
    """Test that SHAP explainer initializes correctly."""
    logger.info("=" * 60)
    logger.info("Testing SHAP Explainer Initialization")
    logger.info("=" * 60)
    
    is_initialized = shap_explainer_service.is_initialized
    logger.info(f"SHAP explainer initialized: {is_initialized}")
    
    if is_initialized:
        logger.info("✅ SHAP explainer is ready")
        return True
    else:
        logger.warning("⚠️ SHAP explainer not initialized")
        return False


def test_fraud_prediction_with_shap():
    """Test fraud prediction with SHAP explanations."""
    logger.info("=" * 60)
    logger.info("Testing Fraud Prediction with SHAP")
    logger.info("=" * 60)
    
    try:
        # Load sample transactions
        transactions = load_sample_transactions()
        logger.info(f"Loaded {len(transactions)} sample transactions")
        
        # Run predictions
        analyses = model_service.predict_transactions(transactions)
        
        logger.info(f"Generated {len(analyses)} analyses")
        
        # Check each analysis
        for i, analysis in enumerate(analyses):
            tx_id = analysis.transaction_id
            logger.info(f"\n--- Analysis for Transaction {tx_id} ---")
            logger.info(f"Classification: {analysis.classification.value}")
            logger.info(f"Risk Score: {analysis.risk_score:.3f}")
            logger.info(f"Legacy Risk Factors: {len(analysis.risk_factors)}")
            logger.info(f"SHAP Explanations: {len(analysis.shap_explanations)}")
            
            # Display SHAP explanations if available
            if analysis.shap_explanations:
                logger.info("Top SHAP Features:")
                for j, shap_exp in enumerate(analysis.shap_explanations[:3]):
                    logger.info(f"  {j+1}. {shap_exp.icon} {shap_exp.human_title}")
                    logger.info(f"     {shap_exp.human_detail}")
                    logger.info(f"     SHAP Value: {shap_exp.shap_value:.3f} | Severity: {shap_exp.severity}")
            else:
                logger.warning(f"  No SHAP explanations generated for {tx_id}")
            
            logger.info(f"Explanation: {analysis.explanation}")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Fraud prediction test failed: {str(e)}", exc_info=True)
        return False


def test_shap_feature_mapping():
    """Test SHAP feature mapping functionality."""
    logger.info("=" * 60)
    logger.info("Testing SHAP Feature Mapping")
    logger.info("=" * 60)
    
    if not shap_explainer_service.is_initialized:
        logger.warning("SHAP explainer not initialized, skipping feature mapping test")
        return False
    
    try:
        # Create a simple test DataFrame
        import pandas as pd
        import numpy as np
        
        # Create test features that should trigger various mappings
        test_features = pd.DataFrame({
            'log_amt_per_card_avg_ratio_1h': [5.0],  # High spending spike
            'is_late_night_fraud_window': [1.0],     # Late night
            'log_trans_in_last_1h': [2.3],           # ~10 transactions
            'amt_diff_from_card_median_7d': [500.0], # Above median
            'hour_of_day': [23.0],                   # Late night hour
            'amt': [2500.0]                          # High amount
        })
        
        # Pad with zeros for other features if needed
        model_info = model_loader.get_model_info()
        if model_info.get("feature_names"):
            for feature in model_info["feature_names"]:
                if feature not in test_features.columns:
                    test_features[feature] = 0.0
        
        # Get SHAP explanation
        shap_features = shap_explainer_service.get_shap_explanation(test_features, top_n=6)
        
        logger.info(f"Generated {len(shap_features)} SHAP feature explanations")
        
        for i, sf in enumerate(shap_features):
            logger.info(f"\n{i+1}. Feature: {sf.feature_name}")
            logger.info(f"   Title: {sf.icon} {sf.human_title}")
            logger.info(f"   Detail: {sf.human_detail}")
            logger.info(f"   SHAP Value: {sf.shap_value:.3f}")
            logger.info(f"   Feature Value: {sf.feature_value:.3f}")
            logger.info(f"   Severity: {sf.severity}")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ SHAP feature mapping test failed: {str(e)}", exc_info=True)
        return False


def main():
    """Run all SHAP integration tests."""
    logger.info("🚀 Starting SHAP Integration Tests")
    
    # Test 1: Model Service Initialization
    test1_passed = test_model_service_initialization()
    
    # Test 2: SHAP Initialization
    test2_passed = test_shap_initialization()
    
    # Test 3: Fraud Prediction with SHAP
    test3_passed = test_fraud_prediction_with_shap()
    
    # Test 4: SHAP Feature Mapping
    test4_passed = test_shap_feature_mapping()
    
    # Summary
    logger.info("=" * 60)
    logger.info("Test Summary")
    logger.info("=" * 60)
    logger.info(f"Model Service Initialization: {'✅ PASS' if test1_passed else '❌ FAIL'}")
    logger.info(f"SHAP Explainer Initialization: {'✅ PASS' if test2_passed else '❌ FAIL'}")
    logger.info(f"Fraud Prediction with SHAP: {'✅ PASS' if test3_passed else '❌ FAIL'}")
    logger.info(f"SHAP Feature Mapping: {'✅ PASS' if test4_passed else '❌ FAIL'}")
    
    all_passed = all([test1_passed, test2_passed, test3_passed, test4_passed])
    
    if all_passed:
        logger.info("\n🎉 All SHAP integration tests passed!")
        return 0
    else:
        logger.error("\n💥 Some tests failed. Check the logs above for details.")
        return 1


if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
