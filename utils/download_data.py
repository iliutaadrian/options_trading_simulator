#!/usr/bin/env python3
"""
Download historical stock data from Yahoo Finance and save as JSON files.
Requires: pip install yfinance pandas
"""

import yfinance as yf
import json
from datetime import datetime, timedelta
import pandas as pd

def download_stock_data(symbol, start_date, end_date):
    """
    Download historical stock data from Yahoo Finance.

    Args:
        symbol: Stock ticker symbol (e.g., 'AAPL', 'META', 'GOOGL')
        start_date: Start date in 'YYYY-MM-DD' format
        end_date: End date in 'YYYY-MM-DD' format

    Returns:
        List of dictionaries containing OHLCV data
    """
    print(f"Downloading {symbol} data from {start_date} to {end_date}...")

    df = yf.download(symbol, start=start_date, end=end_date)

    # Convert to list of dictionaries
    data = []
    for date, row in df.iterrows():
        data.append({
            'date': date.strftime('%Y-%m-%d'),
            'timestamp': int(date.timestamp() * 1000),
            'open': round(float(row['Open']), 2),
            'high': round(float(row['High']), 2),
            'low': round(float(row['Low']), 2),
            'close': round(float(row['Close']), 2),
            'volume': int(row['Volume'])
        })

    print(f"Downloaded {len(data)} trading days for {symbol}")
    return data

def main():
    # Configuration
    symbols = ['GOOGL', 'META', 'AMZN']
    start_date = '2019-01-01'
    end_date = '2025-11-14'

    # Download data for each symbol
    for symbol in symbols:
        try:
            data = download_stock_data(symbol, start_date, end_date)

            # Save to JSON file
            filename = f'src/data/{symbol.lower()}_historical.json'
            with open(filename, 'w') as f:
                json.dump(data, f, indent=2)

            print(f"Saved {symbol} data to {filename}")
            print(f"Price range: ${data[0]['close']} to ${data[-1]['close']}")
            print()

        except Exception as e:
            print(f"Error downloading {symbol}: {e}")
            print()

if __name__ == '__main__':
    main()
