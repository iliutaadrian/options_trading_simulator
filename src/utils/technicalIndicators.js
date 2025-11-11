// Calculate Simple Moving Average
export function calculateSMA(data, period) {
  const result = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push({ date: data[i].date, value: null });
      continue;
    }

    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }

    result.push({
      date: data[i].date,
      value: parseFloat((sum / period).toFixed(2))
    });
  }

  return result;
}

// Calculate Bollinger Bands
export function calculateBollingerBands(data, period = 20, stdDev = 2) {
  const result = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push({
        date: data[i].date,
        middle: null,
        upper: null,
        lower: null
      });
      continue;
    }

    // Calculate SMA (middle band)
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    const sma = sum / period;

    // Calculate standard deviation
    let squaredDiffSum = 0;
    for (let j = 0; j < period; j++) {
      const diff = data[i - j].close - sma;
      squaredDiffSum += diff * diff;
    }
    const standardDeviation = Math.sqrt(squaredDiffSum / period);

    result.push({
      date: data[i].date,
      middle: parseFloat(sma.toFixed(2)),
      upper: parseFloat((sma + (stdDev * standardDeviation)).toFixed(2)),
      lower: parseFloat((sma - (stdDev * standardDeviation)).toFixed(2))
    });
  }

  return result;
}

// Calculate RSI (Relative Strength Index)
export function calculateRSI(data, period = 14) {
  const result = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period) {
      result.push({ date: data[i].date, value: null });
      continue;
    }

    let gains = 0;
    let losses = 0;

    for (let j = 1; j <= period; j++) {
      const change = data[i - j + 1].close - data[i - j].close;
      if (change > 0) {
        gains += change;
      } else {
        losses += Math.abs(change);
      }
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) {
      result.push({ date: data[i].date, value: 100 });
      continue;
    }

    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    result.push({
      date: data[i].date,
      value: parseFloat(rsi.toFixed(2))
    });
  }

  return result;
}

// Combine all indicators with price data
export function addIndicatorsToData(priceData) {
  const sma200 = calculateSMA(priceData, 200);
  const bollingerBands = calculateBollingerBands(priceData, 20, 2);
  const rsi = calculateRSI(priceData, 14);

  return priceData.map((candle, index) => ({
    ...candle,
    sma200: sma200[index]?.value,
    bb_upper: bollingerBands[index]?.upper,
    bb_middle: bollingerBands[index]?.middle,
    bb_lower: bollingerBands[index]?.lower,
    rsi: rsi[index]?.value
  }));
}
