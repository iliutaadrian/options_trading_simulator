// Stock-specific parameters based on realistic historical patterns (2019-2025)
const STOCK_PARAMS = {
  AAPL: {
    startPrice: 120.68,      // AAPL price in early 2019 (split-adjusted)
    endPrice: 285.00,       // Approximate 2025 price
    volatility: 0.03,      // Daily price volatility
    drift: 0.0012,
    baseIV: 0.40,           // Base implied volatility (35%) - increased for better premiums
    volume: { min: 40000000, max: 120000000 },
    events: [
      { date: '2020-03-15', drop: 0.25, ivSpike: 0.80 },    // COVID crash - IV spike to 80%
      { date: '2020-08-31', jump: 0.12, ivSpike: 0.50 },    // Stock split announcement
      { date: '2022-01-03', drop: 0.20, ivSpike: 0.60 },    // 2022 tech selloff
      { date: '2023-07-01', jump: 0.15, ivSpike: 0.45 }     // AI rally
    ]
  },
  META: {
    startPrice: 165.00,     // META (FB) price in early 2019
    endPrice: 750.00,       // Approximate 2025 price
    volatility: 0.035,      // Daily price volatility
    drift: 0.0008,
    baseIV: 0.42,           // Base implied volatility (42%) - increased for better premiums
    volume: { min: 15000000, max: 45000000 },
    events: [
      { date: '2020-03-15', drop: 0.30, ivSpike: 0.85 },    // COVID crash
      { date: '2021-09-01', jump: 0.18, ivSpike: 0.50 },    // Post-pandemic high
      { date: '2022-02-03', drop: 0.26, ivSpike: 0.70 },    // Metaverse concerns
      { date: '2023-02-01', jump: 0.23, ivSpike: 0.55 },    // Cost cutting + AI
      { date: '2024-04-01', jump: 0.12, ivSpike: 0.48 }     // Strong earnings
    ]
  },
  PLTR: {
    startPrice: 100.00,      // GOOGL price in early 2019 (split-adjusted)
    endPrice: 200.00,       // Approximate 2025 price
    volatility: 0.04,      // Daily price volatility
    drift: 0.0007,
    baseIV: 0.80,           // Base implied volatility (32%) - increased for better premiums
    volume: { min: 20000000, max: 60000000 },
    events: [
      { date: '2020-03-15', drop: 0.28, ivSpike: 0.75 },    // COVID crash
      { date: '2021-02-01', jump: 0.15, ivSpike: 0.40 },    // Ad revenue surge
      { date: '2022-04-26', drop: 0.18, ivSpike: 0.52 },    // Growth concerns
      { date: '2023-02-08', jump: 0.10, ivSpike: 0.38 },    // Bard/AI announcements
      { date: '2024-01-01', jump: 0.12, ivSpike: 0.35 }     // Cloud growth
    ]
  }
};

// Calculate dynamic IV based on recent price volatility and market events
function calculateDynamicIV(data, index, params) {
  const baseIV = params.baseIV || 0.30;
  const lookback = 20; // 20-day lookback for realized volatility

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

// Generate realistic historical stock price data with actual price movements
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
