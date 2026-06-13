import React, { useState, useEffect } from 'react';
import { useMarketStore } from '../store/marketStore';
import api from '../lib/api';
import { formatPrice } from '../lib/utils';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '../components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ShieldAlert, Users, Percent, ShieldCheck, Activity, Cpu } from 'lucide-react';

export function AdminPage() {
  const allPairs = useMarketStore((state) => state.allPairs);
  
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalOrders: 0, openOrders: 0, volume24h: 0, uptime: 0, systemHealth: { cpu: 0, memory: 0 } });
  const [auditLogs, setAuditLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Price override inputs
  const [overrideSymbol, setOverrideSymbol] = useState('BTCUSDT');
  const [overridePriceVal, setOverridePriceVal] = useState('');
  const [overrideSuccess, setOverrideSuccess] = useState('');
  const [overrideError, setOverrideError] = useState('');

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const usersRes = await api.get('/admin/users');
      setUsers(usersRes.data.users || []);

      const statsRes = await api.get('/admin/system');
      setStats(statsRes.data.stats || {});

      const logsRes = await api.get('/admin/audit-log');
      setAuditLogs(logsRes.data.logs || []);

      setIsLoading(false);
    } catch (err) {
      console.error('Failed to load admin controls:', err.message);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
    // Refresh stats every 10 seconds
    const interval = setInterval(async () => {
      try {
        const statsRes = await api.get('/admin/system');
        setStats(statsRes.data.stats || {});
      } catch (e) {}
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleOverrideSubmit = async (e) => {
    e.preventDefault();
    setOverrideSuccess('');
    setOverrideError('');

    if (!overridePriceVal || parseFloat(overridePriceVal) <= 0) return;

    try {
      const res = await api.post('/admin/market/override-price', {
        symbol: overrideSymbol,
        price: parseFloat(overridePriceVal),
      });
      setOverrideSuccess(res.data.message);
      setOverridePriceVal('');
      
      // Update system stats
      const statsRes = await api.get('/admin/system');
      setStats(statsRes.data.stats || {});
    } catch (err) {
      setOverrideError(err.response?.data?.message || 'Price override failed');
    }
  };

  const updateUserFields = async (userId, fields) => {
    try {
      const res = await api.put(`/admin/users/${userId}`, fields);
      
      // Update local state
      setUsers(users.map((u) => (u.id === userId ? { ...u, ...res.data.user } : u)));
      
      // Refresh audit log
      const logsRes = await api.get('/admin/audit-log');
      setAuditLogs(logsRes.data.logs || []);
    } catch (err) {
      console.error('Failed to update user parameters:', err.message);
    }
  };

  const getUptimeString = (seconds) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="large" /></div>;
  }

  return (
    <div className="min-h-screen bg-bg text-text-primary px-6 py-8 select-none select-none">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Title */}
        <div className="text-left select-none">
          <h1 className="text-2xl font-bold flex items-center">
            <ShieldAlert className="w-6 h-6 text-accent mr-2" />
            System Control Panel
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">Admin-only operations: inspect accounts, review system audits, and inject manual pricing</p>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
          {/* Card 1: Users */}
          <Card className="border-border text-left">
            <CardHeader className="pb-1 px-4 pt-4 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-semibold text-text-secondary uppercase">System Accounts</CardTitle>
              <Users className="w-4 h-4 text-accent" />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-bold font-mono text-text-primary">{stats.totalUsers}</div>
              <p className="text-[10px] text-text-secondary mt-1">Total registered profiles</p>
            </CardContent>
          </Card>

          {/* Card 2: Total Orders */}
          <Card className="border-border text-left">
            <CardHeader className="pb-1 px-4 pt-4 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-semibold text-text-secondary uppercase">Total Orders</CardTitle>
              <Percent className="w-4 h-4 text-blue-400" />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-bold font-mono text-text-primary">{stats.totalOrders}</div>
              <p className="text-[10px] text-text-secondary mt-1">
                Active Limit: <span className="font-semibold text-accent">{stats.openOrders}</span>
              </p>
            </CardContent>
          </Card>

          {/* Card 3: 24h Vol */}
          <Card className="border-border text-left">
            <CardHeader className="pb-1 px-4 pt-4 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-semibold text-text-secondary uppercase">24h Trade Volume</CardTitle>
              <Activity className="w-4 h-4 text-buy" />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-bold font-mono text-text-primary">
                {formatPrice(stats.volume24h)} <span className="text-xs">USDT</span>
              </div>
              <p className="text-[10px] text-text-secondary mt-1">Simulated platform executions</p>
            </CardContent>
          </Card>

          {/* Card 4: Platform Uptime */}
          <Card className="border-border text-left">
            <CardHeader className="pb-1 px-4 pt-4 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-semibold text-text-secondary uppercase">Platform Uptime</CardTitle>
              <ShieldCheck className="w-4 h-4 text-purple-400" />
            </CardHeader>
            <CardContent className="px-4 pb-4 font-sans">
              <div className="text-lg font-bold text-text-primary mt-1">
                {getUptimeString(stats.uptime)}
              </div>
              <p className="text-[10px] text-text-secondary mt-1">Time since node server start</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Panel Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 select-none">
          
          {/* Override Price Input Panel */}
          <Card className="lg:col-span-1 border-border text-left h-fit">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Price Injection Override</CardTitle>
              <CardDescription>Manually force price ticks of active symbols instantly</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <form onSubmit={handleOverrideSubmit} className="space-y-4">
                {overrideSuccess && (
                  <div className="border border-emerald-500/20 bg-emerald-500/10 text-buy text-xs p-2.5 rounded font-medium">
                    {overrideSuccess}
                  </div>
                )}
                {overrideError && (
                  <div className="border border-red-500/20 bg-red-500/10 text-sell text-xs p-2.5 rounded font-medium">
                    {overrideError}
                  </div>
                )}

                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs text-text-secondary">Select Pair</label>
                  <select
                    value={overrideSymbol}
                    onChange={(e) => setOverrideSymbol(e.target.value)}
                    className="flex h-9 w-full rounded border border-border bg-bg-2 px-3 py-1 text-sm text-text-primary focus:outline-none focus:border-accent"
                  >
                    {allPairs.map((p) => (
                      <option key={p.symbol} value={p.symbol}>
                        {p.symbol} ({p.base}/USDT)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs text-text-secondary">New Inject Price (USDT)</label>
                  <Input
                    type="number"
                    step="any"
                    placeholder="e.g. 70000"
                    value={overridePriceVal}
                    onChange={(e) => setOverridePriceVal(e.target.value)}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-accent text-bg hover:bg-accent-hover font-bold text-xs h-9"
                >
                  Force Price Override
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* System Health stats */}
          <Card className="lg:col-span-2 border-border text-left h-fit">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Server Resource Monitor</CardTitle>
              <CardDescription>Simulated CPU & Memory allocations</CardDescription>
            </CardHeader>
            <CardContent className="pt-2 space-y-6">
              {/* CPU */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="flex items-center text-text-secondary">
                    <Cpu className="w-3.5 h-3.5 text-text-muted mr-1.5 animate-pulse" />
                    Simulated CPU Load
                  </span>
                  <span className="font-mono text-text-primary">{stats.systemHealth.cpu}%</span>
                </div>
                <div className="w-full bg-bg-2 h-2.5 rounded overflow-hidden">
                  <div
                    className="bg-accent h-full transition-all duration-500 rounded"
                    style={{ width: `${stats.systemHealth.cpu}%` }}
                  />
                </div>
              </div>

              {/* Memory */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="flex items-center text-text-secondary">
                    <Activity className="w-3.5 h-3.5 text-text-muted mr-1.5" />
                    Simulated RAM Load
                  </span>
                  <span className="font-mono text-text-primary">{stats.systemHealth.memory}%</span>
                </div>
                <div className="w-full bg-bg-2 h-2.5 rounded overflow-hidden">
                  <div
                    className="bg-accent h-full transition-all duration-500 rounded"
                    style={{ width: `${stats.systemHealth.memory}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Account Manager */}
        <div className="bg-bg-1 border border-border rounded overflow-hidden text-left select-none">
          <div className="px-4 py-3 border-b border-border/40 font-semibold text-xs text-text-primary">
            User Account Manager
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-bg-2/10">
                <TableHead className="pl-4">Name / Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>KYC Status</TableHead>
                <TableHead>Account status</TableHead>
                <TableHead className="text-right pr-4">Balances Summary</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const usdtBal = u.walletBalances?.USDT?.available || 0;
                const btcBal = u.walletBalances?.BTC?.available || 0;

                return (
                  <TableRow key={u.id}>
                    <TableCell className="pl-4 py-3">
                      <div className="font-bold text-text-primary leading-tight">{u.name}</div>
                      <div className="text-[10px] text-text-secondary font-mono leading-none mt-0.5">{u.email}</div>
                    </TableCell>
                    <TableCell>
                      <select
                        value={u.role}
                        onChange={(e) => updateUserFields(u.id, { role: e.target.value })}
                        className="bg-bg-2 border border-border rounded text-xs text-text-primary px-1.5 py-0.5 focus:outline-none focus:border-accent"
                      >
                        <option value="trader">trader</option>
                        <option value="admin">admin</option>
                        <option value="viewer">viewer</option>
                      </select>
                    </TableCell>
                    <TableCell>
                      <select
                        value={u.kycStatus}
                        onChange={(e) => updateUserFields(u.id, { kycStatus: e.target.value })}
                        className="bg-bg-2 border border-border rounded text-xs text-text-primary px-1.5 py-0.5 focus:outline-none focus:border-accent"
                      >
                        <option value="none">none</option>
                        <option value="pending">pending</option>
                        <option value="approved">approved</option>
                      </select>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant={u.isActive ? 'outline' : 'destructive'}
                        size="sm"
                        onClick={() => updateUserFields(u.id, { isActive: !u.isActive })}
                        className={`h-6 text-[10px] rounded-sm font-semibold px-2 ${
                          u.isActive
                            ? 'text-buy border-buy/20 hover:bg-buy/10 hover:border-buy/30'
                            : 'bg-sell text-text-primary hover:bg-red-600'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Deactivated'}
                      </Button>
                    </TableCell>
                    <TableCell className="text-right font-mono text-[10px] text-text-secondary pr-4 leading-normal">
                      <div>USDT: <span className="text-text-primary font-semibold">{usdtBal.toFixed(2)}</span></div>
                      <div>BTC: <span className="text-text-primary font-semibold">{btcBal.toFixed(4)}</span></div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* System Audit Logs */}
        <div className="bg-bg-1 border border-border rounded overflow-hidden text-left select-none">
          <div className="px-4 py-3 border-b border-border/40 font-semibold text-xs text-text-primary">
            Platform Transactions Audit Log
          </div>
          {auditLogs.length === 0 ? (
            <EmptyState message="No audit actions logged" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-bg-2/10">
                  <TableHead className="pl-4">Time</TableHead>
                  <TableHead>User Profile</TableHead>
                  <TableHead>Audit Type</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="pl-6 pr-4">Reference Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((log) => (
                  <TableRow key={log._id}>
                    <TableCell className="pl-4 font-mono text-[10px] text-text-secondary">
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-text-primary leading-tight">{log.userId?.name}</div>
                      <div className="text-[9px] text-text-secondary font-mono leading-none mt-0.5">{log.userId?.email}</div>
                    </TableCell>
                    <TableCell>
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-sm ${
                        log.type === 'DEPOSIT' ? 'bg-buy/10 text-buy' : 'bg-bg-3 text-text-secondary'
                      }`}>
                        {log.type}
                      </span>
                    </TableCell>
                    <TableCell className="font-bold text-text-primary">{log.asset}</TableCell>
                    <TableCell className="text-right font-mono text-text-primary font-semibold">
                      {log.amount.toFixed(4)}
                    </TableCell>
                    <TableCell className="pl-6 text-[10px] text-text-secondary pr-4 font-sans">
                      {log.reference}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

      </div>
    </div>
  );
}
export default AdminPage;
