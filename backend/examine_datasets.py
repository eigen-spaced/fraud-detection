#!/usr/bin/env python3
"""
Script to examine the structure of demo datasets and compare with target JSON format.
"""

import pickle
import pandas as pd
from pathlib import Path


def load_demo_datasets():
    """Load the demo datasets from pickle file."""
    model_data_path = Path("model_data/demo_datasets.pkl")
    
    if not model_data_path.exists():
        print(f"❌ Error: {model_data_path} not found")
        return None
    
    # Try different ways to load the pickle file
    try:
        with open(model_data_path, 'rb') as f:
            demo_datasets = pickle.load(f)
        print("✅ Successfully loaded demo datasets")
        return demo_datasets
    except Exception as e:
        print(f"❌ Error loading with pickle: {e}")
        
        # Try joblib if pickle fails
        try:
            import joblib
            demo_datasets = joblib.load(model_data_path)
            print("✅ Successfully loaded demo datasets with joblib")
            return demo_datasets
        except Exception as e2:
            print(f"❌ Error loading with joblib: {e2}")
            
            # Show hex dump to understand the file format
            print("\n🔍 File content preview (first 100 bytes):")
            with open(model_data_path, 'rb') as f:
                content = f.read(100)
                print(f"Hex: {content.hex()}")
                print(f"ASCII: {content}")
            
            return None


def examine_dataset_structure(datasets):
    """Examine the structure of each dataset."""
    
    target_fields = {
        # Transaction fields
        'transaction_id': 'transaction.id',
        'timestamp': 'transaction.timestamp', 
        'merchant_name': 'transaction.merchant.name',
        'merchant_category': 'transaction.merchant.category',
        'location_lat': 'transaction.merchant.location.lat',
        'location_lng': 'transaction.merchant.location.lng', 
        'amount': 'transaction.amount',
        'card_number': 'transaction.card.number',
        'card_full': 'transaction.card.full',
        'account_number': 'transaction.account.number',
        'account_full': 'transaction.account.full',
        
        # Model features - temporal
        'trans_in_last_1h': 'model_features.temporal.trans_in_last_1h',
        'trans_in_last_24h': 'model_features.temporal.trans_in_last_24h', 
        'trans_in_last_7d': 'model_features.temporal.trans_in_last_7d',
        
        # Model features - amount ratios
        'amt_per_card_avg_ratio_1h': 'model_features.amount_ratios.amt_per_card_avg_ratio_1h',
        'amt_per_card_avg_ratio_24h': 'model_features.amount_ratios.amt_per_card_avg_ratio_24h',
        'amt_per_card_avg_ratio_7d': 'model_features.amount_ratios.amt_per_card_avg_ratio_7d',
        'amt_per_category_avg_ratio_1h': 'model_features.amount_ratios.amt_per_category_avg_ratio_1h',
        'amt_per_category_avg_ratio_24h': 'model_features.amount_ratios.amt_per_category_avg_ratio_24h',
        'amt_per_category_avg_ratio_7d': 'model_features.amount_ratios.amt_per_category_avg_ratio_7d',
        
        # Model features - deviations
        'amt_diff_from_card_median_7d': 'model_features.deviations.amt_diff_from_card_median_7d',
        
        # Ground truth
        'is_fraud': 'ground_truth.is_fraud'
    }
    
    print(f"\n📊 Dataset Analysis")
    print("=" * 50)
    
    for dataset_name, df in datasets.items():
        print(f"\n🔍 Dataset: {dataset_name}")
        print(f"   Shape: {df.shape}")
        print(f"   Columns: {list(df.columns)}")
        
        # Check for missing fields
        missing_fields = []
        available_fields = []
        
        for field, json_path in target_fields.items():
            if field in df.columns:
                available_fields.append(field)
                print(f"   ✅ {field} -> {json_path}")
            else:
                missing_fields.append(field)
                print(f"   ❌ {field} -> {json_path} (MISSING)")
        
        print(f"\n   📈 Available fields: {len(available_fields)}/{len(target_fields)}")
        if missing_fields:
            print(f"   ⚠️  Missing fields: {missing_fields}")
        
        # Show sample data
        print(f"\n   Sample data (first row):")
        for col in df.columns:
            print(f"   {col}: {df[col].iloc[0]}")


def main():
    """Main function to examine datasets."""
    print("🔬 Examining Demo Datasets Structure")
    print("=" * 50)
    
    # Load datasets
    datasets = load_demo_datasets()
    if datasets is None:
        return
    
    print(f"📦 Found {len(datasets)} datasets: {list(datasets.keys())}")
    
    # Examine structure
    examine_dataset_structure(datasets)
    
    print(f"\n✅ Analysis complete!")
    print("Next step: Create conversion function if all fields are available")


if __name__ == "__main__":
    main()