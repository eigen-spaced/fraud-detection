#!/usr/bin/env python3
"""
Convert dataframe demo datasets to the target JSON format for frontend.
"""

import joblib
import json
import uuid
from pathlib import Path
from datetime import datetime


def load_demo_datasets():
    """Load the demo datasets from pickle file."""
    model_data_path = Path("model_data/demo_datasets.pkl")
    return joblib.load(model_data_path)


def format_card_number(cc_num):
    """Format card number to show last 4 digits."""
    cc_str = str(int(cc_num))  # Remove decimal if present
    return f"••••{cc_str[-4:]}"


def format_account_number(acct_num):
    """Format account number to show last 4 digits."""
    acct_str = str(int(acct_num))  # Remove decimal if present
    return f"••••{acct_str[-4:]}"


def clean_merchant_name(merchant):
    """Clean merchant name by removing 'fraud_' prefix."""
    if isinstance(merchant, str) and merchant.startswith("fraud_"):
        return merchant[6:]  # Remove 'fraud_' prefix
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
                    "location": {"lat": float(row["merch_lat"]), "lng": float(row["merch_long"])},
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


def save_converted_data():
    """Load, convert, and save all datasets."""
    print("🔄 Converting demo datasets to target JSON format...")

    # Load original datasets
    datasets = load_demo_datasets()

    # Convert each dataset
    converted_data = {}
    for dataset_name, df in datasets.items():
        print(f"   Converting {dataset_name} dataset ({len(df)} transactions)...")
        converted_data[dataset_name] = convert_dataframe_to_json(df, dataset_name)

    # Save to TypeScript file
    output_path = Path("../frontend/lib/convertedSampleData.ts")

    # Generate TypeScript content
    ts_content = f"""// Generated from model datasets - {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
// This file replaces the manually created sample data with real ML model data

export interface TransactionData {{
  transaction: {{
    id: string;
    timestamp: string;
    merchant: {{
      name: string;
      category: string;
      location: {{
        lat: number;
        lng: number;
      }};
    }};
    amount: number;
    card: {{
      number: string;
      full: string;
    }};
    account: {{
      number: string;
      full: string;
    }};
  }};
  model_features: {{
    temporal: {{
      trans_in_last_1h: number;
      trans_in_last_24h: number;
      trans_in_last_7d: number;
    }};
    amount_ratios: {{
      amt_per_card_avg_ratio_1h: number;
      amt_per_card_avg_ratio_24h: number;
      amt_per_card_avg_ratio_7d: number;
      amt_per_category_avg_ratio_1h: number;
      amt_per_category_avg_ratio_24h: number;
      amt_per_category_avg_ratio_7d: number;
    }};
    deviations: {{
      amt_diff_from_card_median_7d: number;
    }};
  }};
  ground_truth: {{
    is_fraud: boolean;
  }};
}}

export interface TransactionBatch {{
  transactions: TransactionData[];
}}

// Category emoji mapping
export const categoryEmojis: Record<string, string> = {{
  "Gas & Transport": "⛽",
  "Grocery": "🛒",
  "Restaurant": "🍽️",
  "Shopping": "🛍️",
  "Entertainment": "🎬",
  "Healthcare": "🏥",
  "Travel": "✈️",
  "Electronics": "💻",
  "Jewelry": "💎",
  "Gambling": "🎰",
  "Crypto": "₿",
  "Wire Transfer": "💸",
  "ATM Withdrawal": "🏧",
  "Online Shopping": "📱",
  "Personal Care": "💄",
  "Home & Garden": "🏡",
  "Family & Pets": "👶",
  "Miscellaneous": "📦",
  "Default": "💳"
}};

// Converted sample transactions from ML model datasets
export const convertedSampleTransactions = {json.dumps(converted_data, indent=2)};
"""

    # Write to file
    output_path.parent.mkdir(exist_ok=True)
    with open(output_path, "w") as f:
        f.write(ts_content)

    print(f"✅ Converted data saved to {output_path}")

    # Show summary
    total_transactions = sum(len(data["transactions"]) for data in converted_data.values())
    print(f"\n📊 Conversion Summary:")
    for name, data in converted_data.items():
        fraud_count = sum(1 for t in data["transactions"] if t["ground_truth"]["is_fraud"])
        legit_count = len(data["transactions"]) - fraud_count
        print(
            f"   {name:>12}: {len(data['transactions'])} transactions ({fraud_count} fraud, {legit_count} legitimate)"
        )
    print(f"   {'Total':>12}: {total_transactions} transactions")

    return converted_data


def main():
    """Main function."""
    print("🚀 Converting Demo Datasets")
    print("=" * 40)

    converted_data = save_converted_data()

    # Show sample
    print(f"\n🔍 Sample converted transaction (fraud dataset):")
    sample = converted_data["fraud"]["transactions"][0]
    print(f"   ID: {sample['transaction']['id']}")
    print(f"   Timestamp: {sample['transaction']['timestamp']}")
    print(f"   Merchant: {sample['transaction']['merchant']['name']}")
    print(f"   Category: {sample['transaction']['merchant']['category']}")
    print(f"   Amount: ${sample['transaction']['amount']:.2f}")
    print(f"   Is Fraud: {sample['ground_truth']['is_fraud']}")
    print(f"   Card: {sample['transaction']['card']['number']}")

    print(f"\n✅ Conversion complete!")
    print(f"Next: Update frontend to use convertedSampleTransactions")


if __name__ == "__main__":
    main()
