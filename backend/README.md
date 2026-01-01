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
- **PostgreSQL Integration**: Persistent storage for analyzed transactions
- **Model Versioning**: Track model versions and build timestamps

## Docker Setup (Recommended)

### Prerequisites

- Docker (20.10+)
- Docker Compose (2.0+)

### Quick Start with Docker

```bash
# Navigate to project root
cd /path/to/fraud-detection

# (Optional) Set OpenRouter API key
echo "OPEN_ROUTER_KEY=your-key-here" > .env

# Start all services (PostgreSQL, Backend, Frontend)
docker-compose up --build

# Access the services:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:8000
# - API Docs: http://localhost:8000/docs
```

### Docker Commands

```bash
# Start services in detached mode
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# Stop services
docker-compose down

# Stop and remove volumes (⚠️ deletes database data)
docker-compose down -v

# Rebuild after code changes
docker-compose up --build
```

### Environment Variables

The backend accepts the following environment variables (set via `.env` file or docker-compose):

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql+asyncpg://fraud_user:fraud_pass@localhost:5432/fraud_detection` | PostgreSQL connection string |
| `DATABASE_ECHO` | `false` | Enable SQL query logging |
| `DATABASE_POOL_SIZE` | `5` | Database connection pool size |
| `DATABASE_MAX_OVERFLOW` | `10` | Max overflow connections |
| `DEBUG` | `true` | Enable debug mode |
| `OPEN_ROUTER_KEY` | `""` | OpenRouter API key for LLM features |
| `ENABLE_RED_TEAM_DETECTION` | `true` | Enable prompt injection detection |
| `MAX_TRANSACTIONS_PER_REQUEST` | `100` | Maximum batch size |
| `CORS_ORIGINS` | `["http://localhost:3000"]` | Allowed CORS origins |

### Database Operations

```bash
# Access PostgreSQL container
docker-compose exec postgres psql -U fraud_user -d fraud_detection

# View recent analyses
docker-compose exec postgres psql -U fraud_user -d fraud_detection \\
  -c "SELECT transaction_id, classification, risk_score, created_at FROM analyzed_transactions ORDER BY created_at DESC LIMIT 10;"

# Count analyses by classification
docker-compose exec postgres psql -U fraud_user -d fraud_detection \\
  -c "SELECT classification, COUNT(*) FROM analyzed_transactions GROUP BY classification;"

# Backup database
docker-compose exec postgres pg_dump -U fraud_user fraud_detection > backup.sql

# Restore database
docker-compose exec -T postgres psql -U fraud_user -d fraud_detection < backup.sql
```

---

## Local Development Setup

For local development without Docker:

### Prerequisites

- Python 3.11+
- uv (Fast Python package installer)
- PostgreSQL 14+ (if using database features)

### Installation

```bash
# Navigate to backend directory
cd backend

# Install dependencies (including dev dependencies)
uv sync

# (Optional) Set up PostgreSQL locally
# Create database: fraud_detection
# User: fraud_user
# Password: fraud_pass
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
- `GET /version` - Model and API version information
- `POST /api/analyze` - Analyze transactions for fraud (simulation mode)
- `POST /api/predict` - ML model predictions with XGBoost
- `GET /api/model/health` - Model service health check
- `GET /api/model/info` - Model information
- `POST /api/llm/explain` - LLM-powered fraud explanation
- `POST /api/llm/patterns` - Pattern analysis across transactions
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
DATABASE_URL=postgresql+asyncpg://fraud_user:fraud_pass@localhost:5432/fraud_detection
MAX_TRANSACTIONS_PER_REQUEST=100
PII_MASK_ENABLED=true
MAX_PII_FIELDS_ALLOWED=2
ENABLE_RED_TEAM_DETECTION=true
OTEL_ENABLED=true
OPEN_ROUTER_KEY=sk-or-v1-your-api-key
```

## Development

```bash
# Run tests
uv run pytest tests/

# Lint code
uv run ruff check app/

# Auto-fix lint issues
uv run ruff check --fix app/

# Format code
uv run black app/
```

## Troubleshooting

### Docker Issues

**Build fails with dependency errors:**
```bash
# Clear Docker cache and rebuild
docker-compose down
docker system prune -a
docker-compose up --build
```

**Database connection fails:**
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres

# Wait for database to be ready (startup health checks)
docker-compose up --wait
```

**Port already in use:**
```bash
# Check what's using the port
lsof -ti:8000

# Kill the process
lsof -ti:8000 | xargs kill -9
```

### Local Development Issues

**Import errors:**
- Ensure you're running from the `backend/` directory
- Verify virtual environment is activated: `uv sync`

**Database connection errors:**
- Check PostgreSQL is running: `psql -U fraud_user -d fraud_detection`
- Verify DATABASE_URL in `.env` file

## License

MIT