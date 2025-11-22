import React from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  Layer
} from 'recharts';

// Custom candlestick component
const Candlestick = (props) => {
  const { x, y, width, height, payload, xAxis, yAxis } = props;

  if (!payload || payload.open === undefined || payload.close === undefined || payload.high === undefined || payload.low === undefined) {
    return null;
  }

  const { open, close, high, low } = payload;
  const isGreen = close > open;
  const color = isGreen ? '#00ff88' : '#ff4444';

  // Determine scale from yAxis
  const yMax = yAxis?.domain?.[1] || height;
  const yMin = yAxis?.domain?.[0] || 0;
  const yRange = yMax - yMin || 1;

  // Calculate Y positions using yAxis scale
  const getY = (price) => {
    if (yAxis && yAxis.scale) {
      return yAxis.scale(price);
    }
    // Fallback calculation
    return y + height - ((price - yMin) / yRange) * height;
  };

  const highY = getY(high);
  const lowY = getY(low);
  const openY = getY(open);
  const closeY = getY(close);

  const centerX = x + width / 2;
  const bodyWidth = Math.max(width * 0.6, 2);

  return (
    <g>
      {/* Wick (High-Low line) */}
      <line
        x1={centerX}
        y1={highY}
        x2={centerX}
        y2={lowY}
        stroke={color}
        strokeWidth={1}
      />
      {/* Body (Open-Close) */}
      <rect
        x={centerX - bodyWidth / 2}
        y={Math.min(openY, closeY)}
        width={bodyWidth}
        height={Math.abs(closeY - openY) || 1}
        fill={color}
        stroke={color}
        strokeWidth={0.5}
      />
    </g>
  );
};

// Custom OHLC bar chart component
const BarShape = (props) => {
  const { x, y, width, height, payload, xAxis, yAxis } = props;

  if (!payload || payload.open === undefined || payload.close === undefined || payload.high === undefined || payload.low === undefined) {
    return null;
  }

  const { open, close, high, low } = payload;
  const isGreen = close > open;
  const color = isGreen ? '#00ff88' : '#ff4444';

  // Determine scale from yAxis
  const yMax = yAxis?.domain?.[1] || height;
  const yMin = yAxis?.domain?.[0] || 0;
  const yRange = yMax - yMin || 1;

  const getY = (price) => {
    if (yAxis && yAxis.scale) {
      return yAxis.scale(price);
    }
    // Fallback calculation
    return y + height - ((price - yMin) / yRange) * height;
  };

  const highY = getY(high);
  const lowY = getY(low);
  const openY = getY(open);
  const closeY = getY(close);

  const centerX = x + width / 2;
  const tickWidth = Math.max(width * 0.3, 3);

  return (
    <g>
      {/* Vertical line (High to Low) */}
      <line
        x1={centerX}
        y1={highY}
        x2={centerX}
        y2={lowY}
        stroke={color}
        strokeWidth={0.5}
      />

      {/* Left tick (Open) */}
      <line
        x1={centerX - tickWidth}
        y1={openY}
        x2={centerX}
        y2={openY}
        stroke={color}
        strokeWidth={1}
      />

      {/* Right tick (Close) */}
      <line
        x1={centerX}
        y1={closeY}
        x2={centerX + tickWidth}
        y2={closeY}
        stroke={color}
        strokeWidth={1}
      />
    </g>
  );
};

const CustomTooltip = ({ active, payload, indicator }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="custom-tooltip">
        <p className="label">{data.date}</p>
        {indicator === 'IVR' ? (
          <>
            <p>Value: {data.close}%</p>
            <p>High: {data.high}%</p>
            <p>Low: {data.low}%</p>
            <p>Open: {data.open}%</p>
            <p>Close: {data.close}%</p>
          </>
        ) : (
          <>
            <p>Open: ${data.open}</p>
            <p>High: ${data.high}</p>
            <p>Low: ${data.low}</p>
            <p>Close: ${data.close}</p>
            <p>Volume: {(data.volume / 1000000).toFixed(2)}M</p>
          </>
        )}
        {data.rsi && <p>RSI: {data.rsi.toFixed(2)}</p>}
      </div>
    );
  }
  return null;
};

const PriceChart = ({ data, currentIndex, vixData, indicator }) => {
  const [timeframe, setTimeframe] = React.useState('1M');
  const [chartType, setChartType] = React.useState('bars');

  const visibleData = data.slice(0, currentIndex + 1);
  // Calculate days to show based on timeframe
  const daysToShow = {
    '1M': 30,
    '3M': 90,
    '6M': 180,
    '1Y': 365,
  };

  const displayData = visibleData.slice(-daysToShow[timeframe])

  // Merge VIX data with display data
  const dataWithVIX = React.useMemo(() => {
    if (!vixData) return displayData;
    return displayData.map(item => {
      const vixEntry = vixData.find(v => v.date === item.date);
      return {
        ...item,
        vix: vixEntry?.close || null
      };
    });
  }, [displayData, vixData]);

  // Calculate volume moving average (20-day)
  const dataWithVolumeSMA = React.useMemo(() => {
    return dataWithVIX.map((item, idx) => {
      if (idx < 19) return { ...item, volumeSMA: null };
      const sum = dataWithVIX.slice(idx - 19, idx + 1).reduce((acc, d) => acc + d.volume, 0);
      return { ...item, volumeSMA: sum / 20 };
    });
  }, [dataWithVIX]);

  // Calculate price change for header
  const latestData = dataWithVolumeSMA[dataWithVolumeSMA.length - 1];
  const previousData = dataWithVolumeSMA[dataWithVolumeSMA.length - 2];
  let priceChange = 0;
  let priceChangePercent = 0;
  let isPositive = true;

  if (indicator !== 'IVR') {
    priceChange = latestData && previousData ? latestData.close - previousData.close : 0;
    priceChangePercent = previousData && previousData.close !== 0 ? (priceChange / previousData.close) * 100 : 0;
    isPositive = priceChange >= 0;
  } else {
    // For IVR, we'll show the change in percentage points
    priceChange = latestData && previousData ? latestData.close - previousData.close : 0;
    // For IVR, we just show the change in percentage points (not percentage change)
    isPositive = priceChange >= 0;
  }

  return (
    <div className="chart-container">
      <div className="chart-section tradingview-style">
        <div className="chart-header">
          <div className="chart-title">
            {latestData && (
              <div className="chart-price-info">
                {indicator && (
                  <span className="indicator-name">{indicator} </span>
                )}
                <span className="current-price">
                  {indicator === 'IVR' ? `${latestData.close.toFixed(2)}%` : `$${latestData.close.toFixed(2)}`}
                </span>
                {indicator !== 'IVR' && (
                  <span className={`price-change ${isPositive ? 'positive' : 'negative'}`}>
                    {isPositive ? '+' : ''}{priceChange.toFixed(2)} ({isPositive ? '+' : ''}{priceChangePercent.toFixed(2)}%)
                  </span>
                )}
                <span className="chart-type-separator">|</span>

                {['1M', '3M', '6M'].map((tf) => (
                  <button
                    key={tf}
                    className={`timeframe ${timeframe === tf ? 'active' : ''}`}
                    onClick={() => setTimeframe(tf)}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={dataWithVolumeSMA} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2962FF" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#2962FF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2940" strokeWidth={1} />
            <XAxis
              dataKey="date"
              tick={{ fill: '#6B7785', fontSize: 11 }}
              stroke="#1e2940"
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
              interval="preserveStartEnd"
              minTickGap={50}
              tickLine={false}
              padding={{ left: 10, right: 10 }}
            />
            <YAxis
              yAxisId="price"
              domain={['auto', 'auto']}
              tick={{ fill: '#6B7785', fontSize: 11 }}
              stroke="#1e2940"
              tickFormatter={(value) => indicator === 'IVR' ? `${value.toFixed(0)}%` : `$${value.toFixed(0)}`}
              tickLine={false}
              orientation="right"
              padding={{ top: 10, bottom: 10 }}
            />
            <ReferenceLine
              yAxisId="price"
              y={latestData?.close}
              stroke="#2962FF"
              strokeWidth={1}
              strokeDasharray="5 5"
              label={{
                value: indicator === 'IVR' ? `${latestData?.close.toFixed(2)}%` : `$${latestData?.close.toFixed(2)}`,
                fill: '#FFFFFF',
                fontSize: 13,
                fontWeight: 'bold',
                position: 'right',
                content: (props) => {
                  const { viewBox, value } = props;
                  return (
                    <g>
                      <rect
                        x={viewBox.width + viewBox.x + 5}
                        y={viewBox.y - 12}
                        width={indicator === 'IVR' ? 60 : 50}
                        height={24}
                        fill="#2962FF"
                        rx={4}
                      />
                      <text
                        x={viewBox.width + viewBox.x + (indicator === 'IVR' ? 35 : 30)}
                        y={viewBox.y + 4}
                        fill="#FFFFFF"
                        fontSize={13}
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {value}
                      </text>
                    </g>
                  );
                }
              }}
            />
            <Tooltip content={<CustomTooltip indicator={indicator} />} cursor={{ stroke: '#4a5568', strokeWidth: 1, strokeDasharray: '5 5' }} />

            {/* Bollinger Bands */}
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="bb_upper"
              stroke="#787B86"
              dot={false}
              strokeWidth={1}
              name="BB Upper"
              strokeDasharray="3 3"
              strokeOpacity={0.5}
            />
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="bb_middle"
              stroke="#787B86"
              dot={false}
              strokeWidth={1}
              name="BB Middle"
              strokeOpacity={0.3}
            />
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="bb_lower"
              stroke="#787B86"
              dot={false}
              strokeWidth={1}
              name="BB Lower"
              strokeDasharray="3 3"
              strokeOpacity={0.5}
            />

            {/* 200-day MA */}
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="sma200"
              stroke="#FF9800"
              dot={false}
              strokeWidth={2}
              name="MA(200)"
            />

            {/* Chart Type: Line */}
            {chartType === 'line' && (
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="close"
                stroke="#2962FF"
                dot={false}
                strokeWidth={2.5}
                name="Price"
                fill="url(#priceGradient)"
              />
            )}

            {/* Chart Type: Bars */}
            {chartType === 'bars' && (
              <Scatter
                yAxisId="price"
                data={dataWithVolumeSMA}
                dataKey="close"
                fill="transparent"
                isAnimationActive={false}
                shape={(props) => {
                  const { cx, cy, payload, xAxis, yAxis } = props;

                  if (!payload || !cx || !yAxis) return null;

                  const { open, close, high, low } = payload;
                  if (open === undefined || close === undefined || high === undefined || low === undefined) {
                    return null;
                  }

                  const isGreen = close > open;
                  const color = isGreen ? '#00ff88' : '#ff4444';

                  // Get Y positions using the yAxis scale
                  const highY = yAxis.scale(high);
                  const lowY = yAxis.scale(low);
                  const openY = yAxis.scale(open);
                  const closeY = yAxis.scale(close);

                  // Calculate bar width based on data density
                  const chartWidth = xAxis?.width || 800;
                  const dataPoints = dataWithVolumeSMA.length;
                  const barWidth = Math.max((chartWidth / dataPoints) * 0.6, 2);
                  const tickWidth = Math.max(barWidth * 0.5, 3);

                  return (
                    <g>
                      {/* Vertical line (High to Low) */}
                      <line
                        x1={cx}
                        y1={highY}
                        x2={cx}
                        y2={lowY}
                        stroke={color}
                        strokeWidth={1.5}
                      />
                      {/* Left tick (Open) */}
                      <line
                        x1={cx - tickWidth}
                        y1={openY}
                        x2={cx}
                        y2={openY}
                        stroke={color}
                        strokeWidth={2}
                      />
                      {/* Right tick (Close) */}
                      <line
                        x1={cx}
                        y1={closeY}
                        x2={cx + tickWidth}
                        y2={closeY}
                        stroke={color}
                        strokeWidth={2}
                      />
                    </g>
                  );
                }}
              />
            )}

            {/* Chart Type: Candles */}
            {chartType === 'candles' && (
              <Scatter
                yAxisId="price"
                data={dataWithVolumeSMA}
                dataKey="close"
                fill="transparent"
                isAnimationActive={false}
                shape={(props) => {
                  const { cx, cy, payload, xAxis, yAxis } = props;

                  if (!payload || !cx || !yAxis) return null;

                  const { open, close, high, low } = payload;
                  if (open === undefined || close === undefined || high === undefined || low === undefined) {
                    return null;
                  }

                  const isGreen = close > open;
                  const color = isGreen ? '#00ff88' : '#ff4444';

                  // Get Y positions using the yAxis scale
                  const highY = yAxis.scale(high);
                  const lowY = yAxis.scale(low);
                  const openY = yAxis.scale(open);
                  const closeY = yAxis.scale(close);

                  // Calculate candle width based on data density
                  const chartWidth = xAxis?.width || 800;
                  const dataPoints = dataWithVolumeSMA.length;
                  const candleWidth = Math.max((chartWidth / dataPoints) * 0.7, 3);

                  return (
                    <g>
                      {/* Wick (High-Low line) */}
                      <line
                        x1={cx}
                        y1={highY}
                        x2={cx}
                        y2={lowY}
                        stroke={color}
                        strokeWidth={1.5}
                      />
                      {/* Body (Open-Close rect) */}
                      <rect
                        x={cx - candleWidth / 2}
                        y={Math.min(openY, closeY)}
                        width={candleWidth}
                        height={Math.abs(closeY - openY) || 1}
                        fill={color}
                        stroke={color}
                        strokeWidth={1}
                      />
                    </g>
                  );
                }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-section tradingview-style">
        <ResponsiveContainer width="100%" height={120}>
          <ComposedChart data={dataWithVolumeSMA} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2940" strokeWidth={1} />
            <XAxis
              dataKey="date"
              tick={{ fill: '#6B7785', fontSize: 11 }}
              stroke="#1e2940"
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
              interval="preserveStartEnd"
              minTickGap={50}
              tickLine={false}
              padding={{ left: 10, right: 10 }}
            />
            <YAxis
              tick={{ fill: '#6B7785', fontSize: 11 }}
              stroke="#1e2940"
              tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
              tickLine={false}
              orientation="right"
              padding={{ top: 10, bottom: 10 }}
            />
            <Tooltip content={<CustomTooltip indicator={indicator} />} cursor={{ fill: 'rgba(42, 53, 82, 0.3)' }} />
            <Bar dataKey="volume" fill="#2962FF" opacity={0.6} />
            <Line
              type="monotone"
              dataKey="volumeSMA"
              stroke="#FF9800"
              dot={false}
              strokeWidth={2}
              name="Volume MA(20)"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-section tradingview-style">
        <ResponsiveContainer width="100%" height={120}>
          <ComposedChart data={dataWithVolumeSMA} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2940" strokeWidth={1} />
            <XAxis
              dataKey="date"
              tick={{ fill: '#6B7785', fontSize: 11 }}
              stroke="#1e2940"
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
              interval="preserveStartEnd"
              minTickGap={50}
              tickLine={false}
              padding={{ left: 10, right: 20 }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: '#6B7785', fontSize: 11 }}
              stroke="#1e2940"
              tickLine={false}
              orientation="right"
              padding={{ top: 10, bottom: 10 }}
            />
            <ReferenceLine
              y={latestData?.rsi}
              stroke="#9C27B0"
              strokeWidth={1}
              strokeDasharray="5 5"
              label={{
                value: `${latestData?.rsi?.toFixed(2) || ''}`,
                fill: '#FFFFFF',
                fontSize: 12,
                fontWeight: 'bold',
                position: 'right',
                content: (props) => {
                  const { viewBox, value } = props;
                  return (
                    <g>
                      <rect
                        x={viewBox.width + viewBox.x + 5}
                        y={viewBox.y - 10}
                        width={40}
                        height={20}
                        fill="#9C27B0"
                        rx={4}
                      />
                      <text
                        x={viewBox.width + viewBox.x + 25}
                        y={viewBox.y + 4}
                        fill="#FFFFFF"
                        fontSize={12}
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {value}
                      </text>
                    </g>
                  );
                }
              }}
            />
            <Tooltip content={<CustomTooltip indicator={indicator} />} cursor={{ stroke: '#4a5568', strokeWidth: 1, strokeDasharray: '5 5' }} />
            <ReferenceLine y={70} stroke="#F23645" strokeDasharray="3 3" strokeWidth={1} opacity={0.5} />
            <ReferenceLine y={30} stroke="#089981" strokeDasharray="3 3" strokeWidth={1} opacity={0.5} />
            <Line
              type="monotone"
              dataKey="rsi"
              stroke="#9C27B0"
              dot={false}
              strokeWidth={2}
              name="RSI"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
};

export default PriceChart;
