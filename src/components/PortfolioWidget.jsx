import React, { useState } from 'react';
import { useSpring, animated } from 'react-spring';
import { calculateOptionPnL, calculateStockPnL } from '../utils/blackScholes';
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
                        <div className="balance-value">${(10000 + totalPnL).toFixed(2)}</div>
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

                    <div className="positions-list">
                        {positions.length === 0 ? (
                            <div className="empty-state">
                                No positions yet. Start swiping to trade!
                            </div>
                        ) : (
                            positionMetrics.map((pos) => (
                                <div key={pos.id} className="position-item">
                                    <div className="position-header">
                                        <span className={`position-type ${pos.type}`}>
                                            {pos.action === 'buy' ? '+' : '-'}{pos.type[0].toUpperCase()}
                                        </span>
                                        {pos.strike && <span className="position-strike">${pos.strike}</span>}
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
                                    <div className="position-details">
                                        <span>Entry: ${pos.entryPrice.toFixed(2)}</span>
                                        <span>·</span>
                                        <span>Current: ${pos.currentPrice.toFixed(2)}</span>
                                    </div>
                                    <div className="position-pnl">
                                        <span className={pos.pnl >= 0 ? 'profit' : 'loss'}>
                                            {pos.pnl >= 0 ? '+' : ''}${pos.pnl.toFixed(2)} ({pos.pnlPercent.toFixed(1)}%)
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </animated.div>
    );
};

export default PortfolioWidget;
