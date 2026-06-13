import React from 'react';
import { useMarketStore } from '../../store/marketStore';
import { useOrderBook } from '../../hooks/useOrderBook';
import { formatPrice } from '../../lib/utils';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { useTicker } from '../../hooks/useTicker';

export function OrderBook() {
  const selectedPair = useMarketStore((state) => state.selectedPair);
  const ticker = useTicker(selectedPair);
  const { bids, asks, isLoading } = useOrderBook(selectedPair);

  const currentPrice = ticker ? ticker.price : 0;
  const changePercent = ticker ? ticker.change24h : 0;
  const isUp = changePercent >= 0;

  // Process Asks: take 15, reverse for rendering descending (highest price at top, lowest at bottom)
  const processedAsks = [...asks].slice(0, 15).reverse();
  
  // Process Bids: take 15 (sorted descending: highest price at top, lowest at bottom)
  const processedBids = [...bids].slice(0, 15);

  // Calculate cumulative sums for depth bars
  let askCumulative = 0;
  const asksWithSum = processedAsks.map((ask) => {
    askCumulative += ask[1];
    return { price: ask[0], qty: ask[1], sum: askCumulative };
  });

  let bidCumulative = 0;
  const bidsWithSum = processedBids.map((bid) => {
    bidCumulative += bid[1];
    return { price: bid[0], qty: bid[1], sum: bidCumulative };
  });

  const maxTotal = Math.max(askCumulative, bidCumulative) || 1;

  const handlePriceClick = (price) => {
    window.dispatchEvent(new CustomEvent('orderbook_price_click', { detail: { price } }));
  };

  // Calculate spread
  const lowestAsk = asks.length > 0 ? asks[0][0] : 0;
  const highestBid = bids.length > 0 ? bids[0][0] : 0;
  const spread = lowestAsk > 0 && highestBid > 0 ? lowestAsk - highestBid : 0;
  const spreadPercent = highestBid > 0 ? (spread / highestBid) * 100 : 0;

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg-1 text-text-secondary text-xs h-full min-h-[300px]">
        Loading Order Book...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-bg-1 border-l border-border select-none text-[11px] font-sans">
      {/* Column Headers */}
      <div className="grid grid-cols-3 px-3 py-1.5 text-text-secondary border-b border-border/20 font-semibold text-[10px] uppercase">
        <span>Price(USDT)</span>
        <span className="text-right">Qty({selectedPair.replace('USDT', '')})</span>
        <span className="text-right">Total</span>
      </div>

      {/* Asks (Sells) - Rendered Top to Bottom (Highest to Lowest) */}
      <div className="flex-1 overflow-hidden flex flex-col justify-end">
        {asksWithSum.map((ask, idx) => {
          const depthPercent = Math.min((ask.sum / maxTotal) * 100, 100);
          return (
            <div
              key={`ask-${idx}`}
              onClick={() => handlePriceClick(ask.price)}
              className="relative grid grid-cols-3 px-3 py-[2px] cursor-pointer hover:bg-bg-2/50 transition-colors font-mono"
            >
              {/* Depth Bar Overlay */}
              <div
                className="absolute right-0 top-0 bottom-0 bg-sell/10 transition-all duration-300 pointer-events-none"
                style={{ width: `${depthPercent}%` }}
              />
              <span className="text-sell z-10">{formatPrice(ask.price)}</span>
              <span className="text-right text-text-primary z-10">{ask.qty.toFixed(4)}</span>
              <span className="text-right text-text-secondary z-10">{ask.sum.toFixed(4)}</span>
            </div>
          );
        })}
      </div>

      {/* Spread & Market Price Center Row */}
      <div className="h-9 bg-bg-2 border-y border-border/40 flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center space-x-1.5">
          <span className={`text-sm font-bold font-mono ${isUp ? 'text-buy' : 'text-sell'}`}>
            {formatPrice(currentPrice)}
          </span>
          {isUp ? (
            <ArrowUp className="w-3.5 h-3.5 text-buy stroke-[2.5]" />
          ) : (
            <ArrowDown className="w-3.5 h-3.5 text-sell stroke-[2.5]" />
          )}
        </div>
        <div className="text-[10px] text-text-secondary flex flex-col items-end">
          <span className="font-mono">Spread: {formatPrice(spread)}</span>
          <span className="font-mono text-[9px]">{spreadPercent.toFixed(3)}%</span>
        </div>
      </div>

      {/* Bids (Buys) - Rendered Top to Bottom (Highest to Lowest) */}
      <div className="flex-1 overflow-hidden flex flex-col justify-start">
        {bidsWithSum.map((bid, idx) => {
          const depthPercent = Math.min((bid.sum / maxTotal) * 100, 100);
          return (
            <div
              key={`bid-${idx}`}
              onClick={() => handlePriceClick(bid.price)}
              className="relative grid grid-cols-3 px-3 py-[2px] cursor-pointer hover:bg-bg-2/50 transition-colors font-mono"
            >
              {/* Depth Bar Overlay */}
              <div
                className="absolute right-0 top-0 bottom-0 bg-buy/10 transition-all duration-300 pointer-events-none"
                style={{ width: `${depthPercent}%` }}
              />
              <span className="text-buy z-10">{formatPrice(bid.price)}</span>
              <span className="text-right text-text-primary z-10">{bid.qty.toFixed(4)}</span>
              <span className="text-right text-text-secondary z-10">{bid.sum.toFixed(4)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
export default OrderBook;
