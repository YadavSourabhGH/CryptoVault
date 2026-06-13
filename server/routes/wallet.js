const express = require('express');
const { protect } = require('../middleware/auth');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');

const router = express.Router();

router.use(protect); // Secure all endpoints

// @desc    Get user wallet balances
// @route   GET /api/wallet
// @access  Private
router.get('/', async (req, res, next) => {
  try {
    let wallet = await Wallet.findOne({ userId: req.user.id });
    
    // If no wallet exists for some reason, provision it now
    if (!wallet) {
      wallet = await Wallet.create({
        userId: req.user.id,
        balances: {
          USDT: { available: 10000, locked: 0 }
        }
      });
    }

    res.json({
      success: true,
      balances: Object.fromEntries(wallet.balances),
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Simulate depositing funds
// @route   POST /api/wallet/deposit
// @access  Private
router.post('/deposit', async (req, res, next) => {
  const { asset, amount } = req.body;

  if (!asset || !amount || parseFloat(amount) <= 0) {
    return res.status(400).json({ success: false, message: 'Please provide valid asset symbol and positive amount' });
  }

  const assetUpper = asset.toUpperCase();
  const depositAmt = parseFloat(amount);

  try {
    const wallet = await Wallet.findOne({ userId: req.user.id });
    if (!wallet) {
      return res.status(404).json({ success: false, message: 'Wallet not found' });
    }

    // Get balance before deposit
    wallet.ensureAssetExists(assetUpper);
    const balanceBefore = wallet.balances.get(assetUpper).available;

    // Credit funds
    await wallet.credit(assetUpper, depositAmt);
    const balanceAfter = balanceBefore + depositAmt;

    // Log transaction
    const tx = await Transaction.create({
      userId: req.user.id,
      type: 'DEPOSIT',
      asset: assetUpper,
      amount: depositAmt,
      balanceBefore,
      balanceAfter,
      reference: `Simulated deposit via modal`,
    });

    res.json({
      success: true,
      message: `Successfully deposited ${depositAmt} ${assetUpper}`,
      balances: Object.fromEntries(wallet.balances),
      transaction: tx,
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get user's transaction history
// @route   GET /api/wallet/transactions
// @access  Private
router.get('/transactions', async (req, res, next) => {
  const { asset, type, limit = 50 } = req.query;
  
  const query = { userId: req.user.id };
  if (asset) query.asset = asset.toUpperCase();
  if (type) query.type = type.toUpperCase();

  try {
    const transactions = await Transaction.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      transactions,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
