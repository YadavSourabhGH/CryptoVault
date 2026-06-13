import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMarketStore } from '../store/marketStore';
import { useSocket } from '../hooks/useSocket';
import { MarketList } from '../components/market/MarketList';
import { PairHeader } from '../components/market/PairHeader';
import { CandleChart } from '../components/market/CandleChart';
import { OrderBook } from '../components/market/OrderBook';
import { TradeHistory } from '../components/market/TradeHistory';
import { OrderForm } from '../components/trading/OrderForm';
import { TradePanel } from '../components/trading/TradePanel';
import { Button } from '../components/ui/button';
import { Menu, Star } from 'lucide-react';

export function TradePage() {
  // Activate Socket listener for the duration of this page
  useSocket();

  const { fetchPairs, setSelectedPair, selectedPair } = useMarketStore();
  const [searchParams] = useSearchParams();
  
  // Mobile Tab State
  const [mobileTab, setMobileTab] = useState('chart'); // chart, orderbook, trade, orders
  
  // Tablet Market list drawer state
  const [showDrawer, setShowDrawer] = useState(false);

  useEffect(() => {
    fetchPairs();
    
    // Check if symbol query param exists
    const queryPair = searchParams.get('pair');
    if (queryPair) {
      setSelectedPair(queryPair.toUpperCase());
    }
  }, [searchParams]);

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] bg-bg text-text-primary overflow-hidden relative select-none">
      
      {/* Drawer Overlay for Tablet Sidebar Toggle */}
      {showDrawer && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 xl:hidden backdrop-blur-sm"
          onClick={() => setShowDrawer(false)}
        />
      )}
      <div 
        className={`fixed top-14 bottom-0 left-0 w-64 bg-bg-1 z-40 border-r border-border transition-transform duration-300 transform xl:hidden ${
          showDrawer ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full" onClick={() => setShowDrawer(false)}>
          <MarketList />
        </div>
      </div>

      {/* MOBILE HEADER (Only visible below MD breakpoint) */}
      <div className="flex md:hidden h-10 border-b border-border bg-bg-1 items-center px-4 justify-between shrink-0">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setShowDrawer(true)} 
          className="h-7 w-7 p-0"
        >
          <Menu className="w-4 h-4 text-text-secondary" />
        </Button>
        <span className="text-xs font-bold text-accent">{selectedPair.replace('USDT', '/USDT')}</span>
        <div className="w-7"></div>
      </div>

      {/* DESKTOP/TABLET/MOBILE LAYOUT WRAPPER */}
      <div className="flex flex-1 w-full overflow-hidden">
        
        {/* COLUMN 1: Market List (Desktop only >= 1280px) */}
        <div className="hidden xl:block w-64 shrink-0 h-full">
          <MarketList />
        </div>

        {/* COLUMN 2 + 3 Wrapper */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden h-full">
          
          {/* CENTER PANEL (Column 2): Pair Header, Chart, Form, Open Orders */}
          <div className="flex-1 flex flex-col overflow-y-auto lg:overflow-hidden h-full border-r border-border">
            
            {/* Tablet Header: adds a sidebar toggle button */}
            <div className="hidden md:flex xl:hidden items-center bg-bg-2/30 px-3 border-b border-border shrink-0">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowDrawer(true)} 
                className="h-7 border-border px-2 text-xs flex items-center mr-1"
              >
                <Menu className="w-3.5 h-3.5 mr-1" />
                Markets
              </Button>
            </div>

            {/* Pair Header (Hidden on Mobile, shown on MD+) */}
            <div className="hidden md:block">
              <PairHeader />
            </div>

            {/* RESPONSIVE SUB-GRID */}
            
            {/* Mobile View Toggle Tabs */}
            <div className="flex md:hidden border-b border-border bg-bg-1 h-9 items-center justify-around shrink-0 text-xs font-bold text-text-secondary select-none">
              {['chart', 'orderbook', 'trade', 'orders'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setMobileTab(tab)}
                  className={`px-3 py-1.5 uppercase tracking-wider ${
                    mobileTab === tab ? 'text-accent border-b-2 border-accent' : ''
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Content Switcher depending on Screen/Tab status */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 lg:overflow-y-auto select-none">
              
              {/* Desktop view (always visible) or Mobile active tab */}
              <div className={`md:block ${mobileTab === 'chart' ? 'block' : 'hidden'}`}>
                {/* Mobile Ticker Info */}
                <div className="block md:hidden pb-2">
                  <PairHeader />
                </div>
                <div className="bg-bg-1 border border-border rounded overflow-hidden">
                  <CandleChart />
                </div>
              </div>

              <div className={`md:block lg:grid lg:grid-cols-1 xl:grid-cols-1 gap-3 ${
                mobileTab === 'trade' ? 'block' : 'hidden'
              }`}>
                <OrderForm />
              </div>

              <div className={`md:block ${mobileTab === 'orders' ? 'block' : 'hidden'}`}>
                <TradePanel />
              </div>

              {/* Mobile-only Order Book tab */}
              <div className={`block md:hidden ${mobileTab === 'orderbook' ? 'block' : 'hidden'}`}>
                <div className="grid grid-cols-1 gap-3 min-h-[350px]">
                  <div className="bg-bg-1 border border-border rounded overflow-hidden h-[300px]">
                    <OrderBook />
                  </div>
                  <div className="bg-bg-1 border border-border rounded overflow-hidden h-[250px]">
                    <TradeHistory />
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* RIGHT SIDE PANEL (Column 3): OrderBook & Trade Feed (Hidden on Mobile, shown on MD+) */}
          <div className="hidden md:flex flex-col w-64 lg:w-72 xl:w-80 shrink-0 h-full border-t lg:border-t-0 border-border select-none">
            <div className="flex-1 overflow-hidden min-h-[250px] flex flex-col">
              <OrderBook />
            </div>
            <div className="h-64 overflow-hidden border-t border-border shrink-0 flex flex-col">
              <TradeHistory />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
export default TradePage;
