import React, { useState, useEffect, useRef } from 'react';
import { formatPrice } from '../../lib/utils';

export function PriceTag({ price, symbol = '', className = '' }) {
  const [flashClass, setFlashClass] = useState('');
  const prevPriceRef = useRef(price);

  useEffect(() => {
    if (price === undefined || price === null) return;
    
    const numPrev = Number(prevPriceRef.current);
    const numCurr = Number(price);

    if (numCurr > numPrev) {
      setFlashClass('bg-buy/20 text-buy');
      const timer = setTimeout(() => setFlashClass(''), 400);
      return () => clearTimeout(timer);
    } else if (numCurr < numPrev) {
      setFlashClass('bg-sell/20 text-sell');
      const timer = setTimeout(() => setFlashClass(''), 400);
      return () => clearTimeout(timer);
    }

    prevPriceRef.current = price;
  }, [price]);

  return (
    <span className={`font-mono transition-all duration-300 px-1 py-0.5 rounded ${flashClass} ${className}`}>
      {formatPrice(price, symbol)}
    </span>
  );
}
export default PriceTag;
