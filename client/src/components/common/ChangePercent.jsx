import React from 'react';
import { formatPercent } from '../../lib/utils';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export function ChangePercent({ change, className = '', showArrow = true }) {
  if (change === undefined || change === null) return <span className="text-text-secondary font-mono">0.00%</span>;

  const numChange = Number(change);
  const isPositive = numChange > 0;
  const isNegative = numChange < 0;

  const colorClass = isPositive 
    ? 'text-buy' 
    : isNegative 
      ? 'text-sell' 
      : 'text-text-secondary';

  return (
    <span className={`inline-flex items-center font-mono font-medium text-xs ${colorClass} ${className}`}>
      {showArrow && isPositive && <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />}
      {showArrow && isNegative && <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
      {formatPercent(change)}
    </span>
  );
}
export default ChangePercent;
