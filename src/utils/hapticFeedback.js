/**
 * Haptic Feedback Utility for Mobile Devices
 * Uses the Vibration API with fallback for unsupported devices
 */

export const hapticPatterns = {
    light: [10],
    medium: [20],
    heavy: [30],
    success: [10, 50, 10],
    error: [20, 100, 20, 100, 20],
    notification: [10, 20, 10],
    selection: [5],
    impact: [15],
};

/**
 * Trigger haptic feedback
 * @param {string} pattern - Pattern name from hapticPatterns or custom array
 */
export const triggerHaptic = (pattern = 'light') => {
    if (!('vibrate' in navigator)) {
        // Fallback for devices that don't support vibration
        return false;
    }

    try {
        const vibrationPattern = typeof pattern === 'string'
            ? hapticPatterns[pattern] || hapticPatterns.light
            : pattern;

        navigator.vibrate(vibrationPattern);
        return true;
    } catch (error) {
        console.warn('Haptic feedback failed:', error);
        return false;
    }
};

/**
 * Check if haptic feedback is supported
 */
export const isHapticSupported = () => {
    return 'vibrate' in navigator;
};

/**
 * Trade-specific haptic feedback
 */
export const tradeHaptics = {
    buy: () => triggerHaptic('medium'),
    sell: () => triggerHaptic('medium'),
    profit: () => triggerHaptic('success'),
    loss: () => triggerHaptic('error'),
    swipe: () => triggerHaptic('light'),
    tap: () => triggerHaptic('selection'),
    achievement: () => triggerHaptic([10, 50, 10, 50, 30]),
};
