const express = require('express');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const User = require('../models/User');
const Order = require('../models/Order');
const Trade = require('../models/Trade');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const { overridePrice, getCurrentPrices } = require('../services/priceEngine');

const router = express.Router();

// Apply auth and admin check to all routes
router.use(protect);
router.use(authorize('admin'));

// @desc    Get all users with their wallet status
// @route   GET /api/admin/users
// @access  Private/Admin
router.get('/users', async (req, res, next) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    const usersWithWallets = [];

    for (const user of users) {
      const wallet = await Wallet.findOne({ userId: user._id });
      usersWithWallets.push({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        kycStatus: user.kycStatus,
        createdAt: user.createdAt,
        walletBalances: wallet ? Object.fromEntries(wallet.balances) : {},
      });
    }

    res.json({
      success: true,
      users: usersWithWallets,
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update user details (role, status, KYC)
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
router.put('/users/:id', async (req, res, next) => {
  const { role, isActive, kycStatus } = req.body;

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update fields if provided
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    if (kycStatus) user.kycStatus = kycStatus;

    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        kycStatus: user.kycStatus,
      },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get system-wide platform statistics
// @route   GET /api/admin/system
// @access  Private/Admin
router.get('/system', async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments({});
    const totalOrders = await Order.countDocuments({});
    const openOrders = await Order.countDocuments({ status: { $in: ['OPEN', 'PARTIALLY_FILLED'] } });
    
    // Calculate 24h platform volume
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentTrades = await Trade.find({ timestamp: { $gte: oneDayAgo } });
    
    let volume24h = 0;
    recentTrades.forEach((trade) => {
      volume24h += trade.price * trade.quantity;
    });

    // Simulated health stats
    const cpuUsage = Math.floor(Math.random() * 25) + 5; // 5-30%
    const memoryUsage = Math.floor(Math.random() * 20) + 40; // 40-60%

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalOrders,
        openOrders,
        volume24h: parseFloat(volume24h.toFixed(2)),
        uptime: process.uptime(),
        systemHealth: {
          cpu: cpuUsage,
          memory: memoryUsage,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Override simulated coin price
// @route   POST /api/admin/market/override-price
// @access  Private/Admin
router.post('/market/override-price', async (req, res, next) => {
  const { symbol, price } = req.body;

  if (!symbol || !price || parseFloat(price) <= 0) {
    return res.status(400).json({ success: false, message: 'Please provide valid symbol and positive price' });
  }

  try {
    const success = await overridePrice(symbol.toUpperCase(), parseFloat(price));
    if (!success) {
      return res.status(404).json({ success: false, message: `Pair ${symbol} not found` });
    }

    res.json({
      success: true,
      message: `Successfully overrode price of ${symbol} to ${price}`,
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get audit trail of transactions
// @route   GET /api/admin/audit-log
// @access  Private/Admin
router.get('/audit-log', async (req, res, next) => {
  try {
    const logs = await Transaction.find({})
      .populate('userId', 'name email')
      .sort({ timestamp: -1 })
      .limit(100);

    res.json({
      success: true,
      logs,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
