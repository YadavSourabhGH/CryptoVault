import React, { useState, useEffect } from 'react';
import { useMarketStore } from '../../store/marketStore';
import { formatPrice } from '../../lib/utils';
import { ChangePercent } from '../common/ChangePercent';
import { Search, Star } from 'lucide-react';
import { Input } from '../ui/input';

export function MarketList() {
  const { allPairs, tickers, selectedPair, setSelectedPair } = useMarketStore();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('USDT'); // Favorites, USDT, BTC, ETH
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('favorites');
    return saved ? JSON.parse(saved) : ['BTCUSDT', 'ETHUSDT'];
  });

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (symbol, e) => {
    e.stopPropagation();
    if (favorites.includes(symbol)) {
      setFavorites(favorites.filter((f) => f !== symbol));
    } else {
      setFavorites([...favorites, symbol]);
    }
  };

  const handleRowClick = (symbol) => {
    setSelectedPair(symbol);
  };

  // Filter pairs
  const filteredPairs = allPairs.filter((pair) => {
    const matchesSearch = pair.symbol.toLowerCase().includes(search.toLowerCase()) || 
                          pair.base.toLowerCase().includes(search.toLowerCase());
    
    if (!matchesSearch) return false;

    if (activeTab === 'Favorites') {
      return favorites.includes(pair.symbol);
    } else {
      return pair.quote === activeTab;
    }
  });

  return (
    <div className="flex flex-col h-full bg-bg-1 border-r border-border font-sans select-none select-none">
      {/* Search Input */}
      <div className="p-3">
        <div className="relative flex items-center">
          <Search className="absolute left-2.5 h-3.5 w-3.5 text-text-secondary" />
          <Input
            type="text"
            placeholder="Search Coin"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs bg-bg-2 border-border/80"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/40 px-2 text-[11px] font-semibold text-text-secondary h-8 items-center space-x-1">
        {['Favorites', 'USDT', 'BTC', 'ETH'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-2 py-1.5 transition-colors hover:text-text-primary ${
              activeTab === tab ? 'text-accent border-b border-accent' : ''
            }`}
          >
            {tab === 'Favorites' ? <Star className="w-3.5 h-3.5 fill-current" /> : tab}
          </button>
        ))}
      </div>

      {/* Market Pairs List */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="text-[10px] text-text-secondary border-b border-border/20 h-7 sticky top-0 bg-bg-1 z-10">
              <th className="pl-3 w-8"></th>
              <th>Pair</th>
              <th className="text-right">Price</th>
              <th className="text-right pr-3">24h%</th>
            </tr>
          </thead>
          <tbody>
            {filteredPairs.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-6 text-text-muted">
                  No markets found
                </td>
              </tr>
            ) : (
              filteredPairs.map((pair) => {
                const ticker = tickers[pair.symbol];
                const price = ticker ? ticker.price : pair.basePrice;
                const change = ticker ? ticker.change24h : 0;
                const isSelected = selectedPair === pair.symbol;

                return (
                  <tr
                    key={pair.symbol}
                    onClick={() => handleRowClick(pair.symbol)}
                    className={`h-9 border-b border-border/10 cursor-pointer hover:bg-bg-2 transition-colors ${
                      isSelected ? 'bg-bg-2/75 border-l-2 border-accent pl-1' : ''
                    }`}
                  >
                    <td className="pl-3" onClick={(e) => toggleFavorite(pair.symbol, e)}>
                      <Star
                        className={`w-3.5 h-3.5 ${
                          favorites.includes(pair.symbol)
                            ? 'text-accent fill-accent'
                            : 'text-text-muted hover:text-text-secondary'
                        }`}
                      />
                    </td>
                    <td>
                      <div className="flex items-baseline">
                        <span className="font-bold text-text-primary">{pair.base}</span>
                        <span className="text-[10px] text-text-secondary ml-0.5">/{pair.quote}</span>
                      </div>
                    </td>
                    <td className="text-right font-mono text-text-primary">
                      {formatPrice(price)}
                    </td>
                    <td className="text-right pr-3">
                      <ChangePercent change={change} showArrow={false} />
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
export default MarketList;
