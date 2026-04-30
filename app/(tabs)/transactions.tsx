import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  StyleSheet, Text, View, FlatList,
  ActivityIndicator, TouchableOpacity,
  Pressable, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Gradients, Spacing, Radius } from '@/constants/Theme';
import { Icons } from '@/constants/Icons';
import CompactAmount from '@/components/CompactAmount';
import type { TimeFilter, UnifiedEntry, Expense, Income } from '@/utils/types';

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

export default function TransactionsScreen() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<UnifiedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [kindFilter, setKindFilter] = useState<KindFilter>('all');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownAnim = useRef(new Animated.Value(0)).current;
  const [kindDropdownOpen, setKindDropdownOpen] = useState(false);
  const kindDropdownAnim = useRef(new Animated.Value(0)).current;

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

  const KIND_FILTERS: { key: KindFilter; label: string; color: string }[] = [
    { key: 'all', label: 'All', color: Colors.textMuted },
    { key: 'income', label: 'Income', color: Colors.success },
    { key: 'expense', label: 'Expense', color: Colors.danger },
  ];

  const currentKindDot = KIND_FILTERS.find(f => f.key === kindFilter)!;

  const toggleKindDropdown = () => {
    if (kindDropdownOpen) {
      Animated.timing(kindDropdownAnim, { toValue: 0, duration: 180, useNativeDriver: false }).start(() => setKindDropdownOpen(false));
    } else {
      setKindDropdownOpen(true);
      Animated.timing(kindDropdownAnim, { toValue: 1, duration: 180, useNativeDriver: false }).start();
    }
  };

  const selectKind = (key: KindFilter) => {
    setKindFilter(key);
    Animated.timing(kindDropdownAnim, { toValue: 0, duration: 150, useNativeDriver: false }).start(() => setKindDropdownOpen(false));
  };

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
          <CompactAmount
            amount={item.amount}
            prefix={isIncome ? '+' : '-'}
            color={color}
            style={styles.amount}
          />
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

        {/* Kind filter dot (centered) */}
        <View style={{ position: 'relative', zIndex: 20, alignItems: 'center' }}>
          <TouchableOpacity
            onPress={toggleKindDropdown}
            style={styles.kindDotBtn}
            activeOpacity={0.7}
          >
            <View style={[styles.kindDot, { backgroundColor: currentKindDot.color }]} />
            <Text style={styles.kindDotLabel}>{currentKindDot.label}</Text>
            <Ionicons
              name={kindDropdownOpen ? 'chevron-up' : 'chevron-down'}
              size={12}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>

          {/* Kind dropdown menu */}
          {kindDropdownOpen && (
            <Animated.View
              style={[
                styles.kindDropdownMenu,
                {
                  opacity: kindDropdownAnim,
                  transform: [
                    {
                      translateY: kindDropdownAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-8, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              {KIND_FILTERS.map(({ key, label, color }) => {
                const active = kindFilter === key;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.kindDropdownItem, active && styles.kindDropdownItemActive]}
                    onPress={() => selectKind(key)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.kindDotSmall, { backgroundColor: color }]} />
                    <Text
                      style={[styles.kindDropdownText, active && { color, fontWeight: '700' }]}
                    >
                      {label}
                    </Text>
                    {active && (
                      <Ionicons name="checkmark" size={14} color={color} style={{ marginLeft: 'auto' }} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </Animated.View>
          )}
        </View>

        <Text style={styles.headerCount}>{filtered.length} entries</Text>
      </View>

      {/* Close kind dropdown when tapping outside */}
      {kindDropdownOpen && (
        <Pressable
          style={[StyleSheet.absoluteFillObject, { zIndex: 15 }]}
          onPress={toggleKindDropdown}
        />
      )}

      {/* ─── Filter Row: Dropdown + Period Navigator ─── */}
      <View style={styles.timeFilterRow}>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary },
  headerCount: { fontSize: 14, color: Colors.textMuted, fontWeight: '500' },

  // Kind dot filter
  kindDotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  kindDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  kindDotLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  kindDropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: 6,
    minWidth: 140,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 14,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 14,
  },
  kindDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 8,
  },
  kindDropdownItemActive: {
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  kindDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  kindDropdownText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },

  // Time filter row (dropdown + period nav inline)
  timeFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
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
