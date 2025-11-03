# Command Reference for uv

Quick reference for common tasks with uv.

## Development Commands

### Setup
```bash
# Install dependencies (including dev dependencies)
uv sync

# Install without dev dependencies
uv sync --no-dev
```

### Running the Server
```bash
# Start development server
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or use the convenience script
./run.sh
```

### Code Quality
```bash
# Run linter
uv run ruff check app/

# Auto-fix linting issues
uv run ruff check --fix app/

# Format code
uv run black app/

# Check formatting without changes
uv run black --check app/
```

### Testing
```bash
# Run all tests (if pytest tests exist)
uv run pytest tests/

# Run specific test scripts
uv run python tests/test_openrouter.py
uv run python tests/test_model_service.py
uv run python tests/test_shap_integration.py

# Run with verbose output
uv run pytest tests/ -v
```

### Package Management
```bash
# Add a new dependency
uv add fastapi

# Add a dev dependency
uv add --dev pytest

# Remove a dependency
uv remove package-name

# List installed packages
uv pip list

# Show dependency tree
uv pip tree
```

### Python Scripts
```bash
# Run any Python script
uv run python script.py

# Run with arguments
uv run python script.py --arg value

# Interactive Python shell
uv run python
```

### Virtual Environment
```bash
# The .venv is automatically managed by uv
# To activate it manually:
source .venv/bin/activate

# To deactivate:
deactivate
```

### Updating Dependencies
```bash
# Update all dependencies
uv lock --upgrade

# Update specific package
uv lock --upgrade-package fastapi

# Sync after updates
uv sync
```

### Clean Up
```bash
# Remove virtual environment
rm -rf .venv

# Remove lock file
rm uv.lock

# Recreate everything
uv sync
```

## Common Tasks

### Convert Model Data to JSON
```bash
# Convert all datasets to JSON
uv run python scripts/convert_to_json.py --output-dir ./output

# Convert only specific dataset (fraud, legitimate, suspicious, or mixed)
uv run python scripts/convert_to_json.py --output-dir ./output --dataset fraud

# See help for more options
uv run python scripts/convert_to_json.py --help
```

### Check API Health
```bash
# Start server in one terminal, then:
curl http://localhost:8000/health
```

### Test Fraud Detection
```bash
uv run python -c "
from app.fraud_detector import fraud_detector
from app.models import Transaction
from datetime import datetime

txn = Transaction(
    transaction_id='TEST001',
    timestamp=datetime.now(),
    amount=100.0,
    merchant_name='Test Store',
    merchant_category='retail',
    card_number='1234',
    location='Test City'
)

result = fraud_detector.analyze_transactions([txn])
print(result.summary)
"
```

## Troubleshooting

### Package conflicts
```bash
rm -rf .venv uv.lock
uv sync
```

### Import errors
```bash
# Make sure you're in the backend directory
cd /path/to/backend
uv sync
```

### Port already in use
```bash
# Find process using port 8000
lsof -ti:8000

# Kill it
lsof -ti:8000 | xargs kill -9
```

## Tips

- **Always use `uv run`** to run Python commands to ensure the virtual environment is used
- **Use `uv sync`** after pulling changes from git
- **Run `uv lock --upgrade`** regularly to get security updates
- **Use `./run.sh`** for quick server startup

## Documentation

- [uv Documentation](https://docs.astral.sh/uv/)
- [Backend README](../README.md)
- [Main Project README](../../README.md)
