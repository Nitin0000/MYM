export const formatCurrency = (amount: number | string, minimumFractionDigits = 2) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '₹0.00';
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits, maximumFractionDigits: minimumFractionDigits })}`;
};
