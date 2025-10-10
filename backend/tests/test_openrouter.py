#!/usr/bin/env python3
"""Test script for OpenRouter integration."""

import asyncio
import sys
import os
from datetime import datetime

# Add the backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.openrouter_service import openrouter_service


async def test_openrouter_integration():
    """Test the OpenRouter service integration."""
    print("🧪 Testing OpenRouter Integration")
    print("=" * 50)
    
    # Check if service is available
    if not openrouter_service.is_available():
        print("❌ OpenRouter service is not available")
        print("   Make sure OPEN_ROUTER_KEY is set in backend/.env")
        return False
    
    print("✅ OpenRouter service is available")
    print(f"   Model: {openrouter_service.model}")
    
    # Test data
    test_transaction = {
        "transaction_id": "TEST_001",
        "amount": 2500.00,
        "merchant_name": "Luxury Electronics Store",
        "merchant_category": "electronics",
        "location": "Las Vegas, NV",
        "timestamp": datetime.now().isoformat()
    }
    
    test_fraud_probability = 0.85
    test_risk_factors = [
        "High transaction amount ($2500)",
        "Late night transaction (2:30 AM)",
        "Location differs from usual spending pattern",
        "First time merchant"
    ]
    
    print("\n🔍 Testing fraud prediction explanation...")
    print(f"   Transaction: ${test_transaction['amount']} at {test_transaction['merchant_name']}")
    print(f"   Fraud Probability: {test_fraud_probability:.2%}")
    print(f"   Risk Factors: {len(test_risk_factors)} identified")
    
    try:
        explanation = await openrouter_service.explain_fraud_prediction(
            test_transaction,
            test_fraud_probability,
            test_risk_factors
        )
        
        print("\n📝 Generated Explanation:")
        print("-" * 30)
        print(explanation)
        print("-" * 30)
        print("✅ Fraud explanation test passed")
        
    except Exception as e:
        print(f"❌ Fraud explanation test failed: {str(e)}")
        return False
    
    # Test pattern analysis
    print("\n🔍 Testing pattern analysis...")
    test_transactions = [
        {"transaction_id": "TXN_001", "amount": 50.00, "merchant_name": "Coffee Shop"},
        {"transaction_id": "TXN_002", "amount": 2500.00, "merchant_name": "Electronics Store"},
        {"transaction_id": "TXN_003", "amount": 75.00, "merchant_name": "Gas Station"},
        {"transaction_id": "TXN_004", "amount": 5000.00, "merchant_name": "Jewelry Store"},
    ]
    
    test_predictions = [0.15, 0.85, 0.25, 0.92]
    
    try:
        analysis = await openrouter_service.analyze_transaction_patterns(
            test_transactions,
            test_predictions
        )
        
        print(f"   Transactions: {len(test_transactions)}")
        print(f"   Predictions: {test_predictions}")
        
        print("\n📊 Generated Pattern Analysis:")
        print("-" * 30)
        print(analysis)
        print("-" * 30)
        print("✅ Pattern analysis test passed")
        
    except Exception as e:
        print(f"❌ Pattern analysis test failed: {str(e)}")
        return False
    
    print("\n🎉 All OpenRouter integration tests passed!")
    return True


if __name__ == "__main__":
    success = asyncio.run(test_openrouter_integration())
    sys.exit(0 if success else 1)