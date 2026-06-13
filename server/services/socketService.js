const socketIo = require('socket.io');

let io = null;

const initSockets = (server) => {
  io = socketIo(server, {
    cors: {
      origin: '*', // In development, allow all origins
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    // console.log(`New socket client connected: ${socket.id}`);

    // Client subscribes to symbol updates (ticker, orderbook, trades)
    socket.on('subscribe_ticker', (symbol) => {
      if (!symbol) return;
      const upperSymbol = symbol.toUpperCase();
      
      // Leave previous symbol rooms to save bandwidth
      const rooms = Array.from(socket.rooms);
      rooms.forEach((room) => {
        if (room !== socket.id && !room.startsWith('user:') && !room.includes(':')) {
          socket.leave(room);
        }
      });

      socket.join(upperSymbol);
      // console.log(`Socket ${socket.id} subscribed to ticker: ${upperSymbol}`);
    });

    // Client subscribes to a specific candle interval for charting
    socket.on('subscribe_candles', ({ symbol, interval }) => {
      if (!symbol || !interval) return;
      const upperSymbol = symbol.toUpperCase();
      const candleRoom = `${upperSymbol}:${interval}`;

      // Leave other candle rooms
      const rooms = Array.from(socket.rooms);
      rooms.forEach((room) => {
        if (room.includes(':') && !room.startsWith('user:')) {
          socket.leave(room);
        }
      });

      socket.join(candleRoom);
      // console.log(`Socket ${socket.id} subscribed to candles: ${candleRoom}`);
    });

    // Client subscribes to orderbook updates
    socket.on('subscribe_orderbook', (symbol) => {
      if (!symbol) return;
      const upperSymbol = symbol.toUpperCase();
      socket.join(upperSymbol);
      // console.log(`Socket ${socket.id} subscribed to orderbook: ${upperSymbol}`);
    });

    // Client joins private room after auth
    socket.on('join_user_room', (userId) => {
      if (!userId) return;
      const userRoom = `user:${userId}`;
      socket.join(userRoom);
      // console.log(`Socket ${socket.id} joined private room: ${userRoom}`);
    });

    // Client manually leaves private room
    socket.on('leave_user_room', (userId) => {
      if (!userId) return;
      socket.leave(`user:${userId}`);
    });

    socket.on('disconnect', () => {
      // console.log(`Socket client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIo = () => io;

module.exports = {
  initSockets,
  getIo,
};
