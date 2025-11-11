import React from 'react';
import { calculateOptionPnL } from '../utils/blackScholes';

const Portfolio = ({ positions, currentPrice, currentDate, currentIV, onClosePosition }) => {
  // Calculate current values and P&L for all positions
  const positionMetrics = positions.map((position, index) => {
    const expiryDate = new Date(position.expiration);
    const currentDateObj = new Date(currentDate);
    const daysToExpiry = Math.max(0, Math.floor((expiryDate - currentDateObj) / (1000 * 60 * 60 * 24)));

    // Use current market IV for position valuation (more realistic)
    const metrics = calculateOptionPnL(
      { ...position, daysToExpiry, volatility: currentIV },
      currentPrice,
      currentDate
    );

    return {
      ...position,
      index,
      daysToExpiry,
      ...metrics
    };
  });

  // Calculate portfolio totals
  const totalValue = positionMetrics.reduce((sum, p) => sum + p.currentValue, 0);
  const totalPnL = positionMetrics.reduce((sum, p) => sum + p.pnl, 0);
  const totalInvested = positionMetrics.reduce((sum, p) =>
    sum + (p.entryPrice * p.contracts * 100), 0
  );

  // Calculate portfolio Greeks
  const portfolioGreeks = positionMetrics.reduce((acc, p) => {
    const multiplier = p.action === 'buy' ? 1 : -1;
    return {
      delta: acc.delta + (p.greeks.delta * p.contracts * 100 * multiplier),
      gamma: acc.gamma + (p.greeks.gamma * p.contracts * 100 * multiplier),
      theta: acc.theta + (p.greeks.theta * p.contracts * 100 * multiplier),
      vega: acc.vega + (p.greeks.vega * p.contracts * 100 * multiplier)
    };
  }, { delta: 0, gamma: 0, theta: 0, vega: 0 });

  return (
    <div className="portfolio">
      <h2>Portfolio</h2>

      <div className="portfolio-summary">
        <div className="summary-card">
          <h4>Total Value</h4>
          <p className="big-number">${totalValue.toFixed(2)}</p>
        </div>
        <div className="summary-card">
          <h4>Total P&L</h4>
          <p className={`big-number ${totalPnL >= 0 ? 'profit' : 'loss'}`}>
            ${totalPnL.toFixed(2)}
            {totalInvested > 0 && (
              <span className="pnl-percent">
                ({((totalPnL / totalInvested) * 100).toFixed(2)}%)
              </span>
            )}
          </p>
        </div>
        <div className="summary-card">
          <h4>Positions</h4>
          <p className="big-number">{positions.length}</p>
        </div>
      </div>

      <div className="portfolio-greeks">
        <h3>Portfolio Greeks</h3>
        <div className="greeks-grid">
          <div className="greek-item">
            <span className="greek-label">Delta:</span>
            <span className="greek-value">{portfolioGreeks.delta.toFixed(2)}</span>
          </div>
          <div className="greek-item">
            <span className="greek-label">Gamma:</span>
            <span className="greek-value">{portfolioGreeks.gamma.toFixed(4)}</span>
          </div>
          <div className="greek-item">
            <span className="greek-label">Theta:</span>
            <span className="greek-value">{portfolioGreeks.theta.toFixed(2)}</span>
          </div>
          <div className="greek-item">
            <span className="greek-label">Vega:</span>
            <span className="greek-value">{portfolioGreeks.vega.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {positions.length === 0 ? (
        <div className="empty-portfolio">
          <p>No open positions. Start trading to build your portfolio!</p>
        </div>
      ) : (
        <div className="positions-table-container">
          <table className="positions-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Action</th>
                <th>Strike</th>
                <th>Contracts</th>
                <th>Entry Price</th>
                <th>Current Price</th>
                <th>Value</th>
                <th>P&L</th>
                <th>DTE</th>
                <th>Delta</th>
                <th>Theta</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {positionMetrics.map((pos) => (
                <tr key={pos.id}>
                  <td>
                    <span className={`option-type ${pos.type}`}>
                      {pos.type.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span className={`action-badge ${pos.action}`}>
                      {pos.action.toUpperCase()}
                    </span>
                  </td>
                  <td>${pos.strike}</td>
                  <td>{pos.contracts}</td>
                  <td>${pos.entryPrice.toFixed(2)}</td>
                  <td>${pos.currentPrice.toFixed(2)}</td>
                  <td>${pos.currentValue.toFixed(2)}</td>
                  <td className={pos.pnl >= 0 ? 'profit' : 'loss'}>
                    ${pos.pnl.toFixed(2)}
                    <br />
                    <span className="pnl-percent">({pos.pnlPercent.toFixed(2)}%)</span>
                  </td>
                  <td>{pos.daysToExpiry}</td>
                  <td>{pos.greeks.delta.toFixed(3)}</td>
                  <td>{pos.greeks.theta.toFixed(3)}</td>
                  <td>
                    <button
                      className="close-btn"
                      onClick={() => onClosePosition(pos.index)}
                      title="Close Position"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Portfolio;
