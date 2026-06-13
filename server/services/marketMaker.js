const { SUPPORTED_PAIRS } = require('../config/constants');

let io = null;

const initMarketMaker = (socketIo) => {
  io = socketIo;
  
  // Start orderbook generation interval (every 500ms)
  setInterval(generateOrderBooks, 500);

  // Start trade feed generation interval (every 2s)
  setInterval(generateFakeTrades, 2000);

  console.log('Market Maker service started (500ms orderbooks, 2s trades)');
};

// Generate fake order book depth for all supported pairs
const generateOrderBooks = () => {
  if (!io) return;
  const { getCurrentPrices } = require('./priceEngine');
  const tickers = getCurrentPrices();

  for (const pair of SUPPORTED_PAIRS) {
    const ticker = tickers[pair.symbol];
    if (!ticker) continue;

    const currentPrice = ticker.price;
    const bids = [];
    const asks = [];

    // Generate 15 levels of bids (buy orders below market price)
    // Decrement from currentPrice by small steps
    let lastBidPrice = currentPrice;
    for (let i = 0; i < 15; i++) {
      const stepPercent = 0.0002 + (Math.random() * 0.001);
      lastBidPrice = parseFloat((lastBidPrice * (1 - stepPercent)).toFixed(8));
      // Random qty scaled for the token (e.g. BTC has smaller qty, DOGE has huge qty)
      const maxQty = 100 / currentPrice; // roughly $100 value max per level
      const qty = parseFloat((Math.random() * maxQty + (0.1 / currentPrice)).toFixed(4));
      bids.push([lastBidPrice, qty]);
    }

    // Generate 15 levels of asks (sell orders above market price)
    // Increment from currentPrice by small steps
    let lastAskPrice = currentPrice;
    for (let i = 0; i < 15; i++) {
      const stepPercent = 0.0002 + (Math.random() * 0.001);
      lastAskPrice = parseFloat((lastAskPrice * (1 + stepPercent)).toFixed(8));
      const maxQty = 100 / currentPrice;
      const qty = parseFloat((Math.random() * maxQty + (0.1 / currentPrice)).toFixed(4));
      asks.push([lastAskPrice, qty]);
    }

    // Sort: bids descending (highest buy price first), asks ascending (lowest sell price first)
    bids.sort((a, b) => b[0] - a[0]);
    asks.sort((a, b) => a[0] - b[0]);

    // Broadcast to pair room
    io.to(pair.symbol).emit('orderbook', {
      symbol: pair.symbol,
      bids,
      asks,
    });
  }
};

// Generate occasional simulated public trades to populate the Trade Feed
const generateFakeTrades = () => {
  if (!io) return;
  const { getCurrentPrices } = require('./priceEngine');
  const tickers = getCurrentPrices();

  for (const pair of SUPPORTED_PAIRS) {
    // Only generate a fake trade 50% of the time to feel natural
    if (Math.random() > 0.5) continue;

    const ticker = tickers[pair.symbol];
    if (!ticker) continue;

    const currentPrice = ticker.price;
    const side = Math.random() > 0.5 ? 'BUY' : 'SELL';
    
    // Trade price slightly offset from ticker
    const offset = currentPrice * (Math.random() * 0.0004 - 0.0002);
    const tradePrice = parseFloat((currentPrice + offset).toFixed(8));

    const maxQty = 200 / currentPrice; // ~$200 value max
    const qty = parseFloat((Math.random() * maxQty + (0.05 / currentPrice)).toFixed(4));

    io.to(pair.symbol).emit('trade_update', {
      symbol: pair.symbol,
      price: tradePrice,
      qty,
      side,
      timestamp: new Date(),
    });
  }
};

module.exports = {
  initMarketMaker,
};
