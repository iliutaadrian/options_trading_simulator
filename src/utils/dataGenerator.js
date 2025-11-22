// Stock-specific parameters - EXTREME CASE scenarios for testing (2019-2025)
const STOCK_PARAMS = {
  // SCENARIO 1: MAX_CRASH - 80% drawdown with multiple fakeouts and bull traps
  // Tests: protective puts, bear spreads, not catching falling knives, hedging timing
  mock_1: {
    startPrice: 200,
    endPrice: 500,         // 80% total decline
    volatility: 0.055,     // High daily volatility
    drift: -0.002,         // Strong negative drift
    baseIV: 0.70,          // Very high base IV (fear)
    volume: { min: 50000000, max: 150000000 },  // High volume (panic selling)
    events: [
      // Initial crash
      { date: '2019-08-15', drop: 0.18, ivSpike: 0.90 },
      // Fake recovery (bull trap)
      { date: '2019-10-10', jump: 0.08, ivSpike: 0.75 },
      // COVID mega-crash
      { date: '2020-03-12', drop: 0.30, ivSpike: 1.20 },
      // Small dead-cat bounce
      { date: '2020-05-20', jump: 0.06, ivSpike: 0.85 },
      // Another leg down
      { date: '2020-09-15', drop: 0.22, ivSpike: 0.95 },
      // Fake recovery #2
      { date: '2021-03-10', jump: 0.10, ivSpike: 0.80 },
      // Slow grind down continues
      { date: '2021-11-05', drop: 0.15, ivSpike: 0.85 },
      // Tiny relief rally (another trap)
      { date: '2022-04-01', jump: 0.05, ivSpike: 0.75 },
      // Final capitulation
      { date: '2022-10-15', drop: 0.25, ivSpike: 1.10 },
      // Weak bounce
      { date: '2023-02-10', jump: 0.07, ivSpike: 0.70 },
      // More downside
      { date: '2023-08-20', drop: 0.12, ivSpike: 0.80 },
      // Last trap
      { date: '2024-03-15', jump: 0.04, ivSpike: 0.65 },
      // Final collapse
      { date: '2024-09-01', drop: 0.20, ivSpike: 1.00 }
    ]
  },

  // SCENARIO 2: WHIPSAW - Extreme volatility with no clear direction
  // Tests: gamma risk, vega exposure, straddles/strangles, stop-loss discipline
  mock_2: {
    startPrice: 100.00,
    endPrice: 110.00,       // Only +10% over 6 years but wild ride
    volatility: 0.085,      // Extreme daily volatility
    drift: 0.0001,          // Basically sideways
    baseIV: 1.10,           // Insanely high IV (100%+)
    volume: { min: 80000000, max: 200000000 },  // Huge volume swings
    events: [
      { date: '2019-03-15', jump: 0.15, ivSpike: 1.30 },
      { date: '2019-06-20', drop: 0.18, ivSpike: 1.35 },
      { date: '2019-09-10', jump: 0.20, ivSpike: 1.28 },
      { date: '2019-12-05', drop: 0.12, ivSpike: 1.25 },
      { date: '2020-02-25', drop: 0.25, ivSpike: 1.50 },
      { date: '2020-05-15', jump: 0.22, ivSpike: 1.45 },
      { date: '2020-08-10', drop: 0.15, ivSpike: 1.40 },
      { date: '2020-11-20', jump: 0.18, ivSpike: 1.35 },
      { date: '2021-02-10', drop: 0.20, ivSpike: 1.42 },
      { date: '2021-05-25', jump: 0.16, ivSpike: 1.38 },
      { date: '2021-08-15', drop: 0.14, ivSpike: 1.33 },
      { date: '2021-11-05', jump: 0.19, ivSpike: 1.40 },
      { date: '2022-01-20', drop: 0.22, ivSpike: 1.48 },
      { date: '2022-04-15', jump: 0.17, ivSpike: 1.36 },
      { date: '2022-07-10', drop: 0.16, ivSpike: 1.39 },
      { date: '2022-10-25', jump: 0.21, ivSpike: 1.44 },
      { date: '2023-01-15', drop: 0.13, ivSpike: 1.32 },
      { date: '2023-04-20', jump: 0.15, ivSpike: 1.35 },
      { date: '2023-07-10', drop: 0.19, ivSpike: 1.41 },
      { date: '2023-10-05', jump: 0.18, ivSpike: 1.37 },
      { date: '2024-01-25', drop: 0.14, ivSpike: 1.34 },
      { date: '2024-05-10', jump: 0.16, ivSpike: 1.38 },
      { date: '2024-08-15', drop: 0.17, ivSpike: 1.40 },
      { date: '2024-11-01', jump: 0.12, ivSpike: 1.30 }
    ]
  },

  // SCENARIO 3: MOONSHOT - Relentless bull market (500% gain)
  // Tests: taking profits too early, FOMO, opportunity cost of hedging, when NOT to buy puts
  mock_3: {
    startPrice: 50.00,
    endPrice: 300.00,       // 500% gain - "it only goes up"
    volatility: 0.022,      // Low volatility (steady climb)
    drift: 0.0025,          // Strong positive drift
    baseIV: 0.25,           // Low IV (complacency, no fear)
    volume: { min: 20000000, max: 60000000 },
    events: [
      // Mostly jumps with very few/shallow drops
      { date: '2019-04-10', jump: 0.12, ivSpike: 0.30 },
      { date: '2019-08-20', jump: 0.10, ivSpike: 0.28 },
      { date: '2020-01-15', jump: 0.15, ivSpike: 0.32 },
      // Tiny dip (immediately bought)
      { date: '2020-03-15', drop: 0.05, ivSpike: 0.35 },
      { date: '2020-06-10', jump: 0.18, ivSpike: 0.30 },
      { date: '2020-09-25', jump: 0.14, ivSpike: 0.28 },
      { date: '2021-01-20', jump: 0.20, ivSpike: 0.32 },
      // Another tiny dip
      { date: '2021-05-10', drop: 0.03, ivSpike: 0.30 },
      { date: '2021-08-15', jump: 0.16, ivSpike: 0.28 },
      { date: '2021-11-10', jump: 0.22, ivSpike: 0.35 },
      { date: '2022-02-20', jump: 0.15, ivSpike: 0.30 },
      { date: '2022-06-15', jump: 0.18, ivSpike: 0.32 },
      // Small pullback (bought aggressively)
      { date: '2022-09-10', drop: 0.04, ivSpike: 0.33 },
      { date: '2022-12-05', jump: 0.17, ivSpike: 0.29 },
      { date: '2023-03-20', jump: 0.25, ivSpike: 0.35 },
      { date: '2023-07-10', jump: 0.19, ivSpike: 0.32 },
      { date: '2023-10-25', jump: 0.21, ivSpike: 0.33 },
      { date: '2024-02-15', jump: 0.16, ivSpike: 0.30 },
      { date: '2024-06-10', jump: 0.23, ivSpike: 0.34 },
      { date: '2024-09-20', jump: 0.20, ivSpike: 0.32 }
    ]
  }
};

// Load VIX data for market volatility context
let vixData = null;

// Attempt to load VIX data asynchronously when the module is first loaded
async function loadVIXData() {
  try {
    // Dynamically import VIX data - fallback to null if not available
    const response = await fetch(new URL('../data/^vix_historical.json', import.meta.url));
    if (response.ok) {
      vixData = await response.json();
    }
  } catch (error) {
    console.warn('Could not load VIX data:', error);
    vixData = null;
  }
}

// Initialize VIX data loading
loadVIXData();

// Get VIX value for a specific date
function getVIXValue(dateStr) {
  if (!vixData || vixData.length === 0) {
    return null; // Return null if VIX data is not available
  }

  // Find the VIX value for the exact date
  const vixEntry = vixData.find(v => v.date === dateStr);
  if (vixEntry && vixEntry.close) {
    return vixEntry.close / 100; // Convert from percentage to decimal (e.g., 25.5 -> 0.255)
  }

  return null;
}

// Calculate Garman-Klass volatility (superior for real market data)
function calculateGarmanKlassVol(priceData, startIndex, window = 20) {
  if (startIndex < window) return null;

  let hlTerm = 0;
  let coTerm = 0;

  for (let i = startIndex - window; i < startIndex; i++) {
    const p = priceData[i];
    if (p.high > 0 && p.low > 0 && p.close > 0 && p.open > 0 && p.high > p.low) {
      hlTerm += Math.pow(Math.log(p.high / p.low), 2);
      coTerm += Math.pow(Math.log(p.close / p.open), 2);
    }
  }

  hlTerm /= window;
  coTerm /= window;

  const gkVol = Math.sqrt(Math.max(0, 0.5 * hlTerm - (2 * Math.log(2) - 1) * coTerm));
  return gkVol * Math.sqrt(252); // Annualize
}

// Detect if date is in crisis period (COVID crash: Feb-March 2020)
function isCrisisPeriod(dateStr) {
  if( dateStr >= '2020-02-20' && dateStr <= '2020-03-31') {
    return true;
  }

}

// Calculate dynamic IV based on recent price volatility, market events, and VIX
function calculateDynamicIV(data, index, params) {
  const baseIV = params.baseIV || 0.30;
  const lookback = 20; // 20-day lookback for realized volatility

  // Get VIX value for current date to inform stock IV
  const currentVIX = getVIXValue(data[index].date);

  // For real historical data with IV already set, enhance it
  if (data[index].iv && data[index].iv > 0) {
    // Use existing IV but enhance with realized vol and VIX components
    const gkVol = calculateGarmanKlassVol(data, index, 20);
    let iv = data[index].iv;

    if (gkVol) {
      // Blend existing IV with calculated volatility
      iv = iv * 0.6 + gkVol * 0.4;
    }

    // Adjust based on VIX if available
    if (currentVIX) {
      // Calculate ratio of current VIX to typical VIX levels (historical average ~20%)
      const vixRatio = currentVIX / 0.20;
      // Apply VIX adjustment but with limited impact (30% max influence)
      const vixAdjustment = (vixRatio - 1.0) * 0.50;
      iv *= (1 + vixAdjustment);
    }

    // Add crisis spike if in COVID period
    if (isCrisisPeriod(data[index].date)) {
      // Enhance IV during crisis
      iv = Math.min(0.75, iv * 1.3);
    }

    return Math.max(0.25, Math.min(0.75, iv));
  }

  // For synthetic/mock data, calculate from scratch
  // Calculate realized volatility from recent price changes
  let realizedVol = 0;
  if (index >= lookback) {
    const returns = [];
    for (let i = index - lookback; i < index; i++) {
      const ret = Math.log(data[i + 1].close / data[i].close);
      returns.push(ret);
    }
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    realizedVol = Math.sqrt(variance * 252); // Annualize
  } else {
    realizedVol = baseIV;
  }

  // Start with base IV influenced by realized volatility
  let iv = baseIV * 0.6 + realizedVol * 0.4;

  // Adjust based on VIX if available
  if (currentVIX) {
    // Calculate ratio of current VIX to typical VIX levels (historical average ~20%)
    const vixRatio = currentVIX / 0.20;
    // Apply VIX adjustment but with limited impact (20% max influence for synthetic data)
    const vixAdjustment = (vixRatio - 1.0) * 0.20;
    iv *= (1 + vixAdjustment);
  }

  // Check for nearby events (within 30 days)
  const currentDate = new Date(data[index].date);
  params.events?.forEach(event => {
    const eventDate = new Date(event.date);
    const daysDiff = Math.abs((currentDate - eventDate) / (1000 * 60 * 60 * 24));

    if (daysDiff < 30) {
      // IV spikes before event and decays after
      const decayFactor = Math.exp(-daysDiff / 10); // Exponential decay
      const ivIncrease = (event.ivSpike - baseIV) * decayFactor;
      iv += ivIncrease;
    }
  });

  // Add some random day-to-day variation (±10%)
  iv *= (0.95 + Math.random() * 0.10);

  // Clamp IV to reasonable range (25% to 100%) - minimum 25% for good premiums
  iv = Math.max(0.25, Math.min(1.00, iv));

  return iv;
}

// Calculate IV rank for a given stock's historical data
// IV Rank = (Current IV - 52W Low IV) / (52W High IV - 52W Low IV)
// This tells you where current IV stands relative to the past year
export function calculateIVRank(historicalData, currentIndex, lookbackPeriod = 252) { // 252 trading days = ~1 year
  if (!historicalData || historicalData.length === 0) {
    return null;
  }

  // Calculate the starting index for the lookback period
  const startLookbackIndex = Math.max(0, currentIndex - lookbackPeriod);
  const ivValues = [];

  // Collect IV values for the lookback period
  for (let i = startLookbackIndex; i <= currentIndex; i++) {
    if (historicalData[i] && historicalData[i].iv !== undefined) {
      ivValues.push(historicalData[i].iv);
    }
  }

  if (ivValues.length === 0) {
    return null;
  }

  // Calculate min and max IV over the period
  const minIV = Math.min(...ivValues);
  const maxIV = Math.max(...ivValues);
  const currentIV = historicalData[currentIndex].iv;

  // Calculate IV Rank: (Current IV - Min IV) / (Max IV - Min IV)
  if (maxIV === minIV) {
    return 0.50; // If min and max are the same, return 50%
  }

  const ivRank = (currentIV - minIV) / (maxIV - minIV);
  return parseFloat(ivRank.toFixed(2));
}

// Historical data cache
const historicalDataCache = {};

// Load historical data from JSON files (for real symbols: GOOGL, META, AMZN)
async function loadHistoricalData(symbol) {
  if (historicalDataCache[symbol]) {
    return historicalDataCache[symbol];
  }

  try {
    // Use dynamic import to load data from public folder
    const response = await fetch(new URL(`../data/${symbol.toLowerCase()}_historical.json`, import.meta.url));
    if (response.ok) {
      let data = await response.json();

      // Apply calculateDynamicIV to all data points for consistency
      // This ensures IV is calculated using the unified method
      const params = { baseIV: 0.40, events: [] };
      for (let i = 0; i < data.length; i++) {
        data[i].iv = calculateDynamicIV(data, i, params);
      }

      historicalDataCache[symbol] = data;
      return data;
    }
  } catch (error) {
    console.warn(`Could not load historical data for ${symbol}:`, error);
  }

  return null;
}

// Generate realistic historical stock price data with actual price movements (for mock symbols)
export function generateHistoricalData(symbol, startDate, endDate, basePrice = null) {
  const params = STOCK_PARAMS[symbol] || {
    startPrice: basePrice || 100,
    endPrice: basePrice ? basePrice * 2 : 200,
    volatility: 0.022,
    drift: 0.0008,
    volume: { min: 1000000, max: 5000000 },
    events: []
  };

  const data = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.floor((end - start) / (1000 * 60 * 60 * 24));

  // Calculate the overall price trajectory
  let currentPrice = params.startPrice;
  const totalReturn = (params.endPrice - params.startPrice) / params.startPrice;
  const dailyTrend = Math.pow(1 + totalReturn, 1 / days) - 1;

  // Create event map for easy lookup
  const eventMap = new Map();
  params.events?.forEach(event => {
    eventMap.set(event.date, event);
  });

  for (let i = 0; i <= days; i++) {
    const currentDate = new Date(start);
    currentDate.setDate(start.getDate() + i);

    // Skip weekends
    if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
      continue;
    }

    const dateStr = currentDate.toISOString().split('T')[0];

    // Check for special events
    let eventImpact = 0;
    if (eventMap.has(dateStr)) {
      const event = eventMap.get(dateStr);
      eventImpact = event.jump ? event.jump : -event.drop;
    }

    // Generate returns with realistic volatility and trend
    const randomComponent = params.volatility * (Math.random() * 2 - 1);
    const trendComponent = dailyTrend;
    const totalReturn = trendComponent + randomComponent + eventImpact;

    currentPrice = currentPrice * (1 + totalReturn);

    // Generate OHLC data with realistic intraday movement
    const dayVolatility = currentPrice * (params.volatility * 0.7);
    const open = currentPrice + (Math.random() - 0.5) * dayVolatility;
    const close = currentPrice + (Math.random() - 0.5) * dayVolatility;
    const high = Math.max(open, close) + Math.random() * dayVolatility * 0.5;
    const low = Math.min(open, close) - Math.random() * dayVolatility * 0.5;

    // Volume with more variation on event days
    const volumeMultiplier = eventImpact !== 0 ? 1.5 + Math.random() : 1;
    const volume = Math.floor(
      (params.volume.min + Math.random() * (params.volume.max - params.volume.min)) * volumeMultiplier
    );

    data.push({
      date: dateStr,
      timestamp: currentDate.getTime(),
      open: parseFloat(Math.max(0.01, open).toFixed(2)),
      high: parseFloat(Math.max(0.01, high).toFixed(2)),
      low: parseFloat(Math.max(0.01, low).toFixed(2)),
      close: parseFloat(Math.max(0.01, close).toFixed(2)),
      volume: volume,
      iv: 0 // Will be calculated in second pass
    });
  }

  // Second pass: Calculate dynamic IV for each day
  for (let i = 0; i < data.length; i++) {
    data[i].iv = calculateDynamicIV(data, i, params);
  }

  return data;
}

// Get historical data (returns cached data or null if not yet loaded)
export function getHistoricalData(symbol) {
  // For real symbols, try to return cached data
  if (historicalDataCache[symbol]) {
    return historicalDataCache[symbol];
  }

  // For mock symbols, generate synthetic data
  if (symbol.startsWith('mock_')) {
    return generateHistoricalData(symbol, '2019-01-01', '2025-11-14');
  }

  return null;
}

// Promise to track when all data is loaded
let dataLoadingPromise = Promise.resolve();

// Initialize historical data loading on module import (pre-loads data)
export function initializeHistoricalData(symbols) {
  // Chain all loading promises so they complete in order
  dataLoadingPromise = Promise.all(
    symbols.map(symbol => {
      if (!symbol.startsWith('mock_')) {
        return loadHistoricalData(symbol).then(() => {
          console.log(`Historical data loaded for ${symbol}`);
        }).catch(err => {
          console.error(`Failed to load historical data for ${symbol}:`, err);
        });
      }
      return Promise.resolve();
    })
  );

  return dataLoadingPromise;
}

// Wait for all data to load
export function waitForDataLoad() {
  return dataLoadingPromise;
}

// Generate realistic strike prices around current price
export function generateStrikePrices(currentPrice, count = 50) {
  const strikes = [];
  const baseStrike = Math.round(currentPrice / 10) * 10; // Round to nearest $10

  // Determine step size based on exchange standards
  let step = 1; // Default for $25-$200 range

  if (currentPrice < 25) {
    step = 0.50; // $0.50 increments for stocks under $25
  } else if (currentPrice >= 25 && currentPrice < 100) {
    step = 1.00; // $1.00 increments for stocks $25-$200
  } else if (currentPrice >= 100 && currentPrice < 200) {
    step =2.5; 
  } else if (currentPrice >= 200 && currentPrice < 500) {
    step = 5; 
  } else if (currentPrice >= 500) {
    step = 10.00;
  }

  for (let i = -count / 2; i <= count / 2; i++) {
    strikes.push(baseStrike + (i * step));
  }

  return strikes.sort((a, b) => a - b);
}

// Generate expiration dates - focused on 30 days (monthly options)
export function generateExpirationDates(currentDate, count = 25) {
  const expirations = [];
  const current = new Date(currentDate);

  const targetDays = [7, 14, 30, 45, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360, 390, 420, 450, 480, 510, 540, 570, 600];

  targetDays.slice(0, count).forEach(days => {
    const expDate = new Date(current);
    expDate.setDate(current.getDate() + days);

    // Adjust to nearest Friday (options typically expire on Fridays)
    const dayOfWeek = expDate.getDay();
    const daysToFriday = dayOfWeek <= 5 ? (5 - dayOfWeek) : (12 - dayOfWeek);
    expDate.setDate(expDate.getDate() + daysToFriday);

    const daysToExpiry = Math.floor((expDate - current) / (1000 * 60 * 60 * 24));

    expirations.push({
      date: expDate.toISOString().split('T')[0],
      label: expDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      daysToExpiry: daysToExpiry,
      isDefault: days === 30 // Mark 30-day as default
    });
  });

  // Sort by days to expiry
  expirations.sort((a, b) => a.daysToExpiry - b.daysToExpiry);

  return expirations;
}
