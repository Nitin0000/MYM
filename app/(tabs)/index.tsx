import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  StyleSheet, Text, View, ScrollView,
  RefreshControl, TouchableOpacity, Image,
  Modal, Pressable, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Gradients, Spacing, Radius } from '@/constants/Theme';
import { formatCurrency } from '@/utils/currency';
import { Icons } from '@/constants/Icons';
import { useRouter } from 'expo-router';
import CompactAmount from '@/components/CompactAmount';
import type { TimeFilter, UnifiedEntry, Expense, Income } from '@/utils/types';
import { processEntries } from '@/utils/calculations';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const TIME_FILTERS: { key: TimeFilter; label: string }[] = [
  { key: 'month', label: 'Monthly' },
  { key: 'year', label: 'Yearly' },
  { key: 'all', label: 'All Time' },
];

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();

  // Filter state
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());   // 0-11
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Data
  const [balance, setBalance] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [recentEntries, setRecentEntries] = useState<UnifiedEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownAnim = useRef(new Animated.Value(0)).current;

  const getDateRange = useCallback((): { start: string; end: string } | null => {
    if (timeFilter === 'all') return null;

    if (timeFilter === 'month') {
      const start = new Date(selectedYear, selectedMonth, 1);
      const end = new Date(selectedYear, selectedMonth + 1, 0); // last day of month
      return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
      };
    }

    // year
    return {
      start: `${selectedYear}-01-01`,
      end: `${selectedYear}-12-31`,
    };
  }, [timeFilter, selectedMonth, selectedYear]);

  const fetchData = useCallback(async () => {
    if (!user) return;

    const dateRange = getDateRange();

    // Build queries - fetch ALL active entries for accurate recurring & prediction logic
    let expQ = supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .is('deleted_at', null);

    let incQ = supabase
      .from('income')
      .select('*')
      .eq('user_id', user.id)
      .is('deleted_at', null);

    const [{ data: expenses }, { data: incomes }] = await Promise.all([expQ, incQ]);

    // Build raw entries
    const rawUnified: UnifiedEntry[] = [];

    if (incomes) {
      (incomes as Income[]).forEach((i) => {
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
    }

    if (expenses) {
      (expenses as Expense[]).forEach((e) => {
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
    }

    // Process recurrences and future predictions
    const unified = processEntries(rawUnified, timeFilter, dateRange);

    // Calculate totals from PROCESSED entries
    let incSum = 0, expSum = 0;
    for (const item of unified) {
      if (item.kind === 'income') incSum += item.amount;
      if (item.kind === 'expense') expSum += item.amount;
    }

    // processEntries handles sorting already

    setTotalIncome(incSum);
    setTotalExpense(expSum);
    setBalance(incSum - expSum);
    setRecentEntries(unified.slice(0, 7));
  }, [user, getDateRange]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const canGoForward = true;

  const navigateMonth = (dir: -1 | 1) => {
    let newMonth = selectedMonth + dir;
    let newYear = selectedYear;
    if (newMonth < 0) { newMonth = 11; newYear--; }
    if (newMonth > 11) { newMonth = 0; newYear++; }
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  const navigateYear = (dir: -1 | 1) => {
    setSelectedYear((y) => y + dir);
  };

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'there';
  const filterLabel = timeFilter === 'month'
    ? `${MONTHS[selectedMonth]} ${selectedYear}`
    : timeFilter === 'year'
    ? `${selectedYear}`
    : 'All Time';

  const currentFilterName = TIME_FILTERS.find(f => f.key === timeFilter)?.label || 'Monthly';

  const toggleDropdown = () => {
    if (dropdownOpen) {
      Animated.timing(dropdownAnim, { toValue: 0, duration: 180, useNativeDriver: false }).start(() => setDropdownOpen(false));
    } else {
      setDropdownOpen(true);
      Animated.timing(dropdownAnim, { toValue: 1, duration: 180, useNativeDriver: false }).start();
    }
  };

  const selectFilter = (key: TimeFilter) => {
    setTimeFilter(key);
    Animated.timing(dropdownAnim, { toValue: 0, duration: 150, useNativeDriver: false }).start(() => setDropdownOpen(false));
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={Gradients.background} style={StyleSheet.absoluteFillObject} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={require('@/assets/images/logo.png')} style={styles.headerLogo} />
          <View>
            <Text style={styles.greeting}>Good day, {firstName} 👋</Text>
            <Text style={styles.subGreeting}>Here's your financial overview</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => router.push('/profile')} style={styles.avatarBtn} activeOpacity={0.8}>
          <Ionicons name={Icons.profile} size={38} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* ─── Filter Row: Dropdown + Period Navigator ─── */}
        <View style={styles.filterRow}>
          {/* Dropdown Trigger */}
          <View style={{ position: 'relative', zIndex: 10 }}>
            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={toggleDropdown}
              activeOpacity={0.8}
            >
              <Ionicons name={Icons.filter} size={16} color={Colors.primary} />
              <Text style={styles.dropdownTriggerText}>{currentFilterName}</Text>
              <Ionicons
                name={dropdownOpen ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <Animated.View
                style={[
                  styles.dropdownMenu,
                  {
                    opacity: dropdownAnim,
                    transform: [
                      {
                        translateY: dropdownAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-8, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                {TIME_FILTERS.map(({ key, label }) => {
                  const active = timeFilter === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[styles.dropdownItem, active && styles.dropdownItemActive]}
                      onPress={() => selectFilter(key)}
                      activeOpacity={0.7}
                    >
                      {active && (
                        <Ionicons name="checkmark" size={16} color={Colors.primary} style={{ marginRight: 6 }} />
                      )}
                      <Text
                        style={[styles.dropdownItemText, active && styles.dropdownItemTextActive]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </Animated.View>
            )}
          </View>

          {/* Period Navigator (right side) */}
          {timeFilter !== 'all' ? (
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
          ) : (
            <Text style={styles.allTimeLabel}>All Time</Text>
          )}
        </View>

        {/* Close dropdown when tapping outside */}
        {dropdownOpen && (
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={toggleDropdown}
          />
        )}

        {/* Balance Card */}
        <LinearGradient
          colors={Gradients.balanceCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <View style={styles.cardGlow} />

          <Text style={styles.balanceLabel}>
            {timeFilter === 'all' ? 'Total Balance' : `Balance · ${filterLabel}`}
          </Text>
          <CompactAmount
            amount={balance}
            style={styles.balanceAmount}
          />

          <View style={styles.statsRow}>
            <StatBox label="Income" amount={totalIncome} color={Colors.success} icon={Icons.income} />
            <View style={styles.statDivider} />
            <StatBox label="Expenses" amount={totalExpense} color={Colors.danger} icon={Icons.expense} />
          </View>
        </LinearGradient>

        {/* Recent Transactions */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Recent Entries</Text>
          <Text style={styles.sectionCount}>{recentEntries.length}</Text>
        </View>

        {recentEntries.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name={Icons.emptyDashboard} size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>All clear!</Text>
            <Text style={styles.emptyBody}>
              {timeFilter === 'all'
                ? 'Tap + to add your first transaction.'
                : `No entries in ${filterLabel}.`}
            </Text>
          </View>
        ) : (
          recentEntries.map((entry) => (
            <EntryRow key={entry.id} entry={entry} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ─── Sub-components ──────────────────────────────────── */

function StatBox({ label, amount, color, icon }: {
  label: string; amount: number; color: string; icon: any;
}) {
  return (
    <View style={statStyles.box}>
      <View style={[statStyles.iconCircle, { backgroundColor: `${color}22` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={statStyles.label} numberOfLines={1}>{label}</Text>
        <CompactAmount
          amount={amount}
          color={color}
          style={statStyles.amount}
          numberOfLines={1}
          adjustsFontSizeToFit
        />
      </View>
    </View>
  );
}

function EntryRow({ entry }: { entry: UnifiedEntry }) {
  const isIncome = entry.kind === 'income';
  const color = isIncome ? Colors.success : Colors.danger;
  const icon = isIncome ? Icons.cash : Icons.cart;

  return (
    <View style={rowStyles.card}>
      <View style={[rowStyles.iconWrap, { backgroundColor: `${color}22` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={rowStyles.details}>
        <Text style={rowStyles.title} numberOfLines={1}>
          {entry.description || entry.label || 'Transaction'}
        </Text>
          <View style={rowStyles.metaRow}>
            <Text style={rowStyles.meta}>{entry.label}</Text>
            {entry.isPredicted && (
              <View style={[rowStyles.freqBadge, { backgroundColor: `${Colors.warning}22`, paddingHorizontal: 6, paddingVertical: 4 }]}>
                <Ionicons name="sparkles" size={12} color={Colors.warning} />
              </View>
            )}
            {!entry.isPredicted && entry.frequency !== 'one-time' && (
              <View style={rowStyles.freqBadge}>
                <Text style={rowStyles.freqText}>{entry.frequency}</Text>
              </View>
            )}
          {entry.expenseType && (
            <View style={[rowStyles.freqBadge, entry.expenseType === 'fixed' && { backgroundColor: `${Colors.warning}22` }]}>
              <Text style={[rowStyles.freqText, entry.expenseType === 'fixed' && { color: Colors.warning }]}>
                {entry.expenseType}
              </Text>
            </View>
          )}
        </View>
        <Text style={rowStyles.date}>{entry.date}</Text>
      </View>
      <CompactAmount
        amount={entry.amount}
        prefix={isIncome ? '+' : '-'}
        color={color}
        style={rowStyles.amount}
      />
    </View>
  );
}

/* ─── Styles ──────────────────────────────────── */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerLogo: {
    width: 40,
    height: 40,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  greeting: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  subGreeting: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  avatarBtn: { padding: 4 },
  scroll: { padding: Spacing.lg, paddingBottom: 20 },

  // Filter row (dropdown + period nav in one line)
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    zIndex: 10,
  },

  // Dropdown
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  dropdownTriggerText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: 6,
    minWidth: 150,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 14,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  dropdownItemActive: {
    backgroundColor: `${Colors.primary}18`,
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  dropdownItemTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  allTimeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
    fontStyle: 'italic',
  },

  // Period navigator (inline, right side)
  periodNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    minWidth: 100,
    textAlign: 'center',
  },

  // Balance card
  balanceCard: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.45,
    shadowRadius: 28,
    elevation: 14,
  },
  cardGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: -60,
    right: -60,
  },
  balanceLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13, letterSpacing: 0.5, marginBottom: 6 },
  balanceAmount: { color: '#fff', fontSize: 42, fontWeight: '800', marginBottom: 28, letterSpacing: -0.5 },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.12)' },

  // Section
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  sectionCount: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },

  // Empty
  empty: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textSecondary },
  emptyBody: { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
});

const statStyles = StyleSheet.create({
  box: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2 },
  iconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 2 },
  amount: { fontSize: 15, fontWeight: '700' },
});

const rowStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    marginBottom: 10,
    gap: 12,
  },
  iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  details: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, marginBottom: 3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  meta: { fontSize: 12, color: Colors.textSecondary },
  freqBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: `${Colors.primary}22`,
  },
  freqText: { fontSize: 10, fontWeight: '700', color: Colors.primary },
  date: { fontSize: 11, color: Colors.textMuted },
  amount: { fontSize: 15, fontWeight: '700' },
});
