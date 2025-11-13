# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Options Trading Simulator** - An interactive React web application that allows users to replay historical stock price data (2019-2025) and simulate options trading strategies with real Black-Scholes pricing and Greeks calculations. Users can step through daily price changes, trade options at various strikes/expirations, and monitor portfolio P&L and risk metrics in real-time.

## Architecture

### High-Level Design

The application follows a **React component-based architecture with centralized state management**:

```
App.jsx (State Hub)
├── Maintains: current date/price, positions, playback controls
├── TimeControls → Drives simulation by updating currentIndex
├── PriceChart → Displays candlestick + technical indicators
├── OptionsChain → Shows live option prices, handles trades
└── Portfolio → Tracks positions, calculates P&L & Greeks

Utility Layer:
├── dataGenerator.js → Generates synthetic price data (GBM)
├── blackScholes.js → Option pricing & Greeks calculations
└── technicalIndicators.js → SMA, Bollinger Bands, RSI
```

### Key Architectural Patterns

1. **Synthetic Data Generation**: Uses Geometric Brownian Motion to generate realistic 2019-2025 price data for 3 symbols (AAPL, META, PLTR) with dynamic implied volatility (IV) based on realized volatility + predefined event spikes.

2. **Time-Driven Simulation**: Central `currentIndex` (day number) is the single source of truth. All market data accessed via `priceData[currentIndex]`. Playback uses `setInterval` with adjustable speed (100-2000ms/day).

3. **Real-Time Option Valuation**: Every day recalculates all option prices using Black-Scholes with current IV. Portfolio positions marked-to-market daily.

4. **IV Calculation**: Dynamic mix of base IV (40-80%), 20-day realized volatility, and exponentially-decaying event spikes (±30% swings within 30-day windows).

5. **Component Communication**: Parent App.jsx manages state; children are presentation-only. Data flows down via props, events up via callbacks. Trade confirmation via inline modal.

### Important Non-Obvious Details

- **Greeks Interpretation**: Theta shown per-day (annualized/365). Vega per 1% IV change. Portfolio Greeks use buy=+1x, sell=-1x multipliers (useful for spreads).
- **Strike Price Adjustment**: Strikes rounded to nearest $5 and regenerated when price moves >15% (keeps ATM options visible).
- **Expiration Logic**: Options expire on Fridays. Default expirations: 7, 14, 30, 45, 60, 90 days. Default selection is 30-day.
- **No Persistence**: Positions stored in React state only (lost on page refresh). No localStorage or database.
- **Symbol Switch**: Clears all positions when user changes stock symbol.

## Technology Stack

| Category | Technology |
|----------|-----------|
| **Framework** | React 18.2.0 with Hooks |
| **Build Tool** | Vite 5.0.8 |
| **Charting** | Recharts 2.10.3 |
| **Deployment** | GitHub Pages |
| **Module System** | ES Modules |

## Development Commands

```bash
# Start development server (HMR enabled)
npm run dev

# Build optimized production bundle → /dist
npm run build

# Preview production build locally
npm run preview

# Deploy to GitHub Pages (gh-pages branch)
npm run deploy
# Automatically runs predeploy (npm run build) first
```

**Notes:**
- No test framework configured
- No linter/formatter configured
- dev server typically runs on http://localhost:5173
- Deploy target: `https://iliutaadrian.github.io/options_trading_simulator/`

## File Structure & Key Files

### Main Directories

```
src/
├── components/        # React components (697 LOC)
├── utils/            # Business logic (523 LOC)
├── data/             # Historical data (googl_historical.json)
├── App.jsx           # State management hub (270 LOC)
└── App.css           # Dark theme styling (600+ LOC)
```

### Key Files (Reading Order)

1. **`src/App.jsx`** - State management hub. Manages current date/price, positions, playback. Orchestrates data flow. Contains trading logic.

2. **`src/utils/dataGenerator.js`** - Generates synthetic 2019-2025 price data using Geometric Brownian Motion. Implements dynamic IV calculation with event spikes. Creates strike prices & expiration dates.

3. **`src/utils/blackScholes.js`** - Black-Scholes pricing formula, Greeks calculations (Delta, Gamma, Theta, Vega, Rho), P&L computation. Handles calls and puts.

4. **`src/components/PriceChart.jsx`** - Candlestick chart with Recharts. Overlays: Bollinger Bands, 200-day MA, Volume, RSI, reference lines. Custom tooltip.

5. **`src/components/OptionsChain.jsx`** - Options chain table with real-time pricing. Buy/Sell interface. Contract quantity input with modal confirmation.

6. **`src/components/Portfolio.jsx`** - Position tracking, P&L per position, aggregated portfolio Greeks, close position functionality.

7. **`src/components/TimeControls.jsx`** - Playback controls: play/pause, speed slider, date display.

## Configuration Files

- **`vite.config.js`**: React plugin, base path `/options_trading_simulator/` for GitHub Pages
- **`package.json`**: Private package, ES modules enabled, minimal dependencies (React, React-DOM, Recharts)
- **`index.html`**: Single entry point with `<div id="root">`

## Setup & Environment

**Prerequisites**: Node.js + npm

**Installation**:
```bash
npm install
npm run dev
```

**No additional setup required**:
- No .env files needed
- No external APIs
- No database
- All data generated in-memory

**Browser Requirements**: Modern ES6+ support, WebGL for Recharts

## Important Development Notes

### Performance Considerations

- Technical indicators calculated once per price dataset (memoized in useEffect)
- Options chain auto-scrolls to ATM strikes
- Strike prices regenerated only on >15% price moves
- React Strict Mode enabled during development

### When Adding Features

- **New indicators**: Add to `technicalIndicators.js` and integrate in `PriceChart.jsx`
- **New options strategies**: Extend `App.jsx` trading logic and `Portfolio.jsx` display
- **UI changes**: Maintain dark theme in `App.css` (Grid/Flexbox layout)
- **Data changes**: Modify `dataGenerator.js` for GBM parameters or symbol data

### Common Pitfalls

- Symbol switch clears positions (intentional, but important for UX expectations)
- Page refresh loses all positions (no persistence layer)
- IV calculation is complex—understand event dates before modifying
- Greeks aggregation uses ±1x multiplier for buy/sell (not portfolio-level Greeks)
