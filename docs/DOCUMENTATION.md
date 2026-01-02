#  Fraud Detection - Comprehensive Documentation

This document provides complete technical documentation for the AI-powered fraud detection application with LLM explainability integration.

##  Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Features](#architecture--features)
3. [LLM Integration](#llm-integration)
4. [API Reference](#api-reference)
5. [Testing Guide](#testing-guide)
6. [Security Features](#security-features)
7. [Development Guide](#development-guide)
8. [Troubleshooting](#troubleshooting)
9. [Future Enhancements](#future-enhancements)

---

##  Project Overview

### What Was Built

A complete, production-ready MVP for AI-powered credit card fraud detection with:
- **Modern Next.js Frontend** with TypeScript and Tailwind CSS
- **FastAPI Backend** with Python 3.11+ and comprehensive validation  
- **LLM Integration** via OpenRouter for human-readable explanations
- **Security Features** including red-team detection and PII protection
- **Single-Page Interface** with streamlined user experience

### Project Statistics

```
Total Files: 25+
Backend Files: 10 Python files  
Frontend Files: 8 TypeScript/TSX files
Lines of Code: ~3,000+
Documentation: Comprehensive guides and API docs
```

### Technology Stack

#### Frontend
- Next.js 15.5.4 (App Router)
- React 19 with TypeScript 5.x
- Tailwind CSS 4.x for styling
- React Query 5.x for state management
- Axios for API communication

#### Backend  
- FastAPI 0.104+ with Python 3.11+
- Pydantic 2.5+ for validation
- OpenTelemetry 1.21+ for observability
- OpenRouter integration for LLM services
- uv for fast dependency management

---

##  Architecture & Features

### System Architecture

```

           Browser (User)                    

                HTTP
               

      Next.js Frontend (Port 3000)           
     
    Components                             
    - Header                               
    - TransactionCardInput                 
    - ResultsPanel                         
    - LLMExplanation                       
     

                REST API (JSON)
               

     FastAPI Backend (Port 8000)             
     
    API Endpoints                          
    - /api/analyze                         
    - /api/llm/explain                     
    - /api/llm/patterns                    
    - /health                              
     
     
    OpenRouter LLM Service                 
    - Transaction Explanations             
    - Pattern Analysis                     
    - Claude 3.5 Sonnet                    
     

```

### Core Features 

#### Frontend Features
- **Single-Page Interface**: Streamlined transaction analysis workflow
- **Sample Data Loader**: 3 pre-configured scenarios (Legitimate, Suspicious, Fraudulent)
- **Transaction Cards**: Visual display with detailed transaction information
- **Real-time Analysis**: Loading states, error handling, success feedback
- **LLM Integration**: Test button for AI-powered explanations
- **Responsive Design**: Works on desktop and mobile devices

#### Backend Features
- **Pydantic Validation**: Strict input validation with JSON Schema
- **Fraud Detection**: Rule-based ML simulation with risk scoring
- **Security Suite**: Red-team detection, PII protection, batch limits
- **OpenTelemetry**: Comprehensive logging and observability
- **CORS Support**: Configured for frontend integration

### Project Structure

```
fraud-detection/
 backend/
    app/
       main.py              # FastAPI app & endpoints
       models.py            # Pydantic models
       config.py            # Configuration
       fraud_detector.py    # ML simulation
       openrouter_service.py# LLM integration
       observability.py    # OpenTelemetry
    pyproject.toml          # Dependencies
    test_openrouter.py      # LLM testing
    .env.example
 frontend/
    app/
       page.tsx            # Main interface
       layout.tsx          # Root layout
       providers.tsx       # React Query
       globals.css         # CSS variables theming
    components/
       transactions/       # Transaction components
          TransactionCard.tsx
          TransactionCardInput.tsx
       analysis/           # Analysis components
          AnalysisResults.tsx
          AnalysisCard.tsx
          FormattedExplanation.tsx
          ShapWaterfall.tsx
       Header.tsx          # Application header
       TabbedResultsPanel.tsx  # Results tabs
       LLMExplanation.tsx      # LLM interface
       ThemeContext.tsx        # Theme management
    lib/
        api.ts              # API client
        newSampleData.ts    # Test data
        transactionUtils.ts # Data conversion
    COMPONENTS.md           # Component documentation
 DOCUMENTATION.md            # This file
 README.md                   # Project overview
 QUICKSTART.md              # Setup guide
 start_with_llm.sh          # Automated startup
```

---

## LLM Integration

### Overview

The system includes OpenRouter LLM integration for generating human-readable explanations of fraud detection predictions using Claude 3.5 Sonnet.

### Configuration

#### Environment Setup
```bash
# Backend environment
echo "OPEN_ROUTER_KEY=sk-or-v1-your-api-key-here" >> backend/.env
```

#### OpenRouter Settings  
- **Model**: `anthropic/claude-3.5-sonnet`
- **Base URL**: `https://openrouter.ai/api/v1`
- **Response Time**: 2-5 seconds per explanation

### LLM API Endpoints

#### 1. Individual Transaction Explanation
**POST** `/api/llm/explain`

**Request:**
```json
{
  "transaction_data": {
    "transaction_id": "TXN_001",
    "amount": 2500.00,
    "merchant_name": "Electronics Store",
    "merchant_category": "electronics",
    "location": "Las Vegas, NV"
  },
  "fraud_probability": 0.85,
  "risk_factors": [
    "High transaction amount",
    "Late night transaction", 
    "Unusual location"
  ]
}
```

**Response:**
```json
{
  "transaction_id": "TXN_001",
  "explanation": "This transaction has a high fraud probability (85%) due to several concerning factors...",
  "fraud_probability": 0.85,
  "risk_level": "HIGH",
  "model_used": "anthropic/claude-3.5-sonnet",
  "generated_at": "2025-01-08T14:35:00Z"
}
```

#### 2. Pattern Analysis
**POST** `/api/llm/patterns`

**Request:**
```json
{
  "transactions": [
    {"transaction_id": "T1", "amount": 50.00, "merchant_name": "Coffee Shop"},
    {"transaction_id": "T2", "amount": 2500.00, "merchant_name": "Electronics Store"}
  ],
  "predictions": [0.15, 0.85]
}
```

**Response:**
```json
{
  "analysis": "This batch shows concerning patterns with high-value transactions...",
  "transaction_count": 2,
  "high_risk_count": 1,
  "medium_risk_count": 0, 
  "low_risk_count": 1,
  "average_risk_score": 0.5,
  "model_used": "anthropic/claude-3.5-sonnet",
  "generated_at": "2025-01-08T14:35:00Z"
}
```

### Frontend LLM Integration

#### LLMExplanation Component
- **Location**: Bottom of ResultsPanel after transaction analysis
- **Test Button**: Purple "Test LLM" button with sparkle icon
- **States**: Loading (purple spinner), Success (formatted explanation), Error (detailed debugging)

#### UI Flow
1. Load sample transaction data
2. Click "Analyze Transactions"
3. Scroll to " LLM Explanation" section
4. Click "Test LLM" to generate AI explanation
5. View formatted results with risk analysis

---

## API Reference

### Core Endpoints

#### Health Check
```bash
GET /health
# Response: {"status": "healthy", "version": "0.1.0", "timestamp": "..."}
```

#### Transaction Analysis  
```bash
POST /api/analyze
Content-Type: application/json

{
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
}
```

#### API Information
```bash
GET /
# Returns: API info, endpoints, LLM status
```

#### JSON Schemas
```bash 
GET /api/schema
# Returns: All Pydantic model schemas
```

### Transaction Schema

#### Required Fields
```typescript
{
  transaction_id: string (1-100 chars)
  timestamp: ISO 8601 datetime
  amount: number (0-1000000, positive)
  merchant_name: string (1-200 chars)
  merchant_category: string (1-100 chars) 
  card_number: string (exactly 4 digits)
  location: string (1-200 chars)
}
```

#### Optional Fields
```typescript
{
  cardholder_name?: string (max 100 chars)
  device_fingerprint?: string (max 500 chars)
  ip_address?: string (max 45 chars)
}
```

### Response Models

#### Fraud Analysis Response
```typescript
{
  summary: string
  total_transactions: number
  fraudulent_count: number
  suspicious_count: number  
  legitimate_count: number
  average_risk_score: number (0.0-1.0)
  analyses: FraudAnalysis[]
  citations: Citation[]
  warnings: string[]
}
```

#### Individual Analysis
```typescript  
{
  transaction_id: string
  classification: "legitimate" | "suspicious" | "fraudulent" | "unknown"
  risk_score: number (0.0-1.0, 3 decimal precision)
  risk_factors: string[]
  explanation: string
}
```

---

## Testing Guide

### Quick Start Testing

#### Automated Setup
```bash
# Set OpenRouter API key
echo "OPEN_ROUTER_KEY=your-key-here" >> backend/.env

# Start both servers  
./start_with_llm.sh

# Open http://localhost:3000
```

#### Manual Testing Steps
1. **Load Sample Data**: Click "Legitimate", "Suspicious", or "Fraudulent"
2. **Analyze**: Click "Analyze Transactions" button
3. **View Results**: Check analysis in right panel
4. **Test LLM**: Scroll to "LLM Explanation" section, click "Test LLM"
5. **Verify States**: Loading → Success/Error with proper feedback

### Testing Scenarios

#### Sample Data Types
- ** Legitimate**: Low-risk everyday purchases (~15% risk scores)
- ** Suspicious**: Medium-risk transactions (~50-70% risk scores)  
- ** Fraudulent**: High-risk patterns (~80-100% risk scores)

#### LLM Testing States

**Success Path:**
```
LLM Explanation
[Test LLM] [Clear]

Transaction Analysis                    HIGH RISK
Transaction ID: TEST_001
Fraud Probability: 85.0%

AI Explanation
This transaction has a high fraud probability (85%) due to several concerning factors...

Model Used: anthropic/claude-3.5-sonnet
Generated At: 1/8/2025, 2:35:00 PM
```

**Error Scenarios:**
- Missing API key → Service unavailable message
- Backend offline → Network connection error  
- Invalid API key → Authentication error (401)

### API Testing

#### Direct Backend Testing
```bash
# Health check
curl http://localhost:8000/health

# Transaction analysis
curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"transactions":[{"transaction_id":"T1","timestamp":"2025-01-01T00:00:00Z","amount":100,"merchant_name":"Test","merchant_category":"retail","card_number":"1234","location":"Test City"}]}'

# LLM explanation
curl -X POST http://localhost:8000/api/llm/explain \
  -H "Content-Type: application/json" \
  -d '{"transaction_data":{"transaction_id":"T1","amount":1000},"fraud_probability":0.8,"risk_factors":["High amount"]}'
```

#### Environment Verification
```bash
cd backend
python -c "from app.config import settings; print(f'OpenRouter key configured: {bool(settings.open_router_key)}')"
```

---

## Security Features

### Implemented Security

#### 1. Red-Team Detection Suite
Automatically detects and refuses requests containing:
- **Prompt Injection**: "ignore previous instructions", "system prompt"
- **Command Injection**: "you are now", "forget everything"  
- **Special Tokens**: `<|...|>`, hex escapes, HTML entities
- **Code Injection**: `eval()`, `exec()`, `__import__`

**Example Refusal:**
```json
{
  "refused": true,
  "reason": "Security Policy Violation",
  "details": "Potential prompt injection detected in merchant name"
}
```

#### 2. PII Protection Policy
- **Tracked Fields**: `cardholder_name`, `ip_address`, `device_fingerprint`
- **Limits**: Max 2 PII fields per transaction (configurable)
- **Enforcement**: Refuses if >10% of batch violates policy
- **Response**: Clear refusal with explanation

#### 3. Input Validation
- **Pydantic Models**: Strict field validation with type checking
- **Batch Limits**: Maximum 100 transactions per request
- **Field Constraints**: Length limits, format validation, required fields
- **Automatic Sanitization**: Whitespace stripping, bounds checking

#### 4. Citation Validation  
- **Domain Allow-listing**: Configurable trusted domains
- **URL Parsing**: Validates full URL structure
- **Subdomain Support**: Handles www. prefixes and subdomains
- **Rejection**: Non-allowed domains automatically rejected

### Configuration

#### Backend Security Settings
```bash
ENABLE_RED_TEAM_DETECTION=true
MAX_PII_FIELDS_ALLOWED=2
MAX_TRANSACTIONS_PER_REQUEST=100
PII_MASK_ENABLED=true
ALLOWED_CITATION_DOMAINS=["example.com", "trusted-source.com"]
```

### Production Security Recommendations
- Add rate limiting and API authentication
- Enable HTTPS with proper certificates
- Implement API keys for access control
- Use environment-specific secrets management
- Set up WAF (Web Application Firewall)
- Enable comprehensive audit logging

---

## Development Guide

### Local Development Setup

#### Prerequisites
- Python 3.11+ with uv package manager
- Node.js 18+ with npm
- Git for version control

#### Backend Development
```bash
cd backend

# Setup virtual environment
uv sync

# Run with auto-reload
uv run uvicorn app.main:app --reload --port 8000

# Run tests  
python test_openrouter.py

# View API docs
# http://localhost:8000/docs (Swagger UI)
# http://localhost:8000/redoc (ReDoc)
```

#### Frontend Development
```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Type checking
npx tsc --noEmit
```

### Development Workflow

#### Making Changes
1. **Create Feature Branch**: `git checkout -b feature/new-feature`
2. **Make Changes**: Update code with proper typing
3. **Test Locally**: Verify functionality with test data
4. **Build Check**: Ensure `npm run build` passes
5. **Commit**: Use descriptive commit messages
6. **Merge**: Create PR when ready

#### Code Quality

**Backend Standards:**
- Type hints throughout (`typing` module)
- Pydantic validation for all inputs
- Async/await patterns for I/O operations  
- Comprehensive error handling
- Structured logging with context

**Frontend Standards:**
- TypeScript strict mode enabled
- Component-based architecture
- React Query for API state management
- Tailwind CSS for consistent styling
- Proper error boundaries

### Adding New Features

#### Adding API Endpoints
1. **Define Pydantic Model** in `app/models.py`
2. **Add Endpoint** in `app/main.py`
3. **Update OpenAPI Schema** (automatic)
4. **Add Frontend Types** in `lib/api.ts`
5. **Create UI Components** as needed

#### Adding LLM Features
1. **Extend OpenRouter Service** in `app/openrouter_service.py`
2. **Add API Models** for request/response
3. **Create Frontend Components** for interaction
4. **Update Testing Documentation**

---

##  Troubleshooting

### Common Issues & Solutions

#### Backend Issues

**Port 8000 in use:**
```bash
# Find and kill process
lsof -ti:8000 | xargs kill -9

# Or use different port
uv run uvicorn app.main:app --reload --port 8001
```

**Dependency errors:**
```bash
# Clean reinstall
rm -rf .venv uv.lock
uv sync
```

**OpenRouter service unavailable:**
```bash
# Check API key configuration
python -c "from app.config import settings; print(settings.open_router_key[:10] + '...')"

# Verify network connectivity
curl https://openrouter.ai/api/v1/models -H "Authorization: Bearer $OPEN_ROUTER_KEY"
```

#### Frontend Issues  

**Node module errors:**
```bash
# Clear cache and reinstall
rm -rf node_modules .next package-lock.json
npm install
```

**Build failures:**
```bash
# Type checking
npx tsc --noEmit

# Clear Next.js cache
rm -rf .next
npm run build
```

**API connection errors:**
- Verify backend running on port 8000
- Check CORS configuration in `backend/app/config.py`
- Confirm `NEXT_PUBLIC_API_URL` in `frontend/.env.local`

#### LLM Integration Issues

**"Service not available":**
- Ensure `OPEN_ROUTER_KEY` is set in `backend/.env`
- Verify API key validity with OpenRouter
- Check network connectivity and firewall rules

**Slow response times:**
- OpenRouter latency varies by model and load
- Consider implementing request timeouts
- Monitor OpenRouter service status

**Frontend not showing LLM section:**
- Verify transaction analysis completed first
- Check browser console for React errors
- Confirm LLMExplanation component import

### Debug Mode

#### Enable Detailed Logging
```python
import logging
logging.getLogger("app.openrouter_service").setLevel(logging.DEBUG)
logging.getLogger("app.fraud_detector").setLevel(logging.DEBUG)
```

#### Browser Debugging
- **Network Tab**: Monitor API calls and responses
- **Console**: Check for JavaScript errors
- **React DevTools**: Inspect component state

---

## Future Enhancements

### Planned Features

#### Phase 1: Core Improvements
- **Real ML Model Integration**: Replace simulation with trained models (scikit-learn/TensorFlow/PyTorch)
- **SHAP Integration**: Combine SHAP explanations with LLM narratives
- **Enhanced UI**: More sophisticated explanation formatting and visualization

#### Phase 2: Advanced Features  
- **User Authentication**: JWT/OAuth integration with role-based access
- **Transaction History**: Database storage with search and filtering
- **Advanced Analytics**: Dashboard with charts, trends, and insights
- **Export Capabilities**: PDF reports, CSV data export

#### Phase 3: Enterprise Features
- **Webhook Notifications**: Real-time alerts for high-risk transactions
- **Batch Processing**: Queue system for high-volume analysis
- **Multi-tenant Support**: Organization-based access control
- **API Rate Limiting**: Request throttling and usage quotas

#### Phase 4: Production Readiness
- **Docker Containerization**: Full containerized deployment
- **CI/CD Pipeline**: Automated testing and deployment
- **Production Observability**: Jaeger tracing, Prometheus metrics
- **Performance Optimization**: Caching, CDN, database optimization

### Integration Opportunities

#### ML Pipeline Enhancement
```
Transactions → Feature Engineering → ML Model → Predictions → SHAP Values → LLM Service → Explanations
```

#### Data Sources
- **Real-time Streams**: Kafka/Redis integration
- **Historical Data**: Database with time-series analysis
- **External APIs**: Credit bureau, merchant verification
- **Feedback Loop**: User corrections to improve model

#### Advanced Analytics
- **Risk Patterns**: Automated pattern detection and alerting
- **Model Performance**: A/B testing and model comparison
- **Business Intelligence**: Integration with BI tools
- **Compliance Reporting**: Automated regulatory reports

### Technical Roadmap
