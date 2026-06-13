const PriceHistory = require('../models/PriceHistory');
const { SUPPORTED_PAIRS } = require('../config/constants');
const { randomNormal } = require('../utils/generateOHLC');

// Shared in-memory market tickers state
let tickers = {};
let io = null;

// In-memory active candles for real-time aggregation
// Format: { [symbol]: { [interval]: candleObject } }
let activeCandles = {};

const INTERVALS = ['1m', '5m', '15m', '1h', '4h', '1d'];

const getIntervalMs = (interval) => {
  switch (interval) {
    case '1m': return 60 * 1000;
    case '5m': return 5 * 60 * 1000;
    case '15m': return 15 * 60 * 1000;
    case '1h': return 60 * 60 * 1000;
    case '4h': return 4 * 60 * 60 * 1000;
    case '1d': return 24 * 60 * 60 * 1000;
    default: return 60 * 1000;
  }
};

const getBoundaryTime = (timestamp, intervalMs) => {
  return new Date(Math.floor(timestamp / intervalMs) * intervalMs);
};

// Initialize price engine with supported pairs
const initEngine = async (socketIo) => {
  io = socketIo;

  // Initialize ticker state from constants or DB
  for (const pair of SUPPORTED_PAIRS) {
    // Check if we already have a historical close price in the DB
    let lastPrice = pair.basePrice;
    try {
      const latestCandle = await PriceHistory.findOne({ symbol: pair.symbol, interval: '1m' })
        .sort({ timestamp: -1 });
      if (latestCandle) {
        lastPrice = latestCandle.close;
      }
    } catch (err) {
      console.error(`Error fetching latest price for ${pair.symbol}:`, err.message);
    }

    tickers[pair.symbol] = {
      symbol: pair.symbol,
      price: lastPrice,
      open24h: lastPrice * (1 + (Math.random() * 0.04 - 0.02)), // Simulated open price
      high24h: lastPrice,
      low24h: lastPrice,
      volume24h: Math.random() * 5000 + 100,
      change24h: 0,
      volatility: pair.volatility,
      base: pair.base,
      quote: pair.quote,
    };

    // Make sure high and low are consistent
    tickers[pair.symbol].high24h = Math.max(tickers[pair.symbol].price, tickers[pair.symbol].open24h) * (1 + Math.random() * 0.01);
    tickers[pair.symbol].low24h = Math.min(tickers[pair.symbol].price, tickers[pair.symbol].open24h) * (1 - Math.random() * 0.01);
    
    // Calculate initial change
    const diff = tickers[pair.symbol].price - tickers[pair.symbol].open24h;
    tickers[pair.symbol].change24h = parseFloat(((diff / tickers[pair.symbol].open24h) * 100).toFixed(2));

    // Initialize active candles in memory
    activeCandles[pair.symbol] = {};
    const nowMs = Date.now();
    for (const interval of INTERVALS) {
      const intervalMs = getIntervalMs(interval);
      const boundaryTime = getBoundaryTime(nowMs, intervalMs);

      activeCandles[pair.symbol][interval] = {
        symbol: pair.symbol,
        interval,
        open: lastPrice,
        high: lastPrice,
        low: lastPrice,
        close: lastPrice,
        volume: 0,
        timestamp: boundaryTime,
      };
    }
  }

  // Start the ticking simulation interval
  const updateInterval = parseInt(process.env.PRICE_UPDATE_INTERVAL) || 1000;
  setInterval(tick, updateInterval);
  console.log(`Price Engine started with interval: ${updateInterval}ms`);
};

// Simulate one price tick using GBM
const tick = async () => {
  const nowMs = Date.now();

  for (const pair of SUPPORTED_PAIRS) {
    const ticker = tickers[pair.symbol];
    const prevPrice = ticker.price;
    
    // Geometric Brownian Motion formula
    // drift is set near 0, adding random walk based on volatility
    const drift = 0.00002; 
    const changePercent = drift + ticker.volatility * randomNormal();
    const newPrice = parseFloat((prevPrice * Math.exp(changePercent)).toFixed(8));
    
    // Update tickers in-memory values
    ticker.price = newPrice;
    
    // Volatility/volume accumulation for this tick
    const tickVolume = parseFloat((Math.random() * (100 / prevPrice) + 0.001).toFixed(4));
    ticker.volume24h = parseFloat((ticker.volume24h + tickVolume).toFixed(4));

    // 24h High / Low adjustments
    if (newPrice > ticker.high24h) ticker.high24h = newPrice;
    if (newPrice < ticker.low24h) ticker.low24h = newPrice;

    // Recalculate 24h % change
    const diff = newPrice - ticker.open24h;
    ticker.change24h = parseFloat(((diff / ticker.open24h) * 100).toFixed(2));

    // Emit live ticker info to Socket rooms
    if (io) {
      io.to(pair.symbol).emit('ticker', ticker);
    }

    // Call matching engine to check for simulated limit order fills
    const { checkOpenOrdersAgainstTicker } = require('./matchingEngine');
    checkOpenOrdersAgainstTicker(pair.symbol, newPrice);

    // Process candle aggregation for this tick
    for (const interval of INTERVALS) {
      const intervalMs = getIntervalMs(interval);
      const boundaryTime = getBoundaryTime(nowMs, intervalMs);
      const currentCandle = activeCandles[pair.symbol][interval];

      if (boundaryTime.getTime() > currentCandle.timestamp.getTime()) {
        // Interval boundary crossed! 
        // Save the old candle to MongoDB
        try {
          await PriceHistory.findOneAndUpdate(
            {
              symbol: currentCandle.symbol,
              interval: currentCandle.interval,
              timestamp: currentCandle.timestamp,
            },
            {
              open: currentCandle.open,
              high: currentCandle.high,
              low: currentCandle.low,
              close: currentCandle.close,
              volume: currentCandle.volume > 0 ? currentCandle.volume : 0.001,
            },
            { upsert: true, new: true }
          );
        } catch (err) {
          console.error(`Failed to save candle ${pair.symbol} ${interval}:`, err.message);
        }

        // Start new candle
        activeCandles[pair.symbol][interval] = {
          symbol: pair.symbol,
          interval,
          open: prevPrice,
          high: Math.max(prevPrice, newPrice),
          low: Math.min(prevPrice, newPrice),
          close: newPrice,
          volume: tickVolume,
          timestamp: boundaryTime,
        };
      } else {
        // Within current candle window, update high/low/close/volume
        currentCandle.close = newPrice;
        if (newPrice > currentCandle.high) currentCandle.high = newPrice;
        if (newPrice < currentCandle.low) currentCandle.low = newPrice;
        currentCandle.volume = parseFloat((currentCandle.volume + tickVolume).toFixed(4));
      }

      // Emit active candle updates to clients for smooth charting
      if (io) {
        io.to(`${pair.symbol}:${interval}`).emit('candle_update', activeCandles[pair.symbol][interval]);
      }
    }
  }

  // Broadcast all tickers summary globally
  if (io) {
    io.emit('tickers', tickers);
  }
};

// Expose functions
const getCurrentPrices = () => {
  return tickers;
};

const getTicker = (symbol) => {
  return tickers[symbol.toUpperCase()];
};

const getPriceHistory = async (symbol, interval, limit = 500) => {
  const sym = symbol.toUpperCase();
  const candles = await PriceHistory.find({ symbol: sym, interval })
    .sort({ timestamp: -1 })
    .limit(limit);
  
  // Return in chronological order
  const history = candles.reverse();

  // Append current in-memory active candle if it exists to prevent gaps
  if (activeCandles[sym] && activeCandles[sym][interval]) {
    const active = activeCandles[sym][interval];
    const lastHistory = history[history.length - 1];
    const activeTimeMs = new Date(active.timestamp).getTime();

    if (!lastHistory || new Date(lastHistory.timestamp).getTime() !== activeTimeMs) {
      history.push({
        symbol: active.symbol,
        interval: active.interval,
        open: active.open,
        high: active.high,
        low: active.low,
        close: active.close,
        volume: active.volume,
        timestamp: active.timestamp,
      });
    }
  }

  return history;
};

const overridePrice = async (symbol, newPrice) => {
  const sym = symbol.toUpperCase();
  if (!tickers[sym]) return false;

  const prevPrice = tickers[sym].price;
  tickers[sym].price = newPrice;
  
  // Adjust open/high/low relative to the override
  if (newPrice > tickers[sym].high24h) tickers[sym].high24h = newPrice;
  if (newPrice < tickers[sym].low24h) tickers[sym].low24h = newPrice;
  
  const diff = newPrice - tickers[sym].open24h;
  tickers[sym].change24h = parseFloat(((diff / tickers[sym].open24h) * 100).toFixed(2));

  // Instantly force candle values to match override
  const nowMs = Date.now();
  for (const interval of INTERVALS) {
    const currentCandle = activeCandles[sym][interval];
    currentCandle.close = newPrice;
    if (newPrice > currentCandle.high) currentCandle.high = newPrice;
    if (newPrice < currentCandle.low) currentCandle.low = newPrice;
  }

  // Broadcast updates instantly
  if (io) {
    io.to(sym).emit('ticker', tickers[sym]);
    io.emit('tickers', tickers);
    
    for (const interval of INTERVALS) {
      io.to(`${sym}:${interval}`).emit('candle_update', activeCandles[sym][interval]);
    }
  }

  console.log(`[Admin Override] Price of ${sym} forced from ${prevPrice} to ${newPrice}`);
  return true;
};

module.exports = {
  initEngine,
  getCurrentPrices,
  getTicker,
  getPriceHistory,
  overridePrice,
};
