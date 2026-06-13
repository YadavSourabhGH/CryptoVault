const Order = require('../models/Order');
const Trade = require('../models/Trade');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

// Shared Socket.io ref
let io = null;

const initMatchingEngine = (socketIo) => {
  io = socketIo;
  console.log('Matching Engine initialized');
};

// Emits order updates to the user's private socket room
const notifyUserOrderUpdate = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId.toString()}`).emit(event, data);
  }
};

const notifyUserWalletUpdate = async (userId) => {
  if (io) {
    const wallet = await Wallet.findOne({ userId });
    if (wallet) {
      io.to(`user:${userId.toString()}`).emit('wallet_update', { balances: Object.fromEntries(wallet.balances) });
    }
  }
};

// Places and processes a new order
const processOrder = async (orderData) => {
  const { userId, symbol, side, type, price, quantity, stopPrice } = orderData;
  const pairBase = symbol.replace('USDT', ''); // Simplification for base asset
  const pairQuote = 'USDT';
  
  const wallet = await Wallet.findOne({ userId });
  if (!wallet) throw new Error('User wallet not found');

  const tickerPrice = require('./priceEngine').getTicker(symbol).price;

  // 1. Create the Order in memory / draft status
  const order = new Order({
    userId,
    symbol,
    side,
    type,
    price: type === 'MARKET' ? tickerPrice : price,
    quantity,
    remainingQty: quantity,
    filledQty: 0,
    status: 'OPEN',
    stopPrice: type === 'STOP_LIMIT' ? stopPrice : undefined,
  });

  // Calculate required amount to lock / check availability
  const orderPrice = type === 'MARKET' ? tickerPrice : price;
  const totalCost = quantity * orderPrice;

  // 2. Perform validation & lock balances before matching
  if (side === 'BUY') {
    // Checking quote asset (USDT)
    const quoteBalance = wallet.balances.get(pairQuote) || { available: 0, locked: 0 };
    if (quoteBalance.available < totalCost) {
      throw new Error(`Insufficient USDT balance. Required: ${totalCost.toFixed(2)} USDT, Available: ${quoteBalance.available.toFixed(2)} USDT`);
    }
    
    // For MARKET order, we debit immediately. For LIMIT/STOP_LIMIT, we lock.
    if (type === 'MARKET') {
      await wallet.debit(pairQuote, totalCost, 'available');
    } else if (type === 'LIMIT') {
      await wallet.lockFunds(pairQuote, totalCost);
    }
    // STOP_LIMIT orders only lock funds AFTER they get triggered and converted to LIMIT.
    // For simplicity, we can lock funds for STOP_LIMIT immediately to ensure the trader has the balance when triggered.
    else if (type === 'STOP_LIMIT') {
      await wallet.lockFunds(pairQuote, totalCost);
    }
  } else {
    // Checking base asset (BTC, ETH, etc.)
    const baseBalance = wallet.balances.get(pairBase) || { available: 0, locked: 0 };
    if (baseBalance.available < quantity) {
      throw new Error(`Insufficient ${pairBase} balance. Required: ${quantity} ${pairBase}, Available: ${baseBalance.available} ${pairBase}`);
    }

    if (type === 'MARKET') {
      await wallet.debit(pairBase, quantity, 'available');
    } else if (type === 'LIMIT') {
      await wallet.lockFunds(pairBase, quantity);
    } else if (type === 'STOP_LIMIT') {
      await wallet.lockFunds(pairBase, quantity);
    }
  }

  // 3. Save order to MongoDB
  await order.save();
  await notifyUserWalletUpdate(userId);

  // 4. Match Order
  if (type === 'MARKET') {
    // MARKET order execution
    await executeMarketOrder(order, tickerPrice, wallet, pairBase, pairQuote);
  } else if (type === 'LIMIT') {
    // LIMIT order matching against other users' orders
    await matchLimitOrder(order, wallet, pairBase, pairQuote);
  }

  return order;
};

// Execute market order instantly against current price
const executeMarketOrder = async (order, executionPrice, wallet, base, quote) => {
  const feeRate = 0.001; // 0.1% fee
  const orderTotal = order.quantity * executionPrice;
  const fee = orderTotal * feeRate;

  order.filledQty = order.quantity;
  order.remainingQty = 0;
  order.status = 'FILLED';
  
  // Set execution price on fills
  order.fills.push({
    price: executionPrice,
    quantity: order.quantity,
    timestamp: new Date(),
  });

  await order.save();

  // Create a simulated trade record (with null/system seller)
  const trade = await Trade.create({
    symbol: order.symbol,
    buyOrderId: order.side === 'BUY' ? order._id : new mongoose.Types.ObjectId(),
    sellOrderId: order.side === 'SELL' ? order._id : new mongoose.Types.ObjectId(),
    buyUserId: order.side === 'BUY' ? order.userId : new mongoose.Types.ObjectId(),
    sellUserId: order.side === 'SELL' ? order.userId : new mongoose.Types.ObjectId(),
    price: executionPrice,
    quantity: order.quantity,
    fee,
  });

  // Credit user wallet
  if (order.side === 'BUY') {
    // Bought base currency (BTC), credited to available
    await wallet.credit(base, order.quantity);
    // Write fee transaction (debit from USDT)
    await wallet.debit(quote, fee, 'available');
    
    await Transaction.create({
      userId: order.userId,
      type: 'DEPOSIT',
      asset: base,
      amount: order.quantity,
      reference: `Buy order fill ${order._id}`,
    });
    await Transaction.create({
      userId: order.userId,
      type: 'TRADE_FEE',
      asset: quote,
      amount: fee,
      reference: `Fee on order ${order._id}`,
    });
  } else {
    // Sold base currency, credit quote (USDT) minus fee
    const creditedAmount = orderTotal - fee;
    await wallet.credit(quote, creditedAmount);

    await Transaction.create({
      userId: order.userId,
      type: 'DEPOSIT',
      asset: quote,
      amount: creditedAmount,
      reference: `Sell order fill ${order._id}`,
    });
    await Transaction.create({
      userId: order.userId,
      type: 'TRADE_FEE',
      asset: quote,
      amount: fee,
      reference: `Fee on order ${order._id}`,
    });
  }

  // Notify UI
  notifyUserOrderUpdate(order.userId, 'order_filled', {
    orderId: order._id,
    fillPrice: executionPrice,
    fillQty: order.quantity,
    remainingQty: 0,
    status: 'FILLED',
  });
  
  if (io) {
    io.to(order.symbol).emit('trade_update', {
      symbol: order.symbol,
      price: executionPrice,
      qty: order.quantity,
      side: order.side,
      timestamp: new Date(),
    });
  }

  await notifyUserWalletUpdate(order.userId);
};

// Match LIMIT order against existing opposing limit orders
const matchLimitOrder = async (order, wallet, base, quote) => {
  const opposingSide = order.side === 'BUY' ? 'SELL' : 'BUY';
  
  // Find matching opposing orders
  const sortCriteria = order.side === 'BUY' ? { price: 1, createdAt: 1 } : { price: -1, createdAt: 1 };
  const query = {
    symbol: order.symbol,
    side: opposingSide,
    status: { $in: ['OPEN', 'PARTIALLY_FILLED'] },
    type: 'LIMIT',
  };

  if (order.side === 'BUY') {
    query.price = { $lte: order.price }; // Buy price must be >= Sell price
  } else {
    query.price = { $gte: order.price }; // Sell price must be <= Buy price
  }

  const matches = await Order.find(query).sort(sortCriteria);

  for (const oppositeOrder of matches) {
    if (order.remainingQty <= 0) break;

    const fillQty = Math.min(order.remainingQty, oppositeOrder.remainingQty);
    const fillPrice = oppositeOrder.price; // Fill at the maker's price (the order already in book)
    const tradeTotal = fillQty * fillPrice;
    const feeRate = 0.001;
    const fee = tradeTotal * feeRate;

    // Load counterparty wallet
    const oppositeWallet = await Wallet.findOne({ userId: oppositeOrder.userId });
    if (!oppositeWallet) continue;

    // Execute Trade
    const trade = await Trade.create({
      symbol: order.symbol,
      buyOrderId: order.side === 'BUY' ? order._id : oppositeOrder._id,
      sellOrderId: order.side === 'SELL' ? order._id : oppositeOrder._id,
      buyUserId: order.side === 'BUY' ? order.userId : oppositeOrder.userId,
      sellUserId: order.side === 'SELL' ? order.userId : oppositeOrder.userId,
      price: fillPrice,
      quantity: fillQty,
      fee: fee * 2,
    });

    // Update order fills & progress
    order.filledQty += fillQty;
    order.remainingQty -= fillQty;
    order.status = order.remainingQty === 0 ? 'FILLED' : 'PARTIALLY_FILLED';
    order.fills.push({ price: fillPrice, quantity: fillQty, tradeId: trade._id });

    oppositeOrder.filledQty += fillQty;
    oppositeOrder.remainingQty -= fillQty;
    oppositeOrder.status = oppositeOrder.remainingQty === 0 ? 'FILLED' : 'PARTIALLY_FILLED';
    oppositeOrder.fills.push({ price: fillPrice, quantity: fillQty, tradeId: trade._id });

    await order.save();
    await oppositeOrder.save();

    // Adjust Wallets
    if (order.side === 'BUY') {
      // Order Owner is BUYER: debit locked USDT, credit available Base (e.g. BTC)
      await wallet.debit(quote, tradeTotal, 'locked');
      await wallet.credit(base, fillQty);
      await wallet.debit(quote, fee, 'available'); // fee

      // Counterparty is SELLER: debit locked Base, credit available USDT (minus fee)
      await oppositeWallet.debit(base, fillQty, 'locked');
      await oppositeWallet.credit(quote, tradeTotal - fee);
    } else {
      // Order Owner is SELLER: debit locked Base, credit available USDT (minus fee)
      await wallet.debit(base, fillQty, 'locked');
      await wallet.credit(quote, tradeTotal - fee);

      // Counterparty is BUYER: debit locked USDT, credit available Base
      await oppositeWallet.debit(quote, tradeTotal, 'locked');
      await oppositeWallet.credit(base, fillQty);
      await oppositeWallet.debit(quote, fee, 'available'); // fee
    }

    await wallet.save();
    await oppositeWallet.save();

    // Create Transactions
    await Transaction.create({
      userId: order.userId,
      type: 'DEPOSIT',
      asset: order.side === 'BUY' ? base : quote,
      amount: order.side === 'BUY' ? fillQty : (tradeTotal - fee),
      reference: `Limit order fill ${order._id}`,
    });
    await Transaction.create({
      userId: oppositeOrder.userId,
      type: 'DEPOSIT',
      asset: order.side === 'BUY' ? quote : base,
      amount: order.side === 'BUY' ? (tradeTotal - fee) : fillQty,
      reference: `Limit order fill ${oppositeOrder._id}`,
    });

    // Notify clients
    notifyUserOrderUpdate(order.userId, 'order_filled', {
      orderId: order._id,
      fillPrice,
      fillQty,
      remainingQty: order.remainingQty,
      status: order.status,
    });

    notifyUserOrderUpdate(oppositeOrder.userId, 'order_filled', {
      orderId: oppositeOrder._id,
      fillPrice,
      fillQty,
      remainingQty: oppositeOrder.remainingQty,
      status: oppositeOrder.status,
    });

    if (io) {
      io.to(order.symbol).emit('trade_update', {
        symbol: order.symbol,
        price: fillPrice,
        qty: fillQty,
        side: order.side,
        timestamp: new Date(),
      });
    }

    await notifyUserWalletUpdate(order.userId);
    await notifyUserWalletUpdate(oppositeOrder.userId);
  }
};

// Periodic checker mapping OPEN orders directly to price ticks (for single-user feel)
const checkOpenOrdersAgainstTicker = async (symbol, tickerPrice) => {
  try {
    const openOrders = await Order.find({
      symbol,
      status: { $in: ['OPEN', 'PARTIALLY_FILLED'] },
    });

    for (const order of openOrders) {
      // 1. Process STOP_LIMIT trigger
      if (order.type === 'STOP_LIMIT') {
        let trigger = false;
        // Trigger STOP BUY if ticker rising above stopPrice
        if (order.side === 'BUY' && tickerPrice >= order.stopPrice) {
          trigger = true;
        }
        // Trigger STOP SELL if ticker falling below stopPrice
        else if (order.side === 'SELL' && tickerPrice <= order.stopPrice) {
          trigger = true;
        }

        if (trigger) {
          order.type = 'LIMIT'; // Convert to standard limit order
          await order.save();
          notifyUserOrderUpdate(order.userId, 'order_update', {
            orderId: order._id,
            type: 'LIMIT',
            message: `Stop limit order triggered at ${tickerPrice}`,
          });
        }
        continue; // Check matching next tick
      }

      // 2. Process Simulated Limit Fills
      let fill = false;
      if (order.side === 'BUY' && tickerPrice <= order.price) {
        fill = true;
      } else if (order.side === 'SELL' && tickerPrice >= order.price) {
        fill = true;
      }

      if (fill) {
        const pairBase = symbol.replace('USDT', '');
        const pairQuote = 'USDT';
        const wallet = await Wallet.findOne({ userId: order.userId });
        if (!wallet) continue;

        // Perform instant simulated fill (like Market but at order.price)
        const fillQty = order.remainingQty;
        const fillPrice = order.price;
        const tradeTotal = fillQty * fillPrice;
        const fee = tradeTotal * 0.001;

        // Update DB
        order.filledQty += fillQty;
        order.remainingQty = 0;
        order.status = 'FILLED';
        order.fills.push({ price: fillPrice, quantity: fillQty });
        await order.save();

        // Adjust wallets
        if (order.side === 'BUY') {
          // Debit locked USDT, Credit available crypto
          await wallet.debit(pairQuote, tradeTotal, 'locked');
          await wallet.credit(pairBase, fillQty);
          await wallet.credit(pairQuote, (order.quantity * order.price) - tradeTotal); // refund difference if any
          
          // Apply fee
          await wallet.debit(pairQuote, fee, 'available');
        } else {
          // Debit locked crypto, Credit USDT
          await wallet.debit(pairBase, fillQty, 'locked');
          await wallet.credit(pairQuote, tradeTotal - fee);
        }
        await wallet.save();

        // Log transaction
        await Transaction.create({
          userId: order.userId,
          type: 'DEPOSIT',
          asset: order.side === 'BUY' ? pairBase : pairQuote,
          amount: order.side === 'BUY' ? fillQty : (tradeTotal - fee),
          reference: `Simulated Limit order fill ${order._id}`,
        });

        // Log trade
        await Trade.create({
          symbol: order.symbol,
          buyOrderId: order.side === 'BUY' ? order._id : new mongoose.Types.ObjectId(),
          sellOrderId: order.side === 'SELL' ? order._id : new mongoose.Types.ObjectId(),
          buyUserId: order.side === 'BUY' ? order.userId : new mongoose.Types.ObjectId(),
          sellUserId: order.side === 'SELL' ? order.userId : new mongoose.Types.ObjectId(),
          price: fillPrice,
          quantity: fillQty,
          fee,
        });

        // Notify client
        notifyUserOrderUpdate(order.userId, 'order_filled', {
          orderId: order._id,
          fillPrice,
          fillQty,
          remainingQty: 0,
          status: 'FILLED',
        });

        if (io) {
          io.to(symbol).emit('trade_update', {
            symbol,
            price: fillPrice,
            qty: fillQty,
            side: order.side,
            timestamp: new Date(),
          });
        }

        await notifyUserWalletUpdate(order.userId);
      }
    }
  } catch (err) {
    console.error('Error matching open orders against ticker:', err.message);
  }
};

// Cancel an order
const cancelOrder = async (orderId, userId) => {
  const order = await Order.findOne({ _id: orderId, userId });
  if (!order) throw new Error('Order not found');

  if (order.status === 'FILLED' || order.status === 'CANCELLED') {
    throw new Error('Order already finalized');
  }

  const pairBase = order.symbol.replace('USDT', '');
  const pairQuote = 'USDT';
  const wallet = await Wallet.findOne({ userId });
  
  if (wallet) {
    if (order.side === 'BUY') {
      const lockAmount = order.remainingQty * order.price;
      await wallet.unlockFunds(pairQuote, lockAmount);
    } else {
      await wallet.unlockFunds(pairBase, order.remainingQty);
    }
    await wallet.save();
    await notifyUserWalletUpdate(userId);
  }

  order.status = 'CANCELLED';
  await order.save();

  if (io) {
    io.to(`user:${userId.toString()}`).emit('order_cancelled', { orderId: order._id });
  }

  return order;
};

module.exports = {
  initMatchingEngine,
  processOrder,
  checkOpenOrdersAgainstTicker,
  cancelOrder,
};
