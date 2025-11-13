import React from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

// Custom candlestick component
const Candlestick = (props) => {
  const { x, y, width, height, open, close, high, low, fill } = props;
  const isGreen = close > open;
  const color = isGreen ? '#00ff88' : '#ff4444';
  const ratio = Math.abs(height / (open - close));

  return (
    <g>
      <line
        x1={x + width / 2}
        y1={y}
        x2={x + width / 2}
        y2={y + height}
        stroke={color}
        strokeWidth={1}
      />
      <rect
        x={x + width * 0.25}
        y={isGreen ? y + (high - close) * ratio : y + (high - open) * ratio}
        width={width * 0.5}
        height={Math.abs((close - open) * ratio)}
        fill={color}
        stroke={color}
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

const PriceChart = ({ data, currentIndex }) => {
  const [timeframe, setTimeframe] = React.useState('3M');

  const visibleData = data.slice(0, currentIndex + 1);
  // Calculate days to show based on timeframe
  const daysToShow = {
    '1M': 30,
    '3M': 90,
    '6M': 180,
    '1Y': 365,
  };
  
  const displayData = visibleData.slice(-daysToShow[timeframe])

  // Calculate price change for header
  const latestData = displayData[displayData.length - 1];
  const previousData = displayData[displayData.length - 2];
  const priceChange = latestData && previousData ? latestData.close - previousData.close : 0;
  const priceChangePercent = previousData ? (priceChange / previousData.close) * 100 : 0;
  const isPositive = priceChange >= 0;

  return (
    <div className="chart-container">
      <div className="chart-section tradingview-style">
        <div className="chart-header">
          <div className="chart-title">
            <h3>Price Chart</h3>
            {latestData && (
              <div className="chart-price-info">
                <span className="current-price">${latestData.close.toFixed(2)}</span>
                <span className={`price-change ${isPositive ? 'positive' : 'negative'}`}>
                  {isPositive ? '+' : ''}{priceChange.toFixed(2)} ({isPositive ? '+' : ''}{priceChangePercent.toFixed(2)}%)
                </span>

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
              </div>
            )}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={450}>
          <ComposedChart data={displayData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2962FF" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#2962FF" stopOpacity={0}/>
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
              tickLine={false}
            />
            <YAxis
              yAxisId="price"
              domain={['auto', 'auto']}
              tick={{ fill: '#6B7785', fontSize: 11 }}
              stroke="#1e2940"
              tickFormatter={(value) => `$${value.toFixed(0)}`}
              tickLine={false}
              orientation="right"
            />
            <ReferenceLine 
              yAxisId="price"
              y={latestData?.close} 
              stroke="#2962FF" 
              strokeWidth={1}
              strokeDasharray="5 5"
              label={{ 
                value: `$${latestData?.close.toFixed(2)}`, 
                fill: '#2962FF', 
                fontSize: 15,
                fontWeight: 'bold',
                position: 'right' 
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

            {/* Price line with area */}
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
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-section tradingview-style">
        <div className="chart-header">
          <h3>Volume</h3>
        </div>
        <ResponsiveContainer width="100%" height={120}>
          <ComposedChart data={displayData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2940" strokeWidth={1} />
            <XAxis
              dataKey="date"
              tick={{ fill: '#6B7785', fontSize: 11 }}
              stroke="#1e2940"
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#6B7785', fontSize: 11 }}
              stroke="#1e2940"
              tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
              tickLine={false}
              orientation="right"
            />
            <Tooltip cursor={{ fill: 'rgba(42, 53, 82, 0.3)' }} />
            <Bar dataKey="volume" fill="#2962FF" opacity={0.6} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-section tradingview-style">
        <div className="chart-header">
          <h3>RSI (14)</h3>
        </div>
        <ResponsiveContainer width="100%" height={120}>
          <ComposedChart data={displayData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2940" strokeWidth={1} />
            <XAxis
              dataKey="date"
              tick={{ fill: '#6B7785', fontSize: 11 }}
              stroke="#1e2940"
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: '#6B7785', fontSize: 11 }}
              stroke="#1e2940"
              tickLine={false}
              orientation="right"
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
    </div>
  );
};

export default PriceChart;
