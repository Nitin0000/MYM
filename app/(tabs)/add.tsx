import React, { useState } from 'react';
import {
  StyleSheet, Text, View, TextInput,
  TouchableOpacity, Alert, KeyboardAvoidingView,
  Platform, ScrollView, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Gradients, Spacing, Radius } from '@/constants/Theme';
import { Icons } from '@/constants/Icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  EXPENSE_CATEGORIES, EXPENSE_TYPES, EXPENSE_FREQUENCIES,
  INCOME_TYPES, INCOME_FREQUENCIES,
  type ExpenseType, type ExpenseFrequency,
  type IncomeType, type IncomeFrequency,
} from '@/utils/types';

export default function AddTransactionScreen() {
  const { user } = useAuth();
  const router = useRouter();

  // Common
  const [mode, setMode] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Expense-specific
  const [category, setCategory] = useState('');
  const [expenseType, setExpenseType] = useState<ExpenseType>('variable');
  const [expenseFrequency, setExpenseFrequency] = useState<ExpenseFrequency>('one-time');
  const [isEssential, setIsEssential] = useState(false);

  // Income-specific
  const [incomeType, setIncomeType] = useState<IncomeType>('salary');
  const [incomeFrequency, setIncomeFrequency] = useState<IncomeFrequency>('monthly');

  const isExpense = mode === 'expense';
  const accentColor = isExpense ? Colors.danger : Colors.success;
  const gradColors = isExpense ? Gradients.expense : Gradients.income;

  const resetForm = () => {
    setAmount('');
    setCategory('');
    setDescription('');
    setExpenseType('variable');
    setExpenseFrequency('one-time');
    setIsEssential(false);
    setIncomeType('salary');
    setIncomeFrequency('monthly');
    setDate(new Date());
  };

  const handleSave = async () => {
    if (!amount) {
      Alert.alert('Missing Amount', 'Please enter an amount.');
      return;
    }
    if (isExpense && !category) {
      Alert.alert('Missing Category', 'Please select or enter a category.');
      return;
    }
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid positive number.');
      return;
    }

    setIsLoading(true);
    try {
      if (isExpense) {
        const { error } = await supabase.from('expenses').insert({
          user_id: user?.id,
          amount: parsed,
          category: category.trim(),
          type: expenseType,
          frequency: expenseFrequency,
          start_date: date.toISOString().split('T')[0],
          is_essential: isEssential,
          description: description.trim() || null,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('income').insert({
          user_id: user?.id,
          amount: parsed,
          type: incomeType,
          frequency: incomeFrequency,
          start_date: date.toISOString().split('T')[0],
          description: description.trim() || null,
        });
        if (error) throw error;
      }

      resetForm();
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={Gradients.background} style={StyleSheet.absoluteFillObject} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* Screen Title */}
          <Text style={styles.pageTitle}>New Transaction</Text>

          {/* Mode Toggle */}
          <View style={styles.typeRow}>
            {(['expense', 'income'] as const).map((t) => {
              const active = mode === t;
              const color = t === 'expense' ? Colors.danger : Colors.success;
              return (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeBtn, active && { backgroundColor: color, borderColor: color }]}
                  onPress={() => { setMode(t); setCategory(''); }}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={t === 'expense' ? Icons.expense : Icons.income}
                    size={18}
                    color={active ? '#fff' : Colors.textMuted}
                  />
                  <Text style={[styles.typeBtnLabel, active && styles.typeBtnLabelActive]}>
                    {t === 'expense' ? 'Expense' : 'Income'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Amount Display */}
          <LinearGradient colors={gradColors} style={styles.amountCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={styles.amountPrefix}>{isExpense ? '-₹' : '+₹'}</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor="rgba(255,255,255,0.4)"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />
          </LinearGradient>

          {/* ─── EXPENSE FIELDS ─── */}
          {isExpense && (
            <>
              {/* Category Pills */}
              <Text style={styles.label}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.pill, category === cat && { backgroundColor: accentColor, borderColor: accentColor }]}
                    onPress={() => setCategory(cat)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.pillText, category === cat && { color: '#fff' }]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Custom Category */}
              <View style={styles.fieldGroup}>
                <View style={styles.field}>
                  <Ionicons name={Icons.tag} size={18} color={Colors.textMuted} />
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="Custom category…"
                    placeholderTextColor={Colors.textMuted}
                    value={category}
                    onChangeText={setCategory}
                  />
                </View>
              </View>

              {/* Type: Fixed / Variable */}
              <Text style={styles.label}>Type</Text>
              <View style={styles.typeRow}>
                {EXPENSE_TYPES.map((t) => {
                  const active = expenseType === t;
                  const icon = t === 'fixed' ? Icons.fixed : Icons.variable;
                  return (
                    <TouchableOpacity
                      key={t}
                      style={[styles.metaBtn, active && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}
                      onPress={() => setExpenseType(t)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name={icon} size={16} color={active ? '#fff' : Colors.textMuted} />
                      <Text style={[styles.metaBtnLabel, active && { color: '#fff' }]}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Frequency */}
              <Text style={styles.label}>Frequency</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
                {EXPENSE_FREQUENCIES.map((f) => {
                  const active = expenseFrequency === f;
                  return (
                    <TouchableOpacity
                      key={f}
                      style={[styles.pill, active && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}
                      onPress={() => setExpenseFrequency(f)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.pillText, active && { color: '#fff' }]}>
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Essential Toggle */}
              <View style={styles.toggleRow}>
                <View style={styles.toggleLeft}>
                  <Ionicons name={Icons.essential} size={18} color={isEssential ? Colors.success : Colors.textMuted} />
                  <Text style={styles.toggleLabel}>Essential Expense</Text>
                </View>
                <Switch
                  value={isEssential}
                  onValueChange={setIsEssential}
                  trackColor={{ false: Colors.card, true: `${Colors.success}66` }}
                  thumbColor={isEssential ? Colors.success : Colors.textMuted}
                />
              </View>
            </>
          )}

          {/* ─── INCOME FIELDS ─── */}
          {!isExpense && (
            <>
              {/* Income Type */}
              <Text style={styles.label}>Income Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
                {INCOME_TYPES.map((t) => {
                  const active = incomeType === t;
                  return (
                    <TouchableOpacity
                      key={t}
                      style={[styles.pill, active && { backgroundColor: accentColor, borderColor: accentColor }]}
                      onPress={() => setIncomeType(t)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.pillText, active && { color: '#fff' }]}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Income Frequency */}
              <Text style={styles.label}>Frequency</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
                {INCOME_FREQUENCIES.map((f) => {
                  const active = incomeFrequency === f;
                  return (
                    <TouchableOpacity
                      key={f}
                      style={[styles.pill, active && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}
                      onPress={() => setIncomeFrequency(f)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.pillText, active && { color: '#fff' }]}>
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </>
          )}

          {/* ─── COMMON FIELDS ─── */}
          <View style={styles.fieldGroup}>
            <TouchableOpacity
              style={[styles.field, { height: 52 }]}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
            >
              <Ionicons name={Icons.calendar} size={18} color={Colors.textMuted} />
              <Text style={styles.fieldInputText}>
                {date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
              </Text>
            </TouchableOpacity>
            <View style={styles.fieldSeparator} />
            <View style={styles.field}>
              <Ionicons name={Icons.edit} size={18} color={Colors.textMuted} />
              <TextInput
                style={styles.fieldInput}
                placeholder="Note (optional)"
                placeholderTextColor={Colors.textMuted}
                value={description}
                onChangeText={setDescription}
              />
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity onPress={handleSave} disabled={isLoading} activeOpacity={0.85}>
            <LinearGradient colors={gradColors} style={styles.saveBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Ionicons name={isLoading ? Icons.loading : Icons.success} size={22} color="#fff" />
              <Text style={styles.saveBtnText}>{isLoading ? 'Saving…' : `Save ${isExpense ? 'Expense' : 'Income'}`}</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Date Picker */}
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              maximumDate={new Date()}
              onChange={(event, selectedDate) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (selectedDate) setDate(selectedDate);
              }}
            />
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ─── Styles ──────────────────────────────────── */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.lg, paddingTop: Spacing.md, paddingBottom: 40, gap: 14 },
  pageTitle: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.3 },

  // Mode toggle
  typeRow: { flexDirection: 'row', gap: 12 },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.card,
  },
  typeBtnLabel: { fontSize: 15, fontWeight: '600', color: Colors.textMuted },
  typeBtnLabelActive: { color: '#fff' },

  // Amount
  amountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  amountPrefix: { fontSize: 42, color: 'rgba(255,255,255,0.7)', fontWeight: '800', marginRight: 4 },
  amountInput: {
    flex: 1,
    fontSize: 52,
    color: '#fff',
    fontWeight: '800',
    letterSpacing: -1,
  },

  // Labels
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, letterSpacing: 0.5, marginTop: 4 },

  // Pills
  pillRow: { marginHorizontal: -Spacing.lg, paddingHorizontal: Spacing.lg },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.card,
    marginRight: 8,
  },
  pillText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },

  // Meta buttons (Fixed / Variable)
  metaBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.card,
  },
  metaBtnLabel: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },

  // Toggle row
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md,
  },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  toggleLabel: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },

  // Input fields
  fieldGroup: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  field: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, gap: 12 },
  fieldInput: { flex: 1, height: 52, color: Colors.textPrimary, fontSize: 15 },
  fieldInputText: { flex: 1, color: Colors.textPrimary, fontSize: 15 },
  fieldSeparator: { height: 1, backgroundColor: Colors.separator, marginLeft: 46 },

  // Save
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: Radius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  saveBtnText: { fontSize: 17, fontWeight: '700', color: '#fff' },
});
