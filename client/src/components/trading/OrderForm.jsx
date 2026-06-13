import React, { useState, useEffect } from 'react';
import { useMarketStore } from '../../store/marketStore';
import { useOrderStore } from '../../store/orderStore';
import { useAuthStore } from '../../store/authStore';
import { formatPrice } from '../../lib/utils';
import api from '../../lib/api';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

export function OrderForm() {
  const selectedPair = useMarketStore((state) => state.selectedPair);
  const tickers = useMarketStore((state) => state.tickers);
  const placeOrder = useOrderStore((state) => state.placeOrder);
  const { user } = useAuthStore();

  const baseSymbol = selectedPair.replace('USDT', '');
  const quoteSymbol = 'USDT';

  const currentTicker = tickers[selectedPair];
  const marketPrice = currentTicker ? currentTicker.price : 0;

  // Tabs: LIMIT, MARKET, STOP_LIMIT
  const [activeTab, setActiveTab] = useState('LIMIT');

  // Input states
  const [buyStopPrice, setBuyStopPrice] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [buyAmount, setBuyAmount] = useState('');
  
  const [sellStopPrice, setSellStopPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [sellAmount] = useState(''); // wait, let's use standard state for amount
  const [sellAmountVal, setSellAmountVal] = useState('');
  const [sellPriceVal, setSellPriceVal] = useState('');

  // Wallet balances
  const [balances, setBalances] = useState({ USDT: { available: 0 }, [baseSymbol]: { available: 0 } });
  const [formError, setFormError] = useState({ buy: '', sell: '' });
  const [formSuccess, setFormSuccess] = useState({ buy: '', sell: '' });

  // Fetch balances
  const fetchBalances = async () => {
    try {
      const res = await api.get('/wallet');
      setBalances(res.data.balances || {});
    } catch (err) {
      console.error('Failed to load wallet balances:', err.message);
    }
  };

  useEffect(() => {
    fetchBalances();

    // Listen to real-time wallet updates from socket (via custom hook event)
    const handleBalanceUpdate = (e) => {
      setBalances(e.detail || {});
    };

    // Listen for orderbook price row click to autofill price input
    const handlePriceClick = (e) => {
      const clickedPrice = e.detail.price;
      setBuyPrice(clickedPrice.toString());
      setSellPriceVal(clickedPrice.toString());
    };

    window.addEventListener('wallet_balance_updated', handleBalanceUpdate);
    window.addEventListener('orderbook_price_click', handlePriceClick);

    return () => {
      window.removeEventListener('wallet_balance_updated', handleBalanceUpdate);
      window.removeEventListener('orderbook_price_click', handlePriceClick);
    };
  }, [selectedPair]);

  // Set default prices when ticker loads
  useEffect(() => {
    if (marketPrice > 0) {
      if (!buyPrice) setBuyPrice(marketPrice.toFixed(2));
      if (!sellPriceVal) setSellPriceVal(marketPrice.toFixed(2));
    }
  }, [marketPrice]);

  const availableQuote = balances[quoteSymbol]?.available || 0;
  const availableBase = balances[baseSymbol]?.available || 0;

  // Calculate totals
  const buyPriceNum = activeTab === 'MARKET' ? marketPrice : parseFloat(buyPrice) || 0;
  const buyAmountNum = parseFloat(buyAmount) || 0;
  const buyTotal = buyPriceNum * buyAmountNum;
  const buyFee = buyTotal * 0.001;

  const sellPriceNum = activeTab === 'MARKET' ? marketPrice : parseFloat(sellPriceVal) || 0;
  const sellAmountNum = parseFloat(sellAmountVal) || 0;
  const sellTotal = sellPriceNum * sellAmountNum;
  const sellFee = sellTotal * 0.001;

  // Percent sliders
  const handlePercentSlider = (side, percent) => {
    if (side === 'BUY') {
      if (buyPriceNum <= 0) return;
      const targetSpend = availableQuote * percent;
      const amount = parseFloat((targetSpend / buyPriceNum).toFixed(6));
      setBuyAmount(amount.toString());
    } else {
      const amount = parseFloat((availableBase * percent).toFixed(6));
      setSellAmountVal(amount.toString());
    }
  };

  const handleSubmit = async (side) => {
    setFormError({ buy: '', sell: '' });
    setFormSuccess({ buy: '', sell: '' });

    if (user?.role === 'viewer') {
      setFormError({
        ...formError,
        [side.toLowerCase()]: 'Viewer account cannot place orders.',
      });
      return;
    }

    const orderParams = {
      symbol: selectedPair,
      side,
      type: activeTab,
      quantity: side === 'BUY' ? buyAmountNum : sellAmountNum,
    };

    if (activeTab !== 'MARKET') {
      orderParams.price = side === 'BUY' ? buyPriceNum : sellPriceNum;
    }

    if (activeTab === 'STOP_LIMIT') {
      orderParams.stopPrice = side === 'BUY' ? parseFloat(buyStopPrice) : parseFloat(sellStopPrice);
      if (!orderParams.stopPrice) {
        setFormError({
          ...formError,
          [side.toLowerCase()]: 'Please specify a stop price',
        });
        return;
      }
    }

    if (!orderParams.quantity || orderParams.quantity <= 0) {
      setFormError({
        ...formError,
        [side.toLowerCase()]: 'Please enter a valid amount',
      });
      return;
    }

    // Client-side validations
    if (side === 'BUY' && buyTotal > availableQuote) {
      setFormError({ ...formError, buy: 'Insufficient USDT balance' });
      return;
    }

    if (side === 'SELL' && sellAmountNum > availableBase) {
      setFormError({ ...formError, sell: `Insufficient ${baseSymbol} balance` });
      return;
    }

    const result = await placeOrder(orderParams);
    if (result.success) {
      setFormSuccess({
        ...formSuccess,
        [side.toLowerCase()]: `${activeTab} ${side} order placed!`,
      });
      // Clear inputs
      if (side === 'BUY') {
        setBuyAmount('');
      } else {
        setSellAmountVal('');
      }
      fetchBalances();
      setTimeout(() => setFormSuccess({ buy: '', sell: '' }), 3000);
    } else {
      setFormError({
        ...formError,
        [side.toLowerCase()]: result.error,
      });
    }
  };

  return (
    <div className="bg-bg-1 border border-border rounded p-4 flex flex-col font-sans select-none select-none">
      {/* Order Type Tabs */}
      <div className="flex border-b border-border/40 pb-2 mb-4 space-x-4">
        {['LIMIT', 'MARKET', 'STOP_LIMIT'].map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setFormError({ buy: '', sell: '' });
            }}
            className={`text-xs font-semibold py-1 transition-colors relative ${
              activeTab === tab ? 'text-accent border-b-2 border-accent' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Forms Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* BUY COLUMN */}
        <div className="flex flex-col text-left">
          <div className="flex justify-between items-center text-xs mb-2 text-text-secondary">
            <span>Buy {baseSymbol}</span>
            <span>Avail: <span className="font-mono text-text-primary font-semibold">{formatPrice(availableQuote)}</span> USDT</span>
          </div>

          {formError.buy && (
            <div className="border border-red-500/20 bg-red-500/10 text-sell p-2 rounded text-xs mb-3 font-medium">
              {formError.buy}
            </div>
          )}
          {formSuccess.buy && (
            <div className="border border-emerald-500/20 bg-emerald-500/10 text-buy p-2 rounded text-xs mb-3 font-medium">
              {formSuccess.buy}
            </div>
          )}

          {activeTab === 'STOP_LIMIT' && (
            <div className="flex items-center mb-3">
              <span className="text-xs text-text-secondary w-20">Stop Price</span>
              <Input
                type="number"
                placeholder="USDT"
                value={buyStopPrice}
                onChange={(e) => setBuyStopPrice(e.target.value)}
                className="h-8 text-xs font-mono"
              />
            </div>
          )}

          <div className="flex items-center mb-3">
            <span className="text-xs text-text-secondary w-20">Price</span>
            <Input
              type="text"
              disabled={activeTab === 'MARKET'}
              placeholder={activeTab === 'MARKET' ? 'Market price' : 'USDT'}
              value={activeTab === 'MARKET' ? '' : buyPrice}
              onChange={(e) => setBuyPrice(e.target.value)}
              className="h-8 text-xs font-mono"
            />
          </div>

          <div className="flex items-center mb-3">
            <span className="text-xs text-text-secondary w-20">Amount</span>
            <Input
              type="number"
              placeholder={baseSymbol}
              value={buyAmount}
              onChange={(e) => setBuyAmount(e.target.value)}
              className="h-8 text-xs font-mono"
            />
          </div>

          {/* Balance Slider */}
          <div className="grid grid-cols-4 gap-1.5 mb-4 mt-1">
            {[0.25, 0.5, 0.75, 1.0].map((p) => (
              <button
                key={`buy-p-${p}`}
                onClick={() => handlePercentSlider('BUY', p)}
                className="bg-bg-2 border border-border/80 text-[10px] py-1 text-text-secondary hover:text-text-primary hover:bg-bg-3 font-mono rounded"
              >
                {p * 100}%
              </button>
            ))}
          </div>

          {/* Estimations */}
          <div className="flex flex-col space-y-1.5 border-t border-border/20 pt-3 mb-4 text-[10px] text-text-secondary">
            <div className="flex justify-between">
              <span>Total Est. Cost</span>
              <span className="font-mono text-text-primary">{formatPrice(buyTotal)} USDT</span>
            </div>
            <div className="flex justify-between">
              <span>Est. Fee (0.1%)</span>
              <span className="font-mono text-text-primary">{formatPrice(buyFee)} USDT</span>
            </div>
          </div>

          <Button
            onClick={() => handleSubmit('BUY')}
            variant="success"
            className="w-full h-9 bg-buy text-bg hover:bg-emerald-600 font-bold font-sans tracking-wide"
          >
            Buy {baseSymbol}
          </Button>
        </div>

        {/* SELL COLUMN */}
        <div className="flex flex-col text-left">
          <div className="flex justify-between items-center text-xs mb-2 text-text-secondary">
            <span>Sell {baseSymbol}</span>
            <span>Avail: <span className="font-mono text-text-primary font-semibold">{availableBase.toFixed(4)}</span> {baseSymbol}</span>
          </div>

          {formError.sell && (
            <div className="border border-red-500/20 bg-red-500/10 text-sell p-2 rounded text-xs mb-3 font-medium">
              {formError.sell}
            </div>
          )}
          {formSuccess.sell && (
            <div className="border border-emerald-500/20 bg-emerald-500/10 text-buy p-2 rounded text-xs mb-3 font-medium">
              {formSuccess.sell}
            </div>
          )}

          {activeTab === 'STOP_LIMIT' && (
            <div className="flex items-center mb-3">
              <span className="text-xs text-text-secondary w-20">Stop Price</span>
              <Input
                type="number"
                placeholder="USDT"
                value={sellStopPrice}
                onChange={(e) => setSellStopPrice(e.target.value)}
                className="h-8 text-xs font-mono"
              />
            </div>
          )}

          <div className="flex items-center mb-3">
            <span className="text-xs text-text-secondary w-20">Price</span>
            <Input
              type="text"
              disabled={activeTab === 'MARKET'}
              placeholder={activeTab === 'MARKET' ? 'Market price' : 'USDT'}
              value={activeTab === 'MARKET' ? '' : sellPriceVal}
              onChange={(e) => setSellPriceVal(e.target.value)}
              className="h-8 text-xs font-mono"
            />
          </div>

          <div className="flex items-center mb-3">
            <span className="text-xs text-text-secondary w-20">Amount</span>
            <Input
              type="number"
              placeholder={baseSymbol}
              value={sellAmountVal}
              onChange={(e) => setSellAmountVal(e.target.value)}
              className="h-8 text-xs font-mono"
            />
          </div>

          {/* Balance Slider */}
          <div className="grid grid-cols-4 gap-1.5 mb-4 mt-1">
            {[0.25, 0.5, 0.75, 1.0].map((p) => (
              <button
                key={`sell-p-${p}`}
                onClick={() => handlePercentSlider('SELL', p)}
                className="bg-bg-2 border border-border/80 text-[10px] py-1 text-text-secondary hover:text-text-primary hover:bg-bg-3 font-mono rounded"
              >
                {p * 100}%
              </button>
            ))}
          </div>

          {/* Estimations */}
          <div className="flex flex-col space-y-1.5 border-t border-border/20 pt-3 mb-4 text-[10px] text-text-secondary">
            <div className="flex justify-between">
              <span>Total Est. Return</span>
              <span className="font-mono text-text-primary">{formatPrice(sellTotal)} USDT</span>
            </div>
            <div className="flex justify-between">
              <span>Est. Fee (0.1%)</span>
              <span className="font-mono text-text-primary">{formatPrice(sellFee)} USDT</span>
            </div>
          </div>

          <Button
            onClick={() => handleSubmit('SELL')}
            variant="destructive"
            className="w-full h-9 bg-sell text-text-primary hover:bg-red-600 font-bold font-sans tracking-wide"
          >
            Sell {baseSymbol}
          </Button>
        </div>

      </div>
    </div>
  );
}
export default OrderForm;
