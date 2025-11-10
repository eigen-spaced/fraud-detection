#!/bin/bash
# Convenience script to run the fraud detection backend

echo "Starting Fraud Detection API..."
echo "API will be available at http://localhost:8000"
echo "Docs available at http://localhost:8000/docs"
echo ""

uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
