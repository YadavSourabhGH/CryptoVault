import { useState, useEffect } from 'react';
import api from '../lib/api';
import { subscribeToOrderBook, socket } from '../lib/socket';

export function useOrderBook(symbol) {
  const [orderBook, setOrderBook] = useState({ bids: [], asks: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!symbol) return;
    const upperSymbol = symbol.toUpperCase();
    setIsLoading(true);

    // 1. Fetch initial snapshot via HTTP
    const fetchSnapshot = async () => {
      try {
        const res = await api.get(`/market/orderbook/${upperSymbol}?depth=15`);
        setOrderBook({
          bids: res.data.bids || [],
          asks: res.data.asks || [],
        });
        setIsLoading(false);
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
      }
    };

    fetchSnapshot();

    // 2. Subscribe via Socket
    subscribeToOrderBook(upperSymbol);

    // Listen for socket events
    const handleSocketUpdate = (data) => {
      if (data.symbol === upperSymbol) {
        setOrderBook({
          bids: data.bids || [],
          asks: data.asks || [],
        });
      }
    };

    socket.on('orderbook', handleSocketUpdate);

    // Re-subscribe on reconnect
    const onConnect = () => {
      subscribeToOrderBook(upperSymbol);
    };
    socket.on('connect', onConnect);

    return () => {
      socket.off('orderbook', handleSocketUpdate);
      socket.off('connect', onConnect);
    };
  }, [symbol]);

  return { bids: orderBook.bids, asks: orderBook.asks, isLoading, error };
}
export default useOrderBook;
