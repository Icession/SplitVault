import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, formatPeso } from '../constants';
import { getTransactions } from '../storage/storage';

const TYPE_FILTERS = ['All', 'Expense', 'Income', 'Transfer'];
const WALLET_FILTERS = ['Both', 'Savings', 'Expense'];

export default function HistoryScreen() {

  const [transactions, setTransactions] = useState([]);
  const [typeFilter, setTypeFilter] = useState('All');
  const [walletFilter, setWalletFilter] = useState('Both');

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
    const matchesWallet = walletFilter === 'Both' || tx.wallet.toLowerCase() === walletFilter.toLowerCase();
    return matchesType && matchesWallet;
  });

  const getTxIconName = (type) => {
    if (type === 'expense') return 'remove-circle';
    if (type === 'income') return 'add-circle';
    return 'swap-horizontal';
  };

  const getTxIconColor = (type) => {
    if (type === 'expense') return COLORS.danger;
    if (type === 'income') return COLORS.savings;
    return COLORS.warning;
  };

  const getAmountColor = (type) => {
    if (type === 'expense') return COLORS.danger;
    if (type === 'income') return COLORS.expense;
    return COLORS.warning;
  };

  const getAmountPrefix = (type) => {
    if (type === 'expense') return '-';
    if (type === 'income') return '+';
    return '';
  };

  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <Text style={styles.title}>Transaction History</Text>
        <Text style={styles.subtitle}>
          {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
        </Text>
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

      <View style={styles.filterSection}>
        {WALLET_FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterPill,
              walletFilter === filter && styles.filterPillActive,
            ]}
            onPress={() => setWalletFilter(filter)}
          >
            <Text style={[
              styles.filterPillText,
              walletFilter === filter && styles.filterPillTextActive,
            ]}>
              {filter === 'Both' ? 'Both' : filter === 'Savings' ? 'Savings' : 'Expense'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={40} color={COLORS.subtext} />
            <Text style={styles.emptyText}>No transactions found</Text>
            <Text style={styles.emptySubtext}>
              {typeFilter !== 'All' || walletFilter !== 'Both'
                ? 'Try adjusting your filters'
                : 'Start by adding an expense or income'}
            </Text>
          </View>
        ) : (
          filtered.map((tx, index) => (
            <View key={tx.id || index} style={styles.txCard}>
              <View style={[
                styles.txIconContainer,
                { backgroundColor: getTxIconColor(tx.type) + '22' }
              ]}>
                <Ionicons
                  name={getTxIconName(tx.type)}
                  size={22}
                  color={getTxIconColor(tx.type)}
                />
              </View>
              <View style={styles.txMiddle}>
                <Text style={styles.txLabel}>{tx.label}</Text>
                <View style={styles.txMeta}>
                  <Text style={styles.txCategory}>{tx.category}</Text>
                  <Text style={styles.txDot}>·</Text>
                  <Text style={styles.txWallet}>
                    {tx.wallet === 'savings' ? 'Savings' : 'Expense'}
                  </Text>
                  <Text style={styles.txDot}>·</Text>
                  <Text style={styles.txDate}>{tx.date}</Text>
                </View>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.subtext,
    marginTop: 4,
  },
  filterSection: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 10,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterPillActive: {
    backgroundColor: COLORS.savings,
    borderColor: COLORS.savings,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.subtext,
  },
  filterPillTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 24,
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
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 10,
  },
  txIconContainer: {
    width: 42,
    height: 42,
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
    marginBottom: 4,
  },
  txMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  txCategory: {
    fontSize: 11,
    color: COLORS.subtext,
  },
  txDot: {
    fontSize: 11,
    color: COLORS.border,
  },
  txWallet: {
    fontSize: 11,
    color: COLORS.subtext,
  },
  txDate: {
    fontSize: 11,
    color: COLORS.subtext,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
});