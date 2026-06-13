import React from 'react';
import { useMarketStore } from '../../store/marketStore';
import { ChangePercent } from '../common/ChangePercent';
import { formatPrice } from '../../lib/utils';
import { useTicker } from '../../hooks/useTicker';

function TickerItem({ pair }) {
  const ticker = useTicker(pair.symbol);
  const price = ticker ? ticker.price : pair.basePrice;
  const change = ticker ? ticker.change24h : 0;

  return (
    <div className="flex items-center space-x-2 px-4 border-r border-border/40 shrink-0 font-sans text-xs">
      <span className="font-semibold text-text-primary">{pair.symbol}</span>
      <span className="font-mono text-text-primary">{formatPrice(price)}</span>
      <ChangePercent change={change} showArrow={false} />
    </div>
  );
}

export function TickerBar() {
  const allPairs = useMarketStore((state) => state.allPairs);
  const defaultPairs = [
    { symbol: 'BTCUSDT', basePrice: 67450 },
    { symbol: 'ETHUSDT', basePrice: 3580 },
    { symbol: 'BNBUSDT', basePrice: 598 },
    { symbol: 'SOLUSDT', basePrice: 178.50 },
    { symbol: 'XRPUSDT', basePrice: 0.5820 },
    { symbol: 'ADAUSDT', basePrice: 0.4610 },
    { symbol: 'DOGEUSDT', basePrice: 0.1620 },
    { symbol: 'DOTUSDT', basePrice: 7.840 },
    { symbol: 'MATICUSDT', basePrice: 0.8940 },
    { symbol: 'LINKUSDT', basePrice: 14.820 }
  ];

  const pairsToUse = allPairs.length > 0 ? allPairs : defaultPairs;

  return (
    <div className="h-8 bg-bg-2 border-b border-border flex items-center overflow-hidden w-full select-none">
      <div className="flex animate-[tickerScroll_40s_linear_infinite] whitespace-nowrap hover:[animation-play-state:paused]">
        {/* Render twice for continuous loop */}
        {pairsToUse.concat(pairsToUse).map((pair, idx) => (
          <TickerItem key={`${pair.symbol}-${idx}`} pair={pair} />
        ))}
      </div>
    </div>
  );
}
export default TickerBar;
