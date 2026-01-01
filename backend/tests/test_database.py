#!/usr/bin/env python3
"""
Test script for database integration.
"""

import sys
import asyncio
from pathlib import Path

# Add the backend directory to Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import init_db, get_db
from app.db_service import save_analysis, get_analysis_by_transaction_id
from app.models import FraudAnalysis, FraudClassification


async def test_database_integration():
    """Test database creation and basic operations."""
    print("🧪 Testing Database Integration")
    print("=" * 50)
    
    try:
        # Initialize database
        print("\n1. Initializing database...")
        await init_db()
        print("✅ Database initialized")
        
        # Create a test analysis
        print("\n2. Creating test fraud analysis...")
        test_analysis = FraudAnalysis(
            transaction_id="TEST_TXN_001",
            classification=FraudClassification.SUSPICIOUS,
            risk_score=0.65,
            risk_factors=["High transaction amount", "Unusual time of day"],
            explanation="This is a test transaction for database verification.",
        )
        
        test_transaction_data = {
            "transaction_id": "TEST_TXN_001",
            "timestamp": "2026-01-01T12:00:00Z",
            "merchant_name": "Test Merchant",
            "merchant_category": "test",
            "amount": 500.00,
        }
        
        # Save to database
        print("3. Saving analysis to database...")
        async for db in get_db():
            saved_record = await save_analysis(
                db,
                test_analysis,
                test_transaction_data,
                model_version="1.0.0-test",
            )
            
            if saved_record:
                print(f"✅ Saved record with ID: {saved_record.id}")
                print(f"   Transaction ID: {saved_record.transaction_id}")
                print(f"   Classification: {saved_record.classification}")
                print(f"   Risk Score: {saved_record.risk_score}")
            else:
                print("❌ Failed to save record")
                return
            
            # Retrieve from database
            print("\n4. Retrieving analysis from database...")
            retrieved = await get_analysis_by_transaction_id(db, "TEST_TXN_001")
            
            if retrieved:
                print("✅ Retrieved record:")
                print(f"   Transaction ID: {retrieved.transaction_id}")
                print(f"   Classification: {retrieved.classification}")
                print(f"   Risk Score: {retrieved.risk_score}")
                print(f"   Explanation: {retrieved.explanation}")
                print(f"   Model Version: {retrieved.model_version}")
                print(f"   Created At: {retrieved.created_at}")
            else:
                print("❌ Failed to retrieve record")
                return
            
            break  # Exit the async generator
        
        print("\n🎉 Database Integration Test Complete!")
        print("✅ All database operations working correctly")
        
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(test_database_integration())
