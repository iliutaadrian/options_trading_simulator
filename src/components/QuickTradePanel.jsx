import React, { useState } from 'react';
import { useSpring, animated } from 'react-spring';
import { useDrag } from '@use-gesture/react';
import { tradeHaptics } from '../utils/hapticFeedback';
import { calculateOptionMetrics } from '../utils/blackScholes';
import './QuickTradePanel.css';

const QuickTradePanel = ({
    currentPrice,
    currentIV,
    strikes,
    selectedExpiration,
    expirations,
    onTrade,
    riskFreeRate,
    onExpirationChange
}) => {
    const [activeType, setActiveType] = useState('call');
    const [focusedStrikeIndex, setFocusedStrikeIndex] = useState(0);

    const expiration = expirations.find(exp => exp.date === selectedExpiration);
    const atmIndex = strikes.findIndex(strike => strike >= currentPrice);
    const nearbyStrikes = strikes.slice(Math.max(0, atmIndex - 8), atmIndex + 9); // Show 17 strikes instead of 11

    // Initialize focused index to ATM
    React.useEffect(() => {
        setFocusedStrikeIndex(Math.min(8, nearbyStrikes.length - 1));
    }, [currentPrice, nearbyStrikes.length]);

    const [contracts, setContracts] = useState(1);
    const [stockQuantity, setStockQuantity] = useState(100);
    const [customStockPrice, setCustomStockPrice] = useState(currentPrice);

    const handleSwipe = (direction, strike) => {
        const optionData = calculateOptionMetrics(
            currentPrice,
            strike,
            expiration?.daysToExpiry || 30,
            riskFreeRate,
            currentIV,
            activeType
        );

        if (direction === 'left') {
            // Swipe left to sell
            tradeHaptics.sell();
            onTrade({
                strike,
                type: activeType,
                action: 'sell',
                price: optionData.price,
                contracts: parseInt(contracts) || 1,
                requireConfirmation: false
            });
        } else if (direction === 'right') {
            // Swipe right to buy
            tradeHaptics.buy();
            onTrade({
                strike,
                type: activeType,
                action: 'buy',
                price: optionData.price,
                contracts: parseInt(contracts) || 1,
                requireConfirmation: false
            });
        }
    };

    return (
        <div className="quick-trade-panel">
            <div className="quick-trade-header">
                <div className="trade-controls-row">
                    <div className="option-type-toggle">
                        <button
                            className={`type-btn ${activeType === 'call' ? 'active' : ''}`}
                            onClick={() => { setActiveType('call'); tradeHaptics.tap(); }}
                        >
                            Calls
                        </button>
                        <button
                            className={`type-btn ${activeType === 'put' ? 'active' : ''}`}
                            onClick={() => { setActiveType('put'); tradeHaptics.tap(); }}
                        >
                            Puts
                        </button>
                    </div>
                </div>

                <div className="expiration-selector-row">
                    <label className="expiration-label">Expiration</label>
                    <select
                        className="expiration-select"
                        value={selectedExpiration}
                        onChange={(e) => {
                            tradeHaptics.tap();
                            if (onExpirationChange) {
                                onExpirationChange(e.target.value);
                            }
                        }}
                    >
                        {expirations.map(exp => (
                            <option key={exp.date} value={exp.date}>
                                {exp.label} ({exp.daysToExpiry}d)
                            </option>
                        ))}
                    </select>
                </div>

                <div className="swipe-hint">← Sell · Buy →</div>
            </div>

            {/* Stock Trading Section */}
            <div className="stock-trading-section">
                <div className="stock-trading-header">
                    <span className="stock-label">Stock</span>
                    <span className="stock-price">${currentPrice.toFixed(2)}</span>
                </div>
                <div className="stock-trading-controls">
                    <div className="stock-quantity-input">
                        <label>Qty</label>
                        <input
                            type="number"
                            min="1"
                            max="10000"
                            value={stockQuantity}
                            onChange={(e) => setStockQuantity(e.target.value)}
                        />
                    </div>
                    <div className="stock-price-input">
                        <label>Price</label>
                        <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={customStockPrice}
                            onChange={(e) => setCustomStockPrice(parseFloat(e.target.value) || 0)}
                            placeholder={currentPrice.toFixed(2)}
                        />
                    </div>
                    <button
                        className="stock-action-btn sell"
                        onClick={() => {
                            tradeHaptics.sell();
                            onTrade({
                                strike: null,
                                type: 'stock',
                                action: 'sell',
                                price: customStockPrice || currentPrice,
                                contracts: parseInt(stockQuantity) || 100,
                                requireConfirmation: false
                            });
                        }}
                    >
                        Sell Stock
                    </button>
                    <button
                        className="stock-action-btn buy"
                        onClick={() => {
                            tradeHaptics.buy();
                            onTrade({
                                strike: null,
                                type: 'stock',
                                action: 'buy',
                                price: customStockPrice || currentPrice,
                                contracts: parseInt(stockQuantity) || 100,
                                requireConfirmation: false
                            });
                        }}
                    >
                        Buy Stock
                    </button>
                </div>
            </div>

            <div className="strike-cards-container">
                {nearbyStrikes.map((strike, index) => (
                    <StrikeCard
                        key={strike}
                        strike={strike}
                        currentPrice={currentPrice}
                        currentIV={currentIV}
                        optionType={activeType}
                        expiration={expiration}
                        riskFreeRate={riskFreeRate}
                        isFocused={index === focusedStrikeIndex}
                        onSwipe={(direction) => handleSwipe(direction, strike)}
                        contracts={contracts}
                        onContractsChange={setContracts}
                    />
                ))}
            </div>
        </div>
    );
};

const StrikeCard = ({
    strike,
    currentPrice,
    currentIV,
    optionType,
    expiration,
    riskFreeRate,
    isFocused,
    onSwipe,
    contracts,
    onContractsChange
}) => {
    const [{ x }, api] = useSpring(() => ({ x: 0 }));
    const [swiped, setSwiped] = useState(false);

    const optionData = calculateOptionMetrics(
        currentPrice,
        strike,
        expiration?.daysToExpiry || 30,
        riskFreeRate,
        currentIV,
        optionType
    );

    const isITM = optionType === 'call' ? currentPrice > strike : currentPrice < strike;

    const bind = useDrag(
        ({ down, movement: [mx], velocity: [vx], direction: [dx] }) => {
            if (swiped) return;

            const trigger = Math.abs(mx) > 100 || Math.abs(vx) > 0.5;

            if (!down && trigger) {
                const direction = dx > 0 ? 'right' : 'left';
                setSwiped(true);
                api.start({ x: dx > 0 ? 300 : -300 });
                setTimeout(() => {
                    onSwipe(direction);
                    api.start({ x: 0 });
                    setSwiped(false);
                }, 300);
            } else {
                api.start({ x: down ? mx : 0, immediate: down });
            }
        },
        { axis: 'x' }
    );

    return (
        <animated.div
            {...bind()}
            className={`strike-card ${isITM ? 'itm' : 'otm'} ${isFocused ? 'focused' : ''}`}
            style={{
                x,
                touchAction: 'pan-y',
            }}
        >
            <div className="strike-card-header">
                <span className="strike-price">${strike}</span>
                <div className="header-right-group">
                    <span className="contract-qty-badge">{contracts}x</span>
                    {isFocused && (
                        <div className="card-contract-input" onClick={e => e.stopPropagation()}>
                            <label>Qty</label>
                            <input
                                type="number"
                                min="1"
                                max="100"
                                value={contracts}
                                onChange={(e) => onContractsChange(e.target.value)}
                                onTouchStart={e => e.stopPropagation()}
                            />
                        </div>
                    )}
                    {isITM && <span className="itm-badge">ITM</span>}
                </div>
            </div>

            <div className="strike-card-body">
                <div className="option-price">${optionData.price.toFixed(2)}</div>
                <div className="option-details">
                    <span>Δ {optionData.delta.toFixed(2)}</span>
                    <span>·</span>
                    <span>Θ {optionData.theta.toFixed(2)}</span>
                </div>
            </div>

            <animated.div
                className="swipe-indicator left"
                style={{ opacity: x.to(v => Math.max(0, -v / 100)) }}
            >
                SELL
            </animated.div>
            <animated.div
                className="swipe-indicator right"
                style={{ opacity: x.to(v => Math.max(0, v / 100)) }}
            >
                BUY
            </animated.div>
        </animated.div>
    );
};

export default QuickTradePanel;
