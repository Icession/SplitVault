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

import { COLORS, formatPeso } from '../constants';
import { getWallets, getTransactions } from '../storage/storage';

export default function HomeScreen({ navigation }) {

  // ─── STATE ──────────────────────────────────────────
  const [wallets, setWallets] = useState({ savings: 0, expense: 0 });
  const [transactions, setTransactions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // ─── LOAD DATA ──────────────────────────────────────
  // useFocusEffect runs every time this screen comes into focus
  // This means data refreshes when user navigates back to Home
  // useCallback prevents unnecessary re-renders
  const loadData = useCallback(async () => {
    const w = await getWallets();
    const t = await getTransactions();
    setWallets(w);
    // Only show the 5 most recent transactions on home screen
    setTransactions(t.slice(0, 5));
  }, []);

  useFocusEffect(loadData);

  // ─── PULL TO REFRESH ────────────────────────────────
  // When user pulls down on the screen it reloads the data
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // ─── BALANCE WARNING ────────────────────────────────
  // Returns a warning level based on how low the expense wallet is
  // compared to the total balance
  const total = wallets.savings + wallets.expense;
  const expenseRatio = total > 0 ? wallets.expense / total : 1;

  const getWarningLevel = () => {
    if (expenseRatio <= 0.10) return 'danger';   // below 10%
    if (expenseRatio <= 0.25) return 'warning';  // below 25%
    return 'safe';
  };

  const warningLevel = getWarningLevel();

  // ─── UI ─────────────────────────────────────────────
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        // This enables the pull-to-refresh spinner
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.savings}
        />
      }
    >

      {/* ── HEADER ───────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.greeting}>SplitVault 💰</Text>
        <Text style={styles.subGreeting}>Your wallet overview</Text>
      </View>

      {/* ── LOW BALANCE WARNING BANNER ───────────────── */}
      {/* Only renders if wallet is low — conditional rendering */}
      {warningLevel !== 'safe' && (
        <View style={[
          styles.warningBanner,
          { backgroundColor: warningLevel === 'danger' ? COLORS.danger : COLORS.warning }
        ]}>
          <Text style={styles.warningText}>
            {warningLevel === 'danger'
              ? '🚨 Expense wallet is critically low (below 10%)'
              : '⚠️ Expense wallet is running low (below 25%)'}
          </Text>
        </View>
      )}

      {/* ── WALLET CARDS ─────────────────────────────── */}
      <View style={styles.walletRow}>

        {/* Savings Wallet Card */}
        <View style={[styles.walletCard, { borderColor: COLORS.savings }]}>
          <Text style={styles.walletEmoji}>🐷</Text>
          <Text style={styles.walletLabel}>Savings</Text>
          <Text style={[styles.walletAmount, { color: COLORS.savings }]}>
            {formatPeso(wallets.savings)}
          </Text>
        </View>

        {/* Expense Wallet Card */}
        <View style={[styles.walletCard, {
          borderColor: warningLevel === 'danger'
            ? COLORS.danger
            : warningLevel === 'warning'
            ? COLORS.warning
            : COLORS.expense
        }]}>
          <Text style={styles.walletEmoji}>💳</Text>
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

      {/* ── TOTAL BALANCE ────────────────────────────── */}
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Balance</Text>
        <Text style={styles.totalAmount}>{formatPeso(total)}</Text>
      </View>

      {/* ── BUDGET GAUGE ─────────────────────────────── */}
      {/* Shows a visual bar of how much of expense wallet remains */}
      <View style={styles.gaugeContainer}>
        <View style={styles.gaugeLabelRow}>
          <Text style={styles.gaugeLabel}>Expense Wallet Health</Text>
          <Text style={styles.gaugePercent}>
            {Math.round(expenseRatio * 100)}%
          </Text>
        </View>

        {/* The grey track */}
        <View style={styles.gaugeTrack}>
          {/* The colored fill — width is a percentage string */}
          <View style={[
            styles.gaugeFill,
            {
              width: `${Math.round(expenseRatio * 100)}%`,
              backgroundColor: warningLevel === 'danger'
                ? COLORS.danger
                : warningLevel === 'warning'
                ? COLORS.warning
                : COLORS.expense,
            }
          ]} />
        </View>
      </View>

      {/* ── QUICK ACTION BUTTONS ─────────────────────── */}
      {/* Shortcuts to other tabs directly from Home */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionBtn}
          // navigation.navigate goes to a tab by name
          onPress={() => navigation.navigate('AddExpense')}
        >
          <Text style={styles.actionEmoji}>➖</Text>
          <Text style={styles.actionLabel}>Expense</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('AddIncome')}
        >
          <Text style={styles.actionEmoji}>➕</Text>
          <Text style={styles.actionLabel}>Income</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('Transfer')}
        >
          <Text style={styles.actionEmoji}>🔁</Text>
          <Text style={styles.actionLabel}>Transfer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('Goals')}
        >
          <Text style={styles.actionEmoji}>🎯</Text>
          <Text style={styles.actionLabel}>Goals</Text>
        </TouchableOpacity>
      </View>

      {/* ── RECENT TRANSACTIONS ──────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => navigation.navigate('History')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {/* If no transactions yet, show empty state */}
        {transactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyText}>No transactions yet</Text>
          </View>
        ) : (
          // Map turns the array into a list of UI elements
          // Each item needs a unique key prop for React to track it
          transactions.map((tx, index) => (
            <View key={tx.id || index} style={styles.txRow}>
              <Text style={styles.txEmoji}>{tx.emoji || '💸'}</Text>
              <View style={styles.txInfo}>
                <Text style={styles.txLabel}>{tx.label}</Text>
                <Text style={styles.txDate}>{tx.date}</Text>
              </View>
              <Text style={[
                styles.txAmount,
                { color: tx.type === 'expense' ? COLORS.danger : COLORS.expense }
              ]}>
                {tx.type === 'expense' ? '-' : '+'}{formatPeso(tx.amount)}
              </Text>
            </View>
          ))
        )}
      </View>

    </ScrollView>
  );
}

// ─── STYLES ───────────────────────────────────────────
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
  },
  warningText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
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
  walletEmoji: {
    fontSize: 28,
    marginBottom: 6,
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
  gaugePercent: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  gaugeTrack: {
    height: 10,
    backgroundColor: COLORS.border,
    borderRadius: 999,
    overflow: 'hidden',     // clips the fill bar to rounded corners
  },
  gaugeFill: {
    height: '100%',
    borderRadius: 999,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  actionLabel: {
    fontSize: 11,
    color: COLORS.subtext,
    fontWeight: '600',
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
  },
  emptyEmoji: {
    fontSize: 36,
    marginBottom: 8,
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
  txEmoji: {
    fontSize: 22,
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