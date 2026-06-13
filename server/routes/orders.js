const express = require('express');
const { protect } = require('../middleware/auth');
const { processOrder, cancelOrder } = require('../services/matchingEngine');
const Order = require('../models/Order');

const router = express.Router();

router.use(protect); // Secure all endpoints

// @desc    Place a new order
// @route   POST /api/orders
// @access  Private
router.post('/', async (req, res, next) => {
  const { symbol, side, type, price, quantity, stopPrice } = req.body;

  if (!symbol || !side || !type || !quantity) {
    return res.status(400).json({ success: false, message: 'Please provide symbol, side, type, and quantity' });
  }

  try {
    const order = await processOrder({
      userId: req.user.id,
      symbol: symbol.toUpperCase(),
      side: side.toUpperCase(),
      type: type.toUpperCase(),
      price: price ? parseFloat(price) : undefined,
      quantity: parseFloat(quantity),
      stopPrice: stopPrice ? parseFloat(stopPrice) : undefined,
    });

    res.status(201).json({
      success: true,
      order,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// @desc    Get user's open orders
// @route   GET /api/orders/open
// @access  Private
router.get('/open', async (req, res, next) => {
  try {
    const orders = await Order.find({
      userId: req.user.id,
      status: { $in: ['OPEN', 'PARTIALLY_FILLED'] },
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      orders,
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get user's filled or cancelled orders
// @route   GET /api/orders/history
// @access  Private
router.get('/history', async (req, res, next) => {
  const { symbol, limit = 50, page = 1 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const query = {
    userId: req.user.id,
    status: { $in: ['FILLED', 'CANCELLED'] },
  };

  if (symbol) {
    query.symbol = symbol.toUpperCase();
  }

  try {
    const orders = await Order.find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      orders,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Cancel an open order
// @route   DELETE /api/orders/:orderId
// @access  Private
router.delete('/:orderId', async (req, res, next) => {
  try {
    const order = await cancelOrder(req.params.orderId, req.user.id);
    res.json({
      success: true,
      message: 'Order cancelled successfully',
      order,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
