// Helper to generate random normal distribution (Box-Muller transform)
function randomNormal() {
  let u = 0, v = 0;
  while(u === 0) u = Math.random(); // Converting [0,1) to (0,1)
  while(v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// Generate historical candles for a symbol
const generateHistoricalCandles = (symbol, interval, basePrice, volatility, count = 500) => {
  const candles = [];
  let currentPrice = basePrice;
  const now = new Date();
  
  // Calculate interval duration in milliseconds
  let intervalMs;
  switch (interval) {
    case '1m': intervalMs = 60 * 1000; break;
    case '5m': intervalMs = 5 * 60 * 1000; break;
    case '15m': intervalMs = 15 * 60 * 1000; break;
    case '1h': intervalMs = 60 * 60 * 1000; break;
    case '4h': intervalMs = 4 * 60 * 60 * 1000; break;
    case '1d': intervalMs = 24 * 60 * 60 * 1000; break;
    default: intervalMs = 60 * 1000;
  }

  // Generate candles going backward in time, then reverse them so they are in chronological order
  let tempTimestamp = now.getTime() - (count * intervalMs);

  for (let i = 0; i < count; i++) {
    const open = currentPrice;
    
    // Simulate high, low, close for this candle
    const numSubTicks = 5; // Simulating 5 sub-steps within the candle
    let high = open;
    let low = open;
    let lastPrice = open;

    for (let j = 0; j < numSubTicks; j++) {
      // Small drift and random walk
      const change = lastPrice * (0.0001 + volatility * randomNormal() * 0.4);
      lastPrice = parseFloat((lastPrice + change).toFixed(8));
      if (lastPrice > high) high = lastPrice;
      if (lastPrice < low) low = lastPrice;
    }

    const close = lastPrice;
    const volume = parseFloat((Math.random() * (10000 / basePrice) + (100 / basePrice)).toFixed(4));
    
    candles.push({
      symbol,
      interval,
      open,
      high,
      low,
      close,
      volume,
      timestamp: new Date(tempTimestamp),
    });

    currentPrice = close;
    tempTimestamp += intervalMs;
  }

  return candles;
};

module.exports = {
  randomNormal,
  generateHistoricalCandles,
};
