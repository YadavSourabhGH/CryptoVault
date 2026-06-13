const mongoose = require('mongoose');

const WalletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  // Map of asset symbol (e.g. BTC, ETH, USDT) to balance details
  balances: {
    type: Map,
    of: {
      available: { type: Number, default: 0 },
      locked: { type: Number, default: 0 },
    },
    default: {},
  },
}, {
  timestamps: true,
});

// Helper to ensure an asset entry exists in the map
WalletSchema.methods.ensureAssetExists = function (asset) {
  const assetUpper = asset.toUpperCase();
  if (!this.balances.has(assetUpper)) {
    this.balances.set(assetUpper, { available: 0, locked: 0 });
  }
  return assetUpper;
};

// Credit funds to available balance
WalletSchema.methods.credit = async function (asset, amount) {
  const assetKey = this.ensureAssetExists(asset);
  const bal = this.balances.get(assetKey);
  bal.available = parseFloat((bal.available + amount).toFixed(8));
  this.balances.set(assetKey, bal);
  this.markModified('balances');
  return this.save();
};

// Debit funds
// type = 'available' (for withdrawals or instant market orders) or 'locked' (for filling existing limit orders)
WalletSchema.methods.debit = async function (asset, amount, type = 'available') {
  const assetKey = this.ensureAssetExists(asset);
  const bal = this.balances.get(assetKey);
  
  if (type === 'available') {
    if (bal.available < amount) {
      throw new Error(`Insufficient available balance for ${assetKey}`);
    }
    bal.available = parseFloat((bal.available - amount).toFixed(8));
  } else if (type === 'locked') {
    if (bal.locked < amount) {
      throw new Error(`Insufficient locked balance for ${assetKey}`);
    }
    bal.locked = parseFloat((bal.locked - amount).toFixed(8));
  } else {
    throw new Error(`Invalid debit type: ${type}`);
  }
  
  this.balances.set(assetKey, bal);
  this.markModified('balances');
  return this.save();
};

// Lock funds (move available -> locked when placing a limit order)
WalletSchema.methods.lockFunds = async function (asset, amount) {
  const assetKey = this.ensureAssetExists(asset);
  const bal = this.balances.get(assetKey);
  
  if (bal.available < amount) {
    throw new Error(`Insufficient available balance to lock for ${assetKey}`);
  }
  
  bal.available = parseFloat((bal.available - amount).toFixed(8));
  bal.locked = parseFloat((bal.locked + amount).toFixed(8));
  
  this.balances.set(assetKey, bal);
  this.markModified('balances');
  return this.save();
};

// Unlock funds (move locked -> available when cancelling a limit order)
WalletSchema.methods.unlockFunds = async function (asset, amount) {
  const assetKey = this.ensureAssetExists(asset);
  const bal = this.balances.get(assetKey);
  
  if (bal.locked < amount) {
    throw new Error(`Insufficient locked balance to unlock for ${assetKey}`);
  }
  
  bal.locked = parseFloat((bal.locked - amount).toFixed(8));
  bal.available = parseFloat((bal.available + amount).toFixed(8));
  
  this.balances.set(assetKey, bal);
  this.markModified('balances');
  return this.save();
};

module.exports = mongoose.model('Wallet', WalletSchema);
