import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { OpenOrders } from './OpenOrders';
import { OrderHistory } from './OrderHistory';
import api from '../../lib/api';
import { formatPrice } from '../../lib/utils';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/table';

function FundsTab() {
  const [balances, setBalances] = useState({});

  const fetchBalances = async () => {
    try {
      const res = await api.get('/wallet');
      setBalances(res.data.balances || {});
    } catch (err) {
      console.error(err.message);
    }
  };

  useEffect(() => {
    fetchBalances();
    window.addEventListener('wallet_balance_updated', (e) => {
      setBalances(e.detail || {});
    });
    return () => {
      window.removeEventListener('wallet_balance_updated', (e) => {});
    };
  }, []);

  const entries = Object.entries(balances).filter(([_, b]) => (b.available + b.locked) > 0);

  return (
    <div className="w-full bg-bg-1 overflow-x-auto text-xs select-none">
      {entries.length === 0 ? (
        <div className="p-8 text-center text-text-secondary">No assets found in wallet</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Asset</TableHead>
              <TableHead className="text-right">Available Balance</TableHead>
              <TableHead className="text-right">Locked in Orders</TableHead>
              <TableHead className="text-right pr-4">Total Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map(([asset, bal]) => (
              <TableRow key={asset}>
                <TableCell className="pl-4 font-bold text-text-primary">{asset}</TableCell>
                <TableCell className="text-right font-mono text-text-primary">{bal.available.toFixed(4)}</TableCell>
                <TableCell className="text-right font-mono text-text-secondary">{bal.locked.toFixed(4)}</TableCell>
                <TableCell className="text-right font-mono text-accent pr-4">{(bal.available + bal.locked).toFixed(4)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

export function TradePanel() {
  const [activeTab, setActiveTab] = useState('open_orders');

  return (
    <div className="bg-bg-1 border border-border rounded flex flex-col font-sans select-none select-none min-h-[200px]">
      <Tabs defaultValue="open_orders" className="w-full" onValueChange={setActiveTab}>
        <div className="px-4 border-b border-border/40">
          <TabsList className="bg-transparent border-none p-0 h-10 w-auto space-x-6">
            <TabsTrigger
              value="open_orders"
              className="data-[state=active]:bg-transparent data-[state=active]:text-accent border-b-2 border-transparent data-[state=active]:border-accent rounded-none h-full px-0 text-xs font-semibold"
            >
              Open Orders
            </TabsTrigger>
            <TabsTrigger
              value="order_history"
              className="data-[state=active]:bg-transparent data-[state=active]:text-accent border-b-2 border-transparent data-[state=active]:border-accent rounded-none h-full px-0 text-xs font-semibold"
            >
              Order History
            </TabsTrigger>
            <TabsTrigger
              value="funds"
              className="data-[state=active]:bg-transparent data-[state=active]:text-accent border-b-2 border-transparent data-[state=active]:border-accent rounded-none h-full px-0 text-xs font-semibold"
            >
              Available Funds
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="p-2 overflow-y-auto max-h-[250px]">
          <TabsContent value="open_orders" className="mt-0 outline-none">
            <OpenOrders />
          </TabsContent>
          <TabsContent value="order_history" className="mt-0 outline-none">
            <OrderHistory />
          </TabsContent>
          <TabsContent value="funds" className="mt-0 outline-none">
            <FundsTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
export default TradePanel;
