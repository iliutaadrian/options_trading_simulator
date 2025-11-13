import React, { useState, useEffect, useRef } from 'react';
import { calculateOptionMetrics } from '../utils/blackScholes';

const OptionsChain = ({
  currentPrice,
  currentIV,
  strikes,
  expirations,
  selectedExpiration,
  onExpirationChange,
  onTrade
}) => {
  const [activeTab, setActiveTab] = useState('calls');
  const [defaultContracts, setDefaultContracts] = useState(10);
  const [requireConfirmation, setRequireConfirmation] = useState(false);
  const tableContainerRef = useRef(null);

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
        const scrollPosition = rowTop - (containerHeight / 2) + (rowHeight / 2);

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
      0.045, // 4.5% risk-free rate
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

    return (
      <tr key={rowId} className={rowClass} data-strike={strike}>
        <td className="strike-cell">
          ${strike}
        </td>
        <td className="price-cell">${data.price.toFixed(2)}</td>
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
          <span>Expiration</span>
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
              if (currentItm !== nextItm && nextStrike) {
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

      <div className="options-info">
        <div className="info-box">
          <h4>Current Stock Price</h4>
          <p className="big-number">${currentPrice.toFixed(2)}</p>
        </div>
        <div className="info-box">
          <h4>P/E Ratio</h4>
          <p className="big-number">18.5</p>
        </div>
        <div className="info-box">
          <h4>Implied Volatility</h4>
          <p className="big-number">{(currentIV * 100).toFixed(1)}%</p>
        </div>
        <div className="info-box">
          <h4>Risk-Free Rate</h4>
          <p className="big-number">4.5%</p>
        </div>
      </div>
    </div>
  );
};

export default OptionsChain;
