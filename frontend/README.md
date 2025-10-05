# Fraud Detection Frontend

Modern Next.js frontend for the AI-powered credit card fraud detection system.

## Features

- **Split-pane Interface**: JSON input on left, analysis results on right
- **Sample Data Loader**: Pre-configured test scenarios
- **Real-time Analysis**: Instant feedback with loading states
- **Beautiful UI**: Dark theme with gradient accents
- **Responsive Design**: Works on desktop and mobile
- **Error Handling**: Clear error messages and validation
- **React Query**: Efficient data fetching and caching

## Tech Stack

- **Next.js 15**: App Router, TypeScript
- **React 19**: Latest React features
- **Tailwind CSS**: Utility-first styling
- **React Query**: Data fetching and state management
- **Axios**: HTTP client

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm, yarn, or pnpm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx      # Root layout with providers
│   ├── page.tsx        # Main page component
│   ├── providers.tsx   # React Query provider
│   └── globals.css     # Global styles
├── components/
│   ├── Header.tsx      # App header
│   ├── JsonInput.tsx   # Left panel - JSON input
│   └── ResultsPanel.tsx # Right panel - results display
├── lib/
│   ├── api.ts          # API client and types
│   └── sampleData.ts   # Sample transaction data
└── package.json
```

## Components

### JsonInput

Left panel component with:
- JSON textarea for transaction input
- Sample data buttons
- Analyze and Clear actions
- Error display
- Loading states

### ResultsPanel

Right panel component with:
- Loading spinner
- Error states
- Empty state
- Refusal response display
- Summary card
- Statistics grid
- Risk score visualization
- Transaction details cards
- Citations section

### Header

Top navigation with:
- App branding
- Status indicator

## Sample Data

The app includes four pre-configured scenarios:

1. **Legitimate**: Low-risk everyday transactions
2. **Suspicious**: Medium-risk transactions
3. **Fraudulent**: High-risk fraudulent transactions
4. **Mixed**: Combination of all risk levels

## API Integration

The frontend communicates with the FastAPI backend via:

- `POST /api/analyze` - Analyze transactions
- `GET /health` - Health check
- `GET /api/schema` - Get JSON schemas

See `lib/api.ts` for type definitions and API client.

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Code Style

- TypeScript strict mode
- ESLint with Next.js config
- Tailwind CSS for styling
- Component-based architecture

## Building for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Other Platforms

The app is a standard Next.js application and can be deployed to:
- Netlify
- AWS Amplify
- Docker
- Any Node.js hosting

Make sure to set the `NEXT_PUBLIC_API_URL` environment variable.

## Troubleshooting

### CORS Errors

Ensure the backend CORS settings include your frontend URL:

```python
# backend/app/config.py
cors_origins = ["http://localhost:3000"]
```

### API Connection Failed

1. Check backend is running: `curl http://localhost:8000/health`
2. Verify `NEXT_PUBLIC_API_URL` in `.env.local`
3. Check browser console for errors

### Module Not Found

```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
```

## License

MIT
