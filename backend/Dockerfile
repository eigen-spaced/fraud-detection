# Stage 1: Builder
FROM python:3.11-slim AS builder

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Optimized uv settings for Docker
ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

WORKDIR /app

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Install dependencies (creates /app/.venv)
RUN uv sync --frozen --no-dev --no-install-project


# Stage 2: Testing
FROM python:3.11-slim AS test

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

# Copy the venv and project files
COPY --from=builder /app /app
COPY . .

# Sync again to include dev dependencies (ruff, pytest)
RUN uv sync --frozen


# Run linting and tests
RUN uv run ruff check app/
RUN uv run pytest tests/ -v


# Stage 3: Final runtime image
FROM python:3.11-slim

WORKDIR /app

# Install runtime library for XGBoost (OpenMP support)
# We use apt-get for slim images
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user (Debian syntax is slightly different than Alpine)
RUN useradd -m -U appuser

# Copy virtual environment from builder
COPY --from=builder /app/.venv /app/.venv

# Copy application code and model data
COPY app ./app
COPY model_data ./model_data

# Set ownership to our non-root user
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Set environment variables
ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Expose port
EXPOSE 8000

# Health check (using python since curl/wget might not be in slim)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
