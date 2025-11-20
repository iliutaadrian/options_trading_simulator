import React from 'react';
import { triggerHaptic } from '../utils/hapticFeedback';
import './MobileNav.css';

const MobileNav = ({ activeTab, onTabChange }) => {
    const handleTabClick = (tab) => {
        triggerHaptic('selection');
        onTabChange(tab);
    };

    const tabs = [
        { id: 'chart', label: 'Chart', icon: '📈' },
        { id: 'trade', label: 'Trade', icon: '⚡' },
    ];

    return (
        <nav className="mobile-nav">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    className={`mobile-nav-btn ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => handleTabClick(tab.id)}
                    aria-label={tab.label}
                >
                    <span className="mobile-nav-icon">{tab.icon}</span>
                    <span className="mobile-nav-label">{tab.label}</span>
                </button>
            ))}
        </nav>
    );
};

export default MobileNav;
