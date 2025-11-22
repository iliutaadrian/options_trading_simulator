# Options Trading Simulator - Project Context

## Project Overview

The Options Trading Simulator is an interactive React web application that allows users to replay historical stock price data (2019-2025) and simulate options trading strategies with real Black-Scholes pricing and Greeks calculations. Users can step through daily price changes, switch between multiple chart types (Line, Bars, Candles), trade options at various strikes/expirations with configurable default contracts and confirmation settings, and monitor portfolio P&L with session tracking (realized + unrealized). Positions automatically expire on their expiration date with final P&L captured.

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

9. **Mobile Application**: A companion mobile application is available in the `mobile-app/` directory, built using React Native and Expo. The mobile app provides similar options trading simulation functionality optimized for mobile devices, with responsive design and touch-based controls. It shares the same core business logic and data structures with the web application, ensuring consistent behavior across platforms.

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
| **Frontend Framework** | React 18.2.0 with Hooks |
| **Build Tool** | Vite 5.0.8 |
| **Charting Library** | Recharts 2.10.3 |
| **Mobile Framework** | React Native with Expo |
| **Deployment** | GitHub Pages |
| **Module System** | ES Modules |
| **Development Dependencies** | @types/react, @types/react-dom, @vitejs/plugin-react, gh-pages, vite |
| **Type Checking** | TypeScript (via @types packages) |

## Building and Running

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager
- For mobile app: Expo CLI (install with `npm install -g @expo/cli`)

### Web Application Installation
```bash
# Install dependencies
npm install

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

### Mobile Application Installation
```bash
# Navigate to the mobile app directory
cd mobile-app/OptionsTradingSimulator

# Install mobile app dependencies
npm install

# Start Expo development server
npx expo start
# Or use the shorthand
npm start
```

**Notes:**
- No test framework configured
- No linter/formatter configured
- Web dev server typically runs on http://localhost:5173
- Mobile app can be run on iOS/Android simulators or physical devices via Expo Go app
- Deploy target: `https://iliutaadrian.github.io/options_trading_simulator/`

## Development Conventions

### Code Organization
- Component-based architecture using React hooks
- Utility functions separated by domain (data generation, technical indicators, options pricing)
- ES Module imports/exports for dependency management
- Consistent naming conventions (PascalCase for components, camelCase for functions)

### Data Handling
- Historical data cached in memory for performance
- VIX data integration for improved IV approximation
- Asynchronous data loading with fallbacks to synthetic data
- Real-time data updates during time travel simulation

### User Interface
- Dark theme for extended trading sessions
- Responsive layout with left panel (charts) and right panel (options/portfolio)
- Interactive controls with keyboard shortcuts (Space for play/pause)
- Real-time updates of prices, Greeks, and portfolio metrics

## Key Mathematical Formulas and Models

### Data Generation
1. **Garman-Klass Volatility**: Superior volatility estimator using OHLC data
   - Formula: σ_GK = √[0.5 * (1/n) * Σ[ln(H_i/L_i)]² - (2ln(2)-1) * (1/n) * Σ[ln(C_i/O_i)]²] * √252

2. **Realized Volatility**: Simple return-based volatility calculation
   - Formula: σ_realized = √[variance of log returns] * √252

3. **VIX-Based IV Adjustment**: Incorporates market volatility index for improved IV approximation
   - Formula: adjusted_IV = original_IV * (1 + vix_adjustment)
   - vix_adjustment = (current_VIX / 0.20 - 1.0) * adjustment_factor

4. **Exponential Decay**: For event impact decay over time
   - Formula: decay_factor = exp(-days_diff / 10)

### Black-Scholes and Greeks
5. **Black-Scholes Formula**: Standard options pricing model
   - d1 = [ln(S/K) + (r + 0.5*σ²)*T] / (σ*√T)
   - d2 = d1 - σ*√T
   - Call: C = S*N(d1) - K*e^(-rT)*N(d2)
   - Put: P = K*e^(-rT)*N(-d2) - S*N(-d1)

6. **Greeks Calculations**:
   - Delta: Rate of change of option price with respect to underlying price
   - Gamma: Rate of change of delta with respect to underlying price
   - Theta: Time decay per day (annualized/365)
   - Vega: Sensitivity to volatility changes (per 1% IV change)
   - Rho: Sensitivity to interest rate changes (per 1% rate change)

### Technical Indicators
7. **Simple Moving Average**: SMA = Σ(P_i) / n
8. **Bollinger Bands**: Upper/Lower bands at 2 standard deviations from 20-period SMA
9. **Relative Strength Index**: RSI = 100 - (100 / (1 + RS))
10. **Logarithmic Returns**: Return = ln(P_t / P_{t-1})

## File Structure & Key Files

### Main Directories

```
/
├── .gitignore
├── CLAUDE.md
├── QWEN.md
├── README.md
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
├── .claude/
│   └── settings.local.json
├── .vite/
├── dist/                 # Production build output
├── docs/                 # Documentation files
│   ├── csp_protection_bear_market.md
│   ├── MATHEMATICAL_FORMULAS.md
│   └── put_selling_plan.md
├── mobile-app/           # Mobile application (React Native Expo)
│   └── OptionsTradingSimulator/
│       ├── app/
│       ├── assets/
│       ├── components/
│       ├── constants/
│       ├── contexts/
│       ├── data/
│       ├── hooks/
│       ├── scripts/
│       ├── utils/
│       └── .expo/, .vscode/ (hidden directories)
├── node_modules/         # Dependencies
├── src/                  # Main web application source code
│   ├── components/       # React components (697 LOC)
│   ├── data/             # Historical data (googl_historical.json)
│   ├── utils/            # Business logic utilities (523 LOC)
│   │   ├── blackScholes.js
│   │   ├── dataGenerator.js
│   │   └── technicalIndicators.js
│   ├── App.jsx           # State management hub (300+ LOC)
│   ├── App.css           # Dark theme styling (1000+ LOC)
│   └── main.jsx          # Application entry point
└── utils/                # Data processing utilities (Python scripts)
    ├── download_data.py
    └── README.md
```

### Key Files (Reading Order)

1. **`src/App.jsx`** (300+ LOC) - State management hub. Manages current date/price, positions, closedPositions, playback. Orchestrates data flow. Contains trading logic, auto-expiration logic, and keyboard shortcuts (Space for play/pause).

2. **`src/utils/dataGenerator.js`** - Generates synthetic 2019-2025 price data using Geometric Brownian Motion. Implements dynamic IV calculation with event spikes. Creates strike prices & expiration dates.

3. **`src/utils/blackScholes.js`** - Black-Scholes pricing formula, Greeks calculations (Delta, Gamma, Theta, Vega, Rho), `calculateOptionPnL` function for P&L computation. Handles calls and puts.

4. **`src/components/PriceChart.jsx`** (570+ LOC) - Multi-type chart (Line/Bars/Candles) with Recharts. Features: timeframe selection (1M/3M/6M/1Y), chart type switcher, Bollinger Bands, 200-day MA, Volume with 20-day MA, RSI with current value display. Custom tooltip. Uses Scatter component with custom shapes for Bars/Candles. Price and RSI reference lines with colored background labels.

5. **`src/components/OptionsChain.jsx`** (180+ LOC) - Options chain table with real-time pricing. Buy/Sell interface with configurable default contracts and confirmation toggle. Settings displayed inline with expiration selector. All quantity inputs synchronized.

6. **`src/components/Portfolio.jsx`** (160+ LOC) - Position tracking with session P&L breakdown (Total, Unrealized, Realized). Shows closed positions count. P&L per position, aggregated portfolio Greeks, close position functionality. Receives `closedPositions` prop for realized P&L calculation.

7. **`src/components/TimeControls.jsx`** - Playback controls: play/pause, speed slider, date display, timeline slider.

### Mobile Application

The project includes a mobile application built with React Native using Expo in the `mobile-app/` directory. The mobile app provides similar options trading simulation functionality optimized for mobile devices.

### Documentation Files

The `docs/` directory contains additional documentation files:
- `csp_protection_bear_market.md` - Documentation on bear market protection strategies
- `MATHEMATICAL_FORMULAS.md` - Detailed mathematical formulas used in the application
- `put_selling_plan.md` - Documentation on put selling strategies

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

## Performance Considerations

- Technical indicators calculated once per price dataset (memoized in useEffect)
- Volume SMA calculated with useMemo in PriceChart (recalculates when displayData changes)
- Options chain auto-scrolls to ATM strikes on mount/strike changes
- Strike prices regenerated only on >15% price moves
- React Strict Mode enabled during development
- Auto-expiration uses setTimeout to avoid state updates during render

## When Adding Features

- **New chart types**: Add to PriceChart with Scatter/Line/Bar components. Use custom shape prop for OHLC variations.
- **New indicators**: Add to `technicalIndicators.js` and integrate in `PriceChart.jsx`. Add MA calculations with memoization.
- **New trading features**: Update `App.jsx` trading logic, `OptionsChain.jsx` UI, and `Portfolio.jsx` display. Remember to handle both open and closed positions.
- **UI changes**: Maintain dark theme in `App.css`. Use TradingView-style colors. Options controls styled like chart controls (inline, pipe separators).
- **Data changes**: Modify `dataGenerator.js` for GBM parameters or symbol data. Update IV event dates carefully.

## Common Pitfalls

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

## Core Features

### Time Travel and Playback
- Replay historical data from 2019-2025 day-by-day
- Play/pause functionality with keyboard shortcuts (Space)
- Adjustable playback speed (0.5x to 10x)
- Slider navigation to jump to specific dates

### Charting and Technical Analysis
- Multiple chart types: Line, OHLC Bars, Candlestick
- Technical indicators: Bollinger Bands, 200-day MA, RSI
- Volume indicators with moving averages
- Real-time price reference lines and tooltips

### Options Trading
- Dynamic strike price generation with exchange-standard spacing
- Multiple expiration dates (7, 14, 30, 45, 60, 90 days)
- Real-time Black-Scholes pricing with Greeks
- VIX-informed implied volatility calculations
- Support for both call and put options

### Portfolio Management
- Position tracking with real-time P&L
- Session-based P&L tracking (unrealized and realized)
- Automatic position expiration
- Portfolio Greeks aggregation
- Position closing with manual and automatic options

## Data Sources

The application uses both real and synthetic data:
- **Real Historical Data**: GOOGL, META, AMZN, NVDA, PLTR, SPY with historical OHLCV and IV
- **Synthetic Data**: Three extreme market scenarios (MAX_CRASH, WHIPSAW, MOONSHOT) with parameterized volatility and events
- **VIX Data**: Market volatility index for improved IV approximation
- **TNX Data**: 10-year Treasury rates for interest rate calculations