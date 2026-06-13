import React, { useState, useEffect } from 'react';
import { useMarketStore } from '../../store/marketStore';
import api from '../../lib/api';
import { socket } from '../../lib/socket';
import { formatPrice } from '../../lib/utils';
import { format } from 'date-fns';

export function TradeHistory() {
  const selectedPair = useMarketStore((state) => state.selectedPair);
  const [trades, setTrades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const baseSymbol = selectedPair.replace('USDT', '');

  useEffect(() => {
    if (!selectedPair) return;
    const upperSymbol = selectedPair.toUpperCase();
    setIsLoading(true);

    // 1. Fetch initial trade feed snapshot over HTTP
    const fetchHistory = async () => {
      try {
        const res = await api.get(`/market/trades/${upperSymbol}?limit=40`);
        setTrades(res.data.trades || []);
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load trade history snapshot:', err.message);
        setIsLoading(false);
      }
    };

    fetchHistory();

    // 2. Listen for real-time trade updates pushed from backend
    const handleTradeUpdate = (trade) => {
      if (trade.symbol === upperSymbol) {
        setTrades((prevTrades) => {
          // Prepend new trade and keep only the latest 40 items
          const updated = [trade, ...prevTrades];
          return updated.slice(0, 40);
        });
      }
    };

    socket.on('trade_update', handleTradeUpdate);

    return () => {
      socket.off('trade_update', handleTradeUpdate);
    };
  }, [selectedPair]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg-1 text-text-secondary text-xs min-h-[150px]">
        Loading Trades...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-bg-1 border-l border-t border-border select-none text-[11px] font-sans">
      <div className="px-3 py-1.5 text-text-secondary border-b border-border/20 font-semibold text-[10px] uppercase shrink-0">
        Market Trade Feed
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[10px] text-text-secondary border-b border-border/10 h-7 sticky top-0 bg-bg-1 z-10 font-semibold select-none">
              <th className="pl-3">Price(USDT)</th>
              <th className="text-right">Qty({baseSymbol})</th>
              <th className="text-right pr-3">Time</th>
            </tr>
          </thead>
          <tbody>
            {trades.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-6 text-text-muted">
                  No trades executed
                </td>
              </tr>
            ) : (
              trades.map((trade, idx) => {
                const isBuy = trade.side === 'BUY';
                const formattedTime = format(new Date(trade.timestamp || trade.time), 'HH:mm:ss');

                return (
                  <tr
                    key={`feed-${idx}`}
                    className="h-6 hover:bg-bg-2/30 transition-colors font-mono"
                  >
                    <td className={`pl-3 font-semibold ${isBuy ? 'text-buy' : 'text-sell'}`}>
                      {formatPrice(trade.price)}
                    </td>
                    <td className="text-right text-text-primary">
                      {Number(trade.quantity || trade.qty).toFixed(4)}
                    </td>
                    <td className="text-right pr-3 text-text-muted">
                      {formattedTime}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export default TradeHistory;
