import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { formatPeso } from '../constants';
import { getTransactions } from '../storage/storage';
import { useTheme } from '../theme/ThemeContext';

const TYPE_FILTERS = ['All', 'Expense', 'Income', 'Transfer'];

export default function HistoryScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [transactions, setTransactions] = useState([]);
  const [typeFilter, setTypeFilter] = useState('All');
  const [search, setSearch] = useState('');

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        const t = await getTransactions();
        setTransactions(t);
      };
      fetchData();
    }, [])
  );

  const filtered = transactions.filter((tx) => {
    const matchesType = typeFilter === 'All' || tx.type.toLowerCase() === typeFilter.toLowerCase();
    const matchesSearch = tx.label.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

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

  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Transaction History</Text>
      </View>

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
        <View style={styles.filterDropdown}>
          <Text style={styles.filterDropdownText}>{typeFilter}</Text>
          <Ionicons name="chevron-down" size={14} color={colors.subtext} />
        </View>
      </View>

      <View style={styles.filterSection}>
        {TYPE_FILTERS.map((filter) => (
          <TouchableOpacity
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
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.countText}>
        {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
      </Text>

      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={40} color={colors.subtext} />
            <Text style={styles.emptyText}>No transactions found</Text>
            <Text style={styles.emptySubtext}>
              {typeFilter !== 'All' || search
                ? 'Try adjusting your filters'
                : 'Start by adding an expense or income'}
            </Text>
          </View>
        ) : (
          filtered.map((tx, index) => (
            <View key={tx.id || index} style={styles.txCard}>
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
            </View>
          ))
        )}
      </ScrollView>

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
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 10,
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
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  filterDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  filterDropdownText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
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
});