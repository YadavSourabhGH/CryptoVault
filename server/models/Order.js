const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  symbol: {
    type: String,
    required: true,
    index: true,
  },
  side: {
    type: String,
    enum: ['BUY', 'SELL'],
    required: true,
  },
  type: {
    type: String,
    enum: ['MARKET', 'LIMIT', 'STOP_LIMIT'],
    required: true,
  },
  price: {
    type: Number,
    required: function () {
      return this.type !== 'MARKET';
    },
  },
  quantity: {
    type: Number,
    required: true,
  },
  filledQty: {
    type: Number,
    default: 0,
  },
  remainingQty: {
    type: Number,
    required: true,
    default: function () {
      return this.quantity;
    },
  },
  status: {
    type: String,
    enum: ['OPEN', 'FILLED', 'PARTIALLY_FILLED', 'CANCELLED'],
    default: 'OPEN',
    index: true,
  },
  stopPrice: {
    type: Number,
    required: function () {
      return this.type === 'STOP_LIMIT';
    },
  },
  timeInForce: {
    type: String,
    enum: ['GTC', 'IOC', 'FOK'],
    default: 'GTC',
  },
  fills: [{
    price: Number,
    quantity: Number,
    tradeId: mongoose.Schema.Types.ObjectId,
    timestamp: { type: Date, default: Date.now },
  }],
}, {
  timestamps: true,
});

module.exports = mongoose.model('Order', OrderSchema);
