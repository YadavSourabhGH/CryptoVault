require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Order = require('../models/Order');
const Trade = require('../models/Trade');
const Transaction = require('../models/Transaction');
const PriceHistory = require('../models/PriceHistory');
const { SUPPORTED_PAIRS } = require('../config/constants');
const { generateHistoricalCandles } = require('./generateOHLC');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cryptovault';
    console.log(`Connecting to MongoDB for seeding at: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    // Clear existing data
    console.log('Clearing database tables...');
    await User.deleteMany({});
    await Wallet.deleteMany({});
    await Order.deleteMany({});
    await Trade.deleteMany({});
    await Transaction.deleteMany({});
    await PriceHistory.deleteMany({});

    console.log('Seeding users...');
    // Create 3 demo accounts
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@cryptovault.com',
      password: 'Admin@123',
      role: 'admin',
      kycStatus: 'approved',
    });

    const trader = await User.create({
      name: 'Trader User',
      email: 'trader@cryptovault.com',
      password: 'Trader@123',
      role: 'trader',
      kycStatus: 'approved',
    });

    const viewer = await User.create({
      name: 'Viewer User',
      email: 'viewer@cryptovault.com',
      password: 'Viewer@123',
      role: 'viewer',
      kycStatus: 'none',
    });

    console.log('Seeding wallets...');
    // Setup wallets for all users
    const users = [admin, trader, viewer];
    let walletCount = 0;

    for (const u of users) {
      const wallet = new Wallet({
        userId: u._id,
        balances: new Map([
          ['USDT', { available: 10000, locked: 0 }],
          ['BTC', { available: 0.5, locked: 0 }],
          ['ETH', { available: 3.0, locked: 0 }],
          ['BNB', { available: 5.0, locked: 0 }],
          ['SOL', { available: 15.0, locked: 0 }],
          ['XRP', { available: 500, locked: 0 }],
          ['ADA', { available: 1000, locked: 0 }],
          ['DOGE', { available: 3000, locked: 0 }],
          ['DOT', { available: 50, locked: 0 }],
          ['MATIC', { available: 200, locked: 0 }],
          ['LINK', { available: 20, locked: 0 }],
        ]),
      });
      await wallet.save();
      walletCount++;

      // Log initial deposit transactions
      await Transaction.create({
        userId: u._id,
        type: 'DEPOSIT',
        asset: 'USDT',
        amount: 10000,
        balanceBefore: 0,
        balanceAfter: 10000,
        reference: 'Initial demo deposit',
      });
    }

    console.log('Seeding historical candlesticks (this may take a few seconds)...');
    let candleCount = 0;
    const intervals = ['1m', '5m', '15m', '1h', '4h', '1d'];

    // Generate OHLC candles for all pairs and intervals
    for (const pair of SUPPORTED_PAIRS) {
      for (const interval of intervals) {
        // Decide candle limit per interval
        let limit = 200;
        if (interval === '1d') limit = 30; // 30 days
        if (interval === '4h') limit = 60; // 10 days
        if (interval === '1h') limit = 120; // 5 days

        const candles = generateHistoricalCandles(pair.symbol, interval, pair.basePrice, pair.volatility, limit);
        await PriceHistory.insertMany(candles);
        candleCount += candles.length;
      }
    }

    console.log('Seeding mock historical filled orders & trades...');
    let orderCount = 0;
    let tradeCount = 0;

    for (let i = 0; i < 50; i++) {
      const pair = SUPPORTED_PAIRS[i % SUPPORTED_PAIRS.length];
      const timeOffset = i * 2 * 60 * 60 * 1000; // spaced apart by 2 hours
      const timestamp = new Date(Date.now() - timeOffset);
      const executionPrice = parseFloat((pair.basePrice * (1 + (Math.random() * 0.04 - 0.02))).toFixed(8));
      const qty = parseFloat((Math.random() * (200 / executionPrice) + (0.1 / executionPrice)).toFixed(4));
      const total = qty * executionPrice;
      const fee = total * 0.001;

      // Buy side
      const buyOrder = await Order.create({
        userId: trader._id,
        symbol: pair.symbol,
        side: 'BUY',
        type: 'LIMIT',
        price: executionPrice,
        quantity: qty,
        filledQty: qty,
        remainingQty: 0,
        status: 'FILLED',
        createdAt: timestamp,
        updatedAt: timestamp,
        fills: [{ price: executionPrice, quantity: qty, timestamp }],
      });

      // Sell side
      const sellOrder = await Order.create({
        userId: admin._id,
        symbol: pair.symbol,
        side: 'SELL',
        type: 'LIMIT',
        price: executionPrice,
        quantity: qty,
        filledQty: qty,
        remainingQty: 0,
        status: 'FILLED',
        createdAt: timestamp,
        updatedAt: timestamp,
        fills: [{ price: executionPrice, quantity: qty, timestamp }],
      });

      // Trade execution record
      await Trade.create({
        symbol: pair.symbol,
        buyOrderId: buyOrder._id,
        sellOrderId: sellOrder._id,
        buyUserId: trader._id,
        sellUserId: admin._id,
        price: executionPrice,
        quantity: qty,
        fee: fee * 2,
        timestamp,
      });

      orderCount += 2;
      tradeCount += 1;
    }

    console.log(`\n✅ Database Seeding Complete!`);
    console.log(`Seeded: ${users.length} users`);
    console.log(`Seeded: ${walletCount} wallets`);
    console.log(`Seeded: ${candleCount} historical candles`);
    console.log(`Seeded: ${orderCount} orders`);
    console.log(`Seeded: ${tradeCount} trades`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error.message);
    process.exit(1);
  }
};

seedData();
