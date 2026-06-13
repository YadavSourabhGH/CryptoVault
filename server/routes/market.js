const express = require('express');
const { getCurrentPrices, getTicker, getPriceHistory } = require('../services/priceEngine');
const { SUPPORTED_PAIRS } = require('../config/constants');
const Trade = require('../models/Trade');

const router = express.Router();

// @desc    Get all active tickers
// @route   GET /api/market/tickers
// @access  Public
router.get('/tickers', (req, res) => {
  res.json({
    success: true,
    tickers: getCurrentPrices(),
  });
});

// @desc    Get single pair ticker
// @route   GET /api/market/ticker/:symbol
// @access  Public
router.get('/ticker/:symbol', (req, res) => {
  const ticker = getTicker(req.params.symbol);
  if (!ticker) {
    return res.status(404).json({ success: false, message: `Ticker ${req.params.symbol} not found` });
  }
  res.json({
    success: true,
    ticker,
  });
});

// @desc    Get snapshot of order book depth
// @route   GET /api/market/orderbook/:symbol
// @access  Public
router.get('/orderbook/:symbol', (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const ticker = getTicker(symbol);
  if (!ticker) {
    return res.status(404).json({ success: false, message: `Ticker ${symbol} not found` });
  }

  const depth = parseInt(req.query.depth) || 15;
  const currentPrice = ticker.price;
  const bids = [];
  const asks = [];

  // Instantly generate a snapshot of orderbook depth
  let lastBidPrice = currentPrice;
  for (let i = 0; i < depth; i++) {
    const stepPercent = 0.0002 + (Math.random() * 0.0008);
    lastBidPrice = parseFloat((lastBidPrice * (1 - stepPercent)).toFixed(8));
    const maxQty = 100 / currentPrice;
    const qty = parseFloat((Math.random() * maxQty + (0.05 / currentPrice)).toFixed(4));
    bids.push([lastBidPrice, qty]);
  }

  let lastAskPrice = currentPrice;
  for (let i = 0; i < depth; i++) {
    const stepPercent = 0.0002 + (Math.random() * 0.0008);
    lastAskPrice = parseFloat((lastAskPrice * (1 + stepPercent)).toFixed(8));
    const maxQty = 100 / currentPrice;
    const qty = parseFloat((Math.random() * maxQty + (0.05 / currentPrice)).toFixed(4));
    asks.push([lastAskPrice, qty]);
  }

  res.json({
    success: true,
    symbol,
    bids: bids.sort((a, b) => b[0] - a[0]),
    asks: asks.sort((a, b) => a[0] - b[0]),
  });
});

// @desc    Get recent trades list
// @route   GET /api/market/trades/:symbol
// @access  Public
router.get('/trades/:symbol', async (req, res, next) => {
  const symbol = req.params.symbol.toUpperCase();
  const limit = parseInt(req.query.limit) || 50;

  try {
    const dbTrades = await Trade.find({ symbol })
      .sort({ timestamp: -1 })
      .limit(limit);

    // If we don't have enough trades in DB, generate some mock historical trades to bootstrap
    if (dbTrades.length === 0) {
      const ticker = getTicker(symbol);
      const mockTrades = [];
      if (ticker) {
        let price = ticker.price;
        for (let i = 0; i < limit; i++) {
          const change = price * (Math.random() * 0.002 - 0.001);
          price = parseFloat((price + change).toFixed(8));
          mockTrades.push({
            symbol,
            price,
            quantity: parseFloat((Math.random() * (100 / price) + (0.1 / price)).toFixed(4)),
            side: Math.random() > 0.5 ? 'BUY' : 'SELL',
            timestamp: new Date(Date.now() - i * 15 * 1000), // Spaced by 15s
          });
        }
      }
      return res.json({ success: true, trades: mockTrades });
    }

    res.json({
      success: true,
      trades: dbTrades,
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get historical OHLC candle data (klines)
// @route   GET /api/market/klines/:symbol
// @access  Public
router.get('/klines/:symbol', async (req, res, next) => {
  const symbol = req.params.symbol.toUpperCase();
  const interval = req.query.interval || '1m';
  const limit = parseInt(req.query.limit) || 500;

  try {
    const candles = await getPriceHistory(symbol, interval, limit);
    res.json({
      success: true,
      candles,
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get all supported pairs
// @route   GET /api/market/pairs
// @access  Public
router.get('/pairs', (req, res) => {
  res.json({
    success: true,
    pairs: SUPPORTED_PAIRS,
  });
});

module.exports = router;
