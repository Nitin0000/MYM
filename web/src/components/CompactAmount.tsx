import React, { useState } from 'react';
import { formatCompactCurrency } from '../utils/currency';

interface CompactAmountProps {
  amount: number;
  prefix?: string;
  className?: string;
  color?: string;
}

export default function CompactAmount({
  amount,
  prefix = '',
  className = '',
  color,
}: CompactAmountProps) {
  const { short, full } = formatCompactCurrency(amount);
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => setShowTooltip(!showTooltip)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`focus:outline-none cursor-pointer transition-opacity hover:opacity-85 ${className}`}
        style={color ? { color } : undefined}
        title="Click to view exact amount"
      >
        <span>
          {prefix}{short}
        </span>
      </button>

      {showTooltip && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1 text-xs font-semibold rounded-md shadow-lg border border-white/10 bg-black text-white whitespace-nowrap z-50 animate-fade-in pointer-events-none"
          style={color ? { color } : undefined}
        >
          {prefix}{full}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-black" />
        </div>
      )}
    </div>
  );
}
