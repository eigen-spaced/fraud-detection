# 🛡️ Fraud Detection - AI-Powered Analysis

A production-ready fraud detection system with AI-powered explainability, featuring a modern Next.js frontend, FastAPI backend, and LLM integration for human-readable explanations.

## ✨ Key Features

- **🎨 Modern UI**: Single-page React interface with transaction cards and real-time analysis
- **🔒 Security-First**: Red-team detection, PII protection, comprehensive input validation
- **🤖 LLM Explanations**: OpenRouter integration with Claude 3.5 Sonnet for fraud explanations
- **⚡ FastAPI Backend**: Python 3.11+ with Pydantic validation and OpenTelemetry observability
- **📊 Risk Scoring**: ML simulation with bounded risk scores and detailed analysis
- **🧪 Testing Ready**: Pre-configured sample data and comprehensive test suite

## 🏗️ Architecture

```
📱 Next.js Frontend (Port 3000)
    ↓ REST API
🐍 FastAPI Backend (Port 8000)
    ↓ OpenRouter API
🤖 Claude 3.5 Sonnet (LLM)
```

## 🚀 Quick Start

**Get started in 2 minutes:**

```bash
# 1. Set OpenRouter API key
echo "OPEN_ROUTER_KEY=your-key-here" >> backend/.env

# 2. Run automated setup
./start_with_llm.sh

# 3. Open http://localhost:3000
```

**Manual setup:** See [QUICKSTART.md](QUICKSTART.md) for detailed instructions.

## 🗺️ Usage

1. **Load Sample Data**: Click "Legitimate", "Suspicious", "Fraudulent", or "Mixed"
2. **Analyze Transactions**: Click "Analyze Transactions" to see fraud detection results  
3. **Test LLM Integration**: Scroll to "LLM Explanation" and click "Test LLM" for AI explanations

### Sample Data Types
- **✓ Legitimate**: Low-risk everyday purchases (~15% risk)
- **⚠️ Suspicious**: Medium-risk transactions (~50-70% risk)  
- **⛔ Fraudulent**: High-risk patterns (~80-100% risk)
- **🔀 Mixed**: Combination of all risk levels

## 🔍 Documentation

- **[QUICKSTART.md](QUICKSTART.md)**: Complete setup guide with troubleshooting
- **[DOCUMENTATION.md](DOCUMENTATION.md)**: Comprehensive technical documentation
  - API Reference & Schema
  - LLM Integration Guide  
  - Security Features
  - Testing Guide
  - Development Workflow
  - Troubleshooting

## 🛠️ Tech Stack

**Frontend:** Next.js 15 • React 19 • TypeScript • Tailwind CSS • React Query  
**Backend:** FastAPI • Python 3.11+ • Pydantic • OpenTelemetry • uv  
**AI:** OpenRouter • Claude 3.5 Sonnet • LLM Explanations


---

**Built with ❤️ for secure, AI-powered fraud detection**
