import React, { useState } from 'react';
import {
  StyleSheet, Text, View, SafeAreaView, TextInput,
  TouchableOpacity, Alert, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Gradients, Spacing, Radius } from '@/constants/Theme';

const QUICK_CATEGORIES = {
  expense: ['Food', 'Transport', 'Shopping', 'Bills', 'Health'],
  income: ['Salary', 'Freelance', 'Business', 'Investment', 'Gift'],
};

export default function AddTransactionScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isExpense = type === 'expense';
  const accentColor = isExpense ? Colors.danger : Colors.success;
  const gradColors = isExpense ? Gradients.expense : Gradients.income;

  const handleSave = async () => {
    if (!amount || !categoryName) {
      Alert.alert('Missing Fields', 'Please enter an amount and category.');
      return;
    }
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid positive number.');
      return;
    }

    setIsLoading(true);
    try {
      // Upsert category
      const { data: existingCats } = await supabase
        .from('categories')
        .select('id')
        .eq('user_id', user?.id)
        .eq('name', categoryName.trim())
        .eq('type', type)
        .limit(1);

      let categoryId: string;
      if (existingCats && existingCats.length > 0) {
        categoryId = existingCats[0].id;
      } else {
        const { data: newCat, error: catError } = await supabase
          .from('categories')
          .insert({
            user_id: user?.id,
            name: categoryName.trim(),
            type,
            icon: isExpense ? 'cart' : 'cash',
            color: accentColor,
          })
          .select('id')
          .single();
        if (catError) throw catError;
        categoryId = newCat.id;
      }

      const { error: txError } = await supabase.from('transactions').insert({
        user_id: user?.id,
        category_id: categoryId,
        amount: parsed,
        description: description.trim(),
        type,
        date: new Date().toISOString().split('T')[0],
      });
      if (txError) throw txError;

      setAmount(''); setCategoryName(''); setDescription('');
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

          {/* Type Toggle */}
          <View style={styles.typeRow}>
            {(['expense', 'income'] as const).map((t) => {
              const active = type === t;
              const color = t === 'expense' ? Colors.danger : Colors.success;
              return (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeBtn, active && { backgroundColor: color, borderColor: color }]}
                  onPress={() => { setType(t); setCategoryName(''); }}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={t === 'expense' ? 'arrow-up-circle' : 'arrow-down-circle'}
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
            <Text style={styles.amountPrefix}>{isExpense ? '-' : '+'}</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor="rgba(255,255,255,0.4)"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />
          </LinearGradient>

          {/* Quick Category Pills */}
          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
            {QUICK_CATEGORIES[type].map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.pill,
                  categoryName === cat && { backgroundColor: accentColor, borderColor: accentColor },
                ]}
                onPress={() => setCategoryName(cat)}
                activeOpacity={0.75}
              >
                <Text style={[styles.pillText, categoryName === cat && { color: '#fff' }]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Inputs */}
          <View style={styles.fieldGroup}>
            <View style={styles.field}>
              <Ionicons name="pricetag-outline" size={18} color={Colors.textMuted} />
              <TextInput
                style={styles.fieldInput}
                placeholder="Custom category…"
                placeholderTextColor={Colors.textMuted}
                value={categoryName}
                onChangeText={setCategoryName}
              />
            </View>
            <View style={styles.fieldSeparator} />
            <View style={styles.field}>
              <Ionicons name="create-outline" size={18} color={Colors.textMuted} />
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
              <Ionicons name={isLoading ? 'hourglass' : 'checkmark-circle'} size={22} color="#fff" />
              <Text style={styles.saveBtnText}>{isLoading ? 'Saving…' : 'Save Transaction'}</Text>
            </LinearGradient>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.lg, paddingTop: 40, paddingBottom: 120, gap: Spacing.lg },
  pageTitle: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.3 },

  // Type toggle
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

  // Pills
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, letterSpacing: 0.5 },
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
