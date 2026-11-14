import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Lock,
  Shuffle,
  ShieldCheck,
  Calendar,
  FileText,
  Tag,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/theme';
import {
  EXPENSE_CATEGORIES,
  EXPENSE_TYPES,
  EXPENSE_FREQUENCIES,
  INCOME_TYPES,
  INCOME_FREQUENCIES,
  type ExpenseType,
  type ExpenseFrequency,
  type IncomeType,
  type IncomeFrequency,
} from '../utils/types';
import { toLocalDateString } from '../utils/calculations';
import { addExpense, addIncome } from '../lib/dataService';

export default function AddTransaction() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Common Form State
  const [mode, setMode] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(toLocalDateString(new Date()));
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Expense Specific
  const [category, setCategory] = useState('Food');
  const [customCategory, setCustomCategory] = useState('');
  const [expenseType, setExpenseType] = useState<ExpenseType>('variable');
  const [expenseFrequency, setExpenseFrequency] = useState<ExpenseFrequency>('one-time');
  const [isEssential, setIsEssential] = useState(false);

  // Income Specific
  const [incomeType, setIncomeType] = useState<IncomeType>('salary');
  const [incomeFrequency, setIncomeFrequency] = useState<IncomeFrequency>('monthly');

  const isExpense = mode === 'expense';
  const accentColor = isExpense ? Colors.danger : Colors.success;
  const gradientStyle = isExpense
    ? 'linear-gradient(90deg, #F87171 0%, #EF4444 100%)'
    : 'linear-gradient(90deg, #34D399 0%, #059669 100%)';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) {
      alert('Please enter an amount.');
      return;
    }
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      alert('Please enter a valid positive number.');
      return;
    }

    const finalCategory = customCategory.trim() || category;
    if (isExpense && !finalCategory) {
      alert('Please select or enter a category.');
      return;
    }

    setIsLoading(true);
    try {
      if (isExpense) {
        await addExpense({
          user_id: user?.id || 'guest',
          amount: parsed,
          category: finalCategory,
          type: expenseType,
          frequency: expenseFrequency,
          start_date: date,
          end_date: null,
          is_essential: isEssential,
          description: description.trim() || null,
        });
      } else {
        await addIncome({
          user_id: user?.id || 'guest',
          amount: parsed,
          type: incomeType,
          frequency: incomeFrequency,
          start_date: date,
          end_date: null,
          description: description.trim() || null,
        });
      }

      navigate('/');
    } catch (err: any) {
      alert(err.message || 'Error saving transaction');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28 md:pb-12 animate-fade-in">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-6">
        New Transaction
      </h1>

      <form onSubmit={handleSave} className="space-y-6">
        {/* ─── Mode Toggle (Expense / Income) ─── */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setMode('expense')}
            className={`flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl border text-sm font-bold transition-all ${
              isExpense
                ? 'bg-[#F87171] border-[#F87171] text-white shadow-lg shadow-[#F87171]/25'
                : 'bg-[#1C1C38] border-white/10 text-[#9898B3] hover:text-white'
            }`}
          >
            <ArrowUpCircle className="w-5 h-5" />
            <span>Expense</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('income')}
            className={`flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl border text-sm font-bold transition-all ${
              !isExpense
                ? 'bg-[#34D399] border-[#34D399] text-white shadow-lg shadow-[#34D399]/25'
                : 'bg-[#1C1C38] border-white/10 text-[#9898B3] hover:text-white'
            }`}
          >
            <ArrowDownCircle className="w-5 h-5" />
            <span>Income</span>
          </button>
        </div>

        {/* ─── Amount Input Card ─── */}
        <div
          className="rounded-3xl p-6 sm:p-8 flex items-center gap-2 shadow-2xl transition-all"
          style={{ background: gradientStyle }}
        >
          <span className="text-4xl sm:text-5xl font-black text-white/80 select-none">
            {isExpense ? '-₹' : '+₹'}
          </span>
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-transparent text-4xl sm:text-5xl font-black text-white placeholder-white/40 focus:outline-none tracking-tight"
          />
        </div>

        {/* ─── EXPENSE FIELDS ─── */}
        {isExpense && (
          <div className="space-y-5">
            {/* Category Pills */}
            <div>
              <label className="block text-xs font-bold text-[#9898B3] uppercase tracking-wider mb-2.5">
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {EXPENSE_CATEGORIES.map((cat) => {
                  const active = (customCategory ? false : category === cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setCategory(cat);
                        setCustomCategory('');
                      }}
                      className={`px-4 py-2 rounded-full border text-xs font-bold transition-all ${
                        active
                          ? 'bg-[#F87171] border-[#F87171] text-white shadow-md'
                          : 'bg-[#1C1C38] border-white/10 text-[#9898B3] hover:text-white hover:border-white/20'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>

              {/* Custom Category Input */}
              <div className="mt-3 flex items-center gap-2 p-3.5 rounded-2xl bg-[#1C1C38] border border-white/10 focus-within:border-[#F87171] transition-colors">
                <Tag className="w-4 h-4 text-[#9898B3]" />
                <input
                  type="text"
                  placeholder="Or enter custom category…"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full bg-transparent text-sm text-white placeholder-[#5C5C78] focus:outline-none"
                />
              </div>
            </div>

            {/* Type: Fixed / Variable */}
            <div>
              <label className="block text-xs font-bold text-[#9898B3] uppercase tracking-wider mb-2.5">
                Expense Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                {EXPENSE_TYPES.map((t) => {
                  const active = expenseType === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setExpenseType(t)}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-bold transition-all ${
                        active
                          ? 'bg-[#7C6EF8] border-[#7C6EF8] text-white shadow-md shadow-[#7C6EF8]/25'
                          : 'bg-[#1C1C38] border-white/10 text-[#9898B3] hover:text-white'
                      }`}
                    >
                      {t === 'fixed' ? <Lock className="w-4 h-4" /> : <Shuffle className="w-4 h-4" />}
                      <span className="capitalize">{t}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Frequency */}
            <div>
              <label className="block text-xs font-bold text-[#9898B3] uppercase tracking-wider mb-2.5">
                Frequency
              </label>
              <div className="flex flex-wrap gap-2">
                {EXPENSE_FREQUENCIES.map((f) => {
                  const active = expenseFrequency === f;
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setExpenseFrequency(f)}
                      className={`px-4 py-2 rounded-full border text-xs font-bold transition-all ${
                        active
                          ? 'bg-[#7C6EF8] border-[#7C6EF8] text-white shadow-md'
                          : 'bg-[#1C1C38] border-white/10 text-[#9898B3] hover:text-white'
                      }`}
                    >
                      <span className="capitalize">{f}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Essential Toggle Switch */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-[#1C1C38] border border-white/10">
              <div className="flex items-center gap-3">
                <ShieldCheck
                  className={`w-5 h-5 ${isEssential ? 'text-[#34D399]' : 'text-[#5C5C78]'}`}
                />
                <div>
                  <p className="text-sm font-bold text-white">Essential Expense</p>
                  <p className="text-xs text-[#9898B3]">Mark as must-have living requirement</p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isEssential}
                  onChange={(e) => setIsEssential(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#34D399]"></div>
              </label>
            </div>
          </div>
        )}

        {/* ─── INCOME FIELDS ─── */}
        {!isExpense && (
          <div className="space-y-5">
            {/* Income Type */}
            <div>
              <label className="block text-xs font-bold text-[#9898B3] uppercase tracking-wider mb-2.5">
                Income Source
              </label>
              <div className="flex flex-wrap gap-2">
                {INCOME_TYPES.map((t) => {
                  const active = incomeType === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setIncomeType(t)}
                      className={`px-4 py-2 rounded-full border text-xs font-bold transition-all ${
                        active
                          ? 'bg-[#34D399] border-[#34D399] text-white shadow-md'
                          : 'bg-[#1C1C38] border-white/10 text-[#9898B3] hover:text-white'
                      }`}
                    >
                      <span className="capitalize">{t}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Income Frequency */}
            <div>
              <label className="block text-xs font-bold text-[#9898B3] uppercase tracking-wider mb-2.5">
                Frequency
              </label>
              <div className="flex flex-wrap gap-2">
                {INCOME_FREQUENCIES.map((f) => {
                  const active = incomeFrequency === f;
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setIncomeFrequency(f)}
                      className={`px-4 py-2 rounded-full border text-xs font-bold transition-all ${
                        active
                          ? 'bg-[#7C6EF8] border-[#7C6EF8] text-white shadow-md'
                          : 'bg-[#1C1C38] border-white/10 text-[#9898B3] hover:text-white'
                      }`}
                    >
                      <span className="capitalize">{f}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ─── COMMON FIELDS ─── */}
        <div className="space-y-4">
          {/* Date */}
          <div>
            <label className="block text-xs font-bold text-[#9898B3] uppercase tracking-wider mb-1.5">
              Date
            </label>
            <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-[#1C1C38] border border-white/10 focus-within:border-[#7C6EF8] transition-colors">
              <Calendar className="w-4 h-4 text-[#9898B3]" />
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-transparent text-sm text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-[#9898B3] uppercase tracking-wider mb-1.5">
              Note (Optional)
            </label>
            <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-[#1C1C38] border border-white/10 focus-within:border-[#7C6EF8] transition-colors">
              <FileText className="w-4 h-4 text-[#9898B3]" />
              <input
                type="text"
                placeholder="e.g. Monthly salary, Grocery run, Freelance milestone…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-transparent text-sm text-white placeholder-[#5C5C78] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* ─── Save Button ─── */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 rounded-2xl text-white text-base font-extrabold shadow-xl hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          style={{ background: gradientStyle }}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Saving…</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              <span>Save {isExpense ? 'Expense' : 'Income'}</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
