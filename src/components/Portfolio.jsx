import React from 'react';
import { calculateOptionPnL, calculateStockPnL } from '../utils/blackScholes';

const Portfolio = ({ positions, currentPrice, currentDate, currentIV, onClosePosition, closedPositions = [] }) => {
  // Calculate current values and P&L for all positions
  const positionMetrics = positions.map((position, index) => {
    let metrics;
    if (position.type === 'stock') {
      // For stock positions, use stock P&L calculation
      metrics = calculateStockPnL(position, currentPrice, currentDate);
    } else {
      // For options positions
      const expiryDate = new Date(position.expiration);
      const currentDateObj = new Date(currentDate);
      const daysToExpiry = Math.max(0, Math.floor((expiryDate - currentDateObj) / (1000 * 60 * 60 * 24)));

      // Use current market IV for position valuation (more realistic)
      metrics = calculateOptionPnL(
        { ...position, daysToExpiry, volatility: currentIV },
        currentPrice,
        currentDate
      );
    }

    return {
      ...position,
      originalIndex: index, // Store the original index
      daysToExpiry: position.type !== 'stock' ?
        Math.max(0, Math.floor((new Date(position.expiration) - new Date(currentDate)) / (1000 * 60 * 60 * 24))) : null,
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
  // Buy Call: +1, Sell Call: -1, Buy Put: +1, Sell Put: -1
  // For stocks, Delta = quantity * (1 for long, -1 for short), others are 0
  const portfolioGreeks = positionMetrics.reduce((acc, p) => {
    let greeks = { delta: 0, gamma: 0, theta: 0, vega: 0 };

    if (p.type === 'stock') {
      // For stock, the delta is the number of shares (1 per share)
      greeks.delta = p.quantity * (p.action === 'buy' ? 1 : -1);
      // Other Greeks are 0 for stocks
    } else {
      let multiplier;
      if (p.type === 'call') {
        multiplier = p.action === 'buy' ? 1 : -1;
      } else {
        multiplier = p.action === 'buy' ? -1 : 1;
      }

      greeks = {
        delta: p.greeks.delta * p.contracts * 100 * multiplier,
        gamma: p.greeks.gamma * p.contracts * 100 * multiplier,
        theta: p.greeks.theta * p.contracts * 100 * multiplier,
        vega: p.greeks.vega * p.contracts * 100 * multiplier
      };
    }

    return {
      delta: acc.delta + greeks.delta,
      gamma: acc.gamma + greeks.gamma,
      theta: acc.theta + greeks.theta,
      vega: acc.vega + greeks.vega
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
          <div style={{ fontSize: '15px', marginTop: '0.25rem', display: 'flex', justifyContent: 'space-around' }}>
            <div><span style={{fontSize: '20px'}}>Δ</span> {portfolioGreeks.delta.toFixed(2)}</div>
            <div><span style={{fontSize: '20px'}}>Θ</span> {portfolioGreeks.theta.toFixed(2)}</div>
            <div><span style={{fontSize: '20px'}}>Γ</span> {portfolioGreeks.gamma.toFixed(4)} </div>
            <div><span style={{fontSize: '20px'}}>V</span> {portfolioGreeks.vega.toFixed(2)}</div>
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
                let positionDelta, positionTheta, positionGamma, positionVega, positionMultiplier;

                if (pos.type === 'stock') {
                  positionDelta = pos.quantity * (pos.action === 'buy' ? 1 : -1);
                  positionTheta = 0;
                  positionGamma = 0;
                  positionVega = 0;
                  positionMultiplier = pos.action === 'buy' ? 1 : -1;
                } else {
                  // Calculate position multiplier for display
                  if (pos.type === 'call') {
                    positionMultiplier = pos.action === 'buy' ? 1 : -1;
                  } else {
                    // For puts: buy put = +1 multiplier, sell put = -1 multiplier
                    positionMultiplier = pos.action === 'buy' ? 1 : -1;
                  }
                  positionDelta = pos.greeks.delta * positionMultiplier;
                  positionTheta = pos.greeks.theta;
                  positionGamma = pos.greeks.gamma;
                  positionVega = pos.greeks.vega;
                }

                return (
                  <tr key={pos.id}>
                    <td>
                      <span className={`option-type ${pos.type}`}>
                        {pos.action === 'buy' ? '+' : '-'}{pos.type[0].toUpperCase()}
                      </span>
                    </td>
                    <td>{pos.strike ? `$${pos.strike}` : 'N/A'}</td>
                    <td>{pos.type === 'stock' ? pos.quantity : pos.contracts}</td>
                    <td>${pos.entryPrice.toFixed(2)}</td>
                    <td>${pos.currentPrice.toFixed(2)}</td>
                    <td className={pos.pnl >= 0 ? 'profit' : 'loss'}>
                      ${pos.pnl.toFixed(2)} ({pos.pnlPercent.toFixed(1)}%)
                    </td>
                    <td>{pos.type !== 'stock' ? pos.daysToExpiry : 'N/A'}</td>
                    <td title={`Multiplier: ${positionMultiplier}`}>{positionDelta.toFixed(2)}</td>
                    <td>{positionTheta.toFixed(2)}</td>
                    <td>{positionGamma.toFixed(4)}</td>
                    <td>{positionVega.toFixed(2)}</td>
                    <td>
                      <button
                        className="close-btn"
                        onClick={() => onClosePosition(pos.originalIndex)}
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
