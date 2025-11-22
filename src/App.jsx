import React, { useState, useEffect, useRef } from 'react';
import PriceChart from './components/PriceChart';
import TimeControls from './components/TimeControls';
import MobileNav from './components/MobileNav';
import CompactHeader from './components/CompactHeader';
import QuickTradePanel from './components/QuickTradePanel';
import PortfolioWidget from './components/PortfolioWidget';
import TradeAnimation from './components/TradeAnimation';
import { generateHistoricalData, generateStrikePrices, generateExpirationDates, getHistoricalData, initializeHistoricalData, waitForDataLoad, calculateIVRank } from './utils/dataGenerator';
import { addIndicatorsToData } from './utils/technicalIndicators';
import { calculateOptionPnL, calculateStockPnL } from './utils/blackScholes';
import vixData from './data/^vix_historical.json';
import spyData from './data/spy_historical.json';
import tnxData from './data/^tnx_historical.json';
import './App.css';

// Initialize historical data on app load
initializeHistoricalData(['GOOGL', 'META', 'AMZN', 'NVDA', 'PLTR', 'SPY', 'mock_1', 'mock_2', 'mock_3']);

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(() => { });
  });
}

function App() {
  // Mobile state
  const [activeTab, setActiveTab] = useState('chart');
  const [showStockSelector, setShowStockSelector] = useState(false);
  const [showTradeAnimation, setShowTradeAnimation] = useState(false);
  const [lastTradeType, setLastTradeType] = useState('buy');
  const [lastTradeProfit, setLastTradeProfit] = useState(0);
  const [showPortfolio, setShowPortfolio] = useState(false);

  // Stock and date settings
  const [symbol, setSymbol] = useState('META');
  const [indicatorChart, setIndicatorChart] = useState(null); // null = show main stock chart, otherwise show the selected indicator
  const startDate = '2019-01-01';
  const endDate = '2025-11-14';

  const [dataLoaded, setDataLoaded] = useState(false);

  const loadDataForSymbol = (sym) => {
    let data;
    if (sym.startsWith('mock_')) {
      data = generateHistoricalData(sym, startDate, endDate);
    } else {
      data = getHistoricalData(sym);
      if (!data) {
        data = generateHistoricalData('mock_1', startDate, endDate);
      }
    }
    return data;
  };

  const [rawData, setRawData] = useState(() => loadDataForSymbol(symbol));
  const [priceData, setPriceData] = useState(() => addIndicatorsToData(rawData));

  useEffect(() => {
    waitForDataLoad().then(() => {
      const newData = loadDataForSymbol(symbol);
      if (newData && newData.length > 0) {
        setRawData(newData);
        setPriceData(addIndicatorsToData(newData));
      }
      setDataLoaded(true);
    });
  }, []);

  // Time navigation
  const [currentIndex, setCurrentIndex] = useState(350);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(5000);
  const playbackTimerRef = useRef(null);

  const currentData = priceData[currentIndex];
  const previousData = priceData[currentIndex - 1];
  const currentPrice = currentData?.close || 150;
  const currentDate = currentData?.date || startDate;
  const currentIV = currentData?.iv || 0.35;

  // Calculate price change
  const priceChange = previousData ? currentPrice - previousData.close : 0;
  const priceChangePercent = previousData ? (priceChange / previousData.close) * 100 : 0;

  const currentVIX = vixData.find(v => v.date === currentDate)?.close || null;
  const currentSPY = spyData.find(p => p.date === currentDate)?.close || null;
  const currentTnx = tnxData.find(p => p.date === currentDate)?.close || null;
  const currentRiskFreeRate = currentTnx ? currentTnx / 100 : 0.045;
  const currentIVRank = rawData && currentIndex >= 0 ? calculateIVRank(rawData, currentIndex) : null;

  // Get data for indicator chart if selected
  const getDataForIndicator = (indicator) => {
    switch(indicator) {
      case 'VIX':
        return addIndicatorsToData(vixData.map(d => ({
          ...d,
          close: d.close,
          high: d.high,
          low: d.low,
          open: d.open,
          volume: d.volume,
          date: d.date
        })));
      case 'SPY':
        return addIndicatorsToData(spyData.map(d => ({
          ...d,
          close: d.close,
          high: d.high,
          low: d.low,
          open: d.open,
          volume: d.volume,
          date: d.date
        })));
      case 'TNX':
        return addIndicatorsToData(tnxData.map(d => ({
          ...d,
          close: d.close,
          high: d.high,
          low: d.low,
          open: d.open,
          volume: d.volume,
          date: d.date
        })));
      case 'IVR':
        // Calculate IVR for each date in the main price data
        const ivrData = [];
        const sortedData = [...rawData].sort((a, b) => new Date(a.date) - new Date(b.date));

        for (let i = 0; i < sortedData.length; i++) {
          const ivRank = calculateIVRank(sortedData, i);
          if (ivRank !== null) {
            ivrData.push({
              date: sortedData[i].date,
              close: ivRank * 100, // Convert to percentage
              high: ivRank * 100,
              low: ivRank * 100,
              open: ivRank * 100,
              volume: sortedData[i].volume,
              iv: sortedData[i].iv
            });
          } else {
            // If IVR is null, we can't calculate it, so skip
            continue;
          }
        }
        return addIndicatorsToData(ivrData);
      default:
        return priceData;
    }
  };

  const chartData = indicatorChart ? getDataForIndicator(indicatorChart) : priceData;

  const [strikes, setStrikes] = useState(() => generateStrikePrices(currentPrice));
  const [expirations, setExpirations] = useState(() => generateExpirationDates(currentDate));
  const [selectedExpiration, setSelectedExpiration] = useState(() => {
    const initialExpirations = generateExpirationDates(currentDate);
    const thirtyDayExp = initialExpirations.find(exp => exp.isDefault) || initialExpirations[2];
    return thirtyDayExp?.date;
  });

  useEffect(() => {
    if (currentDate) {
      const newExpirations = generateExpirationDates(currentDate);
      setExpirations(newExpirations);
      if (!newExpirations.find(exp => exp.date === selectedExpiration)) {
        const thirtyDayExp = newExpirations.find(exp => exp.isDefault) || newExpirations[2];
        setSelectedExpiration(thirtyDayExp?.date);
      }
    }
  }, [currentDate]);

  useEffect(() => {
    const currentStrikeCenter = strikes[Math.floor(strikes.length / 2)];
    const priceDiff = Math.abs(currentPrice - currentStrikeCenter);
    if (priceDiff > currentPrice * 0.15) {
      setStrikes(generateStrikePrices(currentPrice));
    }
  }, [currentPrice]);

  // Trading state
  const [positions, setPositions] = useState([]);
  const [closedPositions, setClosedPositions] = useState([]);

  // Calculate unrealized P&L from open positions
  const unrealizedPnL = positions.reduce((sum, position) => {
    let metrics;
    if (position.type === 'stock') {
      metrics = calculateStockPnL(position, currentPrice, currentDate);
    } else {
      const expiryDate = new Date(position.expiration);
      const currentDateObj = new Date(currentDate);
      const daysToExpiry = Math.max(0, Math.floor((expiryDate - currentDateObj) / (1000 * 60 * 60 * 24)));
      metrics = calculateOptionPnL(
        { ...position, daysToExpiry, volatility: currentIV },
        currentPrice,
        currentDate
      );
    }
    return sum + metrics.pnl;
  }, 0);

  // Calculate account balance (portfolio value)
  const accountBalance = 50000 + closedPositions.reduce((sum, p) => sum + p.realizedPnL, 0) + unrealizedPnL;

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);

  const handleSliderChange = (value) => {
    setCurrentIndex(value);
    setIsPlaying(false);
  };

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
  };

  const handleSymbolChange = (newSymbol) => {
    setSymbol(newSymbol);
    const newRawData = loadDataForSymbol(newSymbol);
    const newPriceData = addIndicatorsToData(newRawData);
    setRawData(newRawData);
    setPriceData(newPriceData);
    setCurrentIndex(350);
    setIsPlaying(false);
    const newCurrentPrice = newPriceData[350]?.close || 150;
    setStrikes(generateStrikePrices(newCurrentPrice));
    const newExpirations = generateExpirationDates(newPriceData[350]?.date || startDate);
    setExpirations(newExpirations);
    const thirtyDayExp = newExpirations.find(exp => exp.isDefault) || newExpirations[2];
    setSelectedExpiration(thirtyDayExp?.date);
    setPositions([]);
    setClosedPositions([]);
    setShowStockSelector(false);
  };

  // Trading functions
  const handleTradeClick = (tradeData) => {
    handleExecuteTrade(tradeData.contracts, tradeData);
  };

  const handleExecuteTrade = (contracts, tradeData) => {
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
      volatility: currentIV,
      riskFreeRate: currentRiskFreeRate
    };

    setPositions(prev => [...prev, newPosition]);

    // Show trade animation
    setLastTradeType(tradeData.action);
    setShowTradeAnimation(true);
    setTimeout(() => setShowTradeAnimation(false), 1500);
  };

  const handleClosePosition = (index) => {
    const positionToClose = positions[index];
    if (!positionToClose) return;

    let metrics;
    if (positionToClose.type === 'stock') {
      metrics = calculateStockPnL(positionToClose, currentPrice, currentDate);
    } else {
      const expiryDate = new Date(positionToClose.expiration);
      const currentDateObj = new Date(currentDate);
      const daysToExpiry = Math.max(0, Math.floor((expiryDate - currentDateObj) / (1000 * 60 * 60 * 24)));
      metrics = calculateOptionPnL(
        { ...positionToClose, daysToExpiry, volatility: currentIV },
        currentPrice,
        currentDate
      );
    }

    const closedPosition = {
      ...positionToClose,
      closedDate: currentDate,
      closedPrice: metrics.currentPrice,
      realizedPnL: metrics.pnl
    };

    setClosedPositions(prev => [...prev, closedPosition]);
    setPositions(prev => prev.filter((_, i) => i !== index));

    // Show animation with profit
    setLastTradeProfit(metrics.pnl);
    setLastTradeType('sell');
    setShowTradeAnimation(true);
    setTimeout(() => {
      setShowTradeAnimation(false);
      setLastTradeProfit(0);
    }, 1500);
  };

  const profitableTrades = closedPositions.filter(p => p.realizedPnL > 0).length;

  const handleIndicatorClick = (indicator) => {
    if (indicatorChart === indicator) {
      // If clicking the same indicator, go back to stock chart
      setIndicatorChart(null);
    } else {
      // Otherwise switch to the selected indicator
      setIndicatorChart(indicator);
    }
  };

  return (
    <div className="app mobile-app">
      <CompactHeader
        symbol={symbol}
        price={currentPrice}
        priceChange={priceChange}
        priceChangePercent={priceChangePercent}
        accountBalance={accountBalance}
        onSymbolClick={() => setShowStockSelector(true)}
        onBalanceClick={() => setShowPortfolio(!showPortfolio)}
        vix={currentVIX}
        spy={currentSPY}
        tnx={currentRiskFreeRate * 100}
        ivRank={currentIVRank}
        onIndicatorClick={handleIndicatorClick}
        onPriceClick={() => setIndicatorChart(null)}
      />

      {/* Fixed Timeline Controls */}
      <div className="fixed-timeline-controls">
        <div className="timeline-info-row">
          <span className="timeline-date">{currentDate}</span>
          <div className="timeline-controls-group">
            <button
              className="control-btn icon-only"
              onClick={() => handleSliderChange(Math.max(0, currentIndex - 1))}
            >
              ←
            </button>
            <button
              className={`control-btn play-btn ${isPlaying ? 'active' : ''}`}
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? '❚❚' : '▶'}
            </button>
            <button
              className="control-btn icon-only"
              onClick={() => handleSliderChange(Math.min(priceData.length - 1, currentIndex + 1))}
            >
              →
            </button>
          </div>
        </div>

        <div className="timeline-slider-row">
          <input
            type="range"
            min="0"
            max={priceData.length - 1}
            value={currentIndex}
            onChange={(e) => handleSliderChange(parseInt(e.target.value))}
            className="premium-slider"
            style={{
              backgroundSize: `${(currentIndex / (priceData.length - 1)) * 100}% 100%`
            }}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mobile-content">
        {activeTab === 'chart' && (
          <div className="tab-content">
            <PriceChart data={chartData} currentIndex={currentIndex} indicator={indicatorChart} />
          </div>
        )}

        {activeTab === 'trade' && (
          <div className="tab-content">
            <QuickTradePanel
              currentPrice={currentPrice}
              currentIV={currentIV}
              strikes={strikes}
              expirations={expirations}
              selectedExpiration={selectedExpiration}
              onTrade={handleTradeClick}
              riskFreeRate={currentRiskFreeRate}
              onExpirationChange={setSelectedExpiration}
            />
          </div>
        )}
      </div>

      {/* Mobile Navigation */}
      <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Portfolio Full-Screen Overlay */}
      {showPortfolio && (
        <div className="portfolio-overlay" onClick={() => setShowPortfolio(false)}>
          <div className="portfolio-overlay-content" onClick={(e) => e.stopPropagation()}>
            <PortfolioWidget
              positions={positions}
              currentPrice={currentPrice}
              currentDate={currentDate}
              currentIV={currentIV}
              onClosePosition={handleClosePosition}
              closedPositions={closedPositions}
              isExpanded={true}
              onClose={() => setShowPortfolio(false)}
            />
          </div>
        </div>
      )}

      {/* Stock Selector Modal */}
      {showStockSelector && (
        <div className="modal-overlay" onClick={() => setShowStockSelector(false)}>
          <div className="stock-selector-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Select Stock</h3>
            <div className="stock-options">
              {['GOOGL', 'META', 'AMZN', 'NVDA', 'PLTR', 'SPY'].map(sym => (
                <button
                  key={sym}
                  className={`stock-option ${sym === symbol ? 'active' : ''}`}
                  onClick={() => handleSymbolChange(sym)}
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Trade Animation */}
      <TradeAnimation
        show={showTradeAnimation}
        type={lastTradeType}
        profit={lastTradeProfit}
      />
    </div>
  );
}

export default App;
