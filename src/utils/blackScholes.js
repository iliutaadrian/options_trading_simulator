// Standard normal cumulative distribution function
function normalCDF(x) {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - prob : prob;
}

// Standard normal probability density function
function normalPDF(x) {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

// Black-Scholes option pricing model
export function calculateBlackScholes(
  spotPrice,
  strikePrice,
  timeToExpiry, // in years
  riskFreeRate, // annual rate (e.g., 0.05 for 5%)
  volatility, // annual volatility (e.g., 0.25 for 25%)
  optionType // 'call' or 'put'
) {
  if (timeToExpiry <= 0) {
    // Option has expired, calculate intrinsic value
    if (optionType === 'call') {
      return Math.max(0, spotPrice - strikePrice);
    } else {
      return Math.max(0, strikePrice - spotPrice);
    }
  }

  const d1 = (Math.log(spotPrice / strikePrice) + (riskFreeRate + 0.5 * volatility * volatility) * timeToExpiry) /
    (volatility * Math.sqrt(timeToExpiry));
  const d2 = d1 - volatility * Math.sqrt(timeToExpiry);

  let price;
  if (optionType === 'call') {
    price = spotPrice * normalCDF(d1) - strikePrice * Math.exp(-riskFreeRate * timeToExpiry) * normalCDF(d2);
  } else {
    price = strikePrice * Math.exp(-riskFreeRate * timeToExpiry) * normalCDF(-d2) - spotPrice * normalCDF(-d1);
  }

  return parseFloat(price.toFixed(2));
}

// Calculate Greeks
export function calculateGreeks(
  spotPrice,
  strikePrice,
  timeToExpiry, // in years
  riskFreeRate,
  volatility,
  optionType
) {
  if (timeToExpiry <= 0) {
    return {
      delta: optionType === 'call' ? (spotPrice > strikePrice ? 1 : 0) : (spotPrice < strikePrice ? -1 : 0),
      gamma: 0,
      theta: 0,
      vega: 0,
      rho: 0
    };
  }

  const sqrtT = Math.sqrt(timeToExpiry);
  const d1 = (Math.log(spotPrice / strikePrice) + (riskFreeRate + 0.5 * volatility * volatility) * timeToExpiry) /
    (volatility * sqrtT);
  const d2 = d1 - volatility * sqrtT;

  // Delta: rate of change of option price with respect to underlying price
  let delta;
  if (optionType === 'call') {
    delta = normalCDF(d1);
  } else {
    delta = normalCDF(d1) - 1;
  }

  // Gamma: rate of change of delta with respect to underlying price
  const gamma = normalPDF(d1) / (spotPrice * volatility * sqrtT);

  // Theta: rate of change of option price with respect to time (per day)
  const term1 = -(spotPrice * normalPDF(d1) * volatility) / (2 * sqrtT);
  let theta;
  if (optionType === 'call') {
    const term2 = riskFreeRate * strikePrice * Math.exp(-riskFreeRate * timeToExpiry) * normalCDF(d2);
    theta = (term1 - term2) / 365; // Convert to per day
  } else {
    const term2 = riskFreeRate * strikePrice * Math.exp(-riskFreeRate * timeToExpiry) * normalCDF(-d2);
    theta = (term1 + term2) / 365; // Convert to per day
  }

  // Vega: rate of change of option price with respect to volatility (per 1% change)
  const vega = (spotPrice * normalPDF(d1) * sqrtT) / 100; // Per 1% change in volatility

  // Rho: rate of change of option price with respect to interest rate (per 1% change)
  let rho;
  if (optionType === 'call') {
    rho = (strikePrice * timeToExpiry * Math.exp(-riskFreeRate * timeToExpiry) * normalCDF(d2)) / 100;
  } else {
    rho = -(strikePrice * timeToExpiry * Math.exp(-riskFreeRate * timeToExpiry) * normalCDF(-d2)) / 100;
  }

  return {
    delta: parseFloat(delta.toFixed(4)),
    gamma: parseFloat(gamma.toFixed(4)),
    theta: parseFloat(theta.toFixed(4)),
    vega: parseFloat(vega.toFixed(4)),
    rho: parseFloat(rho.toFixed(4))
  };
}

// Calculate option price and all Greeks in one go
export function calculateOptionMetrics(
  spotPrice,
  strikePrice,
  daysToExpiry,
  riskFreeRate = 0.045, // 4.5%
  volatility = 0.25, // 25%
  optionType = 'call'
) {
  const timeToExpiry = daysToExpiry / 365;

  const price = calculateBlackScholes(
    spotPrice,
    strikePrice,
    timeToExpiry,
    riskFreeRate,
    volatility,
    optionType
  );

  const greeks = calculateGreeks(
    spotPrice,
    strikePrice,
    timeToExpiry,
    riskFreeRate,
    volatility,
    optionType
  );

  return {
    price,
    ...greeks,
    impliedVolatility: volatility
  };
}

// Calculate P&L for an option position
export function calculateOptionPnL(position, currentPrice, currentDate) {
  const currentMetrics = calculateOptionMetrics(
    currentPrice,
    position.strike,
    position.daysToExpiry,
    position.riskFreeRate,
    position.volatility,
    position.type
  );

  const currentValue = currentMetrics.price * position.contracts * 100; // Each contract = 100 shares
  const initialValue = position.entryPrice * position.contracts * 100;

  let pnl;
  if (position.action === 'buy') {
    pnl = currentValue - initialValue;
  } else {
    // For short positions, profit when value decreases
    pnl = initialValue - currentValue;
  }

  return {
    currentPrice: currentMetrics.price,
    currentValue: parseFloat(currentValue.toFixed(2)),
    pnl: parseFloat(pnl.toFixed(2)),
    pnlPercent: parseFloat(((pnl / initialValue) * 100).toFixed(2)),
    greeks: currentMetrics
  };
}

// Calculate P&L for a stock position
export function calculateStockPnL(position, currentPrice, currentDate) {
  // For stock positions, use 'contracts' field which represents the number of shares
  // For options positions, contracts represents number of contracts (each with 100 shares)
  // Ensure proper numeric values to avoid NaN
  const positionContracts = (position.contracts && !isNaN(position.contracts)) ? parseFloat(position.contracts) : 1;
  const quantity = position.type === 'stock' ? positionContracts : positionContracts * 100;

  const currentValue = currentPrice * quantity;
  const initialValue = position.entryPrice * quantity;

  let pnl;
  if (position.action === 'buy') {
    pnl = currentValue - initialValue;
  } else {
    // For short stock positions, profit when price decreases
    pnl = initialValue - currentValue;
  }

  // Avoid division by zero for pnlPercent calculation
  const pnlPercent = initialValue !== 0 ? ((pnl / initialValue) * 100) : 0;

  return {
    currentPrice: currentPrice,
    currentValue: parseFloat(currentValue.toFixed(2)),
    pnl: parseFloat(pnl.toFixed(2)),
    pnlPercent: parseFloat(pnlPercent.toFixed(2))
  };
}

// Calculate portfolio Greeks by aggregating Greeks from all positions
export function calculatePortfolioGreeks(positions, currentPrice, currentDate, currentIV) {
  // Initialize total Greeks
  let totalDelta = 0;
  let totalGamma = 0;
  let totalTheta = 0;
  let totalVega = 0;
  let totalRho = 0;

  positions.forEach(position => {
    if (position.type === 'stock') {
      // For stock positions, delta is 1 for long and -1 for short
      // Other Greeks are effectively 0 for stocks
      const contracts = position.contracts || 1;
      const multiplier = position.action === 'buy' ? 1 : -1;

      // Each share of stock has a delta of 1 relative to the underlying
      // So total stock delta = number of shares * multiplier
      totalDelta += contracts * multiplier;
      // Other Greeks are 0 for stocks
    } else {
      // For option positions, calculate Greeks using the option pricing model
      const expiryDate = new Date(position.expiration);
      const currentDateObj = new Date(currentDate);
      const daysToExpiry = Math.max(0, Math.floor((expiryDate - currentDateObj) / (1000 * 60 * 60 * 24)));

      // Calculate Greeks for this option
      const optionGreeks = calculateOptionMetrics(
        currentPrice,
        position.strike,
        daysToExpiry,
        position.riskFreeRate || 0.045,
        position.volatility || currentIV,
        position.type
      );

      // Get the number of options (for stocks it's shares, for options it's contracts * 100)
      const quantity = position.contracts || 1;
      const multiplier = position.action === 'buy' ? 1 : -1;

      totalDelta += optionGreeks.delta * quantity * 100 * multiplier;
      totalGamma += optionGreeks.gamma * quantity * 100 * multiplier;
      totalTheta += optionGreeks.theta * quantity * 100 * multiplier;
      totalVega += optionGreeks.vega * quantity * 100 * multiplier;
      totalRho += optionGreeks.rho * quantity * 100 * multiplier;
    }
  });

  return {
    delta: parseFloat(totalDelta.toFixed(2)),
    gamma: parseFloat(totalGamma.toFixed(4)),
    theta: parseFloat(totalTheta.toFixed(2)),
    vega: parseFloat(totalVega.toFixed(2)),
    rho: parseFloat(totalRho.toFixed(2))
  };
}
