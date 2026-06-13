import React, { useState, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';
import api from '../lib/api';
import { formatPrice } from '../lib/utils';
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/card';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, Award, Activity, Calendar, HelpCircle } from 'lucide-react';

export function DashboardPage() {
  useSocket(); // keep background connection live
  const [portfolio, setPortfolio] = useState({ currentValue: 0, assets: [], history: [] });
  const [performance, setPerformance] = useState({ totalTrades: 0, winRate: 0, avgProfit: 0, bestTrade: 0, worstTrade: 0, activeSince: null });
  const [volumes, setVolumes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const pRes = await api.get('/analytics/portfolio');
      setPortfolio(pRes.data);

      const perfRes = await api.get('/analytics/performance');
      setPerformance(perfRes.data.performance);

      const vRes = await api.get('/analytics/volume');
      setVolumes(vRes.data.volumes);
      
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to load dashboard data:', err.message);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="large" /></div>;
  }

  // Derived KPI values
  const activeDate = performance.activeSince ? new Date(performance.activeSince).toLocaleDateString() : 'N/A';
  const lastHistoryPoint = portfolio.history[portfolio.history.length - 1];
  const totalPnlVal = lastHistoryPoint ? lastHistoryPoint.pnl : 0;
  const totalPnlPercent = lastHistoryPoint ? lastHistoryPoint.pnlPercent : 0;
  const isPnlUp = totalPnlVal >= 0;

  return (
    <div className="min-h-screen bg-bg text-text-primary px-6 py-8 select-none select-none">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Title */}
        <div className="text-left select-none">
          <h1 className="text-2xl font-bold">Trader Analytics</h1>
          <p className="text-xs text-text-secondary mt-0.5">Audit your simulated trading statistics, P&L history, and volume distribution</p>
        </div>

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
          {/* Card 1: Total P&L */}
          <Card className="border-border text-left">
            <CardHeader className="pb-1.5 pt-4 px-4 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-semibold text-text-secondary uppercase">Net Profit & Loss</CardTitle>
              <TrendingUp className={`w-4 h-4 ${isPnlUp ? 'text-buy' : 'text-sell'}`} />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className={`text-2xl font-bold font-mono ${isPnlUp ? 'text-buy' : 'text-sell'}`}>
                {isPnlUp ? '+' : ''}{formatPrice(totalPnlVal)} USDT
              </div>
              <p className="text-[10px] text-text-secondary mt-1">
                Yield: <span className={isPnlUp ? 'text-buy' : 'text-sell font-semibold'}>{totalPnlPercent}%</span> (since start)
              </p>
            </CardContent>
          </Card>

          {/* Card 2: Win Rate */}
          <Card className="border-border text-left">
            <CardHeader className="pb-1.5 pt-4 px-4 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-semibold text-text-secondary uppercase">Win Rate</CardTitle>
              <Award className="w-4 h-4 text-accent" />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-bold font-mono text-text-primary">
                {performance.winRate}%
              </div>
              <p className="text-[10px] text-text-secondary mt-1">
                Average gain: <span className="text-buy font-semibold font-mono">+${performance.avgProfit}</span> / trade
              </p>
            </CardContent>
          </Card>

          {/* Card 3: Total Trades */}
          <Card className="border-border text-left">
            <CardHeader className="pb-1.5 pt-4 px-4 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-semibold text-text-secondary uppercase">Total Trades</CardTitle>
              <Activity className="w-4 h-4 text-blue-400" />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-bold font-mono text-text-primary">
                {performance.totalTrades}
              </div>
              <p className="text-[10px] text-text-secondary mt-1">
                Best trade: <span className="text-buy font-semibold font-mono">+${performance.bestTrade}</span>
              </p>
            </CardContent>
          </Card>

          {/* Card 4: Uptime / Active Since */}
          <Card className="border-border text-left">
            <CardHeader className="pb-1.5 pt-4 px-4 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-semibold text-text-secondary uppercase">Account Age</CardTitle>
              <Calendar className="w-4 h-4 text-purple-400" />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-bold font-mono text-text-primary">
                Active
              </div>
              <p className="text-[10px] text-text-secondary mt-1">
                Registered on: <span className="text-text-primary font-semibold">{activeDate}</span>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 select-none">
          
          {/* Portfolio P&L Area Chart */}
          <Card className="lg:col-span-2 border-border text-left flex flex-col justify-between">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Net Capital Progress (30d)</CardTitle>
            </CardHeader>
            <CardContent className="h-64 pt-4">
              {portfolio.history.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-text-secondary">No history data</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={portfolio.history}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F0B90B" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#F0B90B" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2D3139" vertical={false} />
                    <XAxis dataKey="date" stroke="#848E9C" fontSize={9} dy={8} />
                    <YAxis 
                      stroke="#848E9C" 
                      fontSize={9} 
                      domain={['dataMin - 100', 'dataMax + 100']} 
                      tickFormatter={(v) => `$${v}`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1E2026', border: '1px solid #2B2F36', borderRadius: '4px' }}
                      labelStyle={{ color: '#848E9C', fontSize: 10 }}
                      itemStyle={{ color: '#EAECEF', fontSize: 11, fontFamily: 'monospace' }}
                      formatter={(v) => [`$${v}`, 'Portfolio Value']}
                    />
                    <Area type="monotone" dataKey="value" stroke="#F0B90B" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Volume Bar Chart */}
          <Card className="lg:col-span-1 border-border text-left flex flex-col justify-between">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Trade Volumes by Pair</CardTitle>
            </CardHeader>
            <CardContent className="h-64 pt-4">
              {volumes.length === 0 || (volumes.length === 1 && volumes[0].volume === 0) ? (
                <div className="h-full flex items-center justify-center text-xs text-text-secondary">No trade volume logs</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={volumes}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2D3139" vertical={false} />
                    <XAxis dataKey="pair" stroke="#848E9C" fontSize={9} dy={8} />
                    <YAxis stroke="#848E9C" fontSize={9} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1E2026', border: '1px solid #2B2F36', borderRadius: '4px' }}
                      labelStyle={{ color: '#848E9C', fontSize: 10 }}
                      itemStyle={{ color: '#F0B90B', fontSize: 11, fontFamily: 'monospace' }}
                      formatter={(v) => [`$${v}`, 'USDT Volume']}
                    />
                    <Bar dataKey="volume" fill="#F0B90B" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Trade Details Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 select-none">
          <Card className="border-border text-left">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Advanced Analytics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs font-sans">
              <div className="flex justify-between items-center border-b border-border/20 pb-2">
                <span className="text-text-secondary flex items-center">
                  <HelpCircle className="w-3.5 h-3.5 text-text-muted mr-1.5" />
                  Average Profit per Trade
                </span>
                <span className="font-mono text-buy font-bold">+${performance.avgProfit} USDT</span>
              </div>
              <div className="flex justify-between items-center border-b border-border/20 pb-2">
                <span className="text-text-secondary flex items-center">
                  <HelpCircle className="w-3.5 h-3.5 text-text-muted mr-1.5" />
                  Best Trade Return
                </span>
                <span className="font-mono text-buy font-bold">+${performance.bestTrade} USDT</span>
              </div>
              <div className="flex justify-between items-center border-b border-border/20 pb-2">
                <span className="text-text-secondary flex items-center">
                  <HelpCircle className="w-3.5 h-3.5 text-text-muted mr-1.5" />
                  Worst Trade Return
                </span>
                <span className="font-mono text-sell font-bold">${performance.worstTrade} USDT</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary flex items-center">
                  <HelpCircle className="w-3.5 h-3.5 text-text-muted mr-1.5" />
                  Win / Loss Ratio
                </span>
                <span className="font-mono text-text-primary">{(performance.winRate / (100 - performance.winRate || 1)).toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border text-left">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Active Asset Portfolios</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[160px] overflow-y-auto space-y-3.5 text-xs font-sans">
              {portfolio.assets.length === 0 ? (
                <div className="py-6 text-center text-text-secondary">No positive asset balances. Go deposit or trade!</div>
              ) : (
                portfolio.assets.sort((a,b) => b.valueUsdt - a.valueUsdt).map((a) => (
                  <div key={a.asset} className="flex justify-between items-center border-b border-border/15 pb-2 last:border-0 last:pb-0">
                    <span className="font-bold text-text-primary">{a.asset}</span>
                    <div className="flex flex-col text-right">
                      <span className="font-mono text-text-primary font-semibold">{a.holdings.toFixed(4)}</span>
                      <span className="text-[10px] text-text-secondary font-mono">${a.valueUsdt.toFixed(2)} USDT</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
export default DashboardPage;
