// Stock-specific parameters based on realistic historical patterns (2019-2025)
const STOCK_PARAMS = {
  mock_1: {
    startPrice: 120,      
    endPrice: 300,       
    volatility: 0.03,      
    drift: 0.0012,
    baseIV: 0.40,           
    volume: { min: 40000000, max: 120000000 },
    events: [
      { date: '2020-03-15', drop: 0.25, ivSpike: 0.80 },    
      { date: '2020-08-31', jump: 0.12, ivSpike: 0.50 },    
      { date: '2022-01-03', drop: 0.20, ivSpike: 0.60 },    
      { date: '2023-07-01', jump: 0.15, ivSpike: 0.45 }     
    ]
  },
  mock_2: {
    startPrice: 165.00,     
    endPrice: 750.00,       
    volatility: 0.035,      
    drift: 0.0008,
    baseIV: 0.42,           
    volume: { min: 15000000, max: 45000000 },
    events: [
      { date: '2020-03-15', drop: 0.30, ivSpike: 0.85 },    
      { date: '2021-09-01', jump: 0.18, ivSpike: 0.50 },    
      { date: '2022-02-03', drop: 0.26, ivSpike: 0.70 },    
      { date: '2023-02-01', jump: 0.23, ivSpike: 0.55 },    
      { date: '2024-04-01', jump: 0.12, ivSpike: 0.48 }     
    ]
  },
  mock_3: {
    startPrice: 100.00,      
    endPrice: 200.00,       
    volatility: 0.04,      
    drift: 0.0007,
    baseIV: 0.80,           
    volume: { min: 20000000, max: 60000000 },
    events: [
      { date: '2020-03-15', drop: 0.28, ivSpike: 0.75 },    
      { date: '2021-02-01', jump: 0.15, ivSpike: 0.40 },    
      { date: '2022-04-26', drop: 0.18, ivSpike: 0.52 },    
      { date: '2023-02-08', jump: 0.10, ivSpike: 0.38 },    
      { date: '2024-01-01', jump: 0.12, ivSpike: 0.35 }     
    ]
  }
};

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
  return dateStr >= '2020-02-20' && dateStr <= '2020-03-31';
}

// Calculate dynamic IV based on recent price volatility and market events
function calculateDynamicIV(data, index, params) {
  const baseIV = params.baseIV || 0.30;
  const lookback = 20; // 20-day lookback for realized volatility

  // For real historical data with IV already set, enhance it
  if (data[index].iv && data[index].iv > 0) {
    // Use existing IV but enhance with realized vol component
    const gkVol = calculateGarmanKlassVol(data, index, 20);
    if (gkVol) {
      // Blend existing IV with calculated volatility
      let iv = data[index].iv * 0.7 + gkVol * 0.3;

      // Add crisis spike if in COVID period
      if (isCrisisPeriod(data[index].date)) {
        // Enhance IV during crisis
        iv = Math.min(0.75, iv * 1.3);
      }

      return Math.max(0.25, Math.min(0.75, iv));
    }
    return data[index].iv;
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
      const params = { baseIV: 0.30, events: [] };
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
export function generateStrikePrices(currentPrice, count = 10) {
  const strikes = [];
  const baseStrike = Math.round(currentPrice / 5) * 5; // Round to nearest $5
  const step = 1;

  for (let i = -count/2; i <= count/2; i++) {
    strikes.push(baseStrike + (i * step));
  }

  return strikes.sort((a, b) => a - b);
}

// Generate expiration dates - focused on 30 days (monthly options)
export function generateExpirationDates(currentDate, count = 6) {
  const expirations = [];
  const current = new Date(currentDate);

  // Target dates in days from now: 7, 14, 30, 45, 60, 90
  const targetDays = [7, 14, 30, 45, 60, 90];

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
