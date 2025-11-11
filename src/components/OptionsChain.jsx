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
  const tableContainerRef = useRef(null);

  // Auto-scroll to middle of option chain on mount and when strikes change
  useEffect(() => {
    if (tableContainerRef.current) {
      const container = tableContainerRef.current;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;
      const middleScroll = (scrollHeight - clientHeight) / 2;
      container.scrollTop = middleScroll;
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

  const renderOptionRow = (strike, type) => {
    const data = getOptionData(strike, type);
    if (!data) return null;

    const itm = isITM(strike, type);
    const rowId = `${strike}-${type}`;

    return (
      <tr key={rowId} className={itm ? 'itm' : 'otm'}>
        <td className="strike-cell">${strike}</td>
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
            defaultValue="1"
            className="contracts-input"
            id={`contracts-${rowId}`}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="trade-btn buy-btn"
            onClick={() => {
              const contracts = parseInt(document.getElementById(`contracts-${rowId}`).value) || 1;
              onTrade({ strike, type, action: 'buy', price: data.price, contracts });
            }}
          >
            Buy
          </button>
          <button
            className="trade-btn sell-btn"
            onClick={() => {
              const contracts = parseInt(document.getElementById(`contracts-${rowId}`).value) || 1;
              onTrade({ strike, type, action: 'sell', price: data.price, contracts });
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
        <div className="expiration-selector">
          <label>Expiration:</label>
          <select value={selectedExpiration} onChange={(e) => onExpirationChange(e.target.value)}>
            {expirations.map(exp => (
              <option key={exp.date} value={exp.date}>
                {exp.label} ({exp.daysToExpiry} days)
              </option>
            ))}
          </select>
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
            {strikes.map(strike => renderOptionRow(strike, activeTab === 'calls' ? 'call' : 'put'))}
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
