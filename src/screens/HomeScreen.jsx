import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Animated,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { formatPeso } from '../constants';
import { getWallets, getTransactions, getProfile } from '../storage/storage';
import { useTheme } from '../theme/ThemeContext';
import AddExpenseScreen from './AddExpenseScreen';
import AddIncomeScreen from './AddIncomeScreen';
import FadeInView from '../components/FadeInView';
import PressableScale from '../components/PressableScale';

export default function HomeScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [wallets, setWallets] = useState({ savings: 0, expense: 0 });
  const [transactions, setTransactions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showExpense, setShowExpense] = useState(false);
  const [showIncome, setShowIncome] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [profileName, setProfileName] = useState('');

  const fetchData = useCallback(async () => {
    const w = await getWallets();
    const t = await getTransactions();
    const p = await getProfile();
    setWallets(w);
    setTransactions(t);
    const first =
      p.username ||
      p.firstName ||
      (p.fullName ? p.fullName.trim().split(' ')[0] : '') ||
      (p.email ? p.email.split('@')[0] : '');
    setProfileName(first);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const total = wallets.savings + wallets.expense;

  const [displayTotal, setDisplayTotal] = useState(0);
  const totalAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const id = totalAnim.addListener(({ value }) => setDisplayTotal(value));
    Animated.timing(totalAnim, {
      toValue: total,
      duration: 700,
      useNativeDriver: false,
    }).start();
    return () => totalAnim.removeListener(id);
  }, [total]);

  const totalIncome = transactions
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalExpense = transactions
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const recent = transactions.slice(0, 5);

  const hour = new Date().getHours();
  const timeGreeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const greeting = profileName ? `${timeGreeting}, ${profileName}` : timeGreeting;

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
        <View style={styles.inner}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.brandRow}>
                <Ionicons name="lock-closed" size={18} color={colors.primary} />
                <Text style={styles.headerTitle}>SplitVault</Text>
              </View>
              <Text style={styles.greeting}>{greeting}</Text>
            </View>
          </View>

          {/* Total Balance */}
          <FadeInView delay={60}>
          <View style={styles.balanceCard}>
            <View style={styles.balanceCardInner}>
              <Ionicons name="card-outline" size={18} color="#fff" style={{ marginBottom: 8 }} />
              <Text style={styles.balanceTitleText}>Total Balance</Text>
              <Text style={styles.balanceAmount}>{formatPeso(displayTotal)}</Text>
            </View>
          </View>
          </FadeInView>

          {/* Accounts (Savings / Expense) */}
          <FadeInView delay={120}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>ACCOUNTS</Text>
            </View>

            <PressableScale
              style={[styles.accountCard, { backgroundColor: colors.savingsCardBg }]}
              onPress={() => navigation.navigate('History')}
            >
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
            </PressableScale>

            <PressableScale
              style={[styles.accountCard, { backgroundColor: colors.expenseCardBg }]}
              onPress={() => navigation.navigate('History')}
            >
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
            </PressableScale>
          </View>
          </FadeInView>

          {/* Breakdown */}
          <FadeInView delay={180}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>BREAKDOWN BY WALLET</Text>
            </View>
            <View style={styles.breakdownCard}>
              <View style={styles.breakdownRow}>
                <View style={styles.breakdownItem}>
                  <View style={[styles.breakdownDot, { backgroundColor: colors.income }]} />
                  <View>
                    <Text style={styles.breakdownLabel}>
                      Savings · {total > 0 ? Math.round((wallets.savings / total) * 100) : 0}%
                    </Text>
                    <Text style={styles.breakdownAmount}>{formatPeso(wallets.savings)}</Text>
                  </View>
                </View>
                <View style={styles.breakdownItem}>
                  <View style={[styles.breakdownDot, { backgroundColor: colors.danger }]} />
                  <View>
                    <Text style={styles.breakdownLabel}>
                      Expense · {total > 0 ? Math.round((wallets.expense / total) * 100) : 0}%
                    </Text>
                    <Text style={styles.breakdownAmount}>{formatPeso(wallets.expense)}</Text>
                  </View>
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
          </FadeInView>

          {/* Income / Expense overview */}
          <FadeInView delay={240}>
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
          </FadeInView>

          {/* Recent Transactions */}
          <FadeInView delay={300}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>RECENT TRANSACTIONS</Text>
              <TouchableOpacity onPress={() => navigation.navigate('History')}>
                <Text style={styles.viewAll}>View all →</Text>
              </TouchableOpacity>
            </View>

            {recent.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="receipt-outline" size={36} color={colors.subtext} />
                <Text style={styles.emptyText}>No transactions yet</Text>
              </View>
            ) : (
              recent.map((tx, index) => (
                <PressableScale
                  key={tx.id || index}
                  style={styles.txRow}
                  onPress={() => navigation.navigate('History')}
                >
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
                </PressableScale>
              ))
            )}
          </View>
          </FadeInView>

          <View style={{ height: 140 }} />
        </View>
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
            <FadeInView delay={0} duration={180} offset={8} style={{ alignSelf: 'flex-end' }}>
              <PressableScale
                style={[styles.fabAction, { backgroundColor: colors.income }]}
                onPress={() => { setShowActions(false); setShowIncome(true); }}
              >
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={styles.fabActionText}>Income</Text>
              </PressableScale>
            </FadeInView>
            <FadeInView delay={60} duration={180} offset={8} style={{ alignSelf: 'flex-end' }}>
              <PressableScale
                style={[styles.fabAction, { backgroundColor: colors.danger }]}
                onPress={() => { setShowActions(false); setShowExpense(true); }}
              >
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={styles.fabActionText}>Expense</Text>
              </PressableScale>
            </FadeInView>
          </>
        )}
        <PressableScale
          style={styles.fab}
          onPress={() => setShowActions(!showActions)}
        >
          <Ionicons name={showActions ? 'close' : 'add'} size={26} color="#fff" />
        </PressableScale>
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
  inner: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    alignItems: 'flex-start',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  greeting: {
    fontSize: 13,
    color: COLORS.subtext,
    marginTop: 2,
  },
  balanceCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
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
    gap: 8,
  },
  breakdownDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  breakdownLabel: {
    fontSize: 12,
    color: COLORS.subtext,
  },
  breakdownAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 2,
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
    bottom: 56,
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