#!/usr/bin/env python3
"""
Convert demo_datasets.pkl to JSON format for frontend consumption.

Usage:
    uv run python scripts/convert_to_json.py --output-dir ./output
    uv run python scripts/convert_to_json.py --output-dir ./output --dataset fraud
"""

import argparse
import json
import joblib
from pathlib import Path


def load_demo_datasets():
    """Load the demo datasets from pickle file."""
    backend_dir = Path(__file__).parent.parent
    model_data_path = backend_dir / "model_data/demo_datasets.pkl"
    
    if not model_data_path.exists():
        raise FileNotFoundError(f"Dataset file not found: {model_data_path}")
    
    print(f"📂 Loading datasets from: {model_data_path}")
    return joblib.load(model_data_path)


def format_card_number(cc_num):
    """Format card number to show last 4 digits."""
    cc_str = str(int(cc_num))
    return f"••••{cc_str[-4:]}"


def format_account_number(acct_num):
    """Format account number to show last 4 digits."""
    acct_str = str(int(acct_num))
    return f"••••{acct_str[-4:]}"


def clean_merchant_name(merchant):
    """Clean merchant name by removing 'fraud_' prefix."""
    if isinstance(merchant, str) and merchant.startswith("fraud_"):
        return merchant[6:]
    return str(merchant)


def map_category_name(category):
    """Map internal category names to user-friendly names."""
    category_mapping = {
        "grocery_pos": "Grocery",
        "gas_transport": "Gas & Transport",
        "food_dining": "Restaurant",
        "shopping_pos": "Shopping",
        "entertainment": "Entertainment",
        "health_fitness": "Healthcare",
        "travel": "Travel",
        "kids_pets": "Family & Pets",
        "personal_care": "Personal Care",
        "home": "Home & Garden",
        "misc_pos": "Miscellaneous",
        "misc_net": "Online Shopping",
    }
    return category_mapping.get(category, category.replace("_", " ").title())


def convert_dataframe_to_json(df, dataset_type):
    """Convert dataframe to target JSON format."""
    transactions = []

    for _, row in df.iterrows():
        # Convert timestamp
        if hasattr(row["trans_datetime"], "isoformat"):
            timestamp = row["trans_datetime"].isoformat() + "Z"
        else:
            timestamp = str(row["trans_datetime"]) + "Z"

        transaction = {
            "transaction": {
                "id": str(row["trans_num"]),
                "timestamp": timestamp,
                "merchant": {
                    "name": clean_merchant_name(row["merchant"]),
                    "category": map_category_name(row["category"]),
                    "location": {
                        "lat": float(row["merch_lat"]),
                        "lng": float(row["merch_long"])
                    },
                },
                "amount": float(row["amt"]),
                "card": {
                    "number": format_card_number(row["cc_num"]),
                    "full": str(int(row["cc_num"])),
                },
                "account": {
                    "number": format_account_number(row["acct_num"]),
                    "full": str(int(row["acct_num"])),
                },
            },
            "model_features": {
                "temporal": {
                    "trans_in_last_1h": float(row["trans_in_last_1h"]),
                    "trans_in_last_24h": float(row["trans_in_last_24h"]),
                    "trans_in_last_7d": float(row["trans_in_last_7d"]),
                },
                "amount_ratios": {
                    "amt_per_card_avg_ratio_1h": float(row["amt_per_card_avg_ratio_1h"]),
                    "amt_per_card_avg_ratio_24h": float(row["amt_per_card_avg_ratio_24h"]),
                    "amt_per_card_avg_ratio_7d": float(row["amt_per_card_avg_ratio_7d"]),
                    "amt_per_category_avg_ratio_1h": float(row["amt_per_category_avg_ratio_1h"]),
                    "amt_per_category_avg_ratio_24h": float(row["amt_per_category_avg_ratio_24h"]),
                    "amt_per_category_avg_ratio_7d": float(row["amt_per_category_avg_ratio_7d"]),
                },
                "deviations": {
                    "amt_diff_from_card_median_7d": float(row["amt_diff_from_card_median_7d"])
                },
            },
            "ground_truth": {"is_fraud": bool(row["is_fraud"])},
        }
        transactions.append(transaction)

    return {"transactions": transactions}


def verify_conversion(original_df, converted_json, dataset_name):
    """Verify that the conversion preserved all data correctly."""
    print(f"\n🔍 Verifying {dataset_name} dataset conversion...")
    
    errors = []
    
    # Check transaction count
    if len(original_df) != len(converted_json["transactions"]):
        errors.append(f"Transaction count mismatch: {len(original_df)} vs {len(converted_json['transactions'])}")
        return errors
    
    # Verify each transaction
    for idx, (_, row) in enumerate(original_df.iterrows()):
        txn = converted_json["transactions"][idx]
        
        # Verify key fields
        if str(row["trans_num"]) != txn["transaction"]["id"]:
            errors.append(f"Transaction {idx}: ID mismatch")
        
        if float(row["amt"]) != txn["transaction"]["amount"]:
            errors.append(f"Transaction {idx}: Amount mismatch")
        
        if bool(row["is_fraud"]) != txn["ground_truth"]["is_fraud"]:
            errors.append(f"Transaction {idx}: Fraud flag mismatch")
        
        # Verify model features
        if float(row["trans_in_last_1h"]) != txn["model_features"]["temporal"]["trans_in_last_1h"]:
            errors.append(f"Transaction {idx}: trans_in_last_1h mismatch")
    
    if errors:
        print(f"   ❌ Found {len(errors)} errors:")
        for error in errors[:5]:  # Show first 5 errors
            print(f"      - {error}")
    else:
        print(f"   ✅ All {len(original_df)} transactions verified successfully")
    
    return errors


def save_json(data, output_path):
    """Save data as JSON file."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, "w") as f:
        json.dump(data, f, indent=2)
    
    print(f"   💾 Saved to: {output_path}")


def main():
    """Main function."""
    parser = argparse.ArgumentParser(
        description="Convert demo_datasets.pkl to JSON format",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Convert all datasets to ./output directory
  uv run python scripts/convert_to_json.py --output-dir ./output

  # Convert only fraud dataset
  uv run python scripts/convert_to_json.py --output-dir ./output --dataset fraud

  # Convert with custom output directory
  uv run python scripts/convert_to_json.py --output-dir /path/to/output
        """
    )
    
    parser.add_argument(
        "--output-dir",
        type=str,
        required=True,
        help="Directory to save JSON output files"
    )
    
    parser.add_argument(
        "--dataset",
        type=str,
        choices=["fraud", "legitimate", "suspicious"],
        help="Convert only a specific dataset (default: convert all)"
    )
    
    parser.add_argument(
        "--verify",
        action="store_true",
        default=True,
        help="Verify conversion integrity (default: True)"
    )
    
    args = parser.parse_args()
    
    print("🚀 Converting Demo Datasets to JSON")
    print("=" * 50)
    
    # Load datasets
    datasets = load_demo_datasets()
    print(f"✅ Loaded {len(datasets)} datasets: {list(datasets.keys())}\n")
    
    # Filter datasets if specific one requested
    if args.dataset:
        if args.dataset not in datasets:
            print(f"❌ Dataset '{args.dataset}' not found in pickle file")
            return 1
        datasets = {args.dataset: datasets[args.dataset]}
    
    output_dir = Path(args.output_dir)
    all_errors = []
    converted_files = []
    
    # Convert each dataset
    for dataset_name, df in datasets.items():
        print(f"Processing {dataset_name} dataset ({len(df)} transactions)...")
        
        # Convert to JSON
        converted_data = convert_dataframe_to_json(df, dataset_name)
        
        # Verify conversion
        if args.verify:
            errors = verify_conversion(df, converted_data, dataset_name)
            if errors:
                all_errors.extend(errors)
        
        # Save to file
        output_path = output_dir / f"{dataset_name}_transactions.json"
        save_json(converted_data, output_path)
        converted_files.append(output_path)
        
        # Show stats
        fraud_count = sum(1 for t in converted_data["transactions"] if t["ground_truth"]["is_fraud"])
        legit_count = len(converted_data["transactions"]) - fraud_count
        print(f"   📈 {fraud_count} fraud, {legit_count} legitimate\n")
    
    # Summary
    print("=" * 50)
    print("Conversion Summary:")
    print(f"   Total files created: {len(converted_files)}")
    print(f"   Output directory: {output_dir.absolute()}")
    
    if args.verify:
        if all_errors:
            print(f"\n⚠️  Found {len(all_errors)} verification errors")
            return 1
        else:
            print(f"\n✅ All conversions verified successfully!")
    
    print("\n💡 Next steps:")
    print(f"   - Review files in {output_dir}")
    print(f"   - Use these JSON files in your frontend application")
    
    return 0


if __name__ == "__main__":
    exit(main())
