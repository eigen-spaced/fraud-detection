# Multi-stage Dockerfile for Fraud Detection Backend
# Stage 1: Builder - Install dependencies with uv
FROM ghcr.io/astral-sh/uv:python3.11-alpine AS builder

WORKDIR /app

# Install build dependencies for XGBoost and other Python packages
RUN apk add --no-cache \
    gcc \
    g++ \
    cmake \
    make \
    musl-dev \
    python3-dev \
    libstdc++ \
    libgomp

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Install dependencies
RUN uv sync --frozen --no-dev


# Stage 2: Testing - Run linting and tests
FROM ghcr.io/astral-sh/uv:python3.11-alpine AS test

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache \
    gcc \
    g++ \
    cmake \
    make \
    musl-dev \
    python3-dev \
    libstdc++ \
    libgomp

# Copy dependency files and install dependencies including dev
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen

# Copy application code
COPY app ./app
COPY tests ./tests
COPY model_data ./model_data

# Run linting
RUN uv run ruff check app/

# Run tests
RUN uv run pytest tests/ -v


# Stage 3: Final runtime image
FROM python:3.11-alpine

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache \
    libstdc++ \
    libgomp \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy virtual environment from builder
COPY --from=builder /app/.venv /app/.venv

# Copy application code and model data
COPY app ./app
COPY model_data ./model_data

# Set ownership
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Set environment variables
ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
