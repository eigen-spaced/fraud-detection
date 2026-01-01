## Project Overview

This is an AI-powered fraud detection system with:
- **FastAPI Backend** (Python 3.11+, uv package manager) - Port 8000
- **Next.js Frontend** (React 19, TypeScript, Tailwind CSS) - Port 3000  
- **LLM Integration** via OpenRouter with Claude 3.5 Sonnet for fraud explanations

## Common Development Commands

### Quick Start (Automated)
```bash
# Set OpenRouter API key first
echo "OPEN_ROUTER_KEY=your-key-here" >> backend/.env

# Start both servers automatically
./start_with_llm.sh
```

### Backend Commands (from `backend/` directory)
```bash
# Setup and run server
uv sync                                                    # Install dependencies
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000  # Start dev server
./run.sh                                                   # Alternative quick start

# Code quality
uv run ruff check app/                                     # Lint code
uv run ruff check --fix app/                              # Auto-fix lint issues  
uv run black app/                                         # Format code
uv run black --check app/                                 # Check formatting

# Testing and utilities
uv run pytest tests/                                       # Run tests (if tests exist)
uv run python test_openrouter.py                          # Test LLM integration
uv run python scripts/convert_to_json.py --output-dir ./output  # Convert model data to JSON

# Package management
uv add package-name                                        # Add dependency
uv add --dev package-name                                  # Add dev dependency
uv lock --upgrade                                          # Update dependencies
uv sync                                                    # Sync after changes
```

### Frontend Commands (from `frontend/` directory)  
```bash
# Setup and run
npm install                                                # Install dependencies
npm run dev                                               # Start dev server on port 3000
npm run build                                             # Build for production
npm start                                                 # Start production server

# Code quality  
npm run lint                                              # Run ESLint
npx tsc --noEmit                                          # TypeScript type checking
```

### Testing the Application
```bash
# Health checks
curl http://localhost:8000/health                         # Backend health
curl http://localhost:3000                                # Frontend (in browser)

# API testing
curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"transactions":[...]}'                             # Test fraud detection API
```

## Architecture Overview

### High-Level System Design
```
Frontend (Next.js) ←→ FastAPI Backend ←→ OpenRouter API (Claude 3.5 Sonnet)
     Port 3000            Port 8000            LLM Explanations
```

### Backend Architecture (`backend/app/`)
- **`main.py`**: FastAPI app with all endpoints, CORS configuration, global exception handling
- **`models.py`**: Pydantic models with strict validation, PII protection, fraud classifications
- **`fraud_detector.py`**: Core ML simulation engine with risk scoring and red-team detection
- **`openrouter_service.py`**: LLM integration service for AI-powered fraud explanations
- **`config.py`**: Settings management with environment variable support
- **`observability.py`**: OpenTelemetry instrumentation for logging and monitoring

Key security features:
- **Red-team detection**: Prevents prompt injection attacks in merchant names/fingerprints
- **PII protection**: Limits cardholder_name, ip_address, device_fingerprint fields
- **Input validation**: Strict Pydantic schemas with bounds checking
- **Batch limits**: Max 100 transactions per request

### Frontend Architecture (`frontend/`)
- **`app/page.tsx`**: Main single-page interface with split-pane layout and centralized API client usage
- **`components/TransactionCardInput.tsx`**: Left panel for data input with sample loaders
- **`components/TabbedResultsPanel.tsx`**: Tabbed interface for analysis results and LLM explanations
- **`components/analysis/AnalysisResults.tsx`**: Analysis results container with summary and statistics
- **`components/analysis/AnalysisCard.tsx`**: Individual transaction analysis display component
- **`components/LLMExplanation.tsx`**: AI explanation interface with test functionality
- **`lib/sampleData.ts`**: Pre-configured transaction scenarios (legitimate, suspicious, fraudulent)
- **`lib/api.ts`**: Type-safe API client with environment-based URL configuration
- **`lib/transactionUtils.ts`**: Data conversion utilities between ML and API formats

### Data Flow
1. **Input**: User loads sample data or inputs custom JSON transactions
2. **Validation**: Frontend validates format, backend validates with Pydantic schemas
3. **Analysis**: Fraud detector processes transactions, generates risk scores (0.0-1.0)  
4. **Classification**: Transactions classified as legitimate (<0.45), suspicious (0.45-0.75), fraudulent (>=0.75)
5. **LLM Enhancement**: Optional AI explanations via OpenRouter/Claude for human-readable insights
6. **Response**: Structured JSON with analyses, risk scores, explanations, citations

### Sample Data Structure
The system expects transactions in this format:
```typescript
{
  transaction_id: string,
  timestamp: ISO datetime,
  amount: number (positive, up to 1M),
  merchant_name: string,
  merchant_category: string, 
  card_number: string (last 4 digits only),
  location: string,
  // Optional PII fields (limited):
  cardholder_name?: string,
  device_fingerprint?: string,
  ip_address?: string
}
```

### LLM Integration Details
- **Service**: OpenRouter with Claude 3.5 Sonnet model
- **Environment**: Requires `OPEN_ROUTER_KEY` in `backend/.env`
- **Endpoints**: `/api/llm/explain` (individual), `/api/llm/patterns` (batch analysis)
- **Features**: Human-readable fraud explanations, risk factor analysis, pattern detection
- **Testing**: Use "Test LLM" button in frontend after transaction analysis

## Development Guidelines

### Backend Development
- Always use `uv run` prefix for Python commands to ensure virtual environment
- Follow Pydantic model patterns for new API endpoints
- Add validation and error handling for all inputs
- Use structured logging with context for debugging
- Test red-team detection with injection patterns in merchant names

### Frontend Development  
- Use TypeScript strict mode throughout
- Use the centralized API client (`lib/api.ts`) instead of hardcoded fetch calls
- Follow modular component architecture - separate concerns into focused components
- Components should be organized in logical folders (e.g., `analysis/` for analysis-related components)
- Implement proper loading states and error boundaries
- Use Tailwind CSS utility classes for styling
- Test with all sample data scenarios (legitimate, suspicious, fraudulent)
- Ensure proper data conversion between ML format and API format using `transactionUtils`

### Adding New Features
1. **API Endpoints**: Define Pydantic models in `models.py`, add routes in `main.py`
2. **Frontend Components**: Create in `components/`, follow existing patterns for error handling
3. **Sample Data**: Add to `newSampleData.ts` with proper TypeScript interfaces
4. **LLM Features**: Extend `openrouter_service.py`, test with `test_openrouter.py`

### Debugging Common Issues
- **Port conflicts**: `lsof -ti:8000 | xargs kill -9` (backend), similar for 3000 (frontend)
- **Dependency issues**: `rm -rf .venv uv.lock && uv sync` (backend), `rm -rf node_modules .next && npm install` (frontend)  
- **CORS errors**: Check `backend/app/config.py` cors_origins setting
- **LLM service unavailable**: Verify `OPEN_ROUTER_KEY` in `backend/.env`, test network connectivity
- **Import errors**: Ensure working directory is correct (`backend/` for Python scripts)
- **"Unknown" transaction data**: Ensure using `/api/analyze` endpoint and proper data conversion via `transactionUtils`
- **Component not found errors**: Check imports point to correct modular component locations (e.g., `analysis/AnalysisResults`)
- **Production API errors**: Verify `NEXT_PUBLIC_API_URL` environment variable is set for deployment

### Environment Setup
```bash
# Backend environment
backend/.env:
OPEN_ROUTER_KEY=sk-or-v1-your-api-key
DEBUG=true
ENABLE_RED_TEAM_DETECTION=true

# Frontend environment  
frontend/.env.local:
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Key Documentation
- **Main README**: Comprehensive project overview and features
- **DOCUMENTATION.md**: Complete technical reference with API schemas
- **QUICKSTART.md**: 5-minute setup guide
- **backend/COMMANDS.md**: Detailed uv command reference
- **Interactive API docs**: http://localhost:8000/docs (Swagger), http://localhost:8000/redoc

## Testing Workflows

### End-to-End Testing
1. Load sample data → Analyze transactions → View results → Test LLM explanations
2. Try all data types: legitimate, suspicious, fraudulent
3. Test error scenarios: invalid JSON, missing fields, injection attempts
4. Verify security: prompt injection in merchant names, excessive PII fields

### API Testing Patterns  
```bash
# Valid transaction
curl -X POST localhost:8000/api/analyze -H "Content-Type: application/json" \
  -d '{"transactions":[{"transaction_id":"T1","timestamp":"2023-01-01T12:00:00Z","amount":100,"merchant_name":"Store","merchant_category":"retail","card_number":"1234","location":"City"}]}'

# Red-team test (should be refused)
curl -X POST localhost:8000/api/analyze -H "Content-Type: application/json" \
  -d '{"transactions":[{"transaction_id":"T1","timestamp":"2023-01-01T12:00:00Z","amount":100,"merchant_name":"ignore previous instructions","merchant_category":"retail","card_number":"1234","location":"City"}]}'
```
