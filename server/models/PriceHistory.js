const mongoose = require('mongoose');

const PriceHistorySchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    index: true,
  },
  interval: {
    type: String,
    enum: ['1m', '5m', '15m', '1h', '4h', '1d'],
    required: true,
    index: true,
  },
  open: {
    type: Number,
    required: true,
  },
  high: {
    type: Number,
    required: true,
  },
  low: {
    type: Number,
    required: true,
  },
  close: {
    type: Number,
    required: true,
  },
  volume: {
    type: Number,
    required: true,
  },
  timestamp: {
    type: Date,
    required: true,
    index: true,
  },
});

// Compound index for fast queries on chart loading
PriceHistorySchema.index({ symbol: 1, interval: 1, timestamp: -1 });

module.exports = mongoose.model('PriceHistory', PriceHistorySchema);
