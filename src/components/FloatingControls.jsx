import React, { useState } from 'react';
import { triggerHaptic } from '../utils/hapticFeedback';
import './FloatingControls.css';

const FloatingControls = ({
    isPlaying,
    onPlay,
    onPause,
    playbackSpeed,
    onSpeedChange
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const handlePlayPause = () => {
        triggerHaptic('medium');
        if (isPlaying) {
            onPause();
        } else {
            onPlay();
        }
    };

    const handleSpeedChange = (speed) => {
        triggerHaptic('light');
        onSpeedChange(speed);
        setIsExpanded(false);
    };

    const toggleExpanded = () => {
        triggerHaptic('selection');
        setIsExpanded(!isExpanded);
    };

    const speedOptions = [
        { value: 7500, label: '0.5x', icon: '🐌' },
        { value: 5000, label: '1x', icon: '▶️' },
        { value: 2500, label: '2x', icon: '⏩' },
        { value: 1000, label: '4x', icon: '⚡' },
    ];

    return (
        <div className="floating-controls">
            {isExpanded && (
                <div className="speed-drawer">
                    {speedOptions.map((option) => (
                        <button
                            key={option.value}
                            className={`speed-option ${playbackSpeed === option.value ? 'active' : ''}`}
                            onClick={() => handleSpeedChange(option.value)}
                        >
                            <span className="speed-icon">{option.icon}</span>
                            <span className="speed-label">{option.label}</span>
                        </button>
                    ))}
                </div>
            )}

            <button
                className="fab-speed"
                onClick={toggleExpanded}
                aria-label="Speed options"
            >
                {speedOptions.find(s => s.value === playbackSpeed)?.icon || '▶️'}
            </button>

            <button
                className={`fab-play ${isPlaying ? 'playing' : 'paused'}`}
                onClick={handlePlayPause}
                aria-label={isPlaying ? 'Pause' : 'Play'}
            >
                {isPlaying ? '⏸' : '▶'}
            </button>
        </div>
    );
};

export default FloatingControls;
