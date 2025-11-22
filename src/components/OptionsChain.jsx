import React, { useState, useEffect, useRef } from 'react';
import { calculateOptionMetrics } from '../utils/blackScholes';

const OptionsChain = ({
  currentPrice,
  currentIV,
  strikes,
  expirations,
  selectedExpiration,
  onExpirationChange,
  onTrade,
  onStockTrade,
  riskFreeRate = 0.045
}) => {
  const [activeTab, setActiveTab] = useState('calls');
  const [defaultContracts, setDefaultContracts] = useState(10);
  const [requireConfirmation, setRequireConfirmation] = useState(false);
  const [stockPrice, setStockPrice] = useState(currentPrice);
  const [isStockPriceManuallyChanged, setIsStockPriceManuallyChanged] = useState(false);
  const tableContainerRef = useRef(null);

  // Update stock price when current price changes (but only if not manually changed)
  useEffect(() => {
    if (!isStockPriceManuallyChanged) {
      setStockPrice(currentPrice);
    }
  }, [currentPrice]);

  // Reset manual change flag when current price changes
  useEffect(() => {
    setIsStockPriceManuallyChanged(false);
  }, [currentPrice]);

  // Auto-scroll to ATM (at-the-money) strike when strikes or price changes
  useEffect(() => {
    if (tableContainerRef.current && strikes.length > 0) {
      // Find the ATM strike (closest to current price)
      const atmIndex = strikes.findIndex(strike => strike >= currentPrice);
      const atmRow = tableContainerRef.current.querySelector(`tr[data-strike="${strikes[atmIndex]}"]`);

      if (atmRow) {
        // Scroll so ATM strike is centered in the viewport
        const container = tableContainerRef.current;
        const rowTop = atmRow.offsetTop;
        const rowHeight = atmRow.offsetHeight;
        const containerHeight = container.clientHeight;
        const scrollPosition = rowTop - (containerHeight / 2) + (rowHeight / 2) - 50;

        container.scrollTop = scrollPosition;
      }
    }
  }, [strikes, currentPrice]);

  const getOptionData = (strike, optionType) => {
    const expiration = expirations.find(exp => exp.date === selectedExpiration);
    if (!expiration) return null;

    return calculateOptionMetrics(
      currentPrice,
      strike,
      expiration.daysToExpiry,
      riskFreeRate, // Dynamic risk-free rate
      currentIV, // Use dynamic IV from current date
      optionType
    );
  };

  const isITM = (strike, type) => {
    if (type === 'call') return currentPrice > strike;
    return currentPrice < strike;
  };

  const isATM = (strike) => {
    // Consider ATM if within $2 of current price
    return Math.abs(strike - currentPrice) <= 2;
  };

  const renderOptionRow = (strike, type) => {
    const data = getOptionData(strike, type);
    if (!data) return null;

    const itm = isITM(strike, type);
    const atm = isATM(strike);
    const rowId = `${strike}-${type}`;
    const rowClass = atm ? 'atm' : (itm ? 'itm' : 'otm');

    if (isNaN(data.delta) ||
      data.price < 0.01 ||
      Math.abs(data.delta) < 0.001 ||
      Math.abs(data.delta) > 0.999 ||
      Math.abs(data.delta - 1) < 0.001 ||
      Math.abs(data.delta + 1) < 0.001) {
      return null;
    }

    return (
      <tr key={rowId} className={rowClass} data-strike={strike}>
        <td className="strike-cell">
          ${strike}
        </td>
        <td className="price-cell">${data.price.toFixed(2)}</td>
        <td className="profit">
          {(data.price / strike * 100).toFixed(1)}%
        </td>
        <td>{data.delta.toFixed(3)}</td>
        <td>{data.gamma.toFixed(4)}</td>
        <td>{data.theta.toFixed(3)}</td>
        <td>{data.vega.toFixed(3)}</td>
        <td>{(data.impliedVolatility * 100).toFixed(1)}%</td>
        <td className="action-cell">
          <input
            type="number"
            min="1"
            max="100"
            value={defaultContracts}
            className="contracts-input"
            id={`contracts-${rowId}`}
            onChange={(e) => setDefaultContracts(parseInt(e.target.value) || 1)}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="trade-btn buy-btn"
            onClick={() => {
              onTrade({
                strike,
                type,
                action: 'buy',
                price: data.price,
                contracts: defaultContracts,
                requireConfirmation
              });
            }}
          >
            Buy
          </button>
          <button
            className="trade-btn sell-btn"
            onClick={() => {
              onTrade({
                strike,
                type,
                action: 'sell',
                price: data.price,
                contracts: defaultContracts,
                requireConfirmation
              });
            }}
          >
            Sell
          </button>
        </td>
      </tr>
    );
  };

  return (
    <div className="options-chain">
      <div className="options-header">
        <h2>Options Chain</h2>
        <div className="options-controls">
          <select value={selectedExpiration} onChange={(e) => onExpirationChange(e.target.value)}>
            {expirations.map(exp => (
              <option key={exp.date} value={exp.date}>
                {exp.label} ({exp.daysToExpiry} days)
              </option>
            ))}
          </select>

          <span className="chart-type-separator">|</span>

          <span>Default Qty</span>
          <input
            type="number"
            id="default-contracts"
            min="1"
            max="100"
            value={defaultContracts}
            onChange={(e) => setDefaultContracts(parseInt(e.target.value) || 1)}
            className="contracts-input"
          />

          <span className="chart-type-separator">|</span>

          <label htmlFor="require-confirmation" className="confirmation-label">
            <input
              type="checkbox"
              id="require-confirmation"
              checked={requireConfirmation}
              onChange={(e) => setRequireConfirmation(e.target.checked)}
            />
            Confirmation
          </label>
        </div>
      </div>

      {/* Stock Trading Section */}
      <div className="stock-trade-section">
        <div className="stock-trade-controls">
          <div className="stock-input-group">
            <label htmlFor="stock-size">Size:</label>
            <input
              type="number"
              id="stock-size"
              min="1"
              max="100000"
              defaultValue={100}
              className="stock-size-input"
            />
          </div>
          <div className="stock-input-group">
            <label htmlFor="stock-price">Price:</label>
            <input
              type="number"
              id="stock-price"
              min="0.01"
              step="0.01"
              value={stockPrice}
              onChange={(e) => {
                setStockPrice(parseFloat(e.target.value) || currentPrice);
                setIsStockPriceManuallyChanged(true);
              }}
              className="stock-price-input"
            />
          </div>
          <div className="stock-input-group">
            <button
              className="trade-btn buy-btn"
              onClick={() => {
                const sizeInput = document.getElementById('stock-size');
                const size = parseInt(sizeInput.value) || 100;
                const price = stockPrice;
                onStockTrade({
                  type: 'stock',
                  action: 'buy',
                  price: price,
                  quantity: size,
                  requireConfirmation
                });
              }}
            >
              Buy Stock
            </button>
          </div>
          <div className="stock-input-group">
            <button
              className="trade-btn sell-btn"
              onClick={() => {
                const sizeInput = document.getElementById('stock-size');
                const size = parseInt(sizeInput.value) || 100;
                const price = stockPrice;
                onStockTrade({
                  type: 'stock',
                  action: 'sell',
                  price: price,
                  quantity: size,
                  requireConfirmation
                });
              }}
            >
              Sell Stock
            </button>
          </div>
        </div>
      </div>

      <div className="option-tabs">
        <button
          className={`tab ${activeTab === 'calls' ? 'active' : ''}`}
          onClick={() => setActiveTab('calls')}
        >
          Calls
        </button>
        <button
          className={`tab ${activeTab === 'puts' ? 'active' : ''}`}
          onClick={() => setActiveTab('puts')}
        >
          Puts
        </button>
      </div>

      <div className="chain-table-container" ref={tableContainerRef}>
        <table className="chain-table">
          <thead>
            <tr>
              <th>Strike</th>
              <th>Price</th>
              <th>RoR</th>
              <th>Delta</th>
              <th>Gamma</th>
              <th>Theta</th>
              <th>Vega</th>
              <th>IV</th>
              <th>Qty / Actions</th>
            </tr>
          </thead>
          <tbody>
            {strikes.map((strike, index) => {
              const row = renderOptionRow(strike, activeTab === 'calls' ? 'call' : 'put');

              // Add ITM/OTM section dividers
              const nextStrike = strikes[index + 1];
              const currentItm = isITM(strike, activeTab === 'calls' ? 'call' : 'put');
              const nextItm = nextStrike ? isITM(nextStrike, activeTab === 'calls' ? 'call' : 'put') : currentItm;

              // Show divider when transitioning from ITM to OTM or vice versa
              if (row && currentItm !== nextItm && nextStrike) {
                return (
                  <React.Fragment key={`${strike}-${activeTab}`}>
                    {row}
                    <tr className="section-divider">
                      <td colSpan="8">
                        <div className="divider-line">
                          <span className="divider-label">
                            {activeTab === 'calls' ? 'ITM ↑ | OTM ↓' : 'OTM ↑ | ITM ↓'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                );
              }

              return row;
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OptionsChain;
