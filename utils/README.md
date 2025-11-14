# Python Utility Scripts

This folder contains Python scripts for data management. JavaScript utilities are in `src/utils/`.

## download_data.py
Downloads historical stock data from Yahoo Finance and saves as JSON files to `src/data/`.

### Usage
```bash
python3 utils/download_data.py
```

### Requirements
```bash
pip install yfinance pandas
```

### Configuration
Edit the `main()` function in `download_data.py` to customize:
- **symbols**: List of ticker symbols to download (default: GOOGL, META, AMZN)
- **start_date**: Start date for historical data (default: 2019-01-01)
- **end_date**: End date for historical data (default: 2025-11-14)

### Output Format
Saves JSON files to `src/data/{symbol}_historical.json` with OHLCV data:
```json
{
  "date": "2019-01-02",
  "timestamp": 1546387200000,
  "open": 51.01,
  "high": 52.68,
  "low": 50.91,
  "close": 52.37,
  "volume": 31868000
}
```

### How IV is Handled
- **IV (implied volatility) is NOT downloaded** - it's calculated by the app
- When data is loaded, `calculateDynamicIV()` in `src/utils/dataGenerator.js` computes IV for each day
- Uses Garman-Klass volatility estimator for realistic market-based IV
- Auto-detects COVID crash period (Feb-March 2020) for spike in IV
- Single source of truth: all IV calculations go through one method
