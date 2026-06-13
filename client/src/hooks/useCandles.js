import { useState, useEffect } from 'react';
import api from '../lib/api';
import { subscribeToCandles, socket } from '../lib/socket';

export function useCandles(symbol, interval) {
  const [candles, setCandles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!symbol || !interval) return;
    const upperSymbol = symbol.toUpperCase();
    setIsLoading(true);
    setCandles([]); // Clear old candles to prevent rendering incorrect intervals during load

    // 1. Fetch historical data via HTTP
    const fetchHistory = async () => {
      try {
        const res = await api.get(`/market/klines/${upperSymbol}?interval=${interval}&limit=500`);
        // Format for lightweight-charts: needs time in seconds or string (YYYY-MM-DD), open, high, low, close, volume (optional)
        const formatted = res.data.candles.map((c) => ({
          time: Math.floor(new Date(c.timestamp).getTime() / 1000),
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
          volume: c.volume,
        }));

        // Deduplicate by timestamp to prevent lightweight-charts assertions from throwing
        const deduplicated = [];
        const seenTimes = new Set();
        for (const item of formatted) {
          if (!seenTimes.has(item.time)) {
            seenTimes.add(item.time);
            deduplicated.push(item);
          }
        }
        // Ensure strictly ascending order by timestamp
        deduplicated.sort((a, b) => a.time - b.time);

        setCandles(deduplicated);
        setIsLoading(false);
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
      }
    };

    fetchHistory();

    // 2. Subscribe to live candle updates via Socket
    subscribeToCandles(upperSymbol, interval);

    const handleCandleUpdate = (candle) => {
      if (candle.symbol === upperSymbol && candle.interval === interval) {
        const candleTime = Math.floor(new Date(candle.timestamp).getTime() / 1000);
        const formattedCandle = {
          time: candleTime,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume,
        };

        setCandles((prevCandles) => {
          if (prevCandles.length === 0) return [formattedCandle];
          const lastCandle = prevCandles[prevCandles.length - 1];

          if (lastCandle.time === formattedCandle.time) {
            // Update last candle
            const updated = [...prevCandles];
            updated[updated.length - 1] = formattedCandle;
            return updated;
          } else if (formattedCandle.time > lastCandle.time) {
            // Append new candle
            return [...prevCandles, formattedCandle];
          }
          return prevCandles;
        });
      }
    };

    socket.on('candle_update', handleCandleUpdate);

    // Re-subscribe on reconnect
    const onConnect = () => {
      subscribeToCandles(upperSymbol, interval);
    };
    socket.on('connect', onConnect);

    return () => {
      socket.off('candle_update', handleCandleUpdate);
      socket.off('connect', onConnect);
    };
  }, [symbol, interval]);

  return { candles, isLoading, error };
}
export default useCandles;
