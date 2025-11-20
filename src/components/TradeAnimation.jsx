import React, { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import { useSpring, animated } from 'react-spring';
import './TradeAnimation.css';

const TradeAnimation = ({ show, type, profit = 0 }) => {
    const [showConfetti, setShowConfetti] = useState(false);
    const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (show && profit > 100) {
            setShowConfetti(true);
            const timer = setTimeout(() => setShowConfetti(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [show, profit]);

    const animationSpring = useSpring({
        opacity: show ? 1 : 0,
        transform: show ? 'scale(1)' : 'scale(0.5)',
        config: { tension: 300, friction: 20 }
    });

    if (!show) return null;

    const isProfit = profit >= 0;
    const emoji = type === 'buy' ? '🚀' : (type === 'sell' ? '💰' : '📊');

    return (
        <>
            {showConfetti && (
                <Confetti
                    width={windowSize.width}
                    height={windowSize.height}
                    recycle={false}
                    numberOfPieces={200}
                    colors={isProfit ? ['#00ff88', '#00d4ff', '#ffaa00'] : ['#ff4444', '#ff6b6b']}
                />
            )}
            <animated.div className="trade-animation-overlay" style={animationSpring}>
                <div className={`trade-animation-content ${isProfit ? 'profit' : 'loss'}`}>
                    <div className="trade-emoji">{emoji}</div>
                    <div className="trade-message">
                        {type === 'buy' ? 'Bought!' : (type === 'sell' ? 'Sold!' : 'Trade Executed')}
                    </div>
                    {Math.abs(profit) > 0 && (
                        <div className="trade-profit">
                            {isProfit ? '+' : ''}${profit.toFixed(2)}
                        </div>
                    )}
                </div>
            </animated.div>
        </>
    );
};

export default TradeAnimation;
