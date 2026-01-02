# Frontend Components Reference

## Overview

The frontend follows a modular component architecture with clear separation of concerns. All styling uses CSS variables for consistent theming and dark mode support.

## Component Structure

```
components/
├── transactions/          # Transaction data related components
│   ├── TransactionCard.tsx
│   └── TransactionCardInput.tsx
├── analysis/             # Analysis results related components
│   ├── AnalysisCard.tsx
│   ├── AnalysisResults.tsx
│   ├── FormattedExplanation.tsx
│   └── ShapWaterfall.tsx
├── ui/                   # Reusable UI components
├── DashboardHeader.tsx   # Main dashboard header
├── Header.tsx            # Application header
├── JsonInput.tsx         # JSON input component
├── LLMExplanation.tsx    # LLM explanation interface
├── TabbedResultsPanel.tsx # Results panel with tabs
└── ThemeContext.tsx      # Theme management
```

## Component Categories

### Transaction Components (`components/transactions/`)

Handles transaction data display and input management.

#### `TransactionCard.tsx`
Displays individual transaction cards with expandable details showing:
- Basic transaction info (merchant, amount, date/time)
- Card and account numbers
- Location coordinates
- Expandable temporal analysis (1h, 24h, 7d transaction counts)
- Amount ratios comparing to card averages
- Deviation analysis from median amounts

**Props:**
- `transaction`: TransactionData object
- `index`: number (for animation delay)

**Styling:** Uses CSS variables for all colors, with `var(--surface-hover)` for detail boxes

#### `TransactionCardInput.tsx`
Left sidebar panel for loading and managing transactions.

**Features:**
- Load sample suspicious transactions
- Display transaction count
- Scrollable transaction card list
- Analyze button integration
- Error display

**Props:**
- `onAnalyze`: (transactions: TransactionData[]) => void
- `onClear`: () => void
- `isLoading`: boolean
- `error`: Error | null

### Analysis Components (`components/analysis/`)

Displays fraud detection analysis results.

#### `AnalysisCard.tsx`
Individual analysis result card with classification-based styling.

**Features:**
- Dynamic styling based on classification (legitimate/suspicious/fraudulent)
- Risk score display with percentage
- Formatted explanation
- Risk factors list
- Expandable SHAP feature analysis

**Styling System:**
Uses `getClassificationStyles()` function that maps classifications to CSS variables:
- `legitimate` → `--success-*` variables
- `suspicious` → `--warning-*` variables
- `fraudulent` → `--critical-*` variables
- `unknown` → `--info-*` variables

#### `AnalysisResults.tsx`
Container for all analysis cards with summary statistics.

#### `FormattedExplanation.tsx`
Formats and displays fraud explanations with proper line breaks.

#### `ShapWaterfall.tsx`
Visualizes SHAP (SHapley Additive exPlanations) feature importance as a waterfall chart.

### LLM Integration

#### `LLMExplanation.tsx`
AI-powered explanation interface using Claude 3.5 Sonnet via OpenRouter.

**Features:**
- Transaction selection dropdown
- "Explain" button with loading state
- Risk level badges (HIGH/MEDIUM/LOW)
- AI-generated explanations
- Model metadata display
- Error handling

### Layout Components

#### `TabbedResultsPanel.tsx`
Right panel with tabbed interface switching between:
- Analysis Results
- LLM Explanations

#### `DashboardHeader.tsx`
Dashboard-specific header with fraud detection branding.

#### `ThemeContext.tsx`
React Context for light/dark theme management.

## CSS Variable Design System

All components use CSS variables defined in `app/globals.css` for consistent theming.

### Core Colors

```css
/* Light Mode */
--background: #F8FAFC;
--surface: #FFFFFF;
--surface-hover: #F1F5F9;
--border: #E2E8F0;
--text-primary: #0F172A;
--text-secondary: #64748B;
--text-tertiary: #94A3B8;

/* Dark Mode */
--background: #0F172A;
--surface: #1E293B;
--surface-hover: #334155;
--border: #334155;
--text-primary: #F1F5F9;
--text-secondary: #CBD5E1;
--text-tertiary: #94A3B8;
```

### Status Colors

| Status | Light Mode | Dark Mode |
|--------|-----------|-----------|
| Error/Critical | `--error` #EF4444 | `--error` #F87171 |
| Warning/Suspicious | `--warning` #F59E0B | `--warning` #FBBF24 |
| Success/Legitimate | `--success` #10B981 | `--success` #34D399 |
| Info | `--info` #3B82F6 | `--info` #60A5FA |

Each status color has corresponding `-bg` and `-border` variants for backgrounds and borders.

### Primary Colors

```css
--primary: #6366F1;        /* Light mode */
--primary: #818CF8;        /* Dark mode */
--primary-hover: #4F46E5;  /* Hover state */
```

## Dark Mode Best Practices

### DO ✅
```tsx
// Use inline CSS variables
<div style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}>

// Use classification styling functions
const styles = getClassificationStyles(analysis.classification);
<div style={{ background: styles.bg, color: styles.text }}>
```

### DON'T ❌
```tsx
// Don't use hardcoded Tailwind color classes
<div className="bg-navy-100 text-navy-800">  // ❌ Breaks in dark mode

// Don't use hardcoded hex colors
<div style={{ color: '#0F172A' }}>  // ❌ Not themeable
```

## Import Conventions

### Absolute Imports
Use the `@/` alias for all imports:

```typescript
import TransactionCardInput from '@/components/transactions/TransactionCardInput';
import { AnalysisCard } from '@/components/analysis/AnalysisCard';
import { api } from '@/lib/api';
import { sampleTransactions } from '@/lib/sampleData';
```

### Relative Imports
Use relative imports only within the same folder:

```typescript
// Inside components/transactions/TransactionCardInput.tsx
import TransactionCard from "./TransactionCard"
```

## Type Safety

All components use TypeScript with strict mode enabled. Key type imports:

```typescript
import type { FraudAnalysis, Transaction } from '@/lib/api';
import type { TransactionData } from '@/lib/sampleData';
```

## Performance Considerations

- **Lazy Loading**: Consider using `React.lazy()` for large components
- **Memoization**: Use `React.memo()` for expensive renders
- **CSS Variables**: No runtime style calculations, pure CSS theming
- **Animations**: Use CSS transitions, not JS animations

## Testing Checklist

When adding/modifying components:

- [ ] TypeScript compiles without errors (`npx tsc --noEmit`)
- [ ] ESLint passes (`npm run lint`)
- [ ] Component renders in both light and dark mode
- [ ] All interactive elements have proper hover/focus states
- [ ] Loading and error states work correctly
- [ ] Mobile responsive (test at 375px, 768px, 1024px widths)
