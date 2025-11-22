import React from 'react';
import './CompactHeader.css';

const CompactHeader = ({
    symbol,
    price,
    priceChange,
    priceChangePercent,
    accountBalance,
    onSymbolClick,
    vix,
    spy,
    tnx,
    ivRank,
    onBalanceClick,
    onIndicatorClick,
    onPriceClick
}) => {
    const isPositive = priceChange >= 0;

    return (
        <header className="compact-header-container">
            <div className="compact-header-main">
                <div className="compact-header-left">
                    <button className="symbol-badge" onClick={onSymbolClick}>
                        {symbol}
                        <span className="change-icon">▼</span>
                    </button>
                </div>

                <div className="compact-header-center">
                    <div className="current-price-display" onClick={onPriceClick} style={{ cursor: 'pointer' }}>
                        ${price.toFixed(2)}
                    </div>
                    <div className={`price-change-compact ${isPositive ? 'positive' : 'negative'}`}>
                        {isPositive ? '+' : ''}{priceChange.toFixed(2)} ({isPositive ? '+' : ''}{priceChangePercent.toFixed(2)}%)
                    </div>
                </div>

                <div className="compact-header-right">
                    <div className="account-balance" onClick={onBalanceClick} style={{ cursor: 'pointer' }}>
                        <div className="balance-label">Balance</div>
                        <div className="balance-value">${accountBalance.toFixed(2)}</div>
                    </div>
                </div>
            </div>

            {/* Market Indicators Scrollable Row */}
            <div className="market-indicators-scroll">
                {vix !== null && (
                    <div className="indicator-chip" onClick={() => onIndicatorClick && onIndicatorClick('VIX')}>
                        <span className="indicator-label">VIX</span>
                        <span className="indicator-value">{vix.toFixed(2)}</span>
                    </div>
                )}
                {spy !== null && (
                    <div className="indicator-chip" onClick={() => onIndicatorClick && onIndicatorClick('SPY')}>
                        <span className="indicator-label">SPY</span>
                        <span className="indicator-value">${spy.toFixed(2)}</span>
                    </div>
                )}
                {tnx !== null && (
                    <div className="indicator-chip" onClick={() => onIndicatorClick && onIndicatorClick('TNX')}>
                        <span className="indicator-label">TNX</span>
                        <span className="indicator-value">{(tnx).toFixed(2)}%</span>
                    </div>
                )}
                {ivRank !== null && (
                    <div className={`indicator-chip ${ivRank >= 0.5 ? 'high-iv' : ''}`} onClick={() => onIndicatorClick && onIndicatorClick('IVR')}>
                        <span className="indicator-label">IVR</span>
                        <span className="indicator-value">{(ivRank * 100).toFixed(0)}%</span>
                    </div>
                )}
            </div>
        </header>
    );
};

export default CompactHeader;
