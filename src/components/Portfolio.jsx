import React from 'react';
import { calculateOptionPnL } from '../utils/blackScholes';

const Portfolio = ({ positions, currentPrice, currentDate, currentIV, onClosePosition, closedPositions = [] }) => {
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

  // Calculate realized P&L from closed positions
  const realizedPnL = closedPositions.reduce((sum, p) => sum + p.realizedPnL, 0);

  // Calculate portfolio totals
  const totalValue = positionMetrics.reduce((sum, p) => sum + p.currentValue, 0);
  const unrealizedPnL = positionMetrics.reduce((sum, p) => sum + p.pnl, 0);
  const totalPnL = unrealizedPnL + realizedPnL;
  const totalInvested = positionMetrics.reduce((sum, p) =>
    sum + (p.entryPrice * p.contracts * 100), 0
  );

  // Calculate portfolio Greeks with correct multipliers
  // Buy Call: +1, Sell Call: -1, Buy Put: -1, Sell Put: +1
  // (Puts are naturally negative delta, so buy put = negative position)
  const portfolioGreeks = positionMetrics.reduce((acc, p) => {
    let multiplier;
    if (p.type === 'call') {
      multiplier = p.action === 'buy' ? 1 : -1;
    } else {
      multiplier = p.action === 'buy' ? 1 : 1;
    }

    return {
      delta: acc.delta + (p.greeks.delta * p.contracts * 100 * multiplier),
      gamma: acc.gamma + (p.greeks.gamma * p.contracts * 100 * multiplier),
      theta: acc.theta + (p.greeks.theta * p.contracts * 100 * multiplier),
      vega: acc.vega + (p.greeks.vega * p.contracts * 100 * multiplier)
    };
  }, { delta: 0, gamma: 0, theta: 0, vega: 0 });

  return (
    <div className="portfolio">
      <div className="portfolio-summary">
        <div className="summary-card">
          <h4>Total P&L</h4>
          <p className={`big-number ${totalPnL >= 0 ? 'profit' : 'loss'}`}>
            ${totalPnL.toFixed(2)}
          </p>
          <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: '#888' }}>
            U: ${unrealizedPnL.toFixed(2)} | R: ${realizedPnL.toFixed(2)}
          </div>
        </div>
        <div className="summary-card">
          <h4>Greeks</h4>
          <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
            <div>Δ {portfolioGreeks.delta.toFixed(2)} | Θ {portfolioGreeks.theta.toFixed(2)}</div>
            <div style={{ color: '#888' }}>Γ {portfolioGreeks.gamma.toFixed(4)} | V {portfolioGreeks.vega.toFixed(2)}</div>
          </div>
        </div>
        <div className="summary-card">
          <h4>Positions</h4>
          <p className="big-number">{positions.length}</p>
          <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: '#888' }}>
            Closed: {closedPositions.length}
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
                <th>Strike</th>
                <th>Qty</th>
                <th>Entry</th>
                <th>Current</th>
                <th>P&L</th>
                <th>DTE</th>
                <th>Δ</th>
                <th>Θ</th>
                <th>Γ</th>
                <th>V</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {positionMetrics.map((pos) => {
                // Calculate position multiplier for display
                let positionMultiplier;
                if (pos.type === 'call') {
                  positionMultiplier = pos.action === 'buy' ? 1 : -1;
                } else {
                  positionMultiplier = pos.action === 'buy' ? -1 : 1;
                }
                const positionDelta = pos.greeks.delta * positionMultiplier;

                return (
                  <tr key={pos.id}>
                    <td>
                      <span className={`option-type ${pos.type}`}>
                        {pos.action === 'buy' ? '+' : '-'}{pos.type[0].toUpperCase()}
                      </span>
                    </td>
                    <td>${pos.strike}</td>
                    <td>{pos.contracts}</td>
                    <td>${pos.entryPrice.toFixed(2)}</td>
                    <td>${pos.currentPrice.toFixed(2)}</td>
                    <td className={pos.pnl >= 0 ? 'profit' : 'loss'}>
                      ${pos.pnl.toFixed(2)} ({pos.pnlPercent.toFixed(1)}%)
                    </td>
                    <td>{pos.daysToExpiry}</td>
                    <td title={`Multiplier: ${positionMultiplier}`}>{positionDelta.toFixed(2)}</td>
                    <td>{pos.greeks.theta.toFixed(2)}</td>
                    <td>{pos.greeks.gamma.toFixed(4)}</td>
                    <td>{pos.greeks.vega.toFixed(2)}</td>
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
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Portfolio;
