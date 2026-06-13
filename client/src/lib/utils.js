import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Format price with correct decimals depending on size
export function formatPrice(price, symbol = '') {
  if (price === undefined || price === null) return '0.00';
  const numPrice = Number(price);

  let decimals = 2;
  if (numPrice < 0.1) {
    decimals = 6;
  } else if (numPrice < 1.0) {
    decimals = 4;
  } else if (numPrice < 100) {
    decimals = 3;
  }

  const formatted = numPrice.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return symbol ? `${formatted} ${symbol}` : formatted;
}

// Format volume with correct decimal places
export function formatVolume(volume) {
  if (volume === undefined || volume === null) return '0.00';
  const numVolume = Number(volume);

  if (numVolume >= 1000000) {
    return (numVolume / 1000000).toFixed(2) + 'M';
  }
  if (numVolume >= 1000) {
    return (numVolume / 1000).toFixed(2) + 'K';
  }

  return numVolume.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

// Format percentages with colored arrows or signs
export function formatPercent(percent) {
  if (percent === undefined || percent === null) return '0.00%';
  const num = Number(percent);
  const sign = num > 0 ? '+' : '';
  return `${sign}${num.toFixed(2)}%`;
}
