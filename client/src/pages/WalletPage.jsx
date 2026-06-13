import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMarketStore } from '../store/marketStore';
import { useSocket } from '../hooks/useSocket';
import api from '../lib/api';
import { formatPrice } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
import { Input } from '../components/ui/input';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Wallet, ArrowDownCircle, ArrowUpRight, Copy, Check } from 'lucide-react';

const COLORS = ['#F0B90B', '#0ECB81', '#3A86FF', '#8338EC', '#FF006E', '#FFBE0B', '#FB5607', '#38B000', '#0077B6', '#E0A100'];

export function WalletPage() {
  useSocket(); // keep price tickers updated in background
  const navigate = useNavigate();
  const tickers = useMarketStore((state) => state.tickers);
  
  const [balances, setBalances] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Deposit Modal State
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [depositAsset, setDepositAsset] = useState('USDT');
  const [depositAmount, setDepositAmount] = useState('1000');
  const [copied, setCopied] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);

  const fetchWalletData = async () => {
    setIsLoading(true);
    try {
      const balRes = await api.get('/wallet');
      setBalances(balRes.data.balances || {});

      const txRes = await api.get('/wallet/transactions?limit=20');
      setTransactions(txRes.data.transactions || []);
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to load wallet metrics:', err.message);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();

    // Listen to real-time wallet balance changes
    const handleBalanceUpdate = (e) => {
      setBalances(e.detail || {});
    };
    window.addEventListener('wallet_balance_updated', handleBalanceUpdate);

    return () => {
      window.removeEventListener('wallet_balance_updated', handleBalanceUpdate);
    };
  }, []);

  // Copy address simulation
  const handleCopy = () => {
    navigator.clipboard.writeText('0xCryptoVaultSimulationWalletAddressDemoOnly');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    if (parseFloat(depositAmount) <= 0) return;

    setIsDepositing(true);
    try {
      const res = await api.post('/wallet/deposit', {
        asset: depositAsset,
        amount: depositAmount,
      });

      setBalances(res.data.balances || {});
      // Refresh transactions
      const txRes = await api.get('/wallet/transactions?limit=20');
      setTransactions(txRes.data.transactions || []);
      
      setIsDepositing(false);
      setIsDepositOpen(false);
    } catch (err) {
      console.error(err.response?.data?.message || err.message);
      setIsDepositing(false);
    }
  };

  // Compile calculations
  let totalPortfolioUSDT = 0;
  const tableData = [];

  Object.entries(balances).forEach(([asset, bal]) => {
    const total = bal.available + bal.locked;
    if (total <= 0 && asset !== 'USDT') return; // hide empty balances (except USDT)

    let valueInUsdt = total;
    if (asset !== 'USDT') {
      const symbol = `${asset}USDT`;
      const price = tickers[symbol] ? tickers[symbol].price : 0;
      valueInUsdt = total * price;
    }

    totalPortfolioUSDT += valueInUsdt;
    tableData.push({
      asset,
      available: bal.available,
      locked: bal.locked,
      total,
      valueUsdt: valueInUsdt,
    });
  });

  // Recharts Chart Data
  const chartData = tableData
    .filter((d) => d.valueUsdt > 1) // Only show assets worth more than $1
    .map((d) => ({
      name: d.asset,
      value: parseFloat(d.valueUsdt.toFixed(2)),
    }));

  if (isLoading && Object.keys(balances).length === 0) {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="large" /></div>;
  }

  return (
    <div className="min-h-screen bg-bg text-text-primary px-6 py-8 select-none select-none">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Title */}
        <div className="flex justify-between items-center text-left">
          <div>
            <h1 className="text-2xl font-bold">Fiat & Spot Wallet</h1>
            <p className="text-xs text-text-secondary mt-0.5">Manage your holdings, check allocations, and simulate deposits</p>
          </div>
          <Button 
            onClick={() => setIsDepositOpen(true)}
            className="bg-accent text-bg hover:bg-accent-hover font-bold text-xs"
          >
            <ArrowDownCircle className="w-4 h-4 mr-1.5" />
            Deposit Paper Funds
          </Button>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Card 1: Balance Value Card */}
          <Card className="lg:col-span-1 border-border flex flex-col justify-between">
            <CardHeader className="text-left pb-2">
              <CardTitle className="text-sm font-semibold text-text-secondary flex items-center">
                <Wallet className="w-4 h-4 text-accent mr-1.5" />
                Estimated Total Value
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center py-6 text-left">
              <span className="text-3xl font-bold font-mono text-text-primary">
                {formatPrice(totalPortfolioUSDT)} <span className="text-base text-text-secondary">USDT</span>
              </span>
              <span className="text-[11px] text-buy mt-1 font-sans flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                Paper money simulation
              </span>
            </CardContent>
          </Card>

          {/* Card 2: Recharts Donut Allocation */}
          <Card className="lg:col-span-2 border-border">
            <CardHeader className="text-left pb-1">
              <CardTitle className="text-sm font-semibold">Asset Allocation</CardTitle>
              <CardDescription>Portfolio weighting in USDT value</CardDescription>
            </CardHeader>
            <CardContent className="h-44 flex items-center justify-between">
              {chartData.length === 0 ? (
                <div className="w-full text-center text-text-secondary text-xs">No holdings to display</div>
              ) : (
                <>
                  <div className="w-1/2 h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1E2026', border: '1px solid #2B2F36', borderRadius: '4px' }}
                          labelStyle={{ color: '#EAECEF' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Legend list */}
                  <div className="w-1/2 overflow-y-auto max-h-[140px] px-2 text-[10px] space-y-1.5 text-left select-none">
                    {chartData.map((d, index) => {
                      const percent = ((d.value / totalPortfolioUSDT) * 100).toFixed(1);
                      return (
                        <div key={d.name} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span 
                              className="w-2.5 h-2.5 rounded-full mr-2 shrink-0" 
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="font-bold text-text-primary">{d.name}</span>
                          </div>
                          <span className="font-mono text-text-secondary">{percent}%</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Asset balances table */}
        <div className="bg-bg-1 border border-border rounded overflow-hidden select-none">
          <div className="px-4 py-3 border-b border-border/40 font-semibold text-xs text-text-primary text-left">
            Balances Breakdown
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-bg-2/10">
                <TableHead className="pl-4">Coin</TableHead>
                <TableHead className="text-right">Available</TableHead>
                <TableHead className="text-right">In Orders (Locked)</TableHead>
                <TableHead className="text-right">Total Balance</TableHead>
                <TableHead className="text-right">Estimated Value</TableHead>
                <TableHead className="text-center pr-4">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.sort((a,b) => b.valueUsdt - a.valueUsdt).map((row) => (
                <TableRow key={row.asset}>
                  <TableCell className="pl-4 font-bold text-text-primary py-3.5">
                    {row.asset}
                  </TableCell>
                  <TableCell className="text-right font-mono text-text-primary">
                    {row.available.toFixed(4)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-text-secondary">
                    {row.locked.toFixed(4)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-text-primary">
                    {row.total.toFixed(4)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-accent">
                    {formatPrice(row.valueUsdt)} USDT
                  </TableCell>
                  <TableCell className="text-center pr-4">
                    {row.asset !== 'USDT' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/trade?pair=${row.asset}USDT`)}
                        className="h-6.5 text-[10px] font-semibold border-accent/20 hover:border-accent hover:text-accent rounded-sm px-3"
                      >
                        Trade
                      </Button>
                    ) : (
                      <span className="text-[10px] text-text-secondary">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Transaction History Logs */}
        <div className="bg-bg-1 border border-border rounded overflow-hidden select-none">
          <div className="px-4 py-3 border-b border-border/40 font-semibold text-xs text-text-primary text-left">
            Recent Deposit & Fee Logs
          </div>
          {transactions.length === 0 ? (
            <EmptyState message="No transactions recorded" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-bg-2/10">
                  <TableHead className="pl-4">Timestamp</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="pl-6">Audit reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx._id}>
                    <TableCell className="pl-4 font-mono text-text-secondary">
                      {new Date(tx.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-sm ${
                        tx.type === 'DEPOSIT' ? 'bg-buy/10 text-buy' : 'bg-bg-3 text-text-secondary'
                      }`}>
                        {tx.type}
                      </span>
                    </TableCell>
                    <TableCell className="font-bold text-text-primary">
                      {tx.asset}
                    </TableCell>
                    <TableCell className={`text-right font-mono font-semibold ${
                      tx.type === 'DEPOSIT' ? 'text-buy' : 'text-sell'
                    }`}>
                      {tx.type === 'DEPOSIT' ? '+' : '-'}{tx.amount.toFixed(4)}
                    </TableCell>
                    <TableCell className="pl-6 text-text-secondary text-[10px]">
                      {tx.reference}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

      </div>

      {/* Simulated Deposit Dialog */}
      <Dialog open={isDepositOpen} onOpenChange={setIsDepositOpen}>
        <DialogContent className="max-w-md border-border bg-bg-1 font-sans">
          <DialogHeader>
            <DialogTitle>Simulate Paper Wallet Deposit</DialogTitle>
            <DialogDescription>Credit your virtual wallet with simulated coins instantly</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleDepositSubmit} className="space-y-4 text-left">
            {/* Asset Select */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs text-text-secondary">Choose Asset</label>
              <select
                value={depositAsset}
                onChange={(e) => setDepositAsset(e.target.value)}
                className="flex h-9 w-full rounded border border-border bg-bg-2 px-3 py-1 text-sm text-text-primary focus:outline-none focus:border-accent"
              >
                <option value="USDT">USDT (Tether USD)</option>
                <option value="BTC">BTC (Bitcoin)</option>
                <option value="ETH">ETH (Ethereum)</option>
                <option value="BNB">BNB (Binance Coin)</option>
                <option value="SOL">SOL (Solana)</option>
              </select>
            </div>

            {/* Amount */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs text-text-secondary">Deposit Amount</label>
              <Input
                type="number"
                placeholder="1000"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                required
              />
            </div>

            {/* Simulated Address Details */}
            <div className="bg-bg-2 p-3 rounded border border-border/80 text-xs text-text-secondary flex flex-col space-y-2 select-none">
              <div className="flex items-center justify-between">
                <span>Simulated Wallet Address:</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-accent flex items-center hover:underline"
                >
                  {copied ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <span className="font-mono text-text-primary break-all select-all">0xCryptoVaultSimulationWalletAddressDemoOnly</span>
              
              {/* Dynamic QR Code */}
              <div className="flex justify-center pt-2">
                <div className="bg-white p-2 rounded">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=0xCryptoVaultSimulationWalletAddressDemoOnly`}
                    alt="Simulated Deposit QR Code"
                    className="w-[130px] h-[130px]"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDepositOpen(false)}
                className="h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isDepositing}
                className="h-9 bg-accent hover:bg-accent-hover text-bg font-bold"
              >
                {isDepositing ? 'Depositing...' : 'Confirm Simulated Deposit'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
export default WalletPage;
