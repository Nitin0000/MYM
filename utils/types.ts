/* ─── Shared type definitions for MYM ──────────────────── */

// Expense types
export type ExpenseType = 'fixed' | 'variable';
export type ExpenseFrequency = 'one-time' | 'monthly' | 'quarterly' | 'yearly';

export const EXPENSE_TYPES: ExpenseType[] = ['fixed', 'variable'];
export const EXPENSE_FREQUENCIES: ExpenseFrequency[] = ['one-time', 'monthly', 'quarterly', 'yearly'];

export const EXPENSE_CATEGORIES = [
  'Food', 'Rent', 'EMI', 'Shopping', 'Bills', 'Health',
  'Transport', 'Insurance', 'Education', 'Entertainment', 'Petrol',
];

export type Expense = {
  id: string;
  user_id: string;
  amount: number;
  category: string;
  type: ExpenseType;
  frequency: ExpenseFrequency;
  start_date: string;
  end_date: string | null;
  is_essential: boolean;
  description: string | null;
  created_at: string;
  deleted_at: string | null;
};

// Income types
export type IncomeType = 'salary' | 'business' | 'freelance' | 'investment' | 'other';
export type IncomeFrequency = 'one-time' | 'monthly' | 'yearly' | 'custom';

export const INCOME_TYPES: IncomeType[] = ['salary', 'business', 'freelance', 'investment', 'other'];
export const INCOME_FREQUENCIES: IncomeFrequency[] = ['one-time', 'monthly', 'yearly', 'custom'];

export type Income = {
  id: string;
  user_id: string;
  amount: number;
  type: IncomeType;
  frequency: IncomeFrequency;
  start_date: string;
  end_date: string | null;
  description: string | null;
  created_at: string;
  deleted_at: string | null;
};

// Unified entry (for combined lists)
export type UnifiedEntry = {
  id: string;
  amount: number;
  kind: 'income' | 'expense';
  label: string;          // category for expense, type for income
  date: string;
  description: string | null;
  frequency: string;
  expenseType?: ExpenseType;  // only for expenses
  isEssential?: boolean;      // only for expenses
  endDate?: string | null;    // end date for recurring entries
  created_at: string;
};

// Dashboard filter
export type TimeFilter = 'month' | 'year' | 'all';
