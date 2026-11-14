import { supabase, isSupabaseConfigured } from './supabase';
import { Expense, Income } from '../utils/types';

const LOCAL_EXPENSES_KEY = 'mym_local_expenses';
const LOCAL_INCOME_KEY = 'mym_local_income';

// Initial sample data if no data exists
const initialExpenses: Expense[] = [
  {
    id: 'exp-1',
    user_id: 'sample',
    amount: 18000,
    category: 'Rent',
    type: 'fixed',
    frequency: 'monthly',
    start_date: '2024-01-01',
    end_date: null,
    is_essential: true,
    description: 'Apartment monthly rent',
    created_at: '2024-01-01T10:00:00Z',
    deleted_at: null,
  },
  {
    id: 'exp-2',
    user_id: 'sample',
    amount: 4500,
    category: 'Bills',
    type: 'fixed',
    frequency: 'monthly',
    start_date: '2024-01-05',
    end_date: null,
    is_essential: true,
    description: 'Electricity & Wifi',
    created_at: '2024-01-05T10:00:00Z',
    deleted_at: null,
  },
  {
    id: 'exp-3',
    user_id: 'sample',
    amount: 1200,
    category: 'Food',
    type: 'variable',
    frequency: 'one-time',
    start_date: new Date().toISOString().split('T')[0],
    end_date: null,
    is_essential: true,
    description: 'Grocery shopping',
    created_at: new Date().toISOString(),
    deleted_at: null,
  },
  {
    id: 'exp-4',
    user_id: 'sample',
    amount: 850,
    category: 'Entertainment',
    type: 'variable',
    frequency: 'one-time',
    start_date: new Date().toISOString().split('T')[0],
    end_date: null,
    is_essential: false,
    description: 'Movie tickets',
    created_at: new Date().toISOString(),
    deleted_at: null,
  },
];

const initialIncome: Income[] = [
  {
    id: 'inc-1',
    user_id: 'sample',
    amount: 75000,
    type: 'salary',
    frequency: 'monthly',
    start_date: '2024-01-01',
    end_date: null,
    description: 'Tech Job Salary',
    created_at: '2024-01-01T09:00:00Z',
    deleted_at: null,
  },
  {
    id: 'inc-2',
    user_id: 'sample',
    amount: 12000,
    type: 'freelance',
    frequency: 'one-time',
    start_date: new Date().toISOString().split('T')[0],
    end_date: null,
    description: 'UI Design Project',
    created_at: new Date().toISOString(),
    deleted_at: null,
  },
];

function getLocalExpenses(): Expense[] {
  const raw = localStorage.getItem(LOCAL_EXPENSES_KEY);
  if (!raw) {
    localStorage.setItem(LOCAL_EXPENSES_KEY, JSON.stringify(initialExpenses));
    return initialExpenses;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function setLocalExpenses(list: Expense[]) {
  localStorage.setItem(LOCAL_EXPENSES_KEY, JSON.stringify(list));
}

function getLocalIncome(): Income[] {
  const raw = localStorage.getItem(LOCAL_INCOME_KEY);
  if (!raw) {
    localStorage.setItem(LOCAL_INCOME_KEY, JSON.stringify(initialIncome));
    return initialIncome;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function setLocalIncome(list: Income[]) {
  localStorage.setItem(LOCAL_INCOME_KEY, JSON.stringify(list));
}

export async function fetchUserExpenses(userId: string): Promise<Expense[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null);
    if (error) throw error;
    return data || [];
  } else {
    return getLocalExpenses().filter((e) => e.deleted_at === null);
  }
}

export async function fetchUserIncome(userId: string): Promise<Income[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('income')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null);
    if (error) throw error;
    return data || [];
  } else {
    return getLocalIncome().filter((i) => i.deleted_at === null);
  }
}

export async function addExpense(expense: Omit<Expense, 'id' | 'created_at' | 'deleted_at'>): Promise<void> {
  if (isSupabaseConfigured) {
    const { error } = await supabase.from('expenses').insert(expense);
    if (error) throw error;
  } else {
    const all = getLocalExpenses();
    const newExp: Expense = {
      ...expense,
      id: 'exp-' + Date.now(),
      created_at: new Date().toISOString(),
      deleted_at: null,
    };
    all.push(newExp);
    setLocalExpenses(all);
  }
}

export async function addIncome(income: Omit<Income, 'id' | 'created_at' | 'deleted_at'>): Promise<void> {
  if (isSupabaseConfigured) {
    const { error } = await supabase.from('income').insert(income);
    if (error) throw error;
  } else {
    const all = getLocalIncome();
    const newInc: Income = {
      ...income,
      id: 'inc-' + Date.now(),
      created_at: new Date().toISOString(),
      deleted_at: null,
    };
    all.push(newInc);
    setLocalIncome(all);
  }
}

export async function softDeleteEntry(kind: 'income' | 'expense', id: string): Promise<void> {
  if (isSupabaseConfigured) {
    const table = kind === 'income' ? 'income' : 'expenses';
    const { error } = await supabase
      .from(table)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  } else {
    const now = new Date().toISOString();
    if (kind === 'expense') {
      const all = getLocalExpenses().map((e) => (e.id === id ? { ...e, deleted_at: now } : e));
      setLocalExpenses(all);
    } else {
      const all = getLocalIncome().map((i) => (i.id === id ? { ...i, deleted_at: now } : i));
      setLocalIncome(all);
    }
  }
}

export async function endRecurringEntry(kind: 'income' | 'expense', id: string, endDate: string): Promise<void> {
  if (isSupabaseConfigured) {
    const table = kind === 'income' ? 'income' : 'expenses';
    const { error } = await supabase
      .from(table)
      .update({ end_date: endDate })
      .eq('id', id);
    if (error) throw error;
  } else {
    if (kind === 'expense') {
      const all = getLocalExpenses().map((e) => (e.id === id ? { ...e, end_date: endDate } : e));
      setLocalExpenses(all);
    } else {
      const all = getLocalIncome().map((i) => (i.id === id ? { ...i, end_date: endDate } : i));
      setLocalIncome(all);
    }
  }
}
