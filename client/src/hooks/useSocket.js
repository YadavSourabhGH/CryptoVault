import { useEffect } from 'react';
import { socket } from '../lib/socket';
import { useAuthStore } from '../store/authStore';
import { useMarketStore } from '../store/marketStore';
import { useOrderStore } from '../store/orderStore';

export function useSocket() {
  const { user, isAuthenticated } = useAuthStore();
  const { updateTicker, updateAllTickers } = useMarketStore();
  const { handleOrderFilled, handleOrderCancelled } = useOrderStore();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Connect Socket
      socket.connect();
      socket.emit('join_user_room', user.id || user._id);

      // Listeners for global events
      socket.on('tickers', (tickersMap) => {
        updateAllTickers(tickersMap);
      });

      socket.on('ticker', (tickerData) => {
        updateTicker(tickerData.symbol, tickerData);
      });

      // Listeners for private user events
      socket.on('order_filled', (data) => {
        handleOrderFilled(data);
      });

      socket.on('order_cancelled', (data) => {
        handleOrderCancelled(data);
      });

      socket.on('wallet_update', (data) => {
        // We can dispatch a custom event or let components listen, 
        // but since we want to trigger wallet page updates, we can use a custom window event
        // or just let the WalletPage subscribe directly.
        // Let's dispatch a custom DOM event for easy component sync:
        window.dispatchEvent(new CustomEvent('wallet_balance_updated', { detail: data.balances }));
      });
    }

    return () => {
      // Clean up listeners
      socket.off('tickers');
      socket.off('ticker');
      socket.off('order_filled');
      socket.off('order_cancelled');
      socket.off('wallet_update');
      
      if (user) {
        socket.emit('leave_user_room', user.id || user._id);
      }
      socket.disconnect();
    };
  }, [isAuthenticated, user]);
}
export default useSocket;
