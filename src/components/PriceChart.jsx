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

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="custom-tooltip">
        <p className="label">{data.date}</p>
        <p>Open: ${data.open}</p>
        <p>High: ${data.high}</p>
        <p>Low: ${data.low}</p>
        <p>Close: ${data.close}</p>
        <p>Volume: {(data.volume / 1000000).toFixed(2)}M</p>
        {data.rsi && <p>RSI: {data.rsi.toFixed(2)}</p>}
      </div>
    );
  }
  return null;
};

const PriceChart = ({ data, currentIndex, vixData }) => {
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
  const priceChange = latestData && previousData ? latestData.close - previousData.close : 0;
  const priceChangePercent = previousData ? (priceChange / previousData.close) * 100 : 0;
  const isPositive = priceChange >= 0;

  return (
    <div className="chart-container">
      <div className="chart-section tradingview-style">
        <div className="chart-header">
          <div className="chart-title">
            {latestData && (
              <div className="chart-price-info">
                <span className="current-price">${latestData.close.toFixed(2)}</span>
                <span className={`price-change ${isPositive ? 'positive' : 'negative'}`}>
                  {isPositive ? '+' : ''}{priceChange.toFixed(2)} ({isPositive ? '+' : ''}{priceChangePercent.toFixed(2)}%)
                </span>

                <span className="chart-type-separator">|</span>

                Timeframe
                {['1M', '3M', '6M', '1Y'].map((tf) => (
                  <button
                    key={tf}
                    className={`timeframe ${timeframe === tf ? 'active' : ''}`}
                    onClick={() => setTimeframe(tf)}
                  >
                    {tf}
                  </button>
                ))}

                <span className="chart-type-separator">|</span>

                {/* Chart Type */}
                {/* {[ */}
                {/*   { id: 'line', label: 'Line' }, */}
                {/*   { id: 'bars', label: 'Bars' }, */}
                {/*   { id: 'candles', label: 'Candles' } */}
                {/* ].map((ct) => ( */}
                {/*   <button */}
                {/*     key={ct.id} */}
                {/*     className={`chart-type ${chartType === ct.id ? 'active' : ''}`} */}
                {/*     onClick={() => setChartType(ct.id)} */}
                {/*   > */}
                {/*     {ct.label} */}
                {/*   </button> */}
                {/* ))} */}
              </div>
            )}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={450}>
          <ComposedChart data={dataWithVolumeSMA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
              padding={{ left: 10, right: 20 }}
            />
            <YAxis
              yAxisId="price"
              domain={['auto', 'auto']}
              tick={{ fill: '#6B7785', fontSize: 11 }}
              stroke="#1e2940"
              tickFormatter={(value) => `$${value.toFixed(0)}`}
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
                value: `$${latestData?.close.toFixed(2)}`,
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
                        width={50}
                        height={24}
                        fill="#2962FF"
                        rx={4}
                      />
                      <text
                        x={viewBox.width + viewBox.x + 30}
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
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#4a5568', strokeWidth: 1, strokeDasharray: '5 5' }} />

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
        <div className="chart-header">
          <h3>Volume</h3>
        </div>
        <ResponsiveContainer width="100%" height={120}>
          <ComposedChart data={dataWithVolumeSMA} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
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
              tick={{ fill: '#6B7785', fontSize: 11 }}
              stroke="#1e2940"
              tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
              tickLine={false}
              orientation="right"
              padding={{ top: 10, bottom: 10 }}
            />
            <Tooltip cursor={{ fill: 'rgba(42, 53, 82, 0.3)' }} />
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
        <div className="chart-header">
          <h3>RSI (14)</h3>
        </div>
        <ResponsiveContainer width="100%" height={120}>
          <ComposedChart data={dataWithVolumeSMA} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
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
            <Tooltip cursor={{ stroke: '#4a5568', strokeWidth: 1, strokeDasharray: '5 5' }} />
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

      <div className="chart-section tradingview-style">
        <div className="chart-header">
          <h3>VIX (Volatility Index)</h3>
        </div>
        <ResponsiveContainer width="100%" height={120}>
          <ComposedChart data={dataWithVolumeSMA} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
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
              domain={[0, 'auto']}
              tick={{ fill: '#6B7785', fontSize: 11 }}
              stroke="#1e2940"
              tickLine={false}
              orientation="right"
              padding={{ top: 10, bottom: 10 }}
            />
            <ReferenceLine
              y={latestData?.vix}
              stroke="#FFA726"
              strokeWidth={1}
              strokeDasharray="5 5"
              label={{
                value: `${latestData?.vix?.toFixed(2) || ''}`,
                fill: '#FFFFFF',
                fontSize: 12,
                fontWeight: 'bold',
                position: 'right',
                content: (props) => {
                  const { viewBox, value } = props;
                  if (!value) return null;
                  return (
                    <g>
                      <rect
                        x={viewBox.width + viewBox.x + 5}
                        y={viewBox.y - 10}
                        width={45}
                        height={20}
                        fill="#FFA726"
                        rx={4}
                      />
                      <text
                        x={viewBox.width + viewBox.x + 27.5}
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
            <Tooltip cursor={{ stroke: '#4a5568', strokeWidth: 1, strokeDasharray: '5 5' }} />
            <ReferenceLine y={30} stroke="#F23645" strokeDasharray="3 3" strokeWidth={1} opacity={0.3} label={{ value: 'High Fear', fill: '#F23645', fontSize: 10, position: 'insideTopRight' }} />
            <ReferenceLine y={20} stroke="#FFA726" strokeDasharray="3 3" strokeWidth={1} opacity={0.3} label={{ value: 'Normal', fill: '#FFA726', fontSize: 10, position: 'insideTopRight' }} />
            <ReferenceLine y={12} stroke="#089981" strokeDasharray="3 3" strokeWidth={1} opacity={0.3} label={{ value: 'Low Fear', fill: '#089981', fontSize: 10, position: 'insideTopRight' }} />
            <Line
              type="monotone"
              dataKey="vix"
              stroke="#FFA726"
              dot={false}
              strokeWidth={2}
              name="VIX"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PriceChart;
