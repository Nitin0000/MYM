import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet, Text, View, FlatList,
  ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Gradients, Spacing, Radius } from '@/constants/Theme';
import { formatCurrency } from '@/utils/currency';
import { Icons } from '@/constants/Icons';
import type { TimeFilter, UnifiedEntry, Expense, Income } from '@/utils/types';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

type KindFilter = 'all' | 'income' | 'expense';

export default function TransactionsScreen() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<UnifiedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [kindFilter, setKindFilter] = useState<KindFilter>('all');

  // Time filter
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const getDateRange = useCallback((): { start: string; end: string } | null => {
    if (timeFilter === 'all') return null;
    if (timeFilter === 'month') {
      const start = new Date(selectedYear, selectedMonth, 1);
      const end = new Date(selectedYear, selectedMonth + 1, 0);
      return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
    }
    return { start: `${selectedYear}-01-01`, end: `${selectedYear}-12-31` };
  }, [timeFilter, selectedMonth, selectedYear]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const dateRange = getDateRange();

    let expQ = supabase.from('expenses').select('*').eq('user_id', user.id);
    let incQ = supabase.from('income').select('*').eq('user_id', user.id);

    if (dateRange) {
      expQ = expQ.gte('start_date', dateRange.start).lte('start_date', dateRange.end);
      incQ = incQ.gte('start_date', dateRange.start).lte('start_date', dateRange.end);
    }

    const [{ data: expenses }, { data: incomes }] = await Promise.all([expQ, incQ]);

    const unified: UnifiedEntry[] = [];

    if (incomes) {
      (incomes as Income[]).forEach((i) => {
        unified.push({
          id: i.id,
          amount: Number(i.amount),
          kind: 'income',
          label: i.type.charAt(0).toUpperCase() + i.type.slice(1),
          date: i.start_date,
          description: i.description,
          frequency: i.frequency,
          created_at: i.created_at,
        });
      });
    }

    if (expenses) {
      (expenses as Expense[]).forEach((e) => {
        unified.push({
          id: e.id,
          amount: Number(e.amount),
          kind: 'expense',
          label: e.category,
          date: e.start_date,
          description: e.description,
          frequency: e.frequency,
          expenseType: e.type,
          isEssential: e.is_essential,
          created_at: e.created_at,
        });
      });
    }

    unified.sort((a, b) => {
      const d = b.date.localeCompare(a.date);
      if (d !== 0) return d;
      return b.created_at.localeCompare(a.created_at);
    });

    setEntries(unified);
    setLoading(false);
  }, [user, getDateRange]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = kindFilter === 'all'
    ? entries
    : entries.filter((e) => e.kind === kindFilter);

  const now = new Date();
  const isCurrentMonth = selectedMonth === now.getMonth() && selectedYear === now.getFullYear();
  const isCurrentYear = selectedYear === now.getFullYear();
  const canGoForward = timeFilter === 'month' ? !isCurrentMonth : !isCurrentYear;

  const navigateMonth = (dir: -1 | 1) => {
    if (dir === 1 && isCurrentMonth) return;
    let newMonth = selectedMonth + dir;
    let newYear = selectedYear;
    if (newMonth < 0) { newMonth = 11; newYear--; }
    if (newMonth > 11) { newMonth = 0; newYear++; }
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  const navigateYear = (dir: -1 | 1) => {
    if (dir === 1 && isCurrentYear) return;
    setSelectedYear((y) => y + dir);
  };

  const filterLabel = timeFilter === 'month'
    ? `${MONTHS[selectedMonth]} ${selectedYear}`
    : timeFilter === 'year'
    ? `${selectedYear}`
    : 'All Time';

  const renderItem = ({ item }: { item: UnifiedEntry }) => {
    const isIncome = item.kind === 'income';
    const color = isIncome ? Colors.success : Colors.danger;

    return (
      <View style={styles.card}>
        <View style={[styles.icon, { backgroundColor: `${color}22` }]}>
          <Ionicons name={isIncome ? Icons.cash : Icons.cart} size={22} color={color} />
        </View>
        <View style={styles.details}>
          <Text style={styles.title} numberOfLines={1}>
            {item.description || item.label || 'Transaction'}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>{item.label}</Text>
            {item.frequency !== 'one-time' && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.frequency}</Text>
              </View>
            )}
            {item.expenseType && (
              <View style={[styles.badge, item.expenseType === 'fixed'
                && { backgroundColor: `${Colors.warning}22` }]}>
                <Text style={[styles.badgeText, item.expenseType === 'fixed'
                  && { color: Colors.warning }]}>
                  {item.expenseType}
                </Text>
              </View>
            )}
            {item.isEssential && (
              <View style={[styles.badge, { backgroundColor: `${Colors.success}22` }]}>
                <Text style={[styles.badgeText, { color: Colors.success }]}>essential</Text>
              </View>
            )}
          </View>
          <Text style={styles.date}>{item.date}</Text>
        </View>
        <View style={styles.right}>
          <Text style={[styles.amount, { color }]}>
            {isIncome ? '+' : '-'}{formatCurrency(item.amount)}
          </Text>
          <View style={[styles.typePill, { backgroundColor: `${color}22` }]}>
            <Text style={[styles.typeLabel, { color }]}>
              {isIncome ? 'Income' : 'Expense'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={Gradients.background} style={StyleSheet.absoluteFillObject} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>History</Text>
        <Text style={styles.headerCount}>{filtered.length} entries</Text>
      </View>

      {/* Time Filter */}
      <View style={styles.timeFilterRow}>
        {([
          { key: 'month' as TimeFilter, label: 'Monthly' },
          { key: 'year' as TimeFilter, label: 'Yearly' },
          { key: 'all' as TimeFilter, label: 'All' },
        ]).map(({ key, label }) => {
          const active = timeFilter === key;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.timeFilterPill, active && styles.timeFilterPillActive]}
              onPress={() => setTimeFilter(key)}
              activeOpacity={0.75}
            >
              <Text style={[styles.timeFilterText, active && { color: '#fff' }]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Period Navigator */}
      {timeFilter !== 'all' && (
        <View style={styles.periodNav}>
          <TouchableOpacity
            onPress={() => timeFilter === 'month' ? navigateMonth(-1) : navigateYear(-1)}
            style={styles.periodArrow}
            activeOpacity={0.7}
          >
            <Ionicons name={Icons.chevronBack} size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.periodLabel}>{filterLabel}</Text>
          <TouchableOpacity
            onPress={() => timeFilter === 'month' ? navigateMonth(1) : navigateYear(1)}
            style={[styles.periodArrow, !canGoForward && { opacity: 0.3 }]}
            activeOpacity={0.7}
            disabled={!canGoForward}
          >
            <Ionicons name={Icons.chevronForward} size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Kind Filter Pills */}
      <View style={styles.filterRow}>
        {(['all', 'income', 'expense'] as KindFilter[]).map((f) => {
          const active = kindFilter === f;
          const color = f === 'income' ? Colors.success : f === 'expense' ? Colors.danger : Colors.primary;
          return (
            <TouchableOpacity
              key={f}
              style={[styles.filterPill, active && { backgroundColor: color }]}
              onPress={() => setKindFilter(f)}
              activeOpacity={0.75}
            >
              <Text style={[styles.filterLabel, active && { color: '#fff' }]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          onRefresh={fetchData}
          refreshing={loading}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name={Icons.emptyTransactions} size={60} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No entries</Text>
              <Text style={styles.emptyBody}>
                {kindFilter === 'all'
                  ? `No entries in ${filterLabel}.`
                  : `No ${kindFilter} entries in ${filterLabel}.`}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary },
  headerCount: { fontSize: 14, color: Colors.textMuted, fontWeight: '500' },

  // Time filter
  timeFilterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: 8,
    marginBottom: Spacing.sm,
  },
  timeFilterPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 30,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
  },
  timeFilterPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  timeFilterText: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },

  // Period navigator
  periodNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    marginBottom: Spacing.sm,
  },
  periodArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    minWidth: 130,
    textAlign: 'center',
  },

  // Kind filter
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: 8,
    marginBottom: Spacing.md,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 30,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  filterLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },

  loader: { flex: 1 },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: 20 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: 10,
    gap: 12,
  },
  icon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  details: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, marginBottom: 3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' },
  meta: { fontSize: 12, color: Colors.textSecondary },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: `${Colors.primary}22`,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: Colors.primary },
  date: { fontSize: 11, color: Colors.textMuted },
  right: { alignItems: 'flex-end', gap: 4 },
  amount: { fontSize: 15, fontWeight: '700' },
  typePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  typeLabel: { fontSize: 11, fontWeight: '700' },

  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textSecondary },
  emptyBody: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: 40 },
});
