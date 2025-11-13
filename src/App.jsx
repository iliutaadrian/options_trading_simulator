import React, { useState, useEffect, useRef } from 'react';
import PriceChart from './components/PriceChart';
import TimeControls from './components/TimeControls';
import OptionsChain from './components/OptionsChain';
import Portfolio from './components/Portfolio';
import { generateHistoricalData, generateStrikePrices, generateExpirationDates } from './utils/dataGenerator';
import { addIndicatorsToData } from './utils/technicalIndicators';
import { calculateOptionPnL } from './utils/blackScholes';

function App() {
  // Stock and date settings - Data from 2019 to 2025
  const [symbol, setSymbol] = useState('AAPL');
  const startDate = '2019-01-01';
  const endDate = '2025-11-11';

  // Generate and process data for the selected symbol
  const [rawData, setRawData] = useState(() => generateHistoricalData(symbol, startDate, endDate));
  const [priceData, setPriceData] = useState(() => addIndicatorsToData(rawData));

  // Time navigation - Start at day 350 to show 200-day moving average with history
  const [currentIndex, setCurrentIndex] = useState(350);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1000); // milliseconds per day
  const playbackTimerRef = useRef(null);

  // Options data
  const currentData = priceData[currentIndex];
  const currentPrice = currentData?.close || 150;
  const currentDate = currentData?.date || startDate;
  const currentIV = currentData?.iv || 0.35; // Get dynamic IV from current date

  const [strikes, setStrikes] = useState(() => generateStrikePrices(currentPrice, 20));
  const [expirations, setExpirations] = useState(() => generateExpirationDates(currentDate, 6));
  // Default to 30-day expiration (closest to 30 days)
  const [selectedExpiration, setSelectedExpiration] = useState(() => {
    const initialExpirations = generateExpirationDates(currentDate, 6);
    const thirtyDayExp = initialExpirations.find(exp => exp.isDefault) || initialExpirations.find(exp => exp.daysToExpiry >= 25 && exp.daysToExpiry <= 35) || initialExpirations[2];
    return thirtyDayExp?.date;
  });

  // Update expirations and strikes as time moves forward
  useEffect(() => {
    if (currentDate) {
      const newExpirations = generateExpirationDates(currentDate, 6);
      setExpirations(newExpirations);
      if (!newExpirations.find(exp => exp.date === selectedExpiration)) {
        // Select 30-day expiration or closest
        const thirtyDayExp = newExpirations.find(exp => exp.isDefault) ||
                            newExpirations.find(exp => exp.daysToExpiry >= 25 && exp.daysToExpiry <= 35) ||
                            newExpirations[2];
        setSelectedExpiration(thirtyDayExp?.date);
      }
    }
  }, [currentDate]);

  // Update strikes when price changes significantly
  useEffect(() => {
    const currentStrikeCenter = strikes[Math.floor(strikes.length / 2)];
    const priceDiff = Math.abs(currentPrice - currentStrikeCenter);
    if (priceDiff > currentPrice * 0.15) { // Update if price moved >15%
      setStrikes(generateStrikePrices(currentPrice, 20));
    }
  }, [currentPrice]);

  // Handle symbol change
  const handleSymbolChange = (newSymbol) => {
    setSymbol(newSymbol);
    const newRawData = generateHistoricalData(newSymbol, startDate, endDate);
    const newPriceData = addIndicatorsToData(newRawData);
    setRawData(newRawData);
    setPriceData(newPriceData);
    setCurrentIndex(350); // Reset to day 350
    setIsPlaying(false);

    // Update strikes and expirations based on new data
    const newCurrentPrice = newPriceData[350]?.close || 150;
    setStrikes(generateStrikePrices(newCurrentPrice, 20));
    const newExpirations = generateExpirationDates(newPriceData[350]?.date || startDate, 6);
    setExpirations(newExpirations);

    // Default to 30-day expiration
    const thirtyDayExp = newExpirations.find(exp => exp.isDefault) ||
                        newExpirations.find(exp => exp.daysToExpiry >= 25 && exp.daysToExpiry <= 35) ||
                        newExpirations[2];
    setSelectedExpiration(thirtyDayExp?.date);

    setPositions([]); // Clear positions when switching stocks
    setClosedPositions([]); // Clear closed positions history
  };

  // Trading state
  const [positions, setPositions] = useState([]);
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

      // If current date is on or after expiration, auto-close position
      if (currentDateObj >= expiryDate) {
        // Use setTimeout to avoid state update during render
        setTimeout(() => handleClosePosition(index), 0);
      }
    });
  }, [currentDate, positions.length]);

  // Keyboard shortcut: Space to play/pause
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Only trigger if space is pressed and not in an input field
      if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

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
      volatility: currentIV, // Use current IV at time of trade
      riskFreeRate: 0.045
    };

    setPositions(prev => [...prev, newPosition]);
    setTradeModalData(null);
  };

  const handleClosePosition = (index) => {
    const positionToClose = positions[index];
    if (!positionToClose) return;

    // Calculate final P&L at closing
    const expiryDate = new Date(positionToClose.expiration);
    const currentDateObj = new Date(currentDate);
    const daysToExpiry = Math.max(0, Math.floor((expiryDate - currentDateObj) / (1000 * 60 * 60 * 24)));

    const metrics = calculateOptionPnL(
      { ...positionToClose, daysToExpiry, volatility: currentIV },
      currentPrice,
      currentDate
    );

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

  return (
    <div className="app">
      <header className="app-header">
        <h1>Options Trading Simulator</h1>
        <div className="stock-selector">
          <label>Mock Stock:</label>
          <select value={symbol} onChange={(e) => handleSymbolChange(e.target.value)}>
            <option value="AAPL">Apple (AAPL)</option>
            <option value="META">Meta (META)</option>
            <option value="PLTR">Palantir (PLTR)</option>
          </select>
        </div>
        <div className="stock-info">
          <span className="symbol">{symbol}</span>
          <span className="price">${currentPrice.toFixed(2)}</span>
          <span className="date">{currentDate}</span>
        </div>
      </header>

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
            currentIV={currentIV}
            strikes={strikes}
            expirations={expirations}
            selectedExpiration={selectedExpiration}
            onExpirationChange={setSelectedExpiration}
            onTrade={handleTradeClick}
          />
        </div>
      </div>

      <Portfolio
        positions={positions}
        currentPrice={currentPrice}
        currentDate={currentDate}
        currentIV={currentIV}
        onClosePosition={handleClosePosition}
        closedPositions={closedPositions}
      />

      {/* Trade Modal */}
      {tradeModalData && (
        <div className="modal-overlay" onClick={() => setTradeModalData(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>
              {tradeModalData.action.toUpperCase()} {tradeModalData.type.toUpperCase()}
            </h3>
            <div className="modal-content">
              <p><strong>Strike:</strong> ${tradeModalData.strike}</p>
              <p><strong>Price:</strong> ${tradeModalData.price.toFixed(2)} per contract</p>
              <p><strong>Contracts:</strong> {tradeModalData.contracts || 1}</p>
              <p><strong>Total Cost:</strong> ${(tradeModalData.price * (tradeModalData.contracts || 1) * 100).toFixed(2)}</p>
              <p><strong>Expiration:</strong> {selectedExpiration}</p>

              <div className="modal-buttons">
                <button
                  className="btn-primary"
                  onClick={() => {
                    handleExecuteTrade(tradeModalData.contracts || 1);
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
