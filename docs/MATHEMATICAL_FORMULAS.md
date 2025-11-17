# Mathematical Formulas in Options Trading Simulator

## 1. Garman-Klass Volatility Formula

The Garman-Klass volatility estimator is a superior method for calculating volatility from OHLC data:

$$\sigma_{GK} = \sqrt{\frac{1}{n}\sum_{i=1}^{n}\left[0.5 \cdot \ln\left(\frac{H_i}{L_i}\right)^2 - (2\ln(2)-1) \cdot \ln\left(\frac{C_i}{O_i}\right)^2\right]} \cdot \sqrt{252}$$

Where:
- $H_i$ = High price on day $i$
- $L_i$ = Low price on day $i$
- $C_i$ = Close price on day $i$
- $O_i$ = Open price on day $i$
- $n$ = lookback period (20 days)
- Result is annualized by multiplying by $\sqrt{252}$

## 2. Realized Volatility (Simple Return-Based)

$$\sigma_{realized} = \sqrt{\text{variance of log returns}} \cdot \sqrt{252}$$

Where variance = $\frac{\sum(r_i - \mu)^2}{n}$, with $r_i = \ln\left(\frac{P_i}{P_{i-1}}\right)$

## 3. Exponential Decay for Event Impact

$$\text{decay\_factor} = e^{-\frac{\text{days\_diff}}{10}}$$

## 4. IV Blending Formula

$$IV = (\text{existing\_IV} \times 0.6) + (\text{realized\_vol} \times 0.4)$$

## 5. VIX-Based Adjustment

$$\text{vix\_ratio} = \frac{\text{current\_VIX}}{0.20}$$
$$\text{vix\_adjustment} = (\text{vix\_ratio} - 1.0) \times \text{adjustment\_factor}$$
$$\text{adjusted\_IV} = \text{original\_IV} \times (1 + \text{vix\_adjustment})$$

## 6. Strike Price Generation

$$\text{base\_strike} = \text{round}\left(\frac{\text{current\_price}}{10}\right) \times 10$$
$$\text{strike}_i = \text{base\_strike} + (i \times \text{step\_size})$$

---

# Black-Scholes and Greeks Formulas

## 7. Black-Scholes Call Option Formula

$$d_1 = \frac{\ln\left(\frac{S}{K}\right) + \left(r + \frac{1}{2}\sigma^2\right)T}{\sigma\sqrt{T}}$$
$$d_2 = d_1 - \sigma\sqrt{T}$$
$$C = S \cdot N(d_1) - K \cdot e^{-rT} \cdot N(d_2)$$

## 8. Black-Scholes Put Option Formula

$$P = K \cdot e^{-rT} \cdot N(-d_2) - S \cdot N(-d_1)$$

## 9. Greeks Formulas

### Delta (Call)
$$\Delta = N(d_1)$$

### Delta (Put)
$$\Delta = N(d_1) - 1$$

### Gamma
$$\Gamma = \frac{N'(d_1)}{S \cdot \sigma \cdot \sqrt{T}}$$

### Vega
$$\text{Vega} = \frac{S \cdot N'(d_1) \cdot \sqrt{T}}{100}$$

### Theta (Call)
$$\Theta = \frac{-\frac{S \cdot N'(d_1) \cdot \sigma}{2\sqrt{T}} - r \cdot K \cdot e^{-rT} \cdot N(d_2)}{365}$$

### Theta (Put)
$$\Theta = \frac{-\frac{S \cdot N'(d_1) \cdot \sigma}{2\sqrt{T}} + r \cdot K \cdot e^{-rT} \cdot N(-d_2)}{365}$$

### Rho (Call)
$$\rho = \frac{K \cdot T \cdot e^{-rT} \cdot N(d_2)}{100}$$

### Rho (Put)
$$\rho = -\frac{K \cdot T \cdot e^{-rT} \cdot N(-d_2)}{100}$$

## 10. Probability Density Functions

### Standard Normal PDF
$$N'(x) = \frac{e^{-\frac{x^2}{2}}}{\sqrt{2\pi}}$$

### Standard Normal CDF (Approximation)
$$N(x) = \text{cumulative distribution function using polynomial approximation}$$

---

# Technical Indicators Formulas

## 11. Simple Moving Average (SMA)
$$SMA = \frac{\sum_{i=1}^{n}P_i}{n}$$

## 12. Bollinger Bands
$$SMA = \frac{\sum_{i=1}^{n}P_i}{n}$$
$$SD = \sqrt{\frac{\sum_{i=1}^{n}(P_i - SMA)^2}{n}}$$
$$\text{Upper Band} = SMA + (2 \times SD)$$
$$\text{Lower Band} = SMA - (2 \times SD)$$

## 13. Relative Strength Index (RSI)
$$RS = \frac{\text{Average Gains}}{\text{Average Losses}}$$
$$RSI = 100 - \frac{100}{1 + RS}$$

## 14. Logarithmic Returns
$$\text{Return} = \ln\left(\frac{P_t}{P_{t-1}}\right)$$

## 15. Normal Distribution Approximation (CDF)

The code uses a polynomial approximation of the standard normal CDF:
$$N(x) \approx 1 - D \cdot t \cdot (p_1 + t \cdot (p_2 + t \cdot (p_3 + t \cdot (p_4 + t \cdot p_5))))$$

Where:
- $t = \frac{1}{1 + 0.2316419 \cdot |x|}$
- $d = 0.3989423 \cdot e^{-\frac{x^2}{2}}$
- $D = d$ if $x > 0$, else $-d$

## Other Mathematical Concepts Used

The main mathematical theorems/formulas implemented in the Options Trading Simulator are:

- **Black-Scholes model** (finance)
- **Greeks calculations** (finance)
- **Garman-Klass volatility estimator** (finance)
- **Technical indicator calculations** (finance/time series)
- **Normal distribution functions** (statistics/probability)
- **Exponential decay functions** (calculus)

These formulas form a comprehensive financial modeling system that combines options pricing theory, volatility estimation, risk management (Greeks), and technical analysis.