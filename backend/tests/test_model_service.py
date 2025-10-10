#!/usr/bin/env python3
"""
Test script for the model service with sample transaction data.
"""

import sys
import os
from pathlib import Path

# Add the backend directory to Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

import json
from app.model_service import model_service

# Sample transaction data (from converted samples)
sample_transactions = [
    {
        "transaction": {
            "id": "8b548bdfadd95b16f2d09ed7a7d25c15",
            "timestamp": "2025-05-13T00:27:23Z",
            "merchant": {
                "name": "Cartwright-Harris",
                "category": "Grocery",
                "location": {
                    "lat": 38.520787,
                    "lng": -75.22499
                }
            },
            "amount": 8.53,
            "card": {
                "number": "••••2266",
                "full": "6598749320392266"
            },
            "account": {
                "number": "••••1994",
                "full": "635673441994"
            }
        },
        "model_features": {
            "temporal": {
                "trans_in_last_1h": 1.0,
                "trans_in_last_24h": 1.0,
                "trans_in_last_7d": 22.0
            },
            "amount_ratios": {
                "amt_per_card_avg_ratio_1h": 8530000.0,
                "amt_per_card_avg_ratio_24h": 8530000.0,
                "amt_per_card_avg_ratio_7d": 0.16694159093971772,
                "amt_per_category_avg_ratio_1h": 8530000.0,
                "amt_per_category_avg_ratio_24h": 8530000.0,
                "amt_per_category_avg_ratio_7d": 8530000.0
            },
            "deviations": {
                "amt_diff_from_card_median_7d": -33.6
            }
        },
        "ground_truth": {
            "is_fraud": True
        }
    },
    {
        "transaction": {
            "id": "e8f919d6eaec741e1d6a2855a321c57c",
            "timestamp": "2024-08-15T13:09:54Z",
            "merchant": {
                "name": "Turner, Ziemann and Lehner",
                "category": "Restaurant",
                "location": {
                    "lat": 32.743545,
                    "lng": -83.079513
                }
            },
            "amount": 9.97,
            "card": {
                "number": "••••8905",
                "full": "342089532638905"
            },
            "account": {
                "number": "••••3069",
                "full": "262006613069"
            }
        },
        "model_features": {
            "temporal": {
                "trans_in_last_1h": 1.0,
                "trans_in_last_24h": 3.0,
                "trans_in_last_7d": 31.0
            },
            "amount_ratios": {
                "amt_per_card_avg_ratio_1h": 9970000.000000002,
                "amt_per_card_avg_ratio_24h": 0.18206719901265161,
                "amt_per_card_avg_ratio_7d": 0.3565085632439099,
                "amt_per_category_avg_ratio_1h": 9970000.000000002,
                "amt_per_category_avg_ratio_24h": 0.18206719901265161,
                "amt_per_category_avg_ratio_7d": 0.3565085632439099
            },
            "deviations": {
                "amt_diff_from_card_median_7d": 4.905000000000001
            }
        },
        "ground_truth": {
            "is_fraud": False
        }
    }
]

def test_model_service():
    """Test the model service with sample data."""
    print("🧪 Testing Model Service with Sample Data")
    print("=" * 50)
    
    try:
        # Initialize the model service
        print("1. Initializing model service...")
        success = model_service.initialize()
        if not success:
            print("❌ Failed to initialize model service")
            return
        
        print("✅ Model service initialized")
        
        # Test prediction
        print("\n2. Testing predictions...")
        analyses = model_service.predict_transactions(sample_transactions)
        
        print(f"✅ Got {len(analyses)} analysis results")
        
        # Display results
        print("\n3. Analysis Results:")
        print("-" * 30)
        
        for i, analysis in enumerate(analyses):
            tx = sample_transactions[i]
            print(f"\nTransaction {i+1}:")
            print(f"   ID: {analysis.transaction_id}")
            print(f"   Merchant: {tx['transaction']['merchant']['name']}")
            print(f"   Amount: ${tx['transaction']['amount']:.2f}")
            print(f"   Ground Truth: {'FRAUD' if tx['ground_truth']['is_fraud'] else 'LEGITIMATE'}")
            print(f"   ----")
            print(f"   ML Prediction: {analysis.classification.value.upper()}")
            print(f"   Risk Score: {analysis.risk_score:.3f} ({analysis.risk_score:.1%})")
            print(f"   Risk Factors: {analysis.risk_factors}")
            print(f"   Explanation: {analysis.explanation}")
        
        # Test health check
        print(f"\n4. Health Check:")
        health_ok = model_service.health_check()
        print(f"   Health Status: {'✅ Healthy' if health_ok else '❌ Unhealthy'}")
        
        print(f"\n🎉 Model Service Test Complete!")
        
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_model_service()