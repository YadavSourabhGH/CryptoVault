import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMarketStore } from '../store/marketStore';
import { useSocket } from '../hooks/useSocket';
import { formatPrice, formatVolume } from '../lib/utils';
import { ChangePercent } from '../components/common/ChangePercent';
import { Input } from '../components/ui/input';
import { Search, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/button';

// Renders a mini SVG sparkline line chart based on historical mock wave
function Sparkline({ change24h }) {
  const isUp = change24h >= 0;
  
  // Generate a mock wave line
  const points = [];
  let currentY = 15;
  const direction = isUp ? -1 : 1; // Trend upward if positive, downward if negative

  // Seed coordinates
  points.push(`0,${currentY}`);
  for (let i = 1; i <= 8; i++) {
    const randomStep = Math.random() * 8 - 4;
    const trend = direction * (i * 0.8);
    currentY = Math.max(2, Math.min(28, currentY + randomStep + trend));
    points.push(`${i * 10},${currentY}`);
  }
  
  const pathData = `M ${points.join(' L ')}`;
  const strokeColor = isUp ? '#0ECB81' : '#F6465D';

  return (
    <svg className="w-20 h-8 overflow-visible" viewBox="0 0 80 30">
      <path
        d={pathData}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MarketsPage() {
  useSocket(); // Sync tickers in real-time
  const { allPairs, tickers, fetchPairs, isLoading } = useMarketStore();
  const [search, setSearch] = useState('');
  const [marketTab, setMarketTab] = useState('ALL'); // ALL, GAINERS, LOSERS
  const navigate = useNavigate();

  useEffect(() => {
    fetchPairs();
  }, []);

  const handleRowClick = (symbol) => {
    navigate(`/trade?pair=${symbol}`);
  };

  // Filter and Sort Pairs
  const getProcessedPairs = () => {
    const list = allPairs.map((pair) => {
      const ticker = tickers[pair.symbol];
      return {
        ...pair,
        price: ticker ? ticker.price : pair.basePrice,
        change: ticker ? ticker.change24h : 0,
        high: ticker ? ticker.high24h : pair.basePrice * 1.02,
        low: ticker ? ticker.low24h : pair.basePrice * 0.98,
        volume: ticker ? ticker.volume24h : 1000,
      };
    });

    // Filter by search
    const searched = list.filter(
      (p) =>
        p.symbol.toLowerCase().includes(search.toLowerCase()) ||
        p.base.toLowerCase().includes(search.toLowerCase())
    );

    // Apply tab filters
    if (marketTab === 'GAINERS') {
      return searched.filter((p) => p.change > 0).sort((a, b) => b.change - a.change);
    } else if (marketTab === 'LOSERS') {
      return searched.filter((p) => p.change < 0).sort((a, b) => a.change - b.change);
    }

    return searched;
  };

  const displayPairs = getProcessedPairs();

  return (
    <div className="min-h-screen bg-bg text-text-primary px-6 py-8 select-none select-none">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
          <div className="text-left">
            <h1 className="text-2xl font-bold">Markets Overview</h1>
            <p className="text-xs text-text-secondary mt-0.5">Explore available trading pairs and live stats</p>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-secondary" />
            <Input
              type="text"
              placeholder="Search coin..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs bg-bg-1 border-border/80"
            />
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex justify-between items-center border-b border-border/40 pb-1 flex-wrap gap-2 select-none">
          <div className="flex space-x-1">
            {[
              { id: 'ALL', label: 'All Pairs' },
              { id: 'GAINERS', label: 'Top Gainers', icon: TrendingUp },
              { id: 'LOSERS', label: 'Top Losers', icon: TrendingDown },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setMarketTab(tab.id)}
                  className={`px-4 py-2 text-xs font-semibold relative flex items-center space-x-1.5 transition-colors ${
                    marketTab === tab.id
                      ? 'text-accent border-b-2 border-accent'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={fetchPairs}
            className="h-8 text-xs text-text-secondary hover:text-text-primary"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Refresh
          </Button>
        </div>

        {/* Markets Table */}
        <div className="bg-bg-1 border border-border rounded overflow-hidden">
          {isLoading && allPairs.length === 0 ? (
            <div className="py-20 text-center text-text-secondary text-xs">
              Loading Pairs...
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-bg-2/30 border-b border-border h-10 font-sans font-semibold text-text-secondary">
                  <th className="pl-4">Name</th>
                  <th>Last Price</th>
                  <th>24h Change</th>
                  <th className="hidden sm:table-cell">24h High</th>
                  <th className="hidden sm:table-cell">24h Low</th>
                  <th className="hidden md:table-cell">24h Volume</th>
                  <th className="hidden sm:table-cell">Trend (7d)</th>
                  <th className="pr-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {displayPairs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-text-secondary">
                      No matching pairs found.
                    </td>
                  </tr>
                ) : (
                  displayPairs.map((pair) => (
                    <tr
                      key={pair.symbol}
                      onClick={() => handleRowClick(pair.symbol)}
                      className="border-b border-border/10 hover:bg-bg-2/30 h-14 cursor-pointer transition-colors"
                    >
                      <td className="pl-4 font-bold text-text-primary text-sm">
                        {pair.base}
                        <span className="text-[10px] text-text-secondary font-normal ml-0.5">
                          /{pair.quote}
                        </span>
                      </td>
                      <td className="font-mono text-sm font-semibold text-text-primary">
                        {formatPrice(pair.price)}
                      </td>
                      <td>
                        <ChangePercent change={pair.change} />
                      </td>
                      <td className="font-mono text-text-secondary hidden sm:table-cell">
                        {formatPrice(pair.high)}
                      </td>
                      <td className="font-mono text-text-secondary hidden sm:table-cell">
                        {formatPrice(pair.low)}
                      </td>
                      <td className="font-mono text-text-secondary hidden md:table-cell">
                        {formatVolume(pair.volume)} {pair.base}
                      </td>
                      <td className="hidden sm:table-cell">
                        <Sparkline change24h={pair.change} />
                      </td>
                      <td className="pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <Link to={`/trade?pair=${pair.symbol}`}>
                          <Button size="sm" className="h-8 text-xs font-semibold bg-accent text-bg hover:bg-accent-hover px-4 rounded">
                            Trade
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}
export default MarketsPage;
