import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, formatPeso } from '../constants';
import { getWallets, getTransactions } from '../storage/storage';

export default function HomeScreen({ navigation }) {

  const [wallets, setWallets] = useState({ savings: 0, expense: 0 });
  const [transactions, setTransactions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        const w = await getWallets();
        const t = await getTransactions();
        setWallets(w);
        setTransactions(t.slice(0, 5));
      };
      fetchData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    const w = await getWallets();
    const t = await getTransactions();
    setWallets(w);
    setTransactions(t.slice(0, 5));
    setRefreshing(false);
  };

  const total = wallets.savings + wallets.expense;

  const getWarningLevel = () => {
    if (wallets.expense === 0) return 'danger';
    if (wallets.expense < 500) return 'warning';
    return 'safe';
  };

  const warningLevel = getWarningLevel();

  const getTxIconName = (type) => {
    if (type === 'expense') return 'remove-circle';
    if (type === 'income') return 'add-circle';
    return 'swap-horizontal';
  };

  const getTxIconColor = (type) => {
    if (type === 'expense') return COLORS.danger;
    if (type === 'income') return COLORS.income;
    return COLORS.transfer;
  };

  const getTxAmountColor = (type) => {
    if (type === 'expense') return COLORS.danger;
    if (type === 'income') return COLORS.income;
    return COLORS.transfer;
  };

  const getTxPrefix = (type) => {
    if (type === 'expense') return '-';
    if (type === 'income') return '+';
    return '';
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.savings}
        />
      }
    >

      <View style={styles.header}>
        <Text style={styles.greeting}>SplitVault</Text>
        <Text style={styles.subGreeting}>Your wallet overview</Text>
      </View>

      {warningLevel !== 'safe' && (
        <View style={[
          styles.warningBanner,
          { backgroundColor: warningLevel === 'danger' ? COLORS.danger : COLORS.warning }
        ]}>
          <Ionicons
            name={warningLevel === 'danger' ? 'alert-circle' : 'warning'}
            size={16}
            color="#fff"
            style={{ marginRight: 6 }}
          />
          <Text style={styles.warningText}>
            {warningLevel === 'danger'
              ? 'Expense wallet is empty — transfer funds to start spending'
              : 'Expense wallet is running low'}
          </Text>
        </View>
      )}

      <View style={styles.walletRow}>
        <View style={[styles.walletCard, { borderColor: COLORS.savings }]}>
          <Ionicons name="wallet" size={28} color={COLORS.savings} style={styles.walletIcon} />
          <Text style={styles.walletLabel}>Savings</Text>
          <Text style={[styles.walletAmount, { color: COLORS.savings }]}>
            {formatPeso(wallets.savings)}
          </Text>
        </View>

        <View style={[styles.walletCard, {
          borderColor: warningLevel === 'danger'
            ? COLORS.danger
            : warningLevel === 'warning'
            ? COLORS.warning
            : COLORS.expense
        }]}>
          <Ionicons
            name="card"
            size={28}
            color={
              warningLevel === 'danger'
                ? COLORS.danger
                : warningLevel === 'warning'
                ? COLORS.warning
                : COLORS.expense
            }
            style={styles.walletIcon}
          />
          <Text style={styles.walletLabel}>Expense</Text>
          <Text style={[styles.walletAmount, {
            color: warningLevel === 'danger'
              ? COLORS.danger
              : warningLevel === 'warning'
              ? COLORS.warning
              : COLORS.expense
          }]}>
            {formatPeso(wallets.expense)}
          </Text>
        </View>
      </View>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Balance</Text>
        <Text style={styles.totalAmount}>{formatPeso(total)}</Text>
      </View>

      <View style={styles.gaugeContainer}>
        <View style={styles.gaugeLabelRow}>
          <Text style={styles.gaugeLabel}>Savings</Text>
          <Text style={styles.gaugeLabel}>Expense</Text>
        </View>
        <View style={styles.gaugeTrack}>
          <View style={[
            styles.gaugeFill,
            {
              width: total > 0 ? `${Math.round((wallets.savings / total) * 100)}%` : '0%',
              backgroundColor: COLORS.savings,
            }
          ]} />
          <View style={[
            styles.gaugeFill,
            {
              width: total > 0 ? `${Math.round((wallets.expense / total) * 100)}%` : '0%',
              backgroundColor: COLORS.expense,
            }
          ]} />
        </View>
        <View style={styles.gaugeLabelRow}>
          <Text style={[styles.gaugePercent, { color: COLORS.savings }]}>
            {total > 0 ? Math.round((wallets.savings / total) * 100) : 0}%
          </Text>
          <Text style={[styles.gaugePercent, { color: COLORS.expense }]}>
            {total > 0 ? Math.round((wallets.expense / total) * 100) : 0}%
          </Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { borderColor: COLORS.danger }]}
          onPress={() => navigation.navigate('AddExpense')}
        >
          <Ionicons name="remove-circle" size={24} color={COLORS.danger} />
          <Text style={[styles.actionLabel, { color: COLORS.danger }]}>Expense</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { borderColor: COLORS.income }]}
          onPress={() => navigation.navigate('AddIncome')}
        >
          <Ionicons name="add-circle" size={24} color={COLORS.income} />
          <Text style={[styles.actionLabel, { color: COLORS.income }]}>Income</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => navigation.navigate('History')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {transactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={40} color={COLORS.subtext} />
            <Text style={styles.emptyText}>No transactions yet</Text>
          </View>
        ) : (
          transactions.map((tx, index) => (
            <View key={tx.id || index} style={styles.txRow}>
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
              <View style={styles.txInfo}>
                <Text style={styles.txLabel}>{tx.label}</Text>
                <Text style={styles.txDate}>{tx.date}</Text>
              </View>
              <Text style={[styles.txAmount, { color: getTxAmountColor(tx.type) }]}>
                {getTxPrefix(tx.type)}{formatPeso(tx.amount)}
              </Text>
            </View>
          ))
        )}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
    paddingTop: 56,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  subGreeting: {
    fontSize: 14,
    color: COLORS.subtext,
    marginTop: 2,
  },
  warningBanner: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  walletRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  walletCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    alignItems: 'center',
  },
  walletIcon: {
    marginBottom: 8,
  },
  walletLabel: {
    fontSize: 13,
    color: COLORS.subtext,
    marginBottom: 4,
  },
  walletAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  totalCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  totalLabel: {
    fontSize: 13,
    color: COLORS.subtext,
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  gaugeContainer: {
    marginBottom: 20,
  },
  gaugeLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  gaugeLabel: {
    fontSize: 13,
    color: COLORS.subtext,
  },
  gaugeTrack: {
    height: 10,
    backgroundColor: COLORS.border,
    borderRadius: 999,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  gaugeFill: {
    height: '100%',
  },
  gaugePercent: {
    fontSize: 13,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    gap: 6,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  seeAll: {
    fontSize: 13,
    color: COLORS.savings,
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
    width: 42,
    height: 42,
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
  txDate: {
    fontSize: 12,
    color: COLORS.subtext,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
});