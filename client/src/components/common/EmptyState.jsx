import React from 'react';
import { Database } from 'lucide-react';

export function EmptyState({ message = 'No data available', icon: Icon = Database, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center text-text-secondary select-none ${className}`}>
      <Icon className="w-8 h-8 text-text-muted mb-2 stroke-[1.5]" />
      <p className="text-xs">{message}</p>
    </div>
  );
}
export default EmptyState;
