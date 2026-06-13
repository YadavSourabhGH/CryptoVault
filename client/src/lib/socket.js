import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '/';

// Initialize socket client with options (reconnection, manual connect)
export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});

// Setup room helper commands
export const subscribeToTicker = (symbol) => {
  if (socket.connected) {
    socket.emit('subscribe_ticker', symbol);
  }
};

export const subscribeToCandles = (symbol, interval) => {
  if (socket.connected) {
    socket.emit('subscribe_candles', { symbol, interval });
  }
};

export const subscribeToOrderBook = (symbol) => {
  if (socket.connected) {
    socket.emit('subscribe_orderbook', symbol);
  }
};

export const joinUserRoom = (userId) => {
  if (socket.connected) {
    socket.emit('join_user_room', userId);
  }
};

export const leaveUserRoom = (userId) => {
  if (socket.connected) {
    socket.emit('leave_user_room', userId);
  }
};
