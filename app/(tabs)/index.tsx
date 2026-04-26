import React, { useEffect, useState } from 'react';
import {
  StyleSheet, Text, View, SafeAreaView, ScrollView,
  RefreshControl, TouchableOpacity,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Gradients, Spacing, Radius } from '@/constants/Theme';

type Transaction = {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  description: string;
  date: string;
  categories: { name: string; icon: string; color: string } | null;
};

export default function DashboardScreen() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    if (!user) return;

    const [{ data: recent }, { data: all }] = await Promise.all([
      supabase
        .from('transactions')
        .select('*, categories(name, icon, color)')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('transactions')
        .select('amount, type')
        .eq('user_id', user.id),
    ]);

    if (recent) setRecentTransactions(recent as Transaction[]);

    if (all) {
      let totalIncome = 0, totalExpense = 0;
      all.forEach((t) => {
        if (t.type === 'income') totalIncome += Number(t.amount);
        else totalExpense += Number(t.amount);
      });
      setIncome(totalIncome);
      setExpense(totalExpense);
      setBalance(totalIncome - totalExpense);
    }
  };

  useEffect(() => { fetchData(); }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'there';

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={Gradients.background} style={StyleSheet.absoluteFillObject} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good day, {firstName} 👋</Text>
          <Text style={styles.subGreeting}>Here's your financial overview</Text>
        </View>
        <View style={styles.avatarBtn}>
          <Ionicons name="person-circle" size={38} color={Colors.primary} />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Balance Card */}
        <LinearGradient
          colors={Gradients.balanceCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          {/* Decorative glow */}
          <View style={styles.cardGlow} />

          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceAmount}>
            ${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </Text>

          <View style={styles.statsRow}>
            <StatBox label="Income" amount={income} color={Colors.success} icon="arrow-down" />
            <View style={styles.statDivider} />
            <StatBox label="Expenses" amount={expense} color={Colors.danger} icon="arrow-up" />
          </View>
        </LinearGradient>

        {/* Recent Transactions */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
        </View>

        {recentTransactions.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="leaf-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>All clear!</Text>
            <Text style={styles.emptyBody}>Tap + to add your first transaction.</Text>
          </View>
        ) : (
          recentTransactions.map((tx) => (
            <TransactionRow key={tx.id} tx={tx} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ─── Sub-components ──────────────────────────────────── */

function StatBox({ label, amount, color, icon }: {
  label: string; amount: number; color: string; icon: string;
}) {
  return (
    <View style={statStyles.box}>
      <View style={[statStyles.iconCircle, { backgroundColor: `${color}22` }]}>
        <Ionicons name={`${icon}-circle` as any} size={20} color={color} />
      </View>
      <View>
        <Text style={statStyles.label}>{label}</Text>
        <Text style={[statStyles.amount, { color }]}>
          ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </Text>
      </View>
    </View>
  );
}

function TransactionRow({ tx }: { tx: Transaction }) {
  const isIncome = tx.type === 'income';
  const bgColor = tx.categories?.color || (isIncome ? Colors.success : Colors.danger);

  return (
    <View style={rowStyles.card}>
      <View style={[rowStyles.iconWrap, { backgroundColor: `${bgColor}22` }]}>
        <Ionicons
          name={(tx.categories?.icon as any) || (isIncome ? 'cash' : 'cart')}
          size={20}
          color={bgColor}
        />
      </View>
      <View style={rowStyles.details}>
        <Text style={rowStyles.title} numberOfLines={1}>
          {tx.description || tx.categories?.name || 'Transaction'}
        </Text>
        <Text style={rowStyles.meta}>
          {tx.categories?.name}
          {tx.categories?.name ? '  ·  ' : ''}
          {tx.date}
        </Text>
      </View>
      <Text style={[rowStyles.amount, { color: isIncome ? Colors.success : Colors.danger }]}>
        {isIncome ? '+' : '-'}${Number(tx.amount).toFixed(2)}
      </Text>
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
  greeting: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  subGreeting: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  avatarBtn: { padding: 4 },
  scroll: { padding: Spacing.lg, paddingBottom: 110 },
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
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textSecondary },
  emptyBody: { fontSize: 13, color: Colors.textMuted },
});

const statStyles = StyleSheet.create({
  box: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
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
  meta: { fontSize: 12, color: Colors.textSecondary },
  amount: { fontSize: 15, fontWeight: '700' },
});
