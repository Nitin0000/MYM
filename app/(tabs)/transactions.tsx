import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  StyleSheet, Text, View, FlatList,
  ActivityIndicator, TouchableOpacity,
  Pressable, Animated, Modal, TextInput, Alert,
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
import { processEntries } from '@/utils/calculations';

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

  // Action sheet state (long press)
  const [actionTarget, setActionTarget] = useState<UnifiedEntry | null>(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<UnifiedEntry | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleting, setDeleting] = useState(false);

  // End recurring entry state
  const [endTarget, setEndTarget] = useState<UnifiedEntry | null>(null);
  const [endModalVisible, setEndModalVisible] = useState(false);
  const [ending, setEnding] = useState(false);
  const [endDateInput, setEndDateInput] = useState('');

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

    let expQ = supabase.from('expenses').select('*').eq('user_id', user.id).is('deleted_at', null);
    let incQ = supabase.from('income').select('*').eq('user_id', user.id).is('deleted_at', null);

    const [{ data: expenses }, { data: incomes }] = await Promise.all([expQ, incQ]);

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

    const unified = processEntries(rawUnified, timeFilter, dateRange);

    // processEntries handles sorting

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
  const canGoForward = timeFilter !== 'all';

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

  // ─── Action sheet (long press) ───
  const isRecurring = (freq: string) => freq !== 'one-time';

  const openActionModal = (item: UnifiedEntry) => {
    setActionTarget(item);
    setActionModalVisible(true);
  };

  const closeActionModal = () => {
    setActionModalVisible(false);
    setActionTarget(null);
  };

  const chooseDelete = () => {
    if (!actionTarget) return;
    closeActionModal();
    setTimeout(() => {
      setDeleteTarget(actionTarget);
      setDeleteInput('');
      setDeleteModalVisible(true);
    }, 250);
  };

  const chooseEnd = () => {
    if (!actionTarget) return;
    closeActionModal();
    setTimeout(() => {
      setEndTarget(actionTarget);
      setEndDateInput(new Date().toISOString().split('T')[0]);
      setEndModalVisible(true);
    }, 250);
  };

  // ─── Delete handlers ───
  const closeDeleteModal = () => {
    setDeleteModalVisible(false);
    setDeleteTarget(null);
    setDeleteInput('');
  };

  const confirmDelete = async () => {
    if (!deleteTarget || deleteInput.toLowerCase() !== 'delete') return;
    setDeleting(true);
    const table = deleteTarget.kind === 'income' ? 'income' : 'expenses';
    const realId = deleteTarget.original_id || deleteTarget.id;
    const { error } = await supabase
      .from(table)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', realId);
    setDeleting(false);
    if (error) { Alert.alert('Error', 'Failed to delete entry.'); return; }
    closeDeleteModal();
    fetchData();
  };

  // ─── End recurring handlers ───
  const closeEndModal = () => {
    setEndModalVisible(false);
    setEndTarget(null);
    setEndDateInput('');
  };

  const isEndDateValid = () => {
    if (!endTarget || !endDateInput) return false;
    return endDateInput >= endTarget.date;
  };

  const confirmEnd = async () => {
    if (!endTarget || !isEndDateValid()) return;
    setEnding(true);
    const table = endTarget.kind === 'income' ? 'income' : 'expenses';
    const realId = endTarget.original_id || endTarget.id;
    const { error } = await supabase
      .from(table)
      .update({ end_date: endDateInput })
      .eq('id', realId);
    setEnding(false);
    if (error) { Alert.alert('Error', 'Failed to end entry.'); return; }
    closeEndModal();
    fetchData();
  };

  const renderItem = ({ item }: { item: UnifiedEntry }) => {
    const isIncome = item.kind === 'income';
    const color = isIncome ? Colors.success : Colors.danger;

    return (
      <TouchableOpacity
        style={styles.card}
        onLongPress={() => openActionModal(item)}
        activeOpacity={0.85}
        delayLongPress={400}
      >
        <View style={[styles.icon, { backgroundColor: `${color}22` }]}>
          <Ionicons name={isIncome ? Icons.cash : Icons.cart} size={22} color={color} />
        </View>
        <View style={styles.details}>
          <Text style={styles.title} numberOfLines={1}>
            {item.description || item.label || 'Transaction'}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>{item.label}</Text>
            {item.isPredicted && (
              <View style={[styles.badge, { backgroundColor: `${Colors.warning}22`, paddingHorizontal: 6, paddingVertical: 4 }]}>
                <Ionicons name="sparkles" size={12} color={Colors.warning} />
              </View>
            )}
            {!item.isPredicted && item.frequency !== 'one-time' && (
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
          {/* Show ended badge for recurring entries */}
          {isRecurring(item.frequency) && item.endDate && (
            <View style={styles.endRow}>
              <View style={styles.endedBadge}>
                <Ionicons name="checkmark-circle" size={12} color={Colors.textMuted} />
                <Text style={styles.endedText}>Ended {item.endDate}</Text>
              </View>
            </View>
          )}
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
      </TouchableOpacity>
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

      {/* ─── Delete Confirmation Modal ─── */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeDeleteModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeDeleteModal}>
          <Pressable style={styles.modalContent} onPress={() => {}}>
            {/* Warning icon */}
            <View style={styles.modalIconWrap}>
              <Ionicons name="warning" size={32} color={Colors.danger} />
            </View>

            <Text style={styles.modalTitle}>Delete Entry</Text>

            {deleteTarget && (
              <View style={styles.modalEntry}>
                <Text style={styles.modalEntryLabel}>
                  {deleteTarget.description || deleteTarget.label}
                </Text>
                <Text style={[
                  styles.modalEntryAmount,
                  { color: deleteTarget.kind === 'income' ? Colors.success : Colors.danger },
                ]}>
                  {deleteTarget.kind === 'income' ? '+' : '-'}₹{deleteTarget.amount.toLocaleString('en-IN')}
                </Text>
              </View>
            )}

            <Text style={styles.modalDesc}>
              This action will remove this entry from your records.{"\n"}
              Type <Text style={styles.modalBold}>delete</Text> below to confirm.
            </Text>

            <TextInput
              style={[
                styles.modalInput,
                deleteInput.toLowerCase() === 'delete' && styles.modalInputValid,
              ]}
              placeholder='Type "delete" to confirm'
              placeholderTextColor={Colors.textMuted}
              value={deleteInput}
              onChangeText={setDeleteInput}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={closeDeleteModal}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalDeleteBtn,
                  deleteInput.toLowerCase() !== 'delete' && styles.modalDeleteBtnDisabled,
                ]}
                onPress={confirmDelete}
                activeOpacity={0.7}
                disabled={deleteInput.toLowerCase() !== 'delete' || deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="trash" size={16} color="#fff" />
                    <Text style={styles.modalDeleteText}>Delete</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ─── Action Sheet Modal (long press) ─── */}
      <Modal
        visible={actionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeActionModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeActionModal}>
          <Pressable style={styles.actionSheet} onPress={() => {}}>
            {actionTarget && (
              <View style={styles.actionSheetHeader}>
                <Text style={styles.actionSheetTitle} numberOfLines={1}>
                  {actionTarget.description || actionTarget.label}
                </Text>
                <Text style={styles.actionSheetSub}>
                  {actionTarget.kind === 'income' ? 'Income' : 'Expense'} · {actionTarget.frequency}
                </Text>
              </View>
            )}

            {/* Delete option */}
            <TouchableOpacity
              style={styles.actionSheetOption}
              onPress={chooseDelete}
              activeOpacity={0.7}
            >
              <View style={[styles.actionSheetIcon, { backgroundColor: `${Colors.danger}18` }]}>
                <Ionicons name="trash" size={20} color={Colors.danger} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionSheetOptionTitle}>Delete</Text>
                <Text style={styles.actionSheetOptionSub}>Remove from records</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </TouchableOpacity>

            {/* End option — only for recurring & not already ended */}
            {actionTarget && isRecurring(actionTarget.frequency) && !actionTarget.endDate && (
              <TouchableOpacity
                style={styles.actionSheetOption}
                onPress={chooseEnd}
                activeOpacity={0.7}
              >
                <View style={[styles.actionSheetIcon, { backgroundColor: `${Colors.warning}18` }]}>
                  <Ionicons name="stop-circle" size={20} color={Colors.warning} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionSheetOptionTitle}>End Recurring</Text>
                  <Text style={styles.actionSheetOptionSub}>Stop future recurrences</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            )}

            {/* Cancel */}
            <TouchableOpacity
              style={styles.actionSheetCancel}
              onPress={closeActionModal}
              activeOpacity={0.7}
            >
              <Text style={styles.actionSheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ─── End Recurring Confirmation Modal ─── */}
      <Modal
        visible={endModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeEndModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeEndModal}>
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <View style={[styles.modalIconWrap, { backgroundColor: `${Colors.warning}18` }]}>
              <Ionicons name="stop-circle" size={32} color={Colors.warning} />
            </View>

            <Text style={styles.modalTitle}>End Recurring Entry</Text>

            {endTarget && (
              <View style={styles.modalEntry}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalEntryLabel}>
                    {endTarget.description || endTarget.label}
                  </Text>
                  <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 2 }}>
                    {endTarget.frequency} · started {endTarget.date}
                  </Text>
                </View>
                <Text style={[
                  styles.modalEntryAmount,
                  { color: endTarget.kind === 'income' ? Colors.success : Colors.danger },
                ]}>
                  {endTarget.kind === 'income' ? '+' : '-'}₹{endTarget.amount.toLocaleString('en-IN')}
                </Text>
              </View>
            )}

            <Text style={styles.modalDesc}>
              Choose an end date for this recurring entry.{"\n"}
              Must be on or after the start date.
            </Text>

            {/* Date input */}
            <View style={styles.endDateRow}>
              <Text style={styles.endDateLabel}>End Date</Text>
              <TextInput
                style={[
                  styles.endDateInput,
                  endDateInput && !isEndDateValid() && styles.endDateInputInvalid,
                  endDateInput && isEndDateValid() && styles.endDateInputValid,
                ]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.textMuted}
                value={endDateInput}
                onChangeText={setEndDateInput}
                keyboardType="numbers-and-punctuation"
                maxLength={10}
              />
            </View>
            {endDateInput && !isEndDateValid() && endTarget && (
              <Text style={styles.endDateError}>
                End date must be on or after {endTarget.date}
              </Text>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={closeEndModal}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.endConfirmBtn, !isEndDateValid() && { opacity: 0.35 }]}
                onPress={confirmEnd}
                activeOpacity={0.7}
                disabled={!isEndDateValid() || ending}
              >
                {ending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={16} color="#fff" />
                    <Text style={styles.endConfirmText}>End Now</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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

  // Delete modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 32,
    elevation: 20,
  },
  modalIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${Colors.danger}18`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  modalEntry: {
    width: '100%',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalEntryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
  },
  modalEntryAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  modalDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  modalBold: {
    fontWeight: '800',
    color: Colors.danger,
  },
  modalInput: {
    width: '100%',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  modalInputValid: {
    borderColor: Colors.danger,
    backgroundColor: `${Colors.danger}0A`,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Radius.md,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  modalDeleteBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Radius.md,
    backgroundColor: Colors.danger,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  modalDeleteBtnDisabled: {
    opacity: 0.35,
  },
  modalDeleteText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },

  // End recurring styles
  endRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  endedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${Colors.textMuted}18`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  endedText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  endConfirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Radius.md,
    backgroundColor: Colors.warning,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  endConfirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  endDateRow: {
    width: '100%',
    marginBottom: Spacing.sm,
  },
  endDateLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  endDateInput: {
    width: '100%',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  endDateInputValid: {
    borderColor: Colors.warning,
    backgroundColor: `${Colors.warning}0A`,
  },
  endDateInputInvalid: {
    borderColor: Colors.danger,
    backgroundColor: `${Colors.danger}0A`,
  },
  endDateError: {
    fontSize: 11,
    color: Colors.danger,
    fontWeight: '600',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },

  // Action sheet
  actionSheet: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 32,
    elevation: 20,
  },
  actionSheetHeader: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
    alignItems: 'center',
  },
  actionSheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  actionSheetSub: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  actionSheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  actionSheetIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionSheetOptionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  actionSheetOptionSub: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  actionSheetCancel: {
    padding: Spacing.md,
    alignItems: 'center',
  },
  actionSheetCancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
});
