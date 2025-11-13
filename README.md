# Options Trading Simulator

An interactive web application for replaying historical stock price data (2019-2025) and simulating options trading strategies with real-time Black-Scholes pricing and Greeks calculations.

## Features

### Core Functionality
- **Time Travel**: Replay historical stock price data day-by-day with play/pause controls
- **Keyboard Shortcuts**: Press **Space** to play/pause playback
- **Speed Controls**: Adjust playback speed from 0.5x to 10x
- **Stock Selection**: Choose from multiple stock symbols (AAPL, META, PLTR) with synthetic data
- **Multiple Timeframes**: View price data in 1M, 3M, 6M, or 1Y timeframes

### Advanced Chart Display
- **Multiple Chart Types**:
  - Line chart with gradient fill
  - OHLC Bars chart (traditional bar chart with open/close ticks)
  - Candlestick chart with color-coded bodies
- **Technical Indicators**:
  - Bollinger Bands (20-period, 2 standard deviations)
  - 200-day Moving Average (orange line)
  - Volume bars with 20-day volume moving average
  - RSI indicator (14-period) with 30/70 reference lines and current value display
- **Interactive Features**:
  - Current price reference line with label
  - Current RSI value indicator
  - Custom tooltips showing OHLC data
  - Synchronized chart padding for better visibility

### Options Trading & Greeks
- **Trading Interface**:
  - Buy/Sell call and put options with various strikes and expirations
  - Dynamic strike prices around current price (auto-updates on >15% price moves)
  - Multiple expiration dates (7, 14, 30, 45, 60, 90 days)
  - **Default Contracts**: Set a default quantity for all trades
  - **Confirmation Toggle**: Enable/disable trade confirmation modal
  - All quantity inputs synchronized with default contract setting

- **Black-Scholes Pricing**:
  - Accurate option pricing with dynamic implied volatility
  - Volatility calculated from realized volatility + event spikes
  - Real-time valuation - options repriced daily based on current market conditions

- **Greeks Display**: For each option:
  - **Delta**: Rate of change relative to stock price
  - **Gamma**: Rate of change of delta
  - **Theta**: Time decay per day
  - **Vega**: Sensitivity to volatility changes (per 1% IV change)
  - **IV**: Dynamic implied volatility displayed for each option

### Advanced Portfolio Management
- **Position Tracking**: View all open positions with entry and current prices
- **Session P&L Tracking**:
  - **Total P&L (Session)**: Cumulative profit/loss for entire trading session
  - **Unrealized P&L**: Current open positions mark-to-market
  - **Realized P&L**: Sum of all closed positions during session
  - **Closed Positions Count**: Track number of positions closed
- **Automatic Expiration**: Positions automatically close on expiration date with final P&L captured
- **Portfolio Greeks**: Aggregate Greeks for entire portfolio with buy/sell multipliers
- **Position Management**: Close positions manually at any time
- **Session Reset**: P&L resets only on page refresh or symbol change

## Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Usage

1. **Time Navigation**:
   - Use the play/pause button or press **Space** to start/stop automatic playback
   - Use step forward/backward buttons for manual control
   - Drag the timeline slider to jump to any date
   - Adjust playback speed using the speed selector

2. **View Charts**:
   - Switch between Line, Bars, and Candles chart types
   - Select timeframe (1M, 3M, 6M, 1Y) to zoom in/out
   - Monitor price action and technical indicators in real-time
   - View current price and RSI values on the right side of charts

3. **Configure Trading Settings**:
   - Set **Default Contracts** quantity for quick trading
   - Toggle **Confirmation** checkbox to enable/disable trade confirmations

4. **Trade Options**:
   - Select an expiration date from the dropdown
   - Switch between Calls and Puts tabs
   - Review option prices and Greeks for each strike
   - Click Buy or Sell on any strike price
   - Confirm trade (if confirmation enabled) or execute immediately

5. **Monitor Portfolio**:
   - Track open positions with real-time P&L updates
   - View session cumulative P&L (realized + unrealized)
   - Monitor portfolio Greeks (Delta, Gamma, Theta, Vega)
   - See closed positions count and realized P&L breakdown

6. **Close Positions**:
   - Click the X button on any position to close it manually
   - Positions automatically close on expiration date
   - All closed positions contribute to session realized P&L

## Technical Details

### Data Generation
- Synthetic price data (2019-2025) generated using Geometric Brownian Motion (GBM)
- Realistic OHLC candles with volume
- Weekend days automatically excluded
- Dynamic implied volatility based on realized volatility + event spikes
- Three stock symbols with different characteristics (AAPL, META, PLTR)

### Option Pricing Parameters
- **Risk-Free Rate**: 4.5%
- **Dynamic Implied Volatility**: Base 40-80% + 20-day realized volatility + event spikes
- **Contract Size**: 100 shares per contract
- **Expiration Logic**: Options expire on Fridays
- **Strike Spacing**: $5 increments, regenerated on >15% price moves

### Technical Indicators
- **Bollinger Bands**: 20-period SMA with 2 standard deviation bands
- **Moving Average**: 200-day simple moving average
- **Volume MA**: 20-day moving average overlay on volume bars
- **RSI**: 14-period Relative Strength Index with 30/70 reference lines and current value display

### Advanced Features
- **Auto-Expiration**: Positions automatically closed on expiration date with final P&L calculated
- **Session Tracking**: Cumulative P&L persists throughout session (resets on refresh/symbol change)
- **Mark-to-Market**: Daily revaluation of all positions using current market conditions
- **Greeks Calculation**: Portfolio-level aggregation with buy/sell multipliers

## Project Structure

```
src/
├── components/
│   ├── PriceChart.jsx       # Candlestick chart with indicators
│   ├── TimeControls.jsx     # Playback controls
│   ├── OptionsChain.jsx     # Options pricing and trading interface
│   └── Portfolio.jsx        # Position tracking and P&L
├── utils/
│   ├── dataGenerator.js     # Historical price data generation
│   ├── technicalIndicators.js  # Bollinger Bands, MA, RSI calculations
│   └── blackScholes.js      # Option pricing and Greeks
├── App.jsx                  # Main application component
├── App.css                  # Dark theme styling
└── main.jsx                 # Application entry point
```

## Technologies Used

- **React**: UI framework
- **Vite**: Build tool and dev server
- **Recharts**: Charting library
- **Black-Scholes Model**: Option pricing
- **Geometric Brownian Motion**: Price data simulation

## Keyboard Shortcuts

- **Space**: Play/Pause playback
- Works globally except when typing in input fields

## Future Enhancements

- Real market data integration via API
- Multiple stock symbols simultaneously on screen
- Option strategies builder (spreads, straddles, iron condors, etc.)
- Export trade history to CSV/JSON
- Performance analytics dashboard
- Historical IV chart overlay
- Earnings dates and event calendar
- Options calculator with custom parameters
- Greeks charting over time
- Trade journal with notes
- Paper trading leaderboard

## License

MIT
