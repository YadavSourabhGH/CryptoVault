import React from 'react';
import { Link } from 'react-router-dom';
import { TickerBar } from '../components/market/TickerBar';
import { Button } from '../components/ui/button';
import { useMarketStore } from '../store/marketStore';
import { formatPrice } from '../lib/utils';
import { ChangePercent } from '../components/common/ChangePercent';
import { ShieldCheck, Zap, Users, BarChart3, ArrowRight } from 'lucide-react';
import { useTicker } from '../hooks/useTicker';

function FeaturedRow({ pair }) {
  const ticker = useTicker(pair.symbol);
  const price = ticker ? ticker.price : pair.basePrice;
  const change = ticker ? ticker.change24h : 0;
  const high = ticker ? ticker.high24h : 0;

  return (
    <tr className="border-b border-border/20 hover:bg-bg-1/40 h-12 transition-colors">
      <td className="pl-4 font-bold text-text-primary text-sm">{pair.base} <span className="text-text-secondary font-normal text-xs">/ {pair.quote}</span></td>
      <td className="font-mono text-sm font-semibold">{formatPrice(price)}</td>
      <td>
        <ChangePercent change={change} />
      </td>
      <td className="font-mono text-text-secondary text-xs hidden sm:table-cell">{formatPrice(high)}</td>
      <td className="pr-4 text-right">
        <Link to={`/trade?pair=${pair.symbol}`}>
          <Button variant="outline" size="sm" className="h-7 text-xs border-accent/20 hover:border-accent hover:text-accent font-semibold px-3">
            Trade
          </Button>
        </Link>
      </td>
    </tr>
  );
}

export function LandingPage() {
  const allPairs = useMarketStore((state) => state.allPairs);
  
  const featured = allPairs.slice(0, 5);
  const defaultFeatured = [
    { symbol: 'BTCUSDT', base: 'BTC', quote: 'USDT', basePrice: 67450 },
    { symbol: 'ETHUSDT', base: 'ETH', quote: 'USDT', basePrice: 3580 },
    { symbol: 'BNBUSDT', base: 'BNB', quote: 'USDT', basePrice: 598 },
    { symbol: 'SOLUSDT', base: 'SOL', quote: 'USDT', basePrice: 178.50 },
    { symbol: 'XRPUSDT', base: 'XRP', quote: 'USDT', basePrice: 0.5820 }
  ];

  const displayFeatured = featured.length > 0 ? featured : defaultFeatured;

  return (
    <div className="flex flex-col min-h-screen bg-bg text-text-primary select-none select-none">
      {/* Scrollable ticker top strip */}
      <TickerBar />

      {/* Hero Header */}
      <section className="relative overflow-hidden py-20 px-6 border-b border-border/30 bg-gradient-to-b from-bg-1/10 to-bg flex flex-col items-center text-center">
        {/* Subtle decorative glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-accent-dim border border-accent/20 rounded-full text-xs text-accent font-medium font-sans">
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Virtual Simulated Paper Trading Exchange</span>
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight sm:leading-none">
            Trade Cryptocurrencies with <span className="text-accent bg-clip-text">Zero Risk</span>
          </h1>
          <p className="text-sm sm:text-base text-text-secondary max-w-2xl mx-auto font-sans leading-relaxed">
            Experience real-time cryptocurrency paper trading on CryptoVault. Match limit and market orders, track your simulated portfolio performance, and refine your strategies.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 pt-4 select-none">
            <Link to="/register">
              <Button size="lg" className="w-full sm:w-auto h-11 bg-accent text-bg hover:bg-accent-hover font-bold text-sm px-6">
                Start Trading Now
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
            <Link to="/markets">
              <Button variant="outline" size="lg" className="w-full sm:w-auto h-11 border-border hover:bg-bg-1 font-semibold text-sm px-6">
                View Markets
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* KPI Stats Panel */}
      <section className="py-12 px-6 border-b border-border/20 max-w-7xl mx-auto w-full grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-bg-1 border border-border p-6 rounded flex items-center space-x-4">
          <div className="w-12 h-12 bg-accent-dim rounded flex items-center justify-center text-accent">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div className="text-left">
            <div className="text-2xl font-bold font-mono">10+</div>
            <div className="text-xs text-text-secondary uppercase tracking-wider font-semibold mt-0.5">Coins Supported</div>
          </div>
        </div>

        <div className="bg-bg-1 border border-border p-6 rounded flex items-center space-x-4">
          <div className="w-12 h-12 bg-buy/10 rounded flex items-center justify-center text-buy">
            <Users className="w-6 h-6" />
          </div>
          <div className="text-left">
            <div className="text-2xl font-bold font-mono">10,000 USDT</div>
            <div className="text-xs text-text-secondary uppercase tracking-wider font-semibold mt-0.5">Starting Paper Funds</div>
          </div>
        </div>

        <div className="bg-bg-1 border border-border p-6 rounded flex items-center space-x-4">
          <div className="w-12 h-12 bg-sell/10 rounded flex items-center justify-center text-sell">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="text-left">
            <div className="text-2xl font-bold font-mono">100% Risk Free</div>
            <div className="text-xs text-text-secondary uppercase tracking-wider font-semibold mt-0.5">Educational Simulator</div>
          </div>
        </div>
      </section>

      {/* Featured Market Table */}
      <section className="py-16 px-6 max-w-5xl mx-auto w-full select-none">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold">Featured Markets</h2>
          <p className="text-xs text-text-secondary mt-1">Get real-time rates of top traded digital assets</p>
        </div>

        <div className="bg-bg-1 border border-border rounded overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-bg-2/50 border-b border-border h-10 font-sans font-bold text-text-secondary">
                <th className="pl-4">Asset</th>
                <th>Price</th>
                <th>24h Change</th>
                <th className="hidden sm:table-cell">24h High</th>
                <th className="pr-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {displayFeatured.map((pair) => (
                <FeaturedRow key={pair.symbol} pair={pair} />
              ))}
            </tbody>
          </table>
        </div>

        <div className="text-center mt-6">
          <Link to="/markets" className="text-xs text-accent hover:underline inline-flex items-center">
            Explore all available symbols
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>
      </section>
    </div>
  );
}
export default LandingPage;
