import React, { useEffect, useState, useCallback } from 'react';
import {
  Wallet,
  ShoppingBag,
  Filter,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Trash2,
  StopCircle,
  AlertTriangle,
  X,
  CheckCircle2,
  Receipt,
  MoreVertical,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/theme';
import CompactAmount from '../components/CompactAmount';
import type { TimeFilter, UnifiedEntry, Expense, Income } from '../utils/types';
import { processEntries, toLocalDateString } from '../utils/calculations';
import {
  fetchUserExpenses,
  fetchUserIncome,
  softDeleteEntry,
  endRecurringEntry,
} from '../lib/dataService';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

type KindFilter = 'all' | 'income' | 'expense';

const TIME_FILTERS: { key: TimeFilter; label: string }[] = [
  { key: 'month', label: 'Monthly' },
  { key: 'year', label: 'Yearly' },
  { key: 'all', label: 'All Time' },
];

const KIND_FILTERS: { key: KindFilter; label: string; color: string }[] = [
  { key: 'all', label: 'All', color: '#9898B3' },
  { key: 'income', label: 'Income', color: Colors.success },
  { key: 'expense', label: 'Expense', color: Colors.danger },
];

export default function Transactions() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<UnifiedEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [kindFilter, setKindFilter] = useState<KindFilter>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [kindDropdownOpen, setKindDropdownOpen] = useState(false);

  // Action Menu State
  const [actionTarget, setActionTarget] = useState<UnifiedEntry | null>(null);

  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState<UnifiedEntry | null>(null);
  const [deleteInput, setDeleteInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // End Recurring Modal State
  const [endTarget, setEndTarget] = useState<UnifiedEntry | null>(null);
  const [endDateInput, setEndDateInput] = useState('');
  const [isEnding, setIsEnding] = useState(false);

  const getDateRange = useCallback((): { start: string; end: string } | null => {
    if (timeFilter === 'all') return null;
    if (timeFilter === 'month') {
      const monthStr = String(selectedMonth + 1).padStart(2, '0');
      const start = `${selectedYear}-${monthStr}-01`;
      const lastDay = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      const end = `${selectedYear}-${monthStr}-${String(lastDay).padStart(2, '0')}`;
      return { start, end };
    }
    return { start: `${selectedYear}-01-01`, end: `${selectedYear}-12-31` };
  }, [timeFilter, selectedMonth, selectedYear]);

  const loadEntries = useCallback(async () => {
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
      setEntries(unified);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [user, timeFilter, getDateRange]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const filtered =
    kindFilter === 'all' ? entries : entries.filter((e) => e.kind === kindFilter);

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

  const filterLabel =
    timeFilter === 'month'
      ? `${MONTHS[selectedMonth]} ${selectedYear}`
      : timeFilter === 'year'
      ? `${selectedYear}`
      : 'All Time';

  const currentFilterName = TIME_FILTERS.find((f) => f.key === timeFilter)?.label || 'Monthly';
  const currentKind = KIND_FILTERS.find((f) => f.key === kindFilter)!;

  // Handlers
  const isRecurring = (freq: string) => freq !== 'one-time';

  const chooseDelete = (item: UnifiedEntry) => {
    setActionTarget(null);
    setDeleteTarget(item);
    setDeleteInput('');
  };

  const chooseEndRecurring = (item: UnifiedEntry) => {
    setActionTarget(null);
    setEndTarget(item);
    setEndDateInput(toLocalDateString(new Date()));
  };

  const confirmDelete = async () => {
    if (!deleteTarget || deleteInput.trim().toLowerCase() !== 'delete') return;
    setIsDeleting(true);
    try {
      const realId = deleteTarget.original_id || deleteTarget.id;
      await softDeleteEntry(deleteTarget.kind, realId);
      setDeleteTarget(null);
      setDeleteInput('');
      loadEntries();
    } catch (err) {
      alert('Failed to delete entry');
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmEnd = async () => {
    if (!endTarget || !endDateInput) return;
    if (endDateInput < endTarget.date) {
      alert(`End date must be on or after start date (${endTarget.date})`);
      return;
    }
    setIsEnding(true);
    try {
      const realId = endTarget.original_id || endTarget.id;
      await endRecurringEntry(endTarget.kind, realId, endDateInput);
      setEndTarget(null);
      setEndDateInput('');
      loadEntries();
    } catch (err) {
      alert('Failed to end recurring entry');
    } finally {
      setIsEnding(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-12 animate-fade-in">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">History</h1>
          <p className="text-xs sm:text-sm text-[#9898B3] mt-0.5">{filtered.length} entries found</p>
        </div>

        {/* Kind Filter Dot Dropdown */}
        <div className="relative z-30">
          <button
            onClick={() => setKindDropdownOpen(!kindDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1C1C38] border border-white/10 hover:border-white/20 transition-all text-xs font-bold text-white shadow-md"
          >
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: currentKind.color }}
            />
            <span>{currentKind.label}</span>
          </button>

          {kindDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-36 rounded-2xl bg-[#141428] border border-white/10 shadow-2xl py-1.5 animate-fade-in">
              {KIND_FILTERS.map(({ key, label, color }) => (
                <button
                  key={key}
                  onClick={() => {
                    setKindFilter(key);
                    setKindDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold transition-colors ${
                    kindFilter === key
                      ? 'bg-white/10 text-white'
                      : 'text-[#9898B3] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Time Filter Row ─── */}
      <div className="flex items-center justify-between gap-3 mb-6 relative z-20">
        {/* Dropdown */}
        <div className="relative">
          <button
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
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold text-white min-w-[110px] text-center px-1">
              {filterLabel}
            </span>
            <button
              onClick={() => (timeFilter === 'month' ? navigateMonth(1) : navigateYear(1))}
              className="p-1 rounded-lg text-[#9898B3] hover:text-white hover:bg-white/5 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <span className="text-sm font-semibold italic text-[#5C5C78]">All Time</span>
        )}
      </div>

      {/* ─── List ─── */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#7C6EF8] border-t-transparent animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 rounded-3xl bg-[#1C1C38]/40 border border-white/[0.06] text-center">
          <Receipt className="w-12 h-12 text-[#5C5C78] mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No entries found</h3>
          <p className="text-xs text-[#9898B3]">
            {kindFilter === 'all'
              ? `No transactions in ${filterLabel}.`
              : `No ${kindFilter} entries in ${filterLabel}.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const isIncome = item.kind === 'income';
            const color = isIncome ? Colors.success : Colors.danger;

            return (
              <div
                key={item.id}
                className="group relative flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-[#1C1C38] border border-white/[0.07] hover:border-white/20 transition-all shadow-md"
              >
                {/* Left */}
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${color}18`, color }}
                  >
                    {isIncome ? <Wallet className="w-6 h-6" /> : <ShoppingBag className="w-6 h-6" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-white truncate">
                      {item.description || item.label}
                    </h3>

                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs font-semibold text-[#9898B3]">{item.label}</span>

                      {item.isPredicted && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FBBF24]/15 text-[#FBBF24] text-[10px] font-extrabold uppercase">
                          <Sparkles className="w-3 h-3" />
                          <span>Predicted</span>
                        </span>
                      )}

                      {!item.isPredicted && item.frequency !== 'one-time' && (
                        <span className="px-2 py-0.5 rounded-md bg-[#7C6EF8]/15 text-[#7C6EF8] text-[10px] font-extrabold capitalize">
                          {item.frequency}
                        </span>
                      )}

                      {item.expenseType && (
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold capitalize ${
                            item.expenseType === 'fixed'
                              ? 'bg-[#FBBF24]/15 text-[#FBBF24]'
                              : 'bg-white/5 text-[#9898B3]'
                          }`}
                        >
                          {item.expenseType}
                        </span>
                      )}

                      {item.isEssential && (
                        <span className="px-2 py-0.5 rounded-md bg-[#34D399]/15 text-[#34D399] text-[10px] font-extrabold">
                          Essential
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#5C5C78] mt-1.5 font-medium">{item.date}</p>

                    {/* Ended Badge */}
                    {isRecurring(item.frequency) && item.endDate && (
                      <div className="inline-flex items-center gap-1 mt-1 text-[11px] font-bold text-[#9898B3] bg-white/5 px-2 py-0.5 rounded-md">
                        <CheckCircle2 className="w-3 h-3 text-[#34D399]" />
                        <span>Ended on {item.endDate}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Amount & Actions */}
                <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                  <div className="text-right">
                    <div className="text-base sm:text-lg font-extrabold" style={{ color }}>
                      <CompactAmount
                        amount={item.amount}
                        prefix={isIncome ? '+' : '-'}
                        color={color}
                      />
                    </div>
                    <span
                      className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase"
                      style={{ backgroundColor: `${color}18`, color }}
                    >
                      {isIncome ? 'Income' : 'Expense'}
                    </span>
                  </div>

                  {/* Actions Trigger button */}
                  <button
                    onClick={() => setActionTarget(item)}
                    className="p-2 rounded-xl text-[#9898B3] hover:text-white hover:bg-white/10 transition-colors"
                    title="Options"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Actions Bottom Sheet / Modal ─── */}
      {actionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-[#141428] border border-white/10 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div>
                <h3 className="text-base font-extrabold text-white truncate max-w-[220px]">
                  {actionTarget.description || actionTarget.label}
                </h3>
                <p className="text-xs text-[#9898B3] mt-0.5 capitalize">
                  {actionTarget.kind} · {actionTarget.frequency}
                </p>
              </div>
              <button
                onClick={() => setActionTarget(null)}
                className="p-1 rounded-full text-[#9898B3] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {/* Delete Button */}
              <button
                onClick={() => chooseDelete(actionTarget)}
                className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-[#F87171]/10 hover:bg-[#F87171]/20 border border-[#F87171]/20 text-[#F87171] text-sm font-bold transition-colors text-left"
              >
                <Trash2 className="w-5 h-5" />
                <div>
                  <p>Delete Entry</p>
                  <p className="text-xs text-[#F87171]/70 font-normal">Remove from records</p>
                </div>
              </button>

              {/* End Recurring Button */}
              {isRecurring(actionTarget.frequency) && !actionTarget.endDate && (
                <button
                  onClick={() => chooseEndRecurring(actionTarget)}
                  className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-[#FBBF24]/10 hover:bg-[#FBBF24]/20 border border-[#FBBF24]/20 text-[#FBBF24] text-sm font-bold transition-colors text-left"
                >
                  <StopCircle className="w-5 h-5" />
                  <div>
                    <p>End Recurring</p>
                    <p className="text-xs text-[#FBBF24]/70 font-normal">Stop future recurrences</p>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation Modal (Type "delete") ─── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#141428] border border-white/10 p-6 sm:p-7 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-full bg-[#F87171]/15 text-[#F87171] flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-extrabold text-white mb-2">Delete Entry</h3>

            <div className="p-3 rounded-2xl bg-[#1C1C38] border border-white/10 mb-4 text-left flex justify-between items-center">
              <div>
                <p className="text-sm font-bold text-white truncate max-w-[200px]">
                  {deleteTarget.description || deleteTarget.label}
                </p>
                <p className="text-xs text-[#9898B3]">{deleteTarget.date}</p>
              </div>
              <p
                className="text-base font-extrabold"
                style={{ color: deleteTarget.kind === 'income' ? Colors.success : Colors.danger }}
              >
                {deleteTarget.kind === 'income' ? '+' : '-'}₹{deleteTarget.amount.toLocaleString('en-IN')}
              </p>
            </div>

            <p className="text-xs text-[#9898B3] leading-relaxed mb-4">
              This action will remove this entry from your active records.
              <br />
              Type <span className="font-extrabold text-white">delete</span> below to confirm.
            </p>

            <input
              type="text"
              placeholder='Type "delete" to confirm'
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/15 focus:border-[#F87171] text-white text-center text-sm font-semibold mb-5 focus:outline-none transition-colors"
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteInput('');
                }}
                className="flex-1 py-3 rounded-xl bg-[#1C1C38] text-sm font-bold text-[#9898B3] hover:text-white transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={confirmDelete}
                disabled={deleteInput.trim().toLowerCase() !== 'delete' || isDeleting}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-[#F87171] text-white text-sm font-bold transition-all ${
                  deleteInput.trim().toLowerCase() !== 'delete'
                    ? 'opacity-40 cursor-not-allowed'
                    : 'hover:bg-[#e05656] shadow-lg shadow-[#F87171]/25'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'Deleting…' : 'Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── End Recurring Modal ─── */}
      {endTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#141428] border border-white/10 p-6 sm:p-7 shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-[#FBBF24]/15 text-[#FBBF24] flex items-center justify-center mx-auto mb-4">
              <StopCircle className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-extrabold text-white text-center mb-2">End Recurring Entry</h3>

            <div className="p-3.5 rounded-2xl bg-[#1C1C38] border border-white/10 mb-4 flex justify-between items-center">
              <div>
                <p className="text-sm font-bold text-white truncate max-w-[200px]">
                  {endTarget.description || endTarget.label}
                </p>
                <p className="text-xs text-[#9898B3]">
                  {endTarget.frequency} · started {endTarget.date}
                </p>
              </div>
              <p
                className="text-base font-extrabold"
                style={{ color: endTarget.kind === 'income' ? Colors.success : Colors.danger }}
              >
                {endTarget.kind === 'income' ? '+' : '-'}₹{endTarget.amount.toLocaleString('en-IN')}
              </p>
            </div>

            <p className="text-xs text-[#9898B3] leading-relaxed mb-4 text-center">
              Choose an end date for this recurring entry. It must be on or after {endTarget.date}.
            </p>

            <div className="mb-5">
              <label className="block text-xs font-bold text-[#9898B3] uppercase tracking-wider mb-1.5">
                End Date (YYYY-MM-DD)
              </label>
              <input
                type="date"
                min={endTarget.date}
                value={endDateInput}
                onChange={(e) => setEndDateInput(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/15 focus:border-[#7C6EF8] text-white text-sm font-semibold focus:outline-none transition-colors"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setEndTarget(null);
                  setEndDateInput('');
                }}
                className="flex-1 py-3 rounded-xl bg-[#1C1C38] text-sm font-bold text-[#9898B3] hover:text-white transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={confirmEnd}
                disabled={!endDateInput || endDateInput < endTarget.date || isEnding}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-[#7C6EF8] text-white text-sm font-bold transition-all ${
                  !endDateInput || endDateInput < endTarget.date
                    ? 'opacity-40 cursor-not-allowed'
                    : 'hover:bg-[#6858f6] shadow-lg shadow-[#7C6EF8]/25'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isEnding ? 'Saving…' : 'End Now'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
