import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { formatPeso } from '../constants';
import { getWallets, getTransactions } from '../storage/storage';
import { useTheme } from '../theme/ThemeContext';
import AddExpenseScreen from './AddExpenseScreen';
import AddIncomeScreen from './AddIncomeScreen';

export default function HomeScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [wallets, setWallets] = useState({ savings: 0, expense: 0 });
  const [transactions, setTransactions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showExpense, setShowExpense] = useState(false);
  const [showIncome, setShowIncome] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const fetchData = useCallback(async () => {
    const w = await getWallets();
    const t = await getTransactions();
    setWallets(w);
    setTransactions(t.slice(0, 5));
  }, []);

  useFocusEffect(fetchData);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const total = wallets.savings + wallets.expense;

  const totalIncome = transactions
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalExpense = transactions
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

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

  const getTxAmountColor = (type) => {
    if (type === 'expense') return colors.danger;
    if (type === 'income') return colors.income;
    return colors.transfer;
  };

  const getTxPrefix = (type) => {
    if (type === 'expense') return '-';
    if (type === 'income') return '+';
    return '';
  };

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="lock-closed" size={18} color={colors.primary} />
            <Text style={styles.headerTitle}>SplitVault</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <Ionicons name="settings-outline" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.balanceCard}>
          <View style={styles.balanceCardInner}>
            <Ionicons name="card-outline" size={18} color="#fff" style={{ marginBottom: 8 }} />
            <Text style={styles.balanceTitleText}>Total Balance</Text>
            <Text style={styles.balanceAmount}>{formatPeso(total)}</Text>
            <View style={styles.walletsPill}>
              <Ionicons name="stats-chart" size={12} color="#fff" />
              <Text style={styles.walletsPillText}>2 wallets</Text>
            </View>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIconBox, { backgroundColor: colors.income + '15' }]}>
              <Ionicons name="trending-up" size={18} color={colors.income} />
            </View>
            <Text style={styles.summaryLabel}>Total Income</Text>
            <Text style={[styles.summaryAmount, { color: colors.income }]}>
              {formatPeso(totalIncome)}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIconBox, { backgroundColor: colors.danger + '15' }]}>
              <Ionicons name="trending-down" size={18} color={colors.danger} />
            </View>
            <Text style={styles.summaryLabel}>Total Expenses</Text>
            <Text style={[styles.summaryAmount, { color: colors.danger }]}>
              {formatPeso(totalExpense)}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>RECENT TRANSACTIONS</Text>
            <TouchableOpacity onPress={() => navigation.navigate('History')}>
              <Text style={styles.viewAll}>View all →</Text>
            </TouchableOpacity>
          </View>

          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={36} color={colors.subtext} />
              <Text style={styles.emptyText}>No transactions yet</Text>
            </View>
          ) : (
            transactions.map((tx, index) => (
              <View key={tx.id || index} style={styles.txRow}>
                <View style={[
                  styles.txIconContainer,
                  { backgroundColor: getTxIconColor(tx.type) + '15' }
                ]}>
                  <Ionicons name={getTxIconName(tx.type)} size={20} color={getTxIconColor(tx.type)} />
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txLabel}>{tx.label}</Text>
                  <Text style={styles.txMeta}>{tx.category} · {tx.date}</Text>
                </View>
                <Text style={[styles.txAmount, { color: getTxAmountColor(tx.type) }]}>
                  {getTxPrefix(tx.type)}{formatPeso(tx.amount)}
                </Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>ACCOUNTS</Text>
          </View>

          <View style={[styles.accountCard, { backgroundColor: colors.savingsCardBg }]}>
            <View style={[styles.accountIconBox, { backgroundColor: colors.income + '25' }]}>
              <Ionicons name="wallet" size={20} color={colors.income} />
            </View>
            <View style={styles.accountInfo}>
              <Text style={styles.accountType}>Savings</Text>
              <Text style={styles.accountName}>Savings Wallet</Text>
            </View>
            <Text style={[styles.accountAmount, { color: colors.income }]}>
              {formatPeso(wallets.savings)}
            </Text>
          </View>

          <View style={[styles.accountCard, { backgroundColor: colors.expenseCardBg }]}>
            <View style={[styles.accountIconBox, { backgroundColor: colors.danger + '25' }]}>
              <Ionicons name="card" size={20} color={colors.danger} />
            </View>
            <View style={styles.accountInfo}>
              <Text style={styles.accountType}>Expense</Text>
              <Text style={styles.accountName}>Expense Wallet</Text>
            </View>
            <Text style={[styles.accountAmount, { color: colors.danger }]}>
              {formatPeso(wallets.expense)}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>BREAKDOWN BY WALLET</Text>
          </View>
          <View style={styles.breakdownCard}>
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownItem}>
                <View style={[styles.breakdownDot, { backgroundColor: colors.income }]} />
                <Text style={styles.breakdownLabel}>Savings</Text>
                <Text style={styles.breakdownPercent}>
                  {total > 0 ? Math.round((wallets.savings / total) * 100) : 0}%
                </Text>
              </View>
              <View style={styles.breakdownItem}>
                <View style={[styles.breakdownDot, { backgroundColor: colors.danger }]} />
                <Text style={styles.breakdownLabel}>Expense</Text>
                <Text style={styles.breakdownPercent}>
                  {total > 0 ? Math.round((wallets.expense / total) * 100) : 0}%
                </Text>
              </View>
            </View>
            <View style={styles.gaugeTrack}>
              <View style={[
                styles.gaugeFill,
                {
                  width: total > 0 ? `${Math.round((wallets.savings / total) * 100)}%` : '0%',
                  backgroundColor: colors.income,
                }
              ]} />
              <View style={[
                styles.gaugeFill,
                {
                  width: total > 0 ? `${Math.round((wallets.expense / total) * 100)}%` : '0%',
                  backgroundColor: colors.danger,
                }
              ]} />
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {showActions && (
        <TouchableOpacity
          style={styles.overlay}
          onPress={() => setShowActions(false)}
          activeOpacity={1}
        />
      )}
      <View style={styles.fabContainer}>
        {showActions && (
          <>
            <TouchableOpacity
              style={[styles.fabAction, { backgroundColor: colors.income }]}
              onPress={() => { setShowActions(false); setShowIncome(true); }}
            >
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={styles.fabActionText}>Income</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.fabAction, { backgroundColor: colors.danger }]}
              onPress={() => { setShowActions(false); setShowExpense(true); }}
            >
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={styles.fabActionText}>Expense</Text>
            </TouchableOpacity>
          </>
        )}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowActions(!showActions)}
        >
          <Ionicons name={showActions ? 'close' : 'add'} size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      <Modal visible={showExpense} animationType="slide" onRequestClose={() => setShowExpense(false)}>
        <AddExpenseScreen
          navigation={{ navigate: () => { setShowExpense(false); fetchData(); } }}
          onClose={() => { setShowExpense(false); fetchData(); }}
        />
      </Modal>

      <Modal visible={showIncome} animationType="slide" onRequestClose={() => setShowIncome(false)}>
        <AddIncomeScreen
          navigation={{ navigate: () => { setShowIncome(false); fetchData(); } }}
          onClose={() => { setShowIncome(false); fetchData(); }}
        />
      </Modal>
    </>
  );
}

const createStyles = (COLORS) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  balanceCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: COLORS.primary,
  },
  balanceCardInner: {
    padding: 24,
    alignItems: 'flex-start',
  },
  balanceTitleText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  walletsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  walletsPillText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.subtext,
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.subtext,
    letterSpacing: 0.5,
  },
  viewAll: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.subtext,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  txIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txInfo: {
    flex: 1,
  },
  txLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  txMeta: {
    fontSize: 12,
    color: COLORS.subtext,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  accountIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  accountInfo: {
    flex: 1,
  },
  accountType: {
    fontSize: 12,
    color: COLORS.subtext,
  },
  accountName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  accountAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  breakdownCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  breakdownDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  breakdownLabel: {
    fontSize: 13,
    color: COLORS.subtext,
  },
  breakdownPercent: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  gaugeTrack: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 999,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  gaugeFill: {
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    alignItems: 'flex-end',
    gap: 10,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  fabAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  fabActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});