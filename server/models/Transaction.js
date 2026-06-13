const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['DEPOSIT', 'WITHDRAWAL', 'TRADE_FEE', 'TRANSFER'],
    required: true,
  },
  asset: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  balanceBefore: {
    type: Number,
  },
  balanceAfter: {
    type: Number,
  },
  reference: {
    type: String,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

module.exports = mongoose.model('Transaction', TransactionSchema);
