# Fraud Detection API

AI-powered credit card fraud detection backend built with FastAPI.

## Features

- **Pydantic Validation**: Strict input validation with JSON Schema
- **Enum-locked Classifications**: Fraudulent, Suspicious, Legitimate, Unknown
- **Risk Score Bounds**: Numeric bounds [0.0, 1.0] with 3 decimal precision
- **Citation Validation**: Only allow-listed domains
- **Red-team Detection**: Identifies prompt injection attempts
- **PII Protection**: Refusal policy for excessive PII
- **OpenTelemetry**: Logging and observability
- **Health Checks**: API health monitoring

## Setup

### Prerequisites

- Python 3.11+
- uv (Fast Python package installer)

### Installation

```bash
# Install dependencies (including dev dependencies)
uv sync
```

### Running the Server

```bash
# Start the development server
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Core Endpoints

- `GET /` - API information
- `GET /health` - Health check
- `POST /api/analyze` - Analyze transactions for fraud
- `GET /api/explain` - Model explanation (placeholder)
- `GET /api/cases` - Fraud case examples (placeholder)
- `GET /api/schema` - JSON schemas

### API Documentation

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Request Format

```json
{
  "transactions": [
    {
      "transaction_id": "TXN001",
      "timestamp": "2025-01-15T14:30:00Z",
      "amount": 1250.00,
      "merchant_name": "Online Electronics Store",
      "merchant_category": "electronics",
      "card_number": "1234",
      "cardholder_name": "John Doe",
      "location": "New York, NY",
      "device_fingerprint": "device_abc123",
      "ip_address": "192.168.1.1"
    }
  ]
}
```

## Response Format

```json
{
  "summary": "Analyzed 1 transactions: 1 legitimate. Average risk score: 15.0%.  All transactions appear safe.",
  "total_transactions": 1,
  "fraudulent_count": 0,
  "suspicious_count": 0,
  "legitimate_count": 1,
  "average_risk_score": 0.15,
  "analyses": [
    {
      "transaction_id": "TXN001",
      "classification": "legitimate",
      "risk_score": 0.15,
      "risk_factors": [
        "Elevated transaction amount: $1250.00"
      ],
      "explanation": "This $1250.00 transaction at Online Electronics Store appears LEGITIMATE (risk score: 15.0%). Key concerns: Elevated transaction amount: $1250.00."
    }
  ],
  "citations": [
    {
      "source": "Credit Card Fraud Detection Best Practices",
      "url": "https://example.com/fraud-detection-guide"
    }
  ],
  "warnings": []
}
```

## Security Features

### Red-team Detection

The API detects and refuses requests containing prompt injection attempts in:
- Merchant names
- Device fingerprints

Patterns detected:
- "ignore previous instructions"
- "system prompt"
- "you are now"
- Special tokens and escape sequences
- Code injection attempts

### PII Policy

Transactions are refused if more than 10% contain excessive PII fields:
- Maximum 2 PII fields per transaction (configurable)
- Fields: cardholder_name, ip_address, device_fingerprint

### Batch Size Limits

- Maximum 100 transactions per request
- Configurable via settings

## Configuration

Edit `app/config.py` or use environment variables:

```bash
# .env file
DEBUG=true
MAX_TRANSACTIONS_PER_REQUEST=100
RISK_SCORE_THRESHOLD=0.7
PII_MASK_ENABLED=true
MAX_PII_FIELDS_ALLOWED=2
ENABLE_RED_TEAM_DETECTION=true
OTEL_ENABLED=true
```

## Development

```bash
# Run tests
uv run pytest tests/

# Lint code
uv run ruff check app/

# Format code
uv run black app/
```

## License

MIT