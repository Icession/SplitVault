import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { CATEGORIES, formatPeso } from '../constants';
import {
  getTransactions,
  saveTransactions,
  getWallets,
  saveWallets,
  getCategories,
} from '../storage/storage';
import { useTheme } from '../theme/ThemeContext';
import FadeInView from '../components/FadeInView';
import PressableScale from '../components/PressableScale';
import useConfirm from '../components/useConfirm';

const TYPE_FILTERS = ['All', 'Expense', 'Income', 'Transfer'];
const SORTS = [
  { key: 'newest', label: 'Newest' },
  { key: 'oldest', label: 'Oldest' },
  { key: 'amount', label: 'Largest' },
];

// Apply (sign +1) or reverse (sign -1) a transaction's effect on wallets.
const applyEffect = (wallets, tx, sign) => {
  const next = { ...wallets };
  if (tx.type === 'income') {
    next.savings += sign * tx.amount;
  } else if (tx.type === 'expense') {
    next[tx.wallet] -= sign * tx.amount;
  } else if (tx.type === 'transfer') {
    const dest = tx.wallet === 'savings' ? 'expense' : 'savings';
    next[tx.wallet] -= sign * tx.amount;
    next[dest] += sign * tx.amount;
  }
  return next;
};

export default function HistoryScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { confirm, dialog } = useConfirm();

  const [transactions, setTransactions] = useState([]);
  const [wallets, setWallets] = useState({ savings: 0, expense: 0 });
  const [typeFilter, setTypeFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [sortOpen, setSortOpen] = useState(false);

  // Edit / delete sheet
  const [selectedTx, setSelectedTx] = useState(null);
  const [editLabel, setEditLabel] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [categories, setCategories] = useState(CATEGORIES);

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        const t = await getTransactions();
        const w = await getWallets();
        const c = await getCategories();
        setTransactions(t);
        setWallets(w);
        setCategories(c);
      };
      fetchData();
    }, [])
  );

  const filtered = transactions.filter((tx) => {
    const matchesType =
      typeFilter === 'All' || tx.type.toLowerCase() === typeFilter.toLowerCase();
    const haystack = `${tx.label} ${tx.category} ${tx.wallet}`.toLowerCase();
    const matchesSearch = haystack.includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'amount') return b.amount - a.amount;
    const ai = Number(a.id) || 0;
    const bi = Number(b.id) || 0;
    return sortBy === 'oldest' ? ai - bi : bi - ai;
  });

  const currentSort = SORTS.find((s) => s.key === sortBy) || SORTS[0];

  // Best available timestamp: prefer createdAt, fall back to the numeric id
  // (which is Date.now() at creation), so pre-timestamp transactions still group.
  const txDate = (tx) => {
    if (tx.createdAt) return new Date(tx.createdAt);
    const n = Number(tx.id);
    return n ? new Date(n) : null;
  };

  const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

  const headerLabel = (d) => {
    const now = new Date();
    const today = dayKey(now);
    const yest = new Date(now);
    yest.setDate(now.getDate() - 1);
    if (dayKey(d) === today) return 'Today';
    if (dayKey(d) === dayKey(yest)) return 'Yesterday';
    const sameYear = d.getFullYear() === now.getFullYear();
    return d.toLocaleDateString('en-PH', {
      month: 'long',
      day: 'numeric',
      ...(sameYear ? {} : { year: 'numeric' }),
    });
  };

  // Group only for date-based sorts; "Largest" stays a flat list.
  const grouped = sortBy === 'amount'
    ? null
    : sorted.reduce((acc, tx) => {
        const d = txDate(tx);
        const label = d ? headerLabel(d) : 'Earlier';
        const last = acc[acc.length - 1];
        if (last && last.label === label) {
          last.items.push(tx);
        } else {
          acc.push({ label, items: [tx] });
        }
        return acc;
      }, []);

  let countLabel = `${sorted.length} transaction${sorted.length !== 1 ? 's' : ''}`;
  if (typeFilter !== 'All' && sorted.length > 0) {
    const sum = sorted.reduce((s, t) => s + t.amount, 0);
    countLabel += ` · ${formatPeso(sum)}`;
  }

  const openTx = (tx) => {
    setSelectedTx(tx);
    setEditLabel(tx.label);
    setEditAmount(String(tx.amount));
    setEditCategory(tx.category);
  };

  const closeTx = () => setSelectedTx(null);

  const handleSaveEdit = async () => {
    const newAmount = parseFloat(editAmount);
    if (!editLabel.trim()) {
      Alert.alert('Missing Description', 'Please enter a description.');
      return;
    }
    if (!editAmount || newAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }

    const newTx = {
      ...selectedTx,
      amount: newAmount,
      label: editLabel.trim(),
      category: selectedTx.type === 'expense' ? editCategory : selectedTx.category,
    };

    // Reverse the old effect, then apply the new one.
    let w = applyEffect(wallets, selectedTx, -1);
    w = applyEffect(w, newTx, +1);

    if (w.savings < 0 || w.expense < 0) {
      Alert.alert(
        "Can't save",
        'This change would make one of your wallet balances negative.'
      );
      return;
    }

    const updatedTx = transactions.map((t) => (t.id === selectedTx.id ? newTx : t));
    await saveWallets(w);
    await saveTransactions(updatedTx);
    setWallets(w);
    setTransactions(updatedTx);
    closeTx();
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Delete Transaction',
      message: 'This removes the transaction and adjusts your wallet balance accordingly.',
      confirmText: 'Delete',
      destructive: true,
      icon: 'trash-outline',
    });
    if (!ok) return;

    const w = applyEffect(wallets, selectedTx, -1);
    if (w.savings < 0 || w.expense < 0) {
      Alert.alert(
        "Can't delete",
        'Removing this would make one of your wallet balances negative (the funds were likely already used).'
      );
      return;
    }
    const updatedTx = transactions.filter((t) => t.id !== selectedTx.id);
    await saveWallets(w);
    await saveTransactions(updatedTx);
    setWallets(w);
    setTransactions(updatedTx);
    closeTx();
  };

  const getTxIconName = (type) => {
    if (type === 'expense') return 'remove-circle';
    if (type === 'income') return 'add-circle';
    return 'swap-horizontal';
  };

  const getTxIconColor = (type) => {
    if (type === 'expense') return colors.danger;
    if (type === 'income') return colors.income;
    return colors.transfer;
  };

  const getAmountColor = (type) => {
    if (type === 'expense') return colors.danger;
    if (type === 'income') return colors.income;
    return colors.transfer;
  };

  const getAmountPrefix = (type) => {
    if (type === 'expense') return '-';
    if (type === 'income') return '+';
    return '';
  };

  const renderRow = (tx, index) => (
    <PressableScale
      key={tx.id || index}
      style={styles.txCard}
      onPress={() => openTx(tx)}
    >
      <View style={[
        styles.txIconContainer,
        { backgroundColor: getTxIconColor(tx.type) + '15' }
      ]}>
        <Ionicons name={getTxIconName(tx.type)} size={20} color={getTxIconColor(tx.type)} />
      </View>
      <View style={styles.txMiddle}>
        <Text style={styles.txLabel}>{tx.label}</Text>
        <Text style={styles.txMeta}>
          {tx.category} · {tx.wallet} · {tx.date}
        </Text>
      </View>
      <Text style={[styles.txAmount, { color: getAmountColor(tx.type) }]}>
        {getAmountPrefix(tx.type)}{formatPeso(tx.amount)}
      </Text>
    </PressableScale>
  );

  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Transaction History</Text>
      </View>

      <View style={styles.controls}>
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={16} color={colors.subtext} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search transactions..."
              placeholderTextColor={colors.subtext}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          <View style={styles.sortWrap}>
            <PressableScale style={styles.sortBtn} onPress={() => setSortOpen((o) => !o)}>
              <Text style={styles.sortBtnText}>{currentSort.label}</Text>
              <Ionicons
                name={sortOpen ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={colors.subtext}
              />
            </PressableScale>
            {sortOpen && (
              <View style={styles.sortMenu}>
                {SORTS.map((s) => {
                  const active = sortBy === s.key;
                  return (
                    <TouchableOpacity
                      key={s.key}
                      style={styles.sortItem}
                      onPress={() => { setSortBy(s.key); setSortOpen(false); }}
                    >
                      <Text style={[
                        styles.sortItemText,
                        active && { color: colors.primary, fontWeight: '700' },
                      ]}>
                        {s.label}
                      </Text>
                      {active && <Ionicons name="checkmark" size={14} color={colors.primary} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        <View style={styles.filterSection}>
          {TYPE_FILTERS.map((filter) => (
            <PressableScale
              key={filter}
              style={[
                styles.filterPill,
                typeFilter === filter && styles.filterPillActive,
              ]}
              onPress={() => setTypeFilter(filter)}
            >
              <Text style={[
                styles.filterPillText,
                typeFilter === filter && styles.filterPillTextActive,
              ]}>
                {filter}
              </Text>
            </PressableScale>
          ))}
        </View>

        <Text style={styles.countText}>{countLabel}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        <FadeInView style={styles.inner}>
          {sorted.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={40} color={colors.subtext} />
              <Text style={styles.emptyText}>No transactions found</Text>
              <Text style={styles.emptySubtext}>
                {typeFilter !== 'All' || search
                  ? 'Try adjusting your filters'
                  : 'Start by adding an expense or income'}
              </Text>
            </View>
          ) : grouped ? (
            grouped.map((group) => (
              <View key={group.label}>
                <Text style={styles.dateHeader}>{group.label}</Text>
                {group.items.map((tx, index) => renderRow(tx, index))}
              </View>
            ))
          ) : (
            sorted.map((tx, index) => renderRow(tx, index))
          )}
        </FadeInView>
      </ScrollView>

      {/* Edit / delete sheet */}
      <Modal
        visible={!!selectedTx}
        transparent
        animationType="slide"
        onRequestClose={closeTx}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {selectedTx && (
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <Text style={styles.modalTitle}>Edit Transaction</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedTx.type.charAt(0).toUpperCase() + selectedTx.type.slice(1)} · {selectedTx.date}
                </Text>

                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Description"
                  placeholderTextColor={colors.subtext}
                  value={editLabel}
                  onChangeText={setEditLabel}
                />

                <Text style={styles.label}>Amount (₱)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Amount"
                  placeholderTextColor={colors.subtext}
                  keyboardType="numeric"
                  value={editAmount}
                  onChangeText={setEditAmount}
                />

                {selectedTx.type === 'expense' && (
                  <>
                    <Text style={styles.label}>Category</Text>
                    <View style={styles.categoryGrid}>
                      {categories.map((cat) => (
                        <TouchableOpacity
                          key={cat.label}
                          style={[
                            styles.categoryChip,
                            editCategory === cat.label && styles.categoryChipActive,
                          ]}
                          onPress={() => setEditCategory(cat.label)}
                        >
                          <Text style={[
                            styles.categoryChipText,
                            editCategory === cat.label && { color: colors.danger },
                          ]}>
                            {cat.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}

                <View style={styles.editActions}>
                  <PressableScale style={styles.deleteBtn} onPress={handleDelete}>
                    <Ionicons name="trash-outline" size={16} color={colors.danger} />
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </PressableScale>
                  <PressableScale style={styles.saveBtn} onPress={handleSaveEdit}>
                    <Text style={styles.saveBtnText}>Save Changes</Text>
                  </PressableScale>
                </View>

                <TouchableOpacity style={styles.cancelLink} onPress={closeTx}>
                  <Text style={styles.cancelLinkText}>Cancel</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {dialog}
    </View>
  );
}

const createStyles = (COLORS) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 12,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  controls: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    zIndex: 10,
  },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 10,
    zIndex: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    height: 46,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  sortWrap: {
    position: 'relative',
    zIndex: 20,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    height: 46,
    gap: 6,
  },
  sortBtnText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  sortMenu: {
    position: 'absolute',
    top: 52,
    right: 0,
    minWidth: 160,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 4,
    zIndex: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  sortItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sortItemText: {
    fontSize: 14,
    color: COLORS.text,
  },
  filterSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.subtext,
  },
  filterPillTextActive: {
    color: '#fff',
  },
  countText: {
    fontSize: 13,
    color: COLORS.subtext,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  listContent: {
    padding: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  inner: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  emptySubtext: {
    fontSize: 13,
    color: COLORS.subtext,
    textAlign: 'center',
  },
  dateHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.subtext,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 8,
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 8,
  },
  txIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txMiddle: {
    flex: 1,
  },
  txLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 3,
  },
  txMeta: {
    fontSize: 11,
    color: COLORS.subtext,
    textTransform: 'capitalize',
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 32,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 13,
    color: COLORS.subtext,
    textAlign: 'center',
    textTransform: 'capitalize',
    marginTop: 4,
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 6,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipActive: {
    borderColor: COLORS.danger,
    backgroundColor: COLORS.danger + '22',
  },
  categoryChipText: {
    fontSize: 13,
    color: COLORS.subtext,
    fontWeight: '600',
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  deleteBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.danger,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  cancelLink: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 4,
  },
  cancelLinkText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.subtext,
  },
});