export const formatCurrency = (amount: number | string, minimumFractionDigits = 2) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '₹0.00';
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits, maximumFractionDigits: minimumFractionDigits })}`;
};

/**
 * Compact Indian currency format:
 *   100000   → ₹1L      (Lac)
 *   10000000 → ₹1Cr     (Crore)
 *   50000    → ₹50K
 *   999      → ₹999
 * Returns { short, full } so callers can show both.
 */
export const formatCompactCurrency = (
  amount: number | string,
): { short: string; full: string } => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return { short: '₹0', full: '₹0.00' };

  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  let short: string;
  // if (abs >= 1_00_00_000) {
  //   // Crores
  //   const val = abs / 1_00_00_000;
  //   short = `${sign}₹${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}Cr`;
  // } else 
  if (abs >= 1_00_000) {
    // Lacs
    const val = abs / 1_00_000;
    short = `${sign}₹${val % 1 === 0 ? val.toFixed(0) : val.toFixed(2)} L`;
  } else {
    short = `${sign}₹${abs % 1 === 0 ? abs.toFixed(0) : abs.toFixed(2)}`;
  }

  const full = `${sign}₹${abs.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  return { short, full };
};
