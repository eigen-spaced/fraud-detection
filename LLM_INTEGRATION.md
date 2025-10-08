# LLM Explainability Integration

This document describes the OpenRouter LLM integration for fraud detection explainability.

## Overview

The fraud detection system now includes LLM-powered explanations that provide human-readable interpretations of ML model predictions. This feature uses OpenRouter to access various LLM models for generating:

1. **Individual Transaction Explanations**: Detailed explanations for why a specific transaction was flagged
2. **Pattern Analysis**: Batch analysis of multiple transactions to identify trends and patterns

## Architecture

### Components

- **OpenRouterService** (`app/openrouter_service.py`): Core service for LLM interactions
- **LLM Models** (`app/models.py`): Pydantic models for request/response validation
- **API Endpoints** (`app/main.py`): FastAPI endpoints for LLM features

### Data Flow

```
Transaction Data + ML Prediction → OpenRouter LLM → Human-Readable Explanation
```

## Configuration

### Environment Variables

Create or update `backend/.env` with:

```env
OPEN_ROUTER_KEY=sk-or-v1-your-api-key-here
```

### Default LLM Model

- **Model**: `anthropic/claude-3.5-sonnet`
- **Provider**: OpenRouter
- **Base URL**: `https://openrouter.ai/api/v1`

## API Endpoints

### 1. Individual Transaction Explanation

**POST** `/api/llm/explain`

Generates a human-readable explanation for a single transaction's fraud prediction.

#### Request Body

```json
{
  "transaction_data": {
    "transaction_id": "TXN_001",
    "amount": 2500.00,
    "merchant_name": "Electronics Store",
    "merchant_category": "electronics",
    "location": "Las Vegas, NV",
    "timestamp": "2025-01-08T14:30:00Z"
  },
  "fraud_probability": 0.85,
  "risk_factors": [
    "High transaction amount",
    "Late night transaction",
    "Unusual location"
  ],
  "model_features": {
    "amount_ratio_24h": 3.2,
    "merchant_first_time": true,
    "location_distance_km": 500
  }
}
```

#### Response

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

### 2. Pattern Analysis

**POST** `/api/llm/patterns`

Analyzes patterns across multiple transactions to provide batch insights.

#### Request Body

```json
{
  "transactions": [
    {
      "transaction_id": "TXN_001",
      "amount": 50.00,
      "merchant_name": "Coffee Shop"
    },
    {
      "transaction_id": "TXN_002", 
      "amount": 2500.00,
      "merchant_name": "Electronics Store"
    }
  ],
  "predictions": [0.15, 0.85]
}
```

#### Response

```json
{
  "analysis": "This batch shows a concerning pattern with high-value transactions...",
  "transaction_count": 2,
  "high_risk_count": 1,
  "medium_risk_count": 0,
  "low_risk_count": 1,
  "average_risk_score": 0.5,
  "model_used": "anthropic/claude-3.5-sonnet",
  "generated_at": "2025-01-08T14:35:00Z"
}
```

## Usage Examples

### Testing the Integration

Run the test script to verify OpenRouter connectivity:

```bash
cd backend
python test_openrouter.py
```

### Using with FastAPI

1. **Start the development server**:
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```

2. **Access interactive docs**: http://localhost:8000/docs

3. **Test the endpoints** using the FastAPI interactive documentation

### Example cURL Commands

#### Explain a transaction:
```bash
curl -X POST "http://localhost:8000/api/llm/explain" \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_data": {
      "transaction_id": "TEST_001",
      "amount": 1500.00,
      "merchant_name": "Online Store",
      "merchant_category": "retail"
    },
    "fraud_probability": 0.75,
    "risk_factors": ["High amount", "Online transaction"]
  }'
```

#### Analyze patterns:
```bash
curl -X POST "http://localhost:8000/api/llm/patterns" \
  -H "Content-Type: application/json" \
  -d '{
    "transactions": [
      {"transaction_id": "T1", "amount": 100, "merchant_name": "Store A"},
      {"transaction_id": "T2", "amount": 2000, "merchant_name": "Store B"}
    ],
    "predictions": [0.2, 0.8]
  }'
```

## Error Handling

### Common Error Scenarios

1. **OpenRouter API Key Missing**:
   - Status: 503 Service Unavailable
   - Message: "LLM explanation service is not available"

2. **Invalid Request Data**:
   - Status: 422 Unprocessable Entity
   - Pydantic validation errors

3. **OpenRouter API Errors**:
   - Status: 500 Internal Server Error
   - Logged for debugging

### Service Availability Check

The service includes availability checking:

```python
if not openrouter_service.is_available():
    # Service is not configured or unavailable
    return fallback_explanation
```

## LLM Prompt Engineering

### System Prompts

The service uses carefully crafted system prompts to ensure:
- Professional, objective tone
- Clear, jargon-free explanations
- Probability-based language (not accusations)
- Actionable insights
- Technical accuracy

### Explanation Structure

Generated explanations typically include:
1. **Risk Level Assessment**
2. **Key Risk Factors** (explained in plain language)
3. **Practical Implications**
4. **Recommended Actions** (when appropriate)

### Pattern Analysis Structure

Pattern analyses provide:
1. **Overall Risk Assessment**
2. **Notable Trends**
3. **Investigation Recommendations**
4. **Statistical Summary**

## Integration with Existing ML Pipeline

### Future Integration Points

1. **Real-time Explanations**: Integrate with existing `/api/analyze` endpoint
2. **SHAP Integration**: Combine SHAP values with LLM explanations
3. **Model Features**: Pass detailed model features for richer explanations
4. **Batch Processing**: Integrate with bulk transaction processing

### Data Flow Integration

```
Transactions → ML Model → Predictions + Features → LLM Service → Explanations
```

## Security Considerations

### Data Privacy

- Transaction data is sent to OpenRouter for processing
- No persistent storage of explanations by default
- Consider data anonymization for sensitive information
- Ensure compliance with data protection regulations

### API Security

- OpenRouter API key stored in environment variables
- Rate limiting should be implemented for production
- Input validation prevents injection attacks

## Performance Considerations

### Response Times

- LLM explanation: ~2-5 seconds per transaction
- Pattern analysis: ~3-8 seconds per batch
- Consider caching for frequently requested explanations

### Rate Limits

- OpenRouter has usage limits based on your plan
- Implement request queuing for high-volume scenarios
- Consider batch processing for efficiency

## Future Enhancements

### Planned Features

1. **SHAP Integration**: Combine SHAP explanations with LLM narratives
2. **Model Comparison**: Compare explanations from different LLM models
3. **Explanation Caching**: Cache explanations for repeated transactions
4. **Custom Prompts**: Allow custom prompt templates
5. **Multi-language Support**: Generate explanations in multiple languages

### Integration Roadmap

1. **Phase 1**: Basic LLM explanations (✅ Complete)
2. **Phase 2**: SHAP + LLM integration (Next)
3. **Phase 3**: Real-time explanation pipeline
4. **Phase 4**: Advanced analytics and reporting

## Troubleshooting

### Common Issues

1. **"OpenRouter service is not available"**:
   - Check that `OPEN_ROUTER_KEY` is set in `.env`
   - Verify the API key is valid
   - Check network connectivity

2. **"Failed to generate explanation"**:
   - Check OpenRouter service status
   - Verify request format matches schema
   - Check logs for detailed error messages

3. **Slow response times**:
   - OpenRouter API latency varies by model
   - Consider using faster models for real-time use cases
   - Implement request timeout handling

### Debugging

Enable detailed logging:

```python
import logging
logging.getLogger("app.openrouter_service").setLevel(logging.DEBUG)
```

### Support

- OpenRouter Documentation: https://openrouter.ai/docs
- FastAPI Documentation: https://fastapi.tiangolo.com/
- Pydantic Documentation: https://docs.pydantic.dev/

## Conclusion

The LLM explainability integration provides powerful human-readable insights into fraud detection predictions. This foundation enables rich explanatory capabilities that can be extended with SHAP integration and other advanced features in future development phases.