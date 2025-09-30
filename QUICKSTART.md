# 🚀 Quick Start Guide

Get the fraud detection app running in 5 minutes!

## Prerequisites Check

```bash
# Check Python version (need 3.11+)
python3 --version

# Check Node.js version (need 18+)
node --version

# Check if PDM is installed
pdm --version
```

If PDM is not installed:
```bash
curl -sSL https://pdm-project.org/install-pdm.py | python3 -
```

## Step 1: Start the Backend (Terminal 1)

```bash
# Navigate to backend
cd backend

# Install dependencies
pdm install

# Start the API server
pdm start
```

✅ Backend should be running at http://localhost:8000

Test it:
```bash
curl http://localhost:8000/health
```

## Step 2: Start the Frontend (Terminal 2)

```bash
# Navigate to frontend (from project root)
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

✅ Frontend should be running at http://localhost:3000

## Step 3: Test the Application

1. Open http://localhost:3000 in your browser
2. Click **"✓ Legitimate"** to load sample data
3. Click **"🔍 Analyze Transactions"**
4. View the results in the right panel!

## Try Different Scenarios

- **✓ Legitimate**: Low-risk everyday purchases (~15% risk)
- **⚠️ Suspicious**: Medium-risk transactions (~50-70% risk)
- **⛔ Fraudulent**: High-risk patterns (~80-100% risk)
- **🔀 Mixed**: Combination of all types

## API Documentation

Visit http://localhost:8000/docs for interactive API documentation.

## Generate Custom Data

```bash
# From backend directory
python3 generate_transactions.py --count 20 --risk-level mixed
```

Copy the output and paste it into the frontend!

## Troubleshooting

### Backend won't start
```bash
# Check if port 8000 is in use
lsof -ti:8000

# Kill the process if needed
lsof -ti:8000 | xargs kill -9

# Reinstall dependencies
cd backend
pdm install --clean
```

### Frontend won't start
```bash
# Clear cache
rm -rf node_modules .next
npm install
```

### CORS errors
Make sure both backend (8000) and frontend (3000) are running.

## Next Steps

- Read the full [README.md](README.md)
- Explore the [Backend API](backend/README.md)
- Check the [Frontend docs](frontend/README.md)
- Test red-team detection (try including "ignore previous instructions" in a merchant name!)

## Key Features to Test

1. **Pydantic Validation**: Try invalid JSON or missing fields
2. **Red-team Detection**: Add prompt injection in merchant names
3. **PII Protection**: Add too many PII fields
4. **Batch Limits**: Try sending >100 transactions
5. **Risk Scoring**: Compare different transaction types

---

**Need help?** Check the main README.md or open an issue!