import React, { useState } from 'react';
import { useSpring, animated } from 'react-spring';
import { calculateOptionPnL, calculateStockPnL, calculatePortfolioGreeks, calculateOptionMetrics } from '../utils/blackScholes';
import './PortfolioWidget.css';

const PortfolioWidget = ({
  positions,
  currentPrice,
  currentDate,
  currentIV,
  onClosePosition,
  closedPositions = [],
  isExpanded: isExpandedProp,
  onClose
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Use prop if provided, otherwise use internal state
  const expanded = isExpandedProp !== undefined ? isExpandedProp : isExpanded;

  // Calculate metrics
  const positionMetrics = positions.map((position, index) => {
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
    return { ...position, originalIndex: index, ...metrics };
  });

  const unrealizedPnL = positionMetrics.reduce((sum, p) => sum + p.pnl, 0);
  const realizedPnL = closedPositions.reduce((sum, p) => sum + p.realizedPnL, 0);
  const totalPnL = unrealizedPnL + realizedPnL;

  // Calculate portfolio Greeks
  const portfolioGreeks = calculatePortfolioGreeks(positions, currentPrice, currentDate, currentIV);

  const expandSpring = useSpring({
    height: expanded ? 'calc(100vh - 130px)' : '80px',
    config: { tension: 280, friction: 30 }
  });

  const handleSummaryClick = () => {
    if (isExpandedProp === undefined) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <animated.div className="portfolio-widget" style={isExpandedProp !== undefined ? { height: '100vh' } : expandSpring}>
      <div
        className="portfolio-widget-summary"
        onClick={handleSummaryClick}
      >
        <div className="widget-summary-left">
          <span className="widget-label">Portfolio</span>
          <span className="position-count">{positions.length} positions</span>
        </div>
        <div className="widget-summary-right">
          <span className="account-balance">
            <div className="balance-label">Balance</div>
            <div className="balance-value">${(50000 + totalPnL).toFixed(2)}</div>
          </span>
          <span className={`total-pnl ${totalPnL >= 0 ? 'profit' : 'loss'}`}>
            {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
          </span>
          {onClose ? (
            <button className="close-overlay-btn" onClick={onClose}>✕</button>
          ) : (
            <span className="expand-icon">{expanded ? '▼' : '▲'}</span>
          )}
        </div>
      </div>

      {expanded && (
        <div className="portfolio-widget-expanded">
          <div className="portfolio-stats">
            <div className="stat-item">
              <div className="stat-label">Unrealized</div>
              <div className={`stat-value ${unrealizedPnL >= 0 ? 'profit' : 'loss'}`}>
                ${unrealizedPnL.toFixed(2)}
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Realized</div>
              <div className={`stat-value ${realizedPnL >= 0 ? 'profit' : 'loss'}`}>
                ${realizedPnL.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Portfolio Greeks */}
          <div className="portfolio-greeks">
            <div className="greeks-grid">
              <div className="greek-item">
                <div className="greek-label">Delta</div>
                <div className={`greek-value ${portfolioGreeks.delta >= 0 ? 'positive' : 'negative'}`}>
                  {portfolioGreeks.delta >= 0 ? '+' : ''}{portfolioGreeks.delta}
                </div>
              </div>
              <div className="greek-item">
                <div className="greek-label">Gamma</div>
                <div className="greek-value">
                  {portfolioGreeks.gamma}
                </div>
              </div>
              <div className="greek-item">
                <div className="greek-label">Theta</div>
                <div className={`greek-value ${portfolioGreeks.theta >= 0 ? 'positive' : 'negative'}`}>
                  {portfolioGreeks.theta >= 0 ? '+' : ''}{portfolioGreeks.theta}
                </div>
              </div>
              <div className="greek-item">
                <div className="greek-label">Vega</div>
                <div className="greek-value">
                  {portfolioGreeks.vega}
                </div>
              </div>
            </div>
          </div>

          <div className="positions-list">
            {positions.length === 0 ? (
              <div className="empty-state">
                No positions yet. Start swiping to trade!
              </div>
            ) : (
              positionMetrics.map((pos) => {
                // Calculate individual position Greeks
                let positionGreeks = { delta: 0, theta: 0 };
                if (pos.type !== 'stock') {
                  const expiryDate = new Date(pos.expiration);
                  const currentDateObj = new Date(currentDate);
                  const daysToExpiry = Math.max(0, Math.floor((expiryDate - currentDateObj) / (1000 * 60 * 60 * 24)));

                  const optionGreeks = calculateOptionMetrics(
                    currentPrice,
                    pos.strike,
                    daysToExpiry,
                    pos.riskFreeRate || 0.045,
                    pos.volatility || currentIV,
                    pos.type
                  );

                  const quantity = pos.contracts || 1;
                  const multiplier = pos.action === 'buy' ? 1 : -1;

                  positionGreeks = {
                    delta: parseFloat((optionGreeks.delta * quantity * 100 * multiplier).toFixed(2)),
                    theta: parseFloat((optionGreeks.theta * quantity * 100 * multiplier).toFixed(2))
                  };
                } else {
                  // For stock positions, delta is 1 per share (or -1 for short)
                  const quantity = pos.contracts || 1;
                  const multiplier = pos.action === 'buy' ? 1 : -1;
                  positionGreeks = {
                    delta: parseFloat((quantity * multiplier).toFixed(2)),
                    theta: 0 // Stocks don't have theta
                  };
                }

                // Calculate days to expiration for display
                let daysToExpiryDisplay = 'N/A';
                if (pos.type !== 'stock') {
                  const expiryDate = new Date(pos.expiration);
                  const currentDateObj = new Date(currentDate);
                  const daysToExpiry = Math.max(0, Math.floor((expiryDate - currentDateObj) / (1000 * 60 * 60 * 24)));
                  daysToExpiryDisplay = daysToExpiry;
                }

                return (
                  <div key={pos.id} className="position-item">
                    <div className="position-header">
                      <div className="position-info-left">
                        <span className={`position-type ${pos.type}`}>
                          {pos.action === 'buy' ? '+' : '-'}{pos.type[0].toUpperCase()}
                        </span>
                        {pos.strike && <span className="position-strike">${pos.strike}</span>}
                      </div>
                      <div className="position-info-right">
                        <div className="position-pnl">
                          <span className={pos.pnl >= 0 ? 'profit' : 'loss'}>
                            {pos.pnl >= 0 ? '+' : ''}${pos.pnl.toFixed(2)} ({pos.pnlPercent.toFixed(1)}%)
                          </span>
                        </div>

                        <button
                          className="close-position-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onClosePosition(pos.originalIndex);
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    <div className="position-details">
                      <span>Entry: ${pos.entryPrice.toFixed(2)}</span>
                      <span>·</span>
                      <span>Current: ${pos.currentPrice.toFixed(2)}</span>
                      <span>·</span>
                      <span>DTE: {daysToExpiryDisplay}</span>
                    </div>
                    <div className="position-greeks">
                      <span className={positionGreeks.delta >= 0 ? 'positive' : 'negative'}>
                        Δ {positionGreeks.delta >= 0 ? '+' : ''}{positionGreeks.delta}
                      </span>
                      <span>·</span>
                      <span className={positionGreeks.theta >= 0 ? 'positive' : 'negative'}>
                        Θ {positionGreeks.theta >= 0 ? '+' : ''}{positionGreeks.theta}
                      </span>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </animated.div>
  );
};

export default PortfolioWidget;
