import { useEffect } from 'react';
import { useMarketStore } from '../store/marketStore';
import { subscribeToTicker, socket } from '../lib/socket';

export function useTicker(symbol) {
  const tickers = useMarketStore((state) => state.tickers);
  const ticker = tickers[symbol?.toUpperCase()];

  useEffect(() => {
    if (!symbol) return;
    const upperSymbol = symbol.toUpperCase();
    
    // Subscribe to symbol updates on mount/change
    subscribeToTicker(upperSymbol);

    // If socket reconnects, re-subscribe
    const onConnect = () => {
      subscribeToTicker(upperSymbol);
    };

    socket.on('connect', onConnect);

    return () => {
      socket.off('connect', onConnect);
    };
  }, [symbol]);

  return ticker;
}
export default useTicker;
