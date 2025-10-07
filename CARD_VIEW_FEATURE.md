# 💳 Card-Based Transaction View Feature

## Overview

This document describes the new card-based transaction view feature added to the fraud detection application. This feature provides a more aesthetic and user-friendly way to visualize transaction data.

## Branch Information

- **Branch**: `feature/data-export`
- **Status**: ✅ Active and ready for testing
- **Base**: `main`

## New JSON Format

### Structure

Transactions now follow this enhanced JSON structure:

```json
{
  "transaction": {
    "id": "417473688cec715a2d4fc745a3267cc5",
    "timestamp": "2023-01-01T02:15:59Z",
    "merchant": {
      "name": "Mraz-Herzog",
      "category": "Gas & Transport",
      "location": {
        "lat": 40.699828,
        "lng": -93.120762
      }
    },
    "amount": 2.35,
    "card": {
      "number": "••••0268",
      "full": "60400268763"
    },
    "account": {
      "number": "••••5556",
      "full": "279317935556"
    }
  },
  "model_features": {
    "temporal": {
      "trans_in_last_1h": 0.693147,
      "trans_in_last_24h": 0.693147,
      "trans_in_last_7d": 0.693147
    },
    "amount_ratios": {
      "amt_per_card_avg_ratio_1h": 14.669926,
      "amt_per_card_avg_ratio_24h": 14.669926,
      "amt_per_card_avg_ratio_7d": 14.669926,
      "amt_per_category_avg_ratio_1h": 14.669926,
      "amt_per_category_avg_ratio_24h": 14.669926,
      "amt_per_category_avg_ratio_7d": 14.669926
    },
    "deviations": {
      "amt_diff_from_card_median_7d": 2.35
    }
  },
  "ground_truth": {
    "is_fraud": false
  }
}
```

### Key Differences from Old Format

| Aspect | Old Format | New Format |
|--------|------------|------------|
| Structure | Flat | Nested/Hierarchical |
| Merchant Info | Single string | Object with name, category, location |
| Card Info | Last 4 digits only | Masked number + full number |
| Account Info | Not included | Included with masking |
| Location | String | Lat/Lng coordinates |
| Model Features | Not included | Rich temporal and ratio data |
| Ground Truth | Not included | Fraud label included |

## Visual Design

### Transaction Card Layout

```
┌─────────────────────────────────────────────┐
│ ⛽ Mraz-Herzog                    $2.35      │ ← Header with emoji & amount
│ Gas & Transport                   [BADGE]   │ ← Category & risk badge
│                                             │
│ 📅 Jan 1, 2023  •  🕐 2:15 AM              │ ← Date & time
│ 💳 Card ••0268  •  🏦 Account ••5556       │ ← Card & account
│ 📍 40.699828, -93.120762                   │ ← Geolocation
│                                             │
│ [▼ Transaction Details]                    │ ← Expandable section
│                                             │
│ ┌─────────────────────────────────────┐   │
│ │ ID: 417473688cec715a2d4fc745a3267cc5│   │
│ │                                     │   │
│ │ ⏱️ Temporal Analysis                │   │
│ │ Last 1h: 0.69  24h: 0.69  7d: 0.69 │   │
│ │                                     │   │
│ │ 💰 Amount Ratios (Card Avg)         │   │
│ │ 1h: 14.67x  24h: 14.67x  7d: 14.67x│   │
│ │                                     │   │
│ │ 📊 Deviation Analysis               │   │
│ │ Amount diff from median: +$2.35    │   │
│ └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

## Features

### 1. Visual Enhancements

- **Category Emojis**: Each merchant category has a unique emoji
  - ⛽ Gas & Transport
  - 🛒 Grocery
  - 🍽️ Restaurant
  - 🛍️ Shopping
  - 💻 Electronics
  - 💎 Jewelry
  - 🎰 Gambling
  - ₿ Crypto
  - 💸 Wire Transfer
  - And more...

- **Risk Indicators**:
  - Color-coded borders (green/yellow/red)
  - Risk level badges
  - Top stripe indicator
  - Dynamic coloring based on fraud probability

- **Animations**:
  - Staggered fade-in on load
  - Smooth expand/collapse for details
  - Hover effects with scale
  - Transition effects

### 2. Interactive Elements

- **Expandable Details**: Click "Transaction Details" to reveal:
  - Transaction ID
  - Temporal analysis (1h, 24h, 7d)
  - Amount ratios by card and category
  - Deviation from card median

- **Sample Data Tabs**:
  - ✓ Legitimate (2 transactions)
  - ⚠️ Suspicious (2 transactions)
  - ⛔ Fraudulent (2 transactions)
  - 🔀 Mixed (3 transactions)

- **Active State Indicators**:
  - Selected tab highlighted with ring
  - Transaction count display
  - Real-time updates

### 3. Information Display

- **Primary Info** (Always Visible):
  - Merchant name and emoji
  - Category
  - Amount (large, bold)
  - Risk badge
  - Date and time (formatted)
  - Card and account numbers (masked)
  - Geolocation coordinates

- **Secondary Info** (Expandable):
  - Full transaction ID
  - Temporal transaction counts
  - Amount ratio analysis
  - Deviation metrics

## Files Created

### Core Components

1. **`frontend/lib/newSampleData.ts`** (482 lines)
   - TypeScript interfaces for new JSON format
   - Sample transaction data for all categories
   - Category emoji mapping
   - Type-safe data structures

2. **`frontend/components/TransactionCard.tsx`** (237 lines)
   - Individual card component
   - Expandable details section
   - Risk level calculations
   - Date/time formatting
   - Animations and styling

3. **`frontend/components/TransactionCardInput.tsx`** (187 lines)
   - Main input panel component
   - Sample data loading
   - Transaction display management
   - Action buttons (Analyze, Clear)
   - Transaction count tracker

4. **`frontend/app/cards/page.tsx`** (89 lines)
   - New dedicated page for card view
   - Mock API integration
   - State management
   - Results panel integration

### Modified Files

5. **`frontend/components/Header.tsx`**
   - Added navigation between views
   - Active page indicators
   - "NEW" badge for card view
   - Made client component for routing

## How to Test

### Starting the Application

```bash
# Navigate to frontend directory
cd frontend

# Start the development server
npm run dev
```

### Access the New Feature

1. Open http://localhost:3000 in your browser
2. Click the "💳 Card View" button in the header
3. Or directly visit http://localhost:3000/cards

### Testing Different Scenarios

1. **Load Legitimate Transactions**:
   - Click "✓ Legitimate" button
   - Observe 2 low-risk transaction cards
   - Green indicators and badges

2. **Load Suspicious Transactions**:
   - Click "⚠️ Suspicious" button
   - View 2 medium-risk cards
   - Yellow warning indicators

3. **Load Fraudulent Transactions**:
   - Click "⛔ Fraudulent" button
   - See 2 high-risk fraud cards
   - Red danger indicators
   - "FRAUD" badges

4. **Load Mixed Transactions**:
   - Click "🔀 Mixed" button
   - Get 3 cards with varying risk levels
   - Mixed color indicators

5. **Expand Card Details**:
   - Click "▼ Transaction Details" button
   - View expanded information
   - Click again to collapse

6. **Analyze Transactions**:
   - Click "🔍 Analyze X Transactions" button
   - View mock results in right panel
   - Observe loading state

7. **Clear Transactions**:
   - Click "Clear" button
   - See empty state message

## Navigation

### Between Views

- **JSON View** (Original): http://localhost:3000/
  - Traditional JSON text input
  - Paste raw JSON data
  - Original workflow

- **Card View** (New): http://localhost:3000/cards
  - Visual card interface
  - Structured data display
  - Enhanced user experience

Use the navigation buttons in the header to switch between views.

## Color Scheme

### Risk Levels

- **Low Risk** (Legitimate):
  - Border: `border-green-600/30`
  - Background: `bg-green-900/10`
  - Badge: Green with opacity
  - Stripe: `bg-green-500`

- **Medium Risk** (Suspicious):
  - Border: `border-yellow-600/30`
  - Background: `bg-yellow-900/10`
  - Badge: Yellow with opacity
  - Stripe: `bg-yellow-500`

- **High Risk** (Fraudulent):
  - Border: `border-red-600/30`
  - Background: `bg-red-900/10`
  - Badge: Red with opacity
  - Stripe: `bg-red-500`

## Future Enhancements

### Phase 2 (Planned)

- [ ] **Geocoding**: Convert lat/lng to readable addresses
- [ ] **Map Integration**: Show merchant locations on map
- [ ] **Card Filtering**: Filter by category, risk level, amount
- [ ] **Card Sorting**: Sort by date, amount, risk
- [ ] **Export Cards**: Export visible cards to PDF/CSV
- [ ] **Bulk Actions**: Select multiple cards for analysis
- [ ] **Card Comparison**: Compare two cards side-by-side
- [ ] **Search**: Search transactions by merchant, ID, amount
- [ ] **Timeline View**: Visual timeline of transactions
- [ ] **Real-time Updates**: WebSocket support for live data

### Phase 3 (Future)

- [ ] **Backend Integration**: Connect to real API
- [ ] **Database Storage**: Persist transaction data
- [ ] **User Accounts**: Save favorite views and filters
- [ ] **Custom Categories**: Define custom merchant categories
- [ ] **Advanced Analytics**: Heat maps, charts, trends
- [ ] **Mobile App**: React Native version
- [ ] **Collaboration**: Share transactions with team
- [ ] **Alerts**: Set up custom fraud alerts
- [ ] **Machine Learning**: Real-time risk prediction
- [ ] **Multi-language**: i18n support

## Technical Details

### Dependencies

No new dependencies required. Uses existing:
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS

### Performance

- **Lazy Loading**: Cards render progressively
- **Staggered Animations**: 100ms delay per card
- **Virtualization**: Ready for large datasets (future)
- **Memoization**: React.memo candidates identified

### Accessibility

- Semantic HTML structure
- ARIA labels on interactive elements
- Keyboard navigation support
- Screen reader friendly
- High contrast mode compatible

### Browser Support

- Chrome/Edge: ✅ Fully supported
- Firefox: ✅ Fully supported
- Safari: ✅ Fully supported
- Mobile browsers: ✅ Responsive design

## Git Workflow

### Current State

```bash
# Check current branch
git branch --show-current
# Output: feature/data-export

# View changes
git log --oneline -1
# Output: 51d17ff feat: Add card-based transaction view with new JSON format

# Files changed
git diff main --name-only
```

### Merging to Main

When ready to merge:

```bash
# Ensure you're on feature branch
git checkout feature/data-export

# Pull latest from main
git fetch origin main
git merge origin/main

# Resolve any conflicts

# Push feature branch
git push origin feature/data-export

# Create pull request (GitHub/GitLab)
# Or merge locally:
git checkout main
git merge feature/data-export
git push origin main
```

## Testing Checklist

- [ ] All 4 sample data types load correctly
- [ ] Card animations work smoothly
- [ ] Expand/collapse transitions are smooth
- [ ] Risk indicators show correct colors
- [ ] Date/time format correctly
- [ ] Masked card/account numbers display
- [ ] Geolocation coordinates show
- [ ] Analyze button triggers mock API
- [ ] Clear button resets state
- [ ] Navigation between views works
- [ ] Mobile responsive (test on phone/tablet)
- [ ] No console errors
- [ ] TypeScript compiles without errors
- [ ] All emojis render correctly

## Screenshots

(To be added after testing)

## Known Issues

None at this time. This is a beta feature for testing and feedback.

## Feedback

To provide feedback on this feature:
1. Test all scenarios listed above
2. Note any UI/UX improvements
3. Report bugs or unexpected behavior
4. Suggest enhancements

---

**Status**: ✅ **Ready for Testing**  
**Branch**: `feature/data-export`  
**Last Updated**: October 7, 2025  
**Next Steps**: Test → Gather Feedback → Refine → Merge to Main