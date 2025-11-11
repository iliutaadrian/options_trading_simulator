# Options Trading Simulator

An interactive web application for replaying historical stock price data and simulating options trading strategies.

## Features

### Core Functionality
- **Time Travel**: Replay historical stock price data day-by-day with play/pause controls
- **Speed Controls**: Adjust playback speed from 0.5x to 10x
- **Stock Selection**: Select any stock symbol and date range (currently using synthetic data)

### Chart Display
- **Candlestick Chart**: Visual representation of OHLC (Open, High, Low, Close) price data
- **Technical Indicators**:
  - Bollinger Bands (20-period, 2 standard deviations)
  - 200-day Moving Average
  - Volume bars
  - RSI indicator (14-period)
- **P/E Ratio**: Display of price-to-earnings ratio

### Options Trading
- **Buy/Sell Options**: Trade call and put options with various strikes and expirations
- **Strike Prices**: Dynamic generation of strike prices around current stock price
- **Expiration Dates**: Multiple weekly expiration dates to choose from
- **Contract Management**: Specify number of contracts per trade

### Option Pricing & Greeks
- **Black-Scholes Model**: Accurate option pricing using the Black-Scholes formula
- **Greeks Display**: For each option:
  - **Delta**: Rate of change relative to stock price
  - **Gamma**: Rate of change of delta
  - **Theta**: Time decay per day
  - **Vega**: Sensitivity to volatility changes
  - **Implied Volatility**: Displayed for each option

### Portfolio Management
- **Position Tracking**: View all open positions with entry and current prices
- **P&L Calculation**: Real-time profit and loss for each position and portfolio total
- **Portfolio Greeks**: Aggregate Greeks for entire portfolio
- **Position Management**: Close positions at any time

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

1. **Time Navigation**: Use the play/pause button to start automatic playback, or use step forward/backward buttons for manual control
2. **View Charts**: Monitor price action and technical indicators in real-time
3. **Trade Options**:
   - Select an expiration date from the dropdown
   - Switch between Calls and Puts tabs
   - Click Buy or Sell on any strike price
   - Enter number of contracts and execute
4. **Monitor Portfolio**: Track your positions, P&L, and portfolio Greeks in the bottom panel
5. **Close Positions**: Click the X button on any position to close it

## Technical Details

### Data Generation
- Synthetic price data generated using geometric Brownian motion
- Realistic OHLC candles with volume
- Weekend days automatically excluded

### Option Pricing Parameters
- **Risk-Free Rate**: 4.5%
- **Implied Volatility**: 25%
- **Contract Size**: 100 shares per contract

### Technical Indicators
- **Bollinger Bands**: 20-period SMA with 2 standard deviation bands
- **Moving Average**: 200-day simple moving average
- **RSI**: 14-period Relative Strength Index with 30/70 reference lines

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

## Future Enhancements

- Real market data integration via API
- Multiple stock symbols simultaneously
- More option strategies (spreads, straddles, etc.)
- Export trade history
- Performance analytics
- Historical IV data
- Earnings dates and events
- Options calculator with custom parameters

## License

MIT
