const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { INITIAL_USDT_BALANCE } = require('../config/constants');

const router = express.Router();

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'cryptovault_super_secret_jwt_key_2024', {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', authLimiter, async (req, res, next) => {
  const { name, email, password } = req.body;

  try {
    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Determine role: if first user, make admin (for testing convenience), else trader
    const userCount = await User.countDocuments({});
    const role = userCount === 0 ? 'admin' : 'trader';

    // Create User
    const user = await User.create({
      name,
      email,
      password,
      role,
    });

    // Create Wallet with initial demo USDT balance
    const wallet = await Wallet.create({
      userId: user._id,
      balances: {
        USDT: { available: INITIAL_USDT_BALANCE, locked: 0 },
      },
    });

    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        kycStatus: user.kycStatus,
      },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', authLimiter, async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account has been deactivated' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Fetch user wallet summary
    const wallet = await Wallet.findOne({ userId: user._id });

    res.json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        kycStatus: user.kycStatus,
      },
      walletSummary: wallet ? Object.fromEntries(wallet.balances) : {},
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Log user out
// @route   POST /api/auth/logout
// @access  Public
router.post('/logout', (req, res) => {
  // Client handles token discard on logout, but we return confirmation
  res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;
