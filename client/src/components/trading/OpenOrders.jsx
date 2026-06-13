import React, { useEffect } from 'react';
import { useOrderStore } from '../../store/orderStore';
import { formatPrice } from '../../lib/utils';
import { format } from 'date-fns';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/table';
import { Button } from '../ui/button';
import { EmptyState } from '../common/EmptyState';
import { LoadingSpinner } from '../common/LoadingSpinner';

export function OpenOrders() {
  const { openOrders, fetchOpenOrders, cancelOrder, isLoading } = useOrderStore();

  useEffect(() => {
    fetchOpenOrders();
  }, []);

  const handleCancel = async (id) => {
    await cancelOrder(id);
  };

  if (isLoading && openOrders.length === 0) {
    return <div className="p-8 flex justify-center"><LoadingSpinner /></div>;
  }

  return (
    <div className="w-full bg-bg-1 overflow-x-auto select-none select-none">
      {openOrders.length === 0 ? (
        <EmptyState message="No active open orders" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Date</TableHead>
              <TableHead>Pair</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Side</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Filled %</TableHead>
              <TableHead className="text-right">Total(USDT)</TableHead>
              <TableHead className="text-center pr-4">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {openOrders.map((order) => {
              const base = order.symbol.replace('USDT', '');
              const filledPercent = ((order.filledQty / order.quantity) * 100).toFixed(2);
              const totalCost = order.quantity * order.price;

              return (
                <TableRow key={order._id}>
                  <TableCell className="pl-4 font-mono text-text-secondary">
                    {format(new Date(order.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                  </TableCell>
                  <TableCell className="font-semibold text-text-primary">
                    {base}/USDT
                  </TableCell>
                  <TableCell className="text-text-secondary text-[10px]">
                    {order.type}
                  </TableCell>
                  <TableCell className={`font-semibold ${order.side === 'BUY' ? 'text-buy' : 'text-sell'}`}>
                    {order.side}
                  </TableCell>
                  <TableCell className="text-right font-mono text-text-primary">
                    {formatPrice(order.price)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-text-primary">
                    {order.quantity.toFixed(4)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-text-secondary">
                    {filledPercent}%
                  </TableCell>
                  <TableCell className="text-right font-mono text-text-primary">
                    {formatPrice(totalCost)}
                  </TableCell>
                  <TableCell className="text-center pr-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancel(order._id)}
                      className="h-6 text-[10px] text-sell border-sell/20 hover:bg-sell/10 hover:border-sell/30 px-2.5 rounded-sm"
                    >
                      Cancel
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
export default OpenOrders;
