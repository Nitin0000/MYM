import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Sparkles,
  ShoppingBag,
  Wallet,
  Calendar,
  Layers,
  Leaf,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/theme';
import CompactAmount from '../components/CompactAmount';
import type { TimeFilter, UnifiedEntry, Expense, Income } from '../utils/types';
import { processEntries } from '../utils/calculations';
import { fetchUserExpenses, fetchUserIncome } from '../lib/dataService';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const TIME_FILTERS: { key: TimeFilter; label: string }[] = [
  { key: 'month', label: 'Monthly' },
  { key: 'year', label: 'Yearly' },
  { key: 'all', label: 'All Time' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Filter state
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Data
  const [balance, setBalance] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [recentEntries, setRecentEntries] = useState<UnifiedEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const getDateRange = useCallback((): { start: string; end: string } | null => {
    if (timeFilter === 'all') return null;

    if (timeFilter === 'month') {
      const monthStr = String(selectedMonth + 1).padStart(2, '0');
      const start = `${selectedYear}-${monthStr}-01`;
      const lastDay = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      const end = `${selectedYear}-${monthStr}-${String(lastDay).padStart(2, '0')}`;
      return { start, end };
    }

    return {
      start: `${selectedYear}-01-01`,
      end: `${selectedYear}-12-31`,
    };
  }, [timeFilter, selectedMonth, selectedYear]);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const [expenses, incomes] = await Promise.all([
        fetchUserExpenses(user.id),
        fetchUserIncome(user.id),
      ]);

      const rawUnified: UnifiedEntry[] = [];

      incomes.forEach((i: Income) => {
        rawUnified.push({
          id: i.id,
          amount: Number(i.amount),
          kind: 'income',
          label: i.type.charAt(0).toUpperCase() + i.type.slice(1),
          date: i.start_date,
          description: i.description,
          frequency: i.frequency,
          endDate: i.end_date,
          created_at: i.created_at,
        });
      });

      expenses.forEach((e: Expense) => {
        rawUnified.push({
          id: e.id,
          amount: Number(e.amount),
          kind: 'expense',
          label: e.category,
          date: e.start_date,
          description: e.description,
          frequency: e.frequency,
          expenseType: e.type,
          isEssential: e.is_essential,
          endDate: e.end_date,
          created_at: e.created_at,
        });
      });

      const dateRange = getDateRange();
      const unified = processEntries(rawUnified, timeFilter, dateRange);

      let incSum = 0;
      let expSum = 0;
      for (const item of unified) {
        if (item.kind === 'income') incSum += item.amount;
        if (item.kind === 'expense') expSum += item.amount;
      }

      setTotalIncome(incSum);
      setTotalExpense(expSum);
      setBalance(incSum - expSum);
      setRecentEntries(unified.slice(0, 7));
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [user, timeFilter, getDateRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const navigateMonth = (dir: -1 | 1) => {
    let newMonth = selectedMonth + dir;
    let newYear = selectedYear;
    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }
    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  const navigateYear = (dir: -1 | 1) => {
    setSelectedYear((y) => y + dir);
  };

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'there';
  const filterLabel =
    timeFilter === 'month'
      ? `${MONTHS[selectedMonth]} ${selectedYear}`
      : timeFilter === 'year'
      ? `${selectedYear}`
      : 'All Time';

  const currentFilterName = TIME_FILTERS.find((f) => f.key === timeFilter)?.label || 'Monthly';

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-12 animate-fade-in">
      {/* ─── Greeting Header ─── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Good day, {firstName} 👋
          </h1>
          <p className="text-sm text-[#9898B3] mt-0.5">Here's your financial overview</p>
        </div>

        <button
          onClick={loadData}
          title="Refresh"
          className="p-2.5 rounded-xl bg-[#1C1C38] border border-white/10 text-[#9898B3] hover:text-white transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#7C6EF8]' : ''}`} />
        </button>
      </div>

      {/* ─── Filter Row: Dropdown + Period Navigator ─── */}
      <div className="flex items-center justify-between gap-3 mb-6 relative z-20">
        {/* Dropdown Filter */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1C1C38] border border-white/10 text-white text-sm font-bold shadow-md hover:border-white/20 transition-all"
          >
            <Filter className="w-4 h-4 text-[#7C6EF8]" />
            <span>{currentFilterName}</span>
          </button>

          {dropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-44 rounded-2xl bg-[#141428] border border-white/10 shadow-2xl py-2 z-30 animate-fade-in">
              {TIME_FILTERS.map(({ key, label }) => {
                const active = timeFilter === key;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setTimeFilter(key);
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors flex items-center justify-between ${
                      active
                        ? 'bg-[#7C6EF8]/15 text-[#7C6EF8] font-bold'
                        : 'text-[#9898B3] hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>{label}</span>
                    {active && <span className="w-1.5 h-1.5 rounded-full bg-[#7C6EF8]" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Period Navigator */}
        {timeFilter !== 'all' ? (
          <div className="flex items-center gap-2 bg-[#1C1C38] border border-white/10 rounded-xl px-2 py-1 shadow-md">
            <button
              onClick={() => (timeFilter === 'month' ? navigateMonth(-1) : navigateYear(-1))}
              className="p-1 rounded-lg text-[#9898B3] hover:text-white hover:bg-white/5 transition-colors"
              title="Previous Period"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold text-white min-w-[110px] text-center px-1">
              {filterLabel}
            </span>
            <button
              onClick={() => (timeFilter === 'month' ? navigateMonth(1) : navigateYear(1))}
              className="p-1 rounded-lg text-[#9898B3] hover:text-white hover:bg-white/5 transition-colors"
              title="Next Period"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <span className="text-sm font-semibold italic text-[#5C5C78]">All Time View</span>
        )}
      </div>

      {/* ─── Balance Card ─── */}
      <div
        className="relative overflow-hidden rounded-3xl p-6 sm:p-8 mb-8 shadow-2xl transition-all"
        style={{
          background: 'linear-gradient(135deg, #2A2060 0%, #7C6EF8 100%)',
        }}
      >
        {/* Decorative subtle ambient circle */}
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/5 pointer-events-none" />

        <div className="relative z-10">
          <p className="text-xs sm:text-sm font-bold tracking-wider uppercase text-white/75 mb-2">
            {timeFilter === 'all' ? 'Total Balance' : `Balance · ${filterLabel}`}
          </p>

          <div className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-6">
            <CompactAmount amount={balance} />
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-3 p-3.5 sm:p-4 rounded-2xl bg-black/25 backdrop-blur-sm border border-white/10">
            {/* Income */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#34D399]/20 flex items-center justify-center flex-shrink-0">
                <ArrowDownCircle className="w-5 h-5 text-[#34D399]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white/60">Income</p>
                <div className="text-sm sm:text-base font-bold text-[#34D399]">
                  <CompactAmount amount={totalIncome} color="#34D399" />
                </div>
              </div>
            </div>

            {/* Expenses */}
            <div className="flex items-center gap-3 border-l border-white/10 pl-3">
              <div className="w-10 h-10 rounded-xl bg-[#F87171]/20 flex items-center justify-center flex-shrink-0">
                <ArrowUpCircle className="w-5 h-5 text-[#F87171]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white/60">Expenses</p>
                <div className="text-sm sm:text-base font-bold text-[#F87171]">
                  <CompactAmount amount={totalExpense} color="#F87171" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Recent Entries ─── */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white tracking-tight">Recent Entries</h2>
        <button
          onClick={() => navigate('/transactions')}
          className="text-xs font-bold text-[#7C6EF8] hover:underline"
        >
          View All ({recentEntries.length})
        </button>
      </div>

      {recentEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 rounded-3xl bg-[#1C1C38]/40 border border-white/[0.06] text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-[#5C5C78] mb-3">
            <Leaf className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">All clear!</h3>
          <p className="text-xs text-[#9898B3] max-w-xs mb-4">
            {timeFilter === 'all'
              ? 'Click the Add button to record your first transaction.'
              : `No entries found for ${filterLabel}.`}
          </p>
          <button
            onClick={() => navigate('/add')}
            className="px-4 py-2 rounded-xl bg-[#7C6EF8] hover:bg-[#6858f6] text-white text-xs font-bold transition-all shadow-md shadow-[#7C6EF8]/20"
          >
            Add Transaction
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {recentEntries.map((entry) => {
            const isIncome = entry.kind === 'income';
            const color = isIncome ? Colors.success : Colors.danger;

            return (
              <div
                key={entry.id}
                onClick={() => navigate('/transactions')}
                className="group flex items-center justify-between p-4 rounded-2xl bg-[#1C1C38] border border-white/[0.07] hover:border-white/15 transition-all cursor-pointer"
              >
                {/* Left icon & details */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${color}18`, color }}
                  >
                    {isIncome ? <Wallet className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white truncate group-hover:text-[#7C6EF8] transition-colors">
                      {entry.description || entry.label}
                    </h4>

                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs font-semibold text-[#9898B3]">{entry.label}</span>

                      {entry.isPredicted && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#FBBF24]/15 text-[#FBBF24] text-[10px] font-extrabold uppercase">
                          <Sparkles className="w-3 h-3" />
                          <span>Predicted</span>
                        </span>
                      )}

                      {!entry.isPredicted && entry.frequency !== 'one-time' && (
                        <span className="px-2 py-0.5 rounded-md bg-[#7C6EF8]/15 text-[#7C6EF8] text-[10px] font-extrabold capitalize">
                          {entry.frequency}
                        </span>
                      )}

                      {entry.expenseType && (
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold capitalize ${
                            entry.expenseType === 'fixed'
                              ? 'bg-[#FBBF24]/15 text-[#FBBF24]'
                              : 'bg-white/5 text-[#9898B3]'
                          }`}
                        >
                          {entry.expenseType}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] font-medium text-[#5C5C78] mt-1">{entry.date}</p>
                  </div>
                </div>

                {/* Right Amount */}
                <div className="text-right flex-shrink-0 ml-3">
                  <div className="text-base font-extrabold" style={{ color }}>
                    <CompactAmount
                      amount={entry.amount}
                      prefix={isIncome ? '+' : '-'}
                      color={color}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
