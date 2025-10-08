"""Sample transaction generator for testing."""
import json
from datetime import datetime, timedelta
import random
import argparse


def generate_sample_transactions(count=10, risk_level="legitimate"):
    """
    Generate sample transactions for testing.
    
    Args:
        count: Number of transactions to generate
        risk_level: "legitimate", "suspicious", "fraudulent"
    """
    # Merchant pools by risk level
    legitimate_merchants = [
        ("Whole Foods Market", "grocery"),
        ("Starbucks Coffee", "restaurant"),
        ("Shell Gas Station", "gas"),
        ("Target Store", "retail"),
        ("Home Depot", "home_improvement"),
        ("CVS Pharmacy", "pharmacy"),
    ]
    
    suspicious_merchants = [
        ("Luxury Watch Boutique", "jewelry"),
        ("High-End Electronics", "electronics"),
        ("Premium Casino", "gambling"),
        ("Online Marketplace", "e-commerce"),
    ]
    
    fraudulent_merchants = [
        ("Quick Cash Transfer", "wire_transfer"),
        ("Instant Crypto Exchange", "crypto"),
        ("Overseas Wire Service", "wire_transfer"),
        ("ATM Cash Advance", "atm_withdrawal"),
    ]
    
    transactions = []
    base_time = datetime.utcnow()
    
    for i in range(count):
        # Use the specified risk level for all transactions
        txn_risk = risk_level
        
        # Select merchant based on risk level
        if txn_risk == "legitimate":
            merchant, category = random.choice(legitimate_merchants)
            amount = round(random.uniform(10, 300), 2)
            hours_back = random.randint(8, 20)  # Normal hours
            location = random.choice(["New York, NY", "San Francisco, CA", "Chicago, IL"])
        elif txn_risk == "suspicious":
            merchant, category = random.choice(suspicious_merchants)
            amount = round(random.uniform(500, 3000), 2)
            hours_back = random.randint(2, 5)  # Late night
            location = random.choice(["Las Vegas, NV", "Miami, FL", "Atlantic City, NJ"])
        else:  # fraudulent
            merchant, category = random.choice(fraudulent_merchants)
            amount = round(random.uniform(3000, 9000), 2)
            hours_back = random.randint(2, 5)  # Late night
            location = random.choice(["International", "Foreign", "Overseas"])
        
        timestamp = base_time - timedelta(hours=hours_back, minutes=random.randint(0, 59))
        
        transaction = {
            "transaction_id": f"TXN{i+1:03d}",
            "timestamp": timestamp.isoformat() + "Z",
            "amount": amount,
            "merchant_name": merchant,
            "merchant_category": category,
            "card_number": "1234",
            "location": location,
        }
        
        # Randomly add optional PII fields (but not too many to avoid policy violation)
        if random.random() < 0.3:
            transaction["cardholder_name"] = random.choice([
                "John Doe", "Jane Smith", "Bob Johnson", "Alice Williams"
            ])
        
        transactions.append(transaction)
    
    return {"transactions": transactions}


def main():
    parser = argparse.ArgumentParser(description="Generate sample credit card transactions")
    parser.add_argument("--count", type=int, default=10, help="Number of transactions to generate")
    parser.add_argument(
        "--risk-level",
        choices=["legitimate", "suspicious", "fraudulent"],
        default="legitimate",
        help="Risk level of transactions"
    )
    parser.add_argument("--output", type=str, help="Output file path (optional)")
    
    args = parser.parse_args()
    
    data = generate_sample_transactions(args.count, args.risk_level)
    output = json.dumps(data, indent=2)
    
    if args.output:
        with open(args.output, 'w') as f:
            f.write(output)
        print(f"Generated {args.count} transactions and saved to {args.output}")
    else:
        print(output)


if __name__ == "__main__":
    main()