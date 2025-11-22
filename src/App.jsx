import React, { useState, useEffect, useRef } from 'react';
import PriceChart from './components/PriceChart';
import TimeControls from './components/TimeControls';
import OptionsChain from './components/OptionsChain';
import Portfolio from './components/Portfolio';
import { generateHistoricalData, generateStrikePrices, generateExpirationDates, getHistoricalData, initializeHistoricalData, waitForDataLoad, calculateIVRank } from './utils/dataGenerator';
import { addIndicatorsToData } from './utils/technicalIndicators';
import { calculateOptionPnL, calculateStockPnL } from './utils/blackScholes';
import vixData from './data/^vix_historical.json';
import spyData from './data/spy_historical.json';
import tnxData from './data/^tnx_historical.json';

// Initialize historical data on app load
initializeHistoricalData(['GOOGL', 'META', 'AMZN', 'NVDA', 'PLTR', 'SPY', 'mock_1', 'mock_2', 'mock_3']);

function App() {
  // Stock and date settings - Data from 2019 to 2025
  const [symbol, setSymbol] = useState('META');
  const [indicatorSymbol, setIndicatorSymbol] = useState(null); // For VIX, SPY, TNX when selected to be viewed on chart
  const startDate = '2019-01-01';
  const endDate = '2025-11-14';

  // Track if data has loaded
  const [dataLoaded, setDataLoaded] = useState(false);

  // Helper function to load data based on symbol type
  const loadDataForSymbol = (sym) => {
    let data;
    if (sym.startsWith('mock_')) {
      data = generateHistoricalData(sym, startDate, endDate);
    } else {
      data = getHistoricalData(sym);
      if (!data) {
        console.warn(`No data found for ${sym}, falling back to mock data`);
        data = generateHistoricalData('mock_1', startDate, endDate);
      }
    }
    return data;
  };

  // Helper function to load indicator data
  const loadIndicatorData = (indicator) => {
    if (indicator === 'VIX') {
      return vixData;
    } else if (indicator === 'SPY') {
      return spyData;
    } else if (indicator === 'TNX') {
      return tnxData;
    } else if (indicator === 'IVR') {
      // For IVR, we'll use the current stock's IV data with dates matched to current stock data
      const stockData = loadDataForSymbol(symbol);
      return stockData.map(item => ({
        date: item.date,
        close: (item.iv * 100) || 0,  // Convert decimal to percentage
        open: (item.iv * 100) || 0,
        high: (item.iv * 100) || 0,
        low: (item.iv * 100) || 0,
        volume: item.volume
      }));
    }
    return null;
  };

  // Generate and process data for the selected symbol
  const [rawData, setRawData] = useState(() => {
    if (indicatorSymbol) {
      return loadIndicatorData(indicatorSymbol);
    } else {
      return loadDataForSymbol(symbol);
    }
  });
  const [priceData, setPriceData] = useState(() => {
    if (indicatorSymbol) {
      // For indicators, we just add indicators to the indicator data itself
      return addIndicatorsToData(rawData, vixData, spyData);
    } else {
      return addIndicatorsToData(rawData, vixData, spyData);
    }
  });

  // Wait for historical data to load, then reload if needed
  useEffect(() => {
    waitForDataLoad().then(() => {
      // Data is now loaded, check if we need to reload
      let newData;
      if (indicatorSymbol) {
        newData = loadIndicatorData(indicatorSymbol);
      } else {
        newData = loadDataForSymbol(symbol);
      }
      if (newData && newData.length > 0) {
        setRawData(newData);
        setPriceData(addIndicatorsToData(newData, vixData, spyData));
      }
      setDataLoaded(true);
    });
  }, [indicatorSymbol, symbol]);

  // Time navigation - Start at day 350 to show 200-day moving average with history
  const [currentIndex, setCurrentIndex] = useState(350);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(5000); // milliseconds per day
  const playbackTimerRef = useRef(null);

  // Options data
  const currentData = priceData[currentIndex];
  const currentIV = currentData?.iv || 0.35; // Get dynamic IV from current date

  // Get current stock price (always get the stock price regardless of which indicator is displayed on chart)
  const getStockPrice = () => {
    if (!indicatorSymbol) {
      return currentData?.close || 150; // Use current chart price if not viewing an indicator
    } else {
      // If viewing an indicator, get the price from the original stock data at the same index
      const stockData = loadDataForSymbol(symbol);
      return stockData[currentIndex]?.close || 150;
    }
  };
  const currentPrice = getStockPrice();

  const currentDate = currentData?.date || startDate;

  // Get current IV for the selected stock (not the indicator if indicator is selected)
  const currentStockIV = () => {
    if (!indicatorSymbol) {
      return currentIV; // Use current IV if not viewing an indicator
    } else {
      // If viewing an indicator, get the IV from the original stock data at the same index
      const stockData = loadDataForSymbol(symbol);
      return stockData[currentIndex]?.iv || 0.35;
    }
  };
  const currentIVForOptions = currentStockIV();

  // Get current VIX value by matching date
  const currentVIX = vixData.find(v => v.date === currentDate)?.close || null;

  // Get current SPY value by matching date
  const currentSPY = spyData.find(p => p.date === currentDate)?.close || null;

  // Get current 10-Year Treasury rate by matching date (TNX is in basis points, so divide by 100 for percentage)
  const currentTnx = tnxData.find(p => p.date === currentDate)?.close || null;
  const currentRiskFreeRate = currentTnx ? currentTnx / 100 : 0.045; // Default to 4.5% if no data

  // Calculate IV Rank for the current stock based on historical IV data
  // Need to use the stock data, not indicator data
  const currentIVRank = () => {
    if (!indicatorSymbol) {
      // If not viewing an indicator, use the current rawData (stock data)
      return rawData && currentIndex >= 0 ? calculateIVRank(rawData, currentIndex) : null;
    } else {
      // If viewing an indicator, get the IV rank from the original stock data at the same index
      const stockData = loadDataForSymbol(symbol);
      return stockData && currentIndex >= 0 ? calculateIVRank(stockData, currentIndex) : null;
    }
  };
  const currentIVRankValue = currentIVRank();

  const [strikes, setStrikes] = useState(() => generateStrikePrices(currentPrice));
  const [expirations, setExpirations] = useState(() => generateExpirationDates(currentDate));
  // Default to 30-day expiration (closest to 30 days)
  const [selectedExpiration, setSelectedExpiration] = useState(() => {
    const initialExpirations = generateExpirationDates(currentDate);
    const thirtyDayExp = initialExpirations.find(exp => exp.isDefault) || initialExpirations.find(exp => exp.daysToExpiry >= 25 && exp.daysToExpiry <= 35) || initialExpirations[2];
    return thirtyDayExp?.date;
  });

  // Update expirations and strikes as time moves forward (only when viewing stock, not indicators)
  useEffect(() => {
    if (currentDate && !indicatorSymbol) { // Only update when viewing stock, not indicators
      const newExpirations = generateExpirationDates(currentDate);
      setExpirations(newExpirations);
      if (!newExpirations.find(exp => exp.date === selectedExpiration)) {
        // Select 30-day expiration or closest
        const thirtyDayExp = newExpirations.find(exp => exp.isDefault) ||
          newExpirations.find(exp => exp.daysToExpiry >= 25 && exp.daysToExpiry <= 35) ||
          newExpirations[2];
        setSelectedExpiration(thirtyDayExp?.date);
      }
    }
  }, [currentDate, indicatorSymbol]);

  // Update strikes when price changes significantly (only when viewing stock, not indicators)
  useEffect(() => {
    if (!indicatorSymbol) { // Only update strikes when viewing stock, not indicators
      const currentStrikeCenter = strikes[Math.floor(strikes.length / 2)];
      const priceDiff = Math.abs(currentPrice - currentStrikeCenter);
      if (priceDiff > currentPrice * 0.15) { // Update if price moved >15%
        setStrikes(generateStrikePrices(currentPrice));
      }
    }
  }, [currentPrice, indicatorSymbol]);

  // Handle symbol change
  const handleSymbolChange = (newSymbol) => {
    setSymbol(newSymbol);
    setIndicatorSymbol(null); // Clear any indicator selection when switching symbols
    const newRawData = loadDataForSymbol(newSymbol);
    const newPriceData = addIndicatorsToData(newRawData, vixData, spyData);
    setRawData(newRawData);
    setPriceData(newPriceData);
    setCurrentIndex(350); // Reset to day 350
    setIsPlaying(false);

    // Update strikes and expirations based on new data
    const newCurrentPrice = newPriceData[350]?.close || 150;
    setStrikes(generateStrikePrices(newCurrentPrice));
    const newExpirations = generateExpirationDates(newPriceData[350]?.date || startDate);
    setExpirations(newExpirations);

    // Default to 30-day expiration
    const thirtyDayExp = newExpirations.find(exp => exp.isDefault) ||
      newExpirations.find(exp => exp.daysToExpiry >= 25 && exp.daysToExpiry <= 35) ||
      newExpirations[2];
    setSelectedExpiration(thirtyDayExp?.date);

    setPositions([]); // Clear options positions when switching stocks
    setStockPosition(null); // Clear stock position when switching stocks
    setClosedPositions([]); // Clear closed positions history
  };

  // Handle indicator change
  const handleIndicatorChange = (indicator) => {
    setIndicatorSymbol(indicator);
    const newRawData = loadIndicatorData(indicator);
    const newPriceData = addIndicatorsToData(newRawData, vixData, spyData);
    setRawData(newRawData);
    setPriceData(newPriceData);
    // Keep the same currentIndex to maintain the same date
    setIsPlaying(false);
  };

  // Handle return to stock chart
  const handleReturnToStock = () => {
    setIndicatorSymbol(null); // Return to stock view
    const newRawData = loadDataForSymbol(symbol);
    const newPriceData = addIndicatorsToData(newRawData, vixData, spyData);
    setRawData(newRawData);
    setPriceData(newPriceData);
    setIsPlaying(false);
  };

  // Trading state
  const [positions, setPositions] = useState([]); // Options positions
  const [stockPosition, setStockPosition] = useState(null); // Single stock position
  const [closedPositions, setClosedPositions] = useState([]);
  const [tradeModalData, setTradeModalData] = useState(null);

  // Playback control
  useEffect(() => {
    if (isPlaying) {
      playbackTimerRef.current = setInterval(() => {
        setCurrentIndex(prev => {
          if (prev >= priceData.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, playbackSpeed);
    } else {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
      }
    }

    return () => {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, priceData.length]);

  // Auto-expire positions that reach expiration date
  useEffect(() => {
    if (positions.length === 0) return;

    const currentDateObj = new Date(currentDate);

    // Check each position for expiration
    positions.forEach((position, index) => {
      const expiryDate = new Date(position.expiration);

      // // If current date is on or after expiration, auto-close position
      // if (currentDateObj >= expiryDate) {
      //   // Use setTimeout to avoid state update during render
      //   setTimeout(() => handleClosePosition(index), 0);
      // }
    });
  }, [currentDate, positions.length]);

  // Keyboard shortcuts: Space to play/pause, Arrow keys for navigation and speed
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Only trigger if not in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleStepForward();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleStepBackward();
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        const speedLevels = [7500, 5000, 2500, 1000];
        const currentSpeedIndex = speedLevels.indexOf(playbackSpeed);
        if (currentSpeedIndex > 0) {
          setPlaybackSpeed(speedLevels[currentSpeedIndex - 1]);
        }
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        const speedLevels = [7500, 5000, 2500, 1000];
        const currentSpeedIndex = speedLevels.indexOf(playbackSpeed);
        if (currentSpeedIndex < speedLevels.length - 1 && currentSpeedIndex !== -1) {
          setPlaybackSpeed(speedLevels[currentSpeedIndex + 1]);
        } else if (currentSpeedIndex === -1) {
          setPlaybackSpeed(5000);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [playbackSpeed]);

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);

  const handleStepForward = () => {
    if (currentIndex < priceData.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleStepBackward = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleSliderChange = (value) => {
    setCurrentIndex(value);
    setIsPlaying(false);
  };

  const handleSpeedIncrease = () => {
    setPlaybackSpeed(prev => prev + 1);
  };
  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
  };

  // Trading functions
  const handleTradeClick = (tradeData) => {
    // If confirmation not required, execute immediately
    if (!tradeData.requireConfirmation) {
      handleExecuteTrade(tradeData.contracts, tradeData);
    } else {
      setTradeModalData(tradeData);
    }
  };

  const handleStockTradeClick = (tradeData) => {
    // If confirmation not required, execute immediately
    if (!tradeData.requireConfirmation) {
      handleExecuteStockTrade(tradeData.quantity, tradeData);
    } else {
      setTradeModalData(tradeData);
    }
  };

  const handleExecuteTrade = (contracts, tradeDataOverride = null) => {
    const tradeData = tradeDataOverride || tradeModalData;
    if (!tradeData || !currentData) return;

    const newPosition = {
      id: Date.now() + Math.random(),
      type: tradeData.type,
      action: tradeData.action,
      strike: tradeData.strike,
      expiration: selectedExpiration,
      contracts: contracts,
      entryPrice: tradeData.price,
      entryDate: currentDate,
      entryStockPrice: currentPrice,
      volatility: currentIVForOptions, // Use current IV at time of trade (from original stock data)
      riskFreeRate: currentRiskFreeRate
    };

    setPositions(prev => [...prev, newPosition]);
    setTradeModalData(null);
  };

  const handleExecuteStockTrade = (quantity, tradeDataOverride = null) => {
    const tradeData = tradeDataOverride || tradeModalData;
    if (!tradeData || !currentData) return;

    setStockPosition(prevStockPosition => {
      if (prevStockPosition) {
        // If we already have a stock position, calculate new position based on action
        if (prevStockPosition.action === tradeData.action) {
          // Same action (buy + buy or sell + sell): increase position size
          const totalQuantity = prevStockPosition.quantity + quantity;
          const totalValue = (prevStockPosition.entryPrice * prevStockPosition.quantity) + (tradeData.price * quantity);
          const newEntryPrice = totalValue / totalQuantity;

          return {
            ...prevStockPosition,
            quantity: totalQuantity,
            entryPrice: newEntryPrice
          };
        } else {
          // Opposite action (buy + sell or sell + buy): reduce position or flip
          const positionDiff = prevStockPosition.quantity - quantity;

          if (positionDiff > 0) {
            // Reduce position but still holding same direction
            const totalValue = (prevStockPosition.entryPrice * prevStockPosition.quantity) + (tradeData.price * quantity);
            const avgEntryPrice = totalValue / (prevStockPosition.quantity + quantity);
            return {
              ...prevStockPosition,
              quantity: positionDiff,
              entryPrice: avgEntryPrice // Weighted average of entry prices
            };
          } else if (positionDiff < 0) {
            // Flip direction
            return {
              id: Date.now() + Math.random(),
              type: 'stock',
              action: tradeData.action, // New action that's dominating
              quantity: Math.abs(positionDiff),
              entryPrice: tradeData.price,
              entryDate: currentDate,
              entryStockPrice: currentPrice,
              volatility: currentIVForOptions,
              riskFreeRate: currentRiskFreeRate
            };
          } else {
            // Complete offset - no position left
            return null;
          }
        }
      } else {
        // No existing position, create new one
        return {
          id: Date.now() + Math.random(),
          type: 'stock',
          action: tradeData.action,
          quantity: quantity,
          entryPrice: tradeData.price,
          entryDate: currentDate,
          entryStockPrice: currentPrice,
          volatility: currentIVForOptions,
          riskFreeRate: currentRiskFreeRate
        };
      }
    });

    setTradeModalData(null);
  };

  const handleClosePosition = (index) => {
    const positionToClose = positions[index];
    if (!positionToClose) return;

    let metrics;
    if (positionToClose.type === 'stock') {
      // For stock positions, use stock P&L calculation
      metrics = calculateStockPnL(positionToClose, currentPrice, currentDate);
    } else {
      // For option positions
      const expiryDate = new Date(positionToClose.expiration);
      const currentDateObj = new Date(currentDate);
      const daysToExpiry = Math.max(0, Math.floor((expiryDate - currentDateObj) / (1000 * 60 * 60 * 24)));

      metrics = calculateOptionPnL(
        { ...positionToClose, daysToExpiry, volatility: currentIVForOptions },
        currentPrice,
        currentDate
      );
    }

    // Store closed position with realized P&L
    const closedPosition = {
      ...positionToClose,
      closedDate: currentDate,
      closedPrice: metrics.currentPrice,
      realizedPnL: metrics.pnl
    };

    setClosedPositions(prev => [...prev, closedPosition]);
    setPositions(prev => prev.filter((_, i) => i !== index));
  };

  // Function to close the single stock position
  const handleCloseStockPosition = () => {
    if (!stockPosition) return;

    const metrics = calculateStockPnL(stockPosition, currentPrice, currentDate);

    // Store closed position with realized P&L
    const closedPosition = {
      ...stockPosition,
      closedDate: currentDate,
      closedPrice: metrics.currentPrice,
      realizedPnL: metrics.pnl
    };

    setClosedPositions(prev => [...prev, closedPosition]);
    setStockPosition(null);
  };

  // Show loading state for real symbols on initial load
  const isLoadingRealData = !dataLoaded && !symbol.startsWith('mock_');

  return (
    <div className="app">
      <header className="app-header">
        <div className="stock-selector">
          <label>Stock:</label>
          <select value={symbol} onChange={(e) => handleSymbolChange(e.target.value)} disabled={isLoadingRealData}>
            <optgroup label="Real Historical Data (2019-2025)">
              <option value="GOOGL">GOOGL</option>
              <option value="META">META</option>
              <option value="AMZN">AMZN</option>
              <option value="NVDA">NVDA</option>
              <option value="AMZN">AMZN</option>
              <option value="PLTR">PLTR</option>
              <option value="SPY">SPY</option>
            </optgroup>
            <optgroup label="Mock / Synthetic Data">
              <option value="mock_1">Max Crash</option>
              <option value="mock_2">Whipsaw</option>
              <option value="mock_3">Moonshot</option>
            </optgroup>
          </select>
        </div>
        <div className="stock-info">
          <span
            className="price clickable-indicator"
            onClick={() => handleReturnToStock()}
            title="Click to return to stock chart"
          >
            ${currentPrice.toFixed(2)}
          </span>
          {currentVIX !== null && (
            <span
              className="indicator vix clickable-indicator"
              onClick={() => handleIndicatorChange('VIX')}
              title="Click to view VIX on chart"
            >
              VIX: {currentVIX.toFixed(2)}
            </span>
          )}
          {currentSPY !== null && (
            <span
              className="indicator spy clickable-indicator"
              onClick={() => handleIndicatorChange('SPY')}
              title="Click to view SPY on chart"
            >
              SPY: {currentSPY.toFixed(2)}
            </span>
          )}
          {currentTnx !== null && (
            <span
              className="indicator tnx clickable-indicator"
              onClick={() => handleIndicatorChange('TNX')}
              title="Click to view TNX on chart"
            >
              TNX: {(currentRiskFreeRate * 100).toFixed(2)}%
            </span>
          )}
          {currentIVRankValue !== null && (
            <span
              className={`indicator iv-rank clickable-indicator ${currentIVRankValue >= 0.5 ? 'iv-high' : 'iv-low'}`}
              onClick={() => handleIndicatorChange('IVR')}
              title={`IV Rank: ${(currentIVRankValue * 100).toFixed(0)}% - Measures where current IV stands relative to the past year (0% = lowest, 100% = highest). Click to view IVR on chart`}
            >
              IVR: {(currentIVRankValue * 100).toFixed(0)}%
            </span>
          )}
        </div>
      </header>

      {isLoadingRealData ? (
        <div className="loading-container">
          <p>Loading {symbol} historical data...</p>
        </div>
      ) : (
        <>
          <TimeControls
            currentIndex={currentIndex}
            totalDays={priceData.length}
            isPlaying={isPlaying}
            playbackSpeed={playbackSpeed}
            onPlay={handlePlay}
            onPause={handlePause}
            onStepBackward={handleStepBackward}
            onStepForward={handleStepForward}
            onSpeedChange={handleSpeedChange}
            onSliderChange={handleSliderChange}
            currentDate={currentDate}
          />

          <div className="main-content">
            <div className="left-panel">
              <PriceChart data={priceData} currentIndex={currentIndex} />
            </div>

            <div className="right-panel">
              <OptionsChain
                currentPrice={currentPrice}
                currentIV={currentIVForOptions}
                strikes={strikes}
                expirations={expirations}
                selectedExpiration={selectedExpiration}
                onExpirationChange={setSelectedExpiration}
                onTrade={handleTradeClick}
                onStockTrade={handleStockTradeClick}
                riskFreeRate={currentRiskFreeRate}
              />

              <Portfolio
                positions={positions}
                stockPosition={stockPosition}
                currentPrice={currentPrice}
                currentDate={currentDate}
                currentIV={currentIVForOptions}
                onClosePosition={handleClosePosition}
                onCloseStockPosition={handleCloseStockPosition}
                closedPositions={closedPositions}
              />
            </div>
          </div>
        </>
      )}

      {/* Trade Modal */}
      {tradeModalData && (
        <div className="modal-overlay" onClick={() => setTradeModalData(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>
              {tradeModalData.action.toUpperCase()} {tradeModalData.type.toUpperCase()}
            </h3>
            <div className="modal-content">
              {tradeModalData.type === 'stock' ? (
                <>
                  <p><strong>Quantity:</strong> {tradeModalData.quantity}</p>
                  <p><strong>Price:</strong> ${tradeModalData.price.toFixed(2)} per share</p>
                  <p><strong>Total Cost:</strong> ${(tradeModalData.price * tradeModalData.quantity).toFixed(2)}</p>
                  <p><strong>Type:</strong> Stock</p>
                </>
              ) : (
                <>
                  <p><strong>Strike:</strong> ${tradeModalData.strike}</p>
                  <p><strong>Price:</strong> ${tradeModalData.price.toFixed(2)} per contract</p>
                  <p><strong>Contracts:</strong> {tradeModalData.contracts || 1}</p>
                  <p><strong>Total Cost:</strong> ${(tradeModalData.price * (tradeModalData.contracts || 1) * 100).toFixed(2)}</p>
                  <p><strong>Expiration:</strong> {selectedExpiration}</p>
                </>
              )}

              <div className="modal-buttons">
                <button
                  className="btn-primary"
                  onClick={() => {
                    if (tradeModalData.type === 'stock') {
                      handleExecuteStockTrade(tradeModalData.quantity);
                    } else {
                      handleExecuteTrade(tradeModalData.contracts || 1);
                    }
                  }}
                >
                  Execute Trade
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => setTradeModalData(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
