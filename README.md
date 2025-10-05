# 🛡️ CC Fraud Detection - AI-Powered MCP Application

A complete fraud detection system with AI-powered analysis, featuring a modern Next.js frontend and FastAPI backend with comprehensive security features.

## 🎯 Features

### Core Functionality
- **JSON Input/Output**: Paste transaction JSON, receive LLM-powered analysis
- **Pydantic Validation**: Strict input validation with JSON Schema
- **Enum-locked Classifications**: Legitimate, Suspicious, Fraudulent, Unknown
- **Numeric Risk Scores**: Bounded [0.0, 1.0] with 3 decimal precision
- **Human-Readable Explanations**: Clear, non-technical fraud analysis
- **Citation Validation**: Only allow-listed domains

### Security Features
- **Red-team Detection**: Identifies prompt injection attempts in merchant names and device fingerprints
- **PII Protection**: Refusal policy for excessive PII (configurable threshold)
- **Batch Size Limits**: Maximum 100 transactions per request
- **Input Validation**: Comprehensive validation of all transaction fields

### Technical Features
- **OpenTelemetry**: Logging and observability
- **Health Checks**: API monitoring endpoints
- **CORS Support**: Configured for frontend integration
- **Error Handling**: Comprehensive error responses
- **Sample Data**: Pre-loaded examples for testing

## 📁 Project Structure

```
fraud-detection/
├── backend/              # FastAPI Python backend
│   ├── app/
│   │   ├── main.py      # FastAPI application
│   │   ├── models.py    # Pydantic models
│   │   ├── config.py    # Configuration settings
│   │   ├── fraud_detector.py  # ML simulation & detection
│   │   └── observability.py   # OpenTelemetry setup
│   ├── pyproject.toml   # uv dependencies
│   └── README.md
├── frontend/            # Next.js TypeScript frontend
│   ├── app/            # Next.js app router
│   ├── components/     # React components
│   ├── lib/           # API client & utilities
│   └── package.json
└── README.md          # This file
```

## 🚀 Quick Start

### Prerequisites

- **Backend**: Python 3.11+, uv
- **Frontend**: Node.js 18+, npm
- **Optional**: Docker (for containerized deployment)

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install uv (if not already installed)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install dependencies
uv sync

# Start the backend server
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

**API Documentation**: 
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

## 📊 Usage

### Web Interface

1. Open `http://localhost:3000` in your browser
2. Click one of the sample data buttons (Legitimate, Suspicious, Fraudulent, Mixed)
3. Or paste your own transaction JSON in the left panel
4. Click "Analyze Transactions"
5. View the AI-powered analysis in the right panel

### API Usage

#### Analyze Transactions

```bash
curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "transactions": [
      {
        "transaction_id": "TXN001",
        "timestamp": "2025-01-15T14:30:00Z",
        "amount": 125.50,
        "merchant_name": "Store Name",
        "merchant_category": "retail",
        "card_number": "1234",
        "location": "City, State"
      }
    ]
  }'
```

#### Health Check

```bash
curl http://localhost:8000/health
```

## 📝 Transaction Schema

### Required Fields

```json
{
  "transaction_id": "string (1-100 chars)",
  "timestamp": "ISO 8601 datetime",
  "amount": "float (0-1000000)",
  "merchant_name": "string (1-200 chars)",
  "merchant_category": "string (1-100 chars)",
  "card_number": "4 digits only (last 4)",
  "location": "string (1-200 chars)"
}
```

### Optional Fields

```json
{
  "cardholder_name": "string (max 100 chars)",
  "device_fingerprint": "string (max 500 chars)",
  "ip_address": "string (max 45 chars)"
}
```

## 🧪 Testing with Sample Data

The frontend includes four pre-configured sample datasets:

### 1. Legitimate Transactions
- Low-risk everyday purchases
- Expected risk scores: 0-30%

### 2. Suspicious Transactions
- Medium-risk late-night or high-value purchases
- Expected risk scores: 45-75%

### 3. Fraudulent Transactions
- High-risk patterns (large amounts, late night, risky categories)
- Expected risk scores: 75-100%

### 4. Mixed Transactions
- Combination of all risk levels
- Tests system's ability to discriminate

## 🔐 Security Features

### Red-team Detection

The system detects and refuses requests containing:
- "ignore previous instructions"
- "system prompt" manipulation attempts
- Special tokens and escape sequences
- Code injection patterns

Example refusal:
```json
{
  "refused": true,
  "reason": "Security Policy Violation",
  "details": "Potential prompt injection detected..."
}
```

### PII Policy

Refuses requests when >10% of transactions contain excessive PII:
- Maximum 2 PII fields per transaction (configurable)
- Fields: `cardholder_name`, `ip_address`, `device_fingerprint`

### Batch Limits

- Maximum 100 transactions per request
- Configurable via backend settings

## 🔧 Configuration

### Backend Configuration

Edit `backend/app/config.py` or create `.env`:

```bash
DEBUG=true
MAX_TRANSACTIONS_PER_REQUEST=100
RISK_SCORE_THRESHOLD=0.7
PII_MASK_ENABLED=true
MAX_PII_FIELDS_ALLOWED=2
ENABLE_RED_TEAM_DETECTION=true
OTEL_ENABLED=true
```

### Frontend Configuration

Create `frontend/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 🧬 Transaction Generation

### Using Sparkov Data Generator

For generating realistic test data, you can use the Sparkov Credit Card Transaction Generator:

```bash
# Clone the repository
git clone https://github.com/namebrandon/Sparkov_Data_Generation.git
cd Sparkov_Data_Generation

# Install dependencies
pip install -r requirements.txt

# Generate transactions
python generate.py --customers 100 --days 7 --output transactions.csv

# Convert to JSON format (use provided script or manual conversion)
```

### Sample Transaction Generator Script

Create `backend/generate_transactions.py`:

```python
import json
from datetime import datetime, timedelta
import random

def generate_sample_transactions(count=10):
    """Generate sample transactions for testing."""
    merchants = [
        ("Whole Foods", "grocery"),
        ("Shell Station", "gas"),
        ("Best Buy", "electronics"),
        ("Casino Resort", "gambling"),
        ("Crypto Exchange", "crypto"),
        ("Wire Transfer Co", "wire_transfer"),
    ]
    
    transactions = []
    base_time = datetime.utcnow()
    
    for i in range(count):
        merchant, category = random.choice(merchants)
        transactions.append({
            "transaction_id": f"TXN{i+1:03d}",
            "timestamp": (base_time - timedelta(hours=random.randint(0, 48))).isoformat() + "Z",
            "amount": round(random.uniform(10, 5000), 2),
            "merchant_name": merchant,
            "merchant_category": category,
            "card_number": "1234",
            "location": random.choice(["New York, NY", "Los Angeles, CA", "International"]),
        })
    
    return {"transactions": transactions}

if __name__ == "__main__":
    data = generate_sample_transactions(20)
    print(json.dumps(data, indent=2))
```

## 📈 ML Model (Simulated)

The current implementation simulates an ML model using rule-based scoring:

### Risk Factors
- **Amount**: >$5000 (+30%), >$1000 (+15%)
- **Time**: 2-5 AM (+20%)
- **Category**: gambling, crypto, wire_transfer (+25%)
- **Location**: international keywords (+20%)
- **Merchant**: suspicious keywords (+15%)

### Classification Thresholds
- **Legitimate**: risk_score < 0.45
- **Suspicious**: 0.45 ≤ risk_score < 0.75
- **Fraudulent**: risk_score ≥ 0.75

### Future Integration

To integrate a real ML model:

1. Replace `simulate_ml_model()` in `backend/app/fraud_detector.py`
2. Load your trained model (scikit-learn, TensorFlow, PyTorch)
3. Extract features from transaction data
4. Return risk score and feature importances

## 🐛 Troubleshooting

### Backend Issues

**Port 8000 already in use:**
```bash
# Find and kill the process
lsof -ti:8000 | xargs kill -9

# Or use a different port
pdm run uvicorn app.main:app --reload --port 8001
```

**Import errors:**
```bash
# Reinstall dependencies
rm -rf .venv uv.lock
uv sync
```

### Frontend Issues

**Node module errors:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**API connection errors:**
- Ensure backend is running on port 8000
- Check CORS settings in `backend/app/config.py`
- Verify `NEXT_PUBLIC_API_URL` in frontend `.env.local`

## 🚢 Deployment

### Docker Deployment (Future)

```bash
# Build and run with docker-compose
docker-compose up --build
```

### Production Considerations

1. **Backend**:
   - Use production ASGI server (Gunicorn + Uvicorn workers)
   - Enable HTTPS
   - Configure proper CORS origins
   - Set DEBUG=false
   - Use environment-specific secrets
   - Set up proper OpenTelemetry exporters

2. **Frontend**:
   - Build for production: `npm run build`
   - Deploy to Vercel/Netlify/AWS
   - Configure production API URL
   - Enable CDN caching

## 📄 API Endpoints

### Core Endpoints
- `GET /` - API information
- `GET /health` - Health check
- `POST /api/analyze` - Analyze transactions
- `GET /api/explain` - Model explanation (placeholder)
- `GET /api/cases` - Fraud case examples (placeholder)
- `GET /api/schema` - JSON schemas

## 🤝 Contributing

This is an MVP. Future enhancements:
- Real ML model integration
- User authentication
- Transaction history storage
- Advanced analytics dashboard
- Webhook notifications
- Batch processing
- Real-time monitoring

## 📜 License

MIT

## 🙏 Acknowledgments

- FastAPI for the excellent Python framework
- Next.js for the modern React framework
- OpenTelemetry for observability
- Sparkov for transaction generation concepts

---

**Built with ❤️ for secure, AI-powered fraud detection**