# LLM Integration Testing Guide

This guide explains how to test the new LLM explainability features integrated into the fraud detection system.

## Quick Start

### 1. Set Up Environment

```bash
# Ensure you have the OpenRouter API key in backend/.env
echo "OPEN_ROUTER_KEY=your-api-key-here" >> backend/.env
```

### 2. Start Both Servers (Automated)

```bash
# Use the automated startup script
./start_with_llm.sh
```

This script will:
- ✅ Check all dependencies
- ✅ Create `.env` files if missing
- ✅ Start backend on port 8000
- ✅ Start frontend on port 3000
- ✅ Display helpful URLs and testing instructions

### 3. Manual Testing Steps

1. **Open the frontend**: http://localhost:3000
2. **Find the LLM section**: Scroll down in the Analysis Results panel
3. **Click "Test LLM"**: This will send a sample transaction for explanation
4. **Watch the states**:
   - Loading: Purple loading indicator with animation
   - Success: Detailed AI explanation with transaction info
   - Error: Red error message with details

## Testing Scenarios

### ✅ Success Path
- API key is configured correctly
- Backend is running and accessible
- OpenRouter service responds successfully
- You should see a detailed explanation like:

```
🤖 LLM Explanation
[Test LLM] [Clear]

Transaction Analysis                           HIGH RISK
Transaction ID: TEST_001
Fraud Probability: 85.0%

🧠 AI Explanation
This transaction has a high fraud probability (85%) due to several concerning factors. The $2500 amount is significantly higher than typical spending patterns, and the late night timing (if applicable) raises additional red flags. The location in Las Vegas differs from usual spending patterns, suggesting potential unauthorized use. Additionally, this appears to be the first transaction with this merchant, which combined with the other factors, increases the likelihood of fraudulent activity.

Model Used: anthropic/claude-3.5-sonnet
Generated At: 1/8/2025, 2:35:00 PM
```

### ❌ Error Scenarios

#### 1. Missing API Key
**Expected**: Red error box with message about service unavailability
```
⚠️ Failed to Generate Explanation
LLM explanation service is not available. Please check OpenRouter configuration.
```

#### 2. Backend Not Running
**Expected**: Network error in the error details
```
⚠️ Failed to Generate Explanation
Network Error: connect ECONNREFUSED 127.0.0.1:8000
```

#### 3. Invalid API Key
**Expected**: Authentication error from OpenRouter
```
⚠️ Failed to Generate Explanation
Request failed with status code 401
```

## UI Components Tested

### 🎯 LLMExplanation Component
- **Location**: Bottom of ResultsPanel
- **Test Button**: Purple "Test LLM" button with sparkle icon
- **Loading State**: Purple background with spinner
- **Error State**: Red background with expandable details
- **Success State**: Multi-section display with:
  - Transaction info (blue background)
  - AI explanation (white background)
  - Metadata (gray background)

### 📱 Responsive Design
- Component adapts to different screen sizes
- Clear button appears when there's content to clear
- Error details are expandable for debugging

## API Endpoints Tested

### POST /api/llm/explain
```bash
curl -X POST "http://localhost:8000/api/llm/explain" \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_data": {
      "transaction_id": "TEST_001",
      "amount": 2500.00,
      "merchant_name": "Luxury Electronics Store",
      "merchant_category": "electronics",
      "location": "Las Vegas, NV"
    },
    "fraud_probability": 0.85,
    "risk_factors": ["High amount", "Late night", "Unusual location", "First time merchant"]
  }'
```

## Debugging Tips

### 1. Check Browser Developer Tools
- **Network tab**: Look for API calls to `/api/llm/explain`
- **Console**: Check for JavaScript errors or network issues

### 2. Check Backend Logs
```bash
# Backend logs will show:
INFO:app.openrouter_service:OpenRouter service initialized
INFO:app.main:Generating LLM explanation for transaction TEST_001
INFO:app.openrouter_service:Generated explanation for transaction TEST_001
```

### 3. Test Backend Directly
```bash
# Test the backend health check
curl http://localhost:8000/health

# Test the LLM explanation endpoint directly
curl -X POST http://localhost:8000/api/llm/explain -H "Content-Type: application/json" -d '{"transaction_data":{"transaction_id":"TEST"},"fraud_probability":0.5,"risk_factors":[]}'
```

### 4. Environment Variables
```bash
# Check if environment variables are loaded
cd backend
python -c "from app.config import settings; print(f'OpenRouter key configured: {bool(settings.open_router_key)}')"
```

## Development Integration

### Adding to Existing Workflows
The LLM component can be:
- ✅ Used standalone (current implementation)
- 🔄 Integrated with transaction analysis results
- 🔄 Connected to real ML model predictions
- 🔄 Enhanced with SHAP explanations

### Future Enhancements
1. **Real Transaction Integration**: Pass actual transaction data from analysis results
2. **Batch Analysis**: Explain multiple transactions at once
3. **Explanation Caching**: Store explanations to avoid re-generating
4. **Custom Models**: Allow selection of different LLM models

## Performance Notes

### Expected Response Times
- **LLM Explanation**: 2-5 seconds
- **Pattern Analysis**: 3-8 seconds
- **Loading State**: Shows immediately
- **Error Handling**: Instant feedback

### Rate Limits
- OpenRouter has usage limits based on your plan
- Consider implementing request queuing for high-volume use cases
- The test button has no built-in rate limiting (intentional for testing)

## Troubleshooting Common Issues

### Issue: "Service not available"
**Solution**: Check that `OPEN_ROUTER_KEY` is set in `backend/.env`

### Issue: Long loading times
**Solution**: 
- Check your internet connection
- Verify OpenRouter service status
- Try a different LLM model if available

### Issue: Frontend not showing LLM section
**Solution**:
- Make sure you're viewing results after an analysis
- Check browser console for React errors
- Verify the LLMExplanation component import

### Issue: CORS errors
**Solution**: Backend CORS is configured for `localhost:3000` - make sure frontend is running on this port

## Success Criteria

The LLM integration is working correctly when:
- ✅ Test button triggers API call
- ✅ Loading state shows during request
- ✅ Success shows formatted explanation
- ✅ Error states display helpful messages
- ✅ Clear button resets the component
- ✅ No console errors in browser
- ✅ Backend logs show LLM activity

## Next Steps

After successful testing:
1. **Connect to Real Data**: Integrate with actual transaction analysis
2. **Add SHAP Integration**: Combine ML explanations with LLM narratives  
3. **Enhance UI**: Add more sophisticated explanation formatting
4. **Performance Optimization**: Add caching and rate limiting
5. **User Experience**: Add explanation sharing and export features

---

**Happy Testing!** 🚀

If you encounter any issues, check the browser developer tools and backend logs for detailed error information.