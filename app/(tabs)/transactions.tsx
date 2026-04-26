import React, { useEffect, useState } from 'react';
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

type Transaction = {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  description: string;
  date: string;
  categories: { name: string; icon: string; color: string } | null;
};

type Filter = 'all' | 'income' | 'expense';

export default function TransactionsScreen() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');

  const fetchTransactions = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('transactions')
      .select('*, categories(name, icon, color)')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (data) setTransactions(data as Transaction[]);
    setLoading(false);
  };

  useEffect(() => { fetchTransactions(); }, [user]);

  const filtered = filter === 'all'
    ? transactions
    : transactions.filter((t) => t.type === filter);

  const renderItem = ({ item }: { item: Transaction }) => {
    const isIncome = item.type === 'income';
    const color = item.categories?.color || (isIncome ? Colors.success : Colors.danger);

    return (
      <View style={styles.card}>
        <View style={[styles.icon, { backgroundColor: `${color}22` }]}>
          <Ionicons name={(item.categories?.icon as any) || (isIncome ? Icons.cash : Icons.cart)} size={22} color={color} />
        </View>
        <View style={styles.details}>
          <Text style={styles.title} numberOfLines={1}>
            {item.description || item.categories?.name || 'Transaction'}
          </Text>
          <Text style={styles.meta}>
            {item.categories?.name}{item.categories?.name ? '  ·  ' : ''}{item.date}
          </Text>
        </View>
        <View style={styles.right}>
          <Text style={[styles.amount, { color: isIncome ? Colors.success : Colors.danger }]}>
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
        <Text style={styles.headerCount}>{filtered.length} transactions</Text>
      </View>

      {/* Filter Pills */}
      <View style={styles.filterRow}>
        {(['all', 'income', 'expense'] as Filter[]).map((f) => {
          const active = filter === f;
          const color = f === 'income' ? Colors.success : f === 'expense' ? Colors.danger : Colors.primary;
          return (
            <TouchableOpacity
              key={f}
              style={[styles.filterPill, active && { backgroundColor: color }]}
              onPress={() => setFilter(f)}
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
          onRefresh={fetchTransactions}
          refreshing={loading}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name={Icons.emptyTransactions} size={60} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No transactions</Text>
              <Text style={styles.emptyBody}>
                {filter === 'all' ? 'Add your first transaction using the + button.' : `No ${filter} transactions found.`}
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
    paddingBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary },
  headerCount: { fontSize: 14, color: Colors.textMuted, fontWeight: '500' },

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
  meta: { fontSize: 12, color: Colors.textSecondary },
  right: { alignItems: 'flex-end', gap: 4 },
  amount: { fontSize: 15, fontWeight: '700' },
  typePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  typeLabel: { fontSize: 11, fontWeight: '700' },

  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textSecondary },
  emptyBody: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: 40 },
});
