import React from 'react';
import { useMarketStore } from '../../store/marketStore';
import { useTicker } from '../../hooks/useTicker';
import { PriceTag } from '../common/PriceTag';
import { ChangePercent } from '../common/ChangePercent';
import { formatPrice, formatVolume } from '../../lib/utils';

export function PairHeader() {
  const selectedPair = useMarketStore((state) => state.selectedPair);
  const ticker = useTicker(selectedPair);

  const baseSymbol = selectedPair.replace('USDT', '');
  const quoteSymbol = 'USDT';

  const price = ticker ? ticker.price : 0;
  const change = ticker ? ticker.change24h : 0;
  const high = ticker ? ticker.high24h : 0;
  const low = ticker ? ticker.low24h : 0;
  const volume = ticker ? ticker.volume24h : 0;
  const amount = volume * price; // approximate 24h volume in USDT

  return (
    <div className="h-14 border-b border-border bg-bg-1 px-4 flex items-center select-none shrink-0 overflow-x-auto">
      {/* Title */}
      <div className="flex items-baseline space-x-1 pr-6 border-r border-border/40 shrink-0">
        <h1 className="text-base font-bold text-text-primary">{baseSymbol}</h1>
        <span className="text-xs text-text-secondary">/{quoteSymbol}</span>
      </div>

      {/* Live Price Tag */}
      <div className="flex flex-col px-6 shrink-0">
        <div className="text-sm font-bold">
          <PriceTag price={price} className="text-sm" />
        </div>
        <span className="text-[10px] text-text-secondary leading-none">Estimated Price</span>
      </div>

      {/* Rolling Stats */}
      <div className="flex items-center space-x-6 pl-6 text-[10px] font-sans">
        <div className="flex flex-col text-left">
          <span className="text-text-secondary mb-0.5">24h Change</span>
          <ChangePercent change={change} className="text-xs" />
        </div>
        
        <div className="flex flex-col text-left">
          <span className="text-text-secondary mb-0.5">24h High</span>
          <span className="text-text-primary font-mono font-medium">{formatPrice(high)}</span>
        </div>

        <div className="flex flex-col text-left">
          <span className="text-text-secondary mb-0.5">24h Low</span>
          <span className="text-text-primary font-mono font-medium">{formatPrice(low)}</span>
        </div>

        <div className="flex flex-col text-left">
          <span className="text-text-secondary mb-0.5">24h Volume({baseSymbol})</span>
          <span className="text-text-primary font-mono font-medium">{formatVolume(volume)}</span>
        </div>

        <div className="flex flex-col text-left">
          <span className="text-text-secondary mb-0.5">24h Amount({quoteSymbol})</span>
          <span className="text-text-primary font-mono font-medium">{formatVolume(amount)}</span>
        </div>
      </div>
    </div>
  );
}
export default PairHeader;
