import React, { useEffect } from 'react';
import { useOrderStore } from '../../store/orderStore';
import { formatPrice } from '../../lib/utils';
import { format } from 'date-fns';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/table';
import { Badge } from '../ui/badge';
import { EmptyState } from '../common/EmptyState';
import { LoadingSpinner } from '../common/LoadingSpinner';

export function OrderHistory({ symbol = '' }) {
  const { orderHistory, fetchHistory, isLoading } = useOrderStore();

  useEffect(() => {
    fetchHistory(symbol);
  }, [symbol]);

  if (isLoading && orderHistory.length === 0) {
    return <div className="p-8 flex justify-center"><LoadingSpinner /></div>;
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'FILLED':
        return <Badge variant="success" className="text-[9px] px-1 py-0 bg-buy/10 hover:bg-buy/15">Filled</Badge>;
      case 'CANCELLED':
        return <Badge variant="secondary" className="text-[9px] px-1 py-0 bg-bg-3 hover:bg-bg-3/80 text-text-secondary">Cancelled</Badge>;
      default:
        return <Badge variant="outline" className="text-[9px] px-1 py-0">{status}</Badge>;
    }
  };

  return (
    <div className="w-full bg-bg-1 overflow-x-auto select-none select-none">
      {orderHistory.length === 0 ? (
        <EmptyState message="No order history found" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Date</TableHead>
              <TableHead>Pair</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Side</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Filled Amount</TableHead>
              <TableHead className="text-right">Total(USDT)</TableHead>
              <TableHead className="text-center pr-4">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orderHistory.map((order) => {
              const base = order.symbol.replace('USDT', '');
              const totalCost = order.filledQty * order.price;

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
                    {order.filledQty.toFixed(4)} / {order.quantity.toFixed(4)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-text-primary">
                    {formatPrice(totalCost)}
                  </TableCell>
                  <TableCell className="text-center pr-4">
                    {getStatusBadge(order.status)}
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
export default OrderHistory;
