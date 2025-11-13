# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Options Trading Simulator** - An interactive React web application that allows users to replay historical stock price data (2019-2025) and simulate options trading strategies with real Black-Scholes pricing and Greeks calculations. Users can step through daily price changes, switch between multiple chart types (Line, Bars, Candles), trade options at various strikes/expirations with configurable default contracts and confirmation settings, and monitor portfolio P&L with session tracking (realized + unrealized). Positions automatically expire on their expiration date with final P&L captured.

## Architecture

### High-Level Design

The application follows a **React component-based architecture with centralized state management**:

```
App.jsx (State Hub)
├── Maintains: current date/price, positions, closedPositions, playback controls
├── TimeControls → Drives simulation by updating currentIndex
├── PriceChart → Displays Line/Bars/Candles + technical indicators (with timeframes)
├── OptionsChain → Shows live option prices, handles trades (with default qty + confirmation toggle)
└── Portfolio → Tracks positions, calculates P&L & Greeks (session tracking with realized/unrealized)

Utility Layer:
├── dataGenerator.js → Generates synthetic price data (GBM) with dynamic IV
├── blackScholes.js → Option pricing & Greeks calculations + P&L
└── technicalIndicators.js → SMA, Bollinger Bands, RSI, Volume MA
```

### Key Architectural Patterns

1. **Synthetic Data Generation**: Uses Geometric Brownian Motion to generate realistic 2019-2025 price data for 3 symbols (AAPL, META, PLTR) with dynamic implied volatility (IV) based on realized volatility + predefined event spikes.

2. **Time-Driven Simulation**: Central `currentIndex` (day number) is the single source of truth. All market data accessed via `priceData[currentIndex]`. Playback uses `setInterval` with adjustable speed (100-2000ms/day). **Keyboard shortcut: Space bar toggles play/pause globally (except when typing in inputs)**.

3. **Real-Time Option Valuation**: Every day recalculates all option prices using Black-Scholes with current IV. Portfolio positions marked-to-market daily.

4. **IV Calculation**: Dynamic mix of base IV (40-80%), 20-day realized volatility, and exponentially-decaying event spikes (±30% swings within 30-day windows).

5. **Component Communication**: Parent App.jsx manages state; children are presentation-only. Data flows down via props, events up via callbacks. Trade confirmation toggleable (default off for quick trading).

6. **Chart Types**: Three chart types available - Line (gradient fill), Bars (OHLC with left/right ticks), Candles (traditional candlesticks). All use Recharts' Scatter component with custom shape rendering.

7. **Session P&L Tracking**: Maintains two arrays - `positions` (open) and `closedPositions` (closed). Total P&L = unrealized (open positions) + realized (closed positions). Resets only on page refresh or symbol change.

8. **Auto-Expiration**: useEffect monitors `currentDate` against position expiration dates. When current date >= expiration, automatically closes position and captures final P&L to `closedPositions`.

### Important Non-Obvious Details

- **Greeks Interpretation**: Theta shown per-day (annualized/365). Vega per 1% IV change. Portfolio Greeks use buy=+1x, sell=-1x multipliers (useful for spreads).
- **Strike Price Adjustment**: Strikes rounded to nearest $5 and regenerated when price moves >15% (keeps ATM options visible).
- **Expiration Logic**: Options expire on Fridays. Default expirations: 7, 14, 30, 45, 60, 90 days. Default selection is 30-day. **Positions auto-close on expiration with final P&L captured**.
- **Session Persistence**: Open positions (`positions`) and closed positions (`closedPositions`) stored in React state only. Lost on page refresh or symbol change. This is intentional for session-based P&L tracking.
- **Symbol Switch**: Clears all positions AND closed positions history when user changes stock symbol.
- **Chart Rendering**: Bars and Candles use Scatter component with custom shape prop. X-position from `cx`, Y-positions calculated via `yAxis.scale()`. Width calculated dynamically based on chart width / data points.
- **Default Contracts**: Shared state in OptionsChain controls all quantity inputs. Changing any input updates the default for all rows.
- **Trade Confirmation**: Controlled by checkbox. When unchecked, trades execute immediately without modal. When checked, shows confirmation modal (App.jsx checks `tradeData.requireConfirmation`).

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
├── App.jsx           # State management hub (300+ LOC)
└── App.css           # Dark theme styling (1000+ LOC)
```

### Key Files (Reading Order)

1. **`src/App.jsx`** (300+ LOC) - State management hub. Manages current date/price, positions, closedPositions, playback. Orchestrates data flow. Contains trading logic, auto-expiration logic, and keyboard shortcuts (Space for play/pause).

2. **`src/utils/dataGenerator.js`** - Generates synthetic 2019-2025 price data using Geometric Brownian Motion. Implements dynamic IV calculation with event spikes. Creates strike prices & expiration dates.

3. **`src/utils/blackScholes.js`** - Black-Scholes pricing formula, Greeks calculations (Delta, Gamma, Theta, Vega, Rho), `calculateOptionPnL` function for P&L computation. Handles calls and puts.

4. **`src/components/PriceChart.jsx`** (570+ LOC) - Multi-type chart (Line/Bars/Candles) with Recharts. Features: timeframe selection (1M/3M/6M/1Y), chart type switcher, Bollinger Bands, 200-day MA, Volume with 20-day MA, RSI with current value display. Custom tooltip. Uses Scatter component with custom shapes for Bars/Candles. Price and RSI reference lines with colored background labels.

5. **`src/components/OptionsChain.jsx`** (180+ LOC) - Options chain table with real-time pricing. Buy/Sell interface with configurable default contracts and confirmation toggle. Settings displayed inline with expiration selector. All quantity inputs synchronized.

6. **`src/components/Portfolio.jsx`** (160+ LOC) - Position tracking with session P&L breakdown (Total, Unrealized, Realized). Shows closed positions count. P&L per position, aggregated portfolio Greeks, close position functionality. Receives `closedPositions` prop for realized P&L calculation.

7. **`src/components/TimeControls.jsx`** - Playback controls: play/pause, speed slider, date display, timeline slider.

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
- Volume SMA calculated with useMemo in PriceChart (recalculates when displayData changes)
- Options chain auto-scrolls to ATM strikes on mount/strike changes
- Strike prices regenerated only on >15% price moves
- React Strict Mode enabled during development
- Auto-expiration uses setTimeout to avoid state updates during render

### When Adding Features

- **New chart types**: Add to PriceChart with Scatter/Line/Bar components. Use custom shape prop for OHLC variations.
- **New indicators**: Add to `technicalIndicators.js` and integrate in `PriceChart.jsx`. Add MA calculations with memoization.
- **New trading features**: Update `App.jsx` trading logic, `OptionsChain.jsx` UI, and `Portfolio.jsx` display. Remember to handle both open and closed positions.
- **UI changes**: Maintain dark theme in `App.css`. Use TradingView-style colors. Options controls styled like chart controls (inline, pipe separators).
- **Data changes**: Modify `dataGenerator.js` for GBM parameters or symbol data. Update IV event dates carefully.

### Common Pitfalls

- **Import syntax**: Always use ES6 imports (`import { x } from 'y'`), never `require()`. Required for Vite/React.
- **Chart positioning**: For custom Recharts shapes, use `cx` for X-position and `yAxis.scale(value)` for Y-positions. Never use array indices for X positioning.
- **Chart padding**: Use `padding` prop on XAxis/YAxis for internal spacing, not margin on ResponsiveContainer.
- **Reference line labels**: Use custom `content` prop with SVG rendering for background boxes. Position with `viewBox` dimensions.
- **Symbol switch**: Clears BOTH positions AND closedPositions (intentional, for clean session reset)
- **Page refresh**: Loses all state including positions (no persistence layer by design)
- **Auto-expiration timing**: Must use setTimeout to avoid updating state during render cycle
- **IV calculation**: Complex mix of base + realized + event spikes. Event dates are hardcoded arrays per symbol.
- **Greeks aggregation**: Uses ±1x multiplier for buy/sell, not standard portfolio Greeks formula
- **Keyboard shortcuts**: Must check event.target.tagName to avoid triggering in input fields
- **Trade confirmation**: Check `requireConfirmation` flag in tradeData to determine modal display
