import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';

import { COLORS, formatPeso } from '../constants';
import { getWallets, saveWallets, saveTransactions, saveGoals, setIsSetup } from '../storage/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants';

export default function SettingsScreen({ onReset }) {

  const [wallets, setWallets] = useState({ savings: 0, expense: 0 });

  useEffect(() => {
    const fetchWallets = async () => {
      const w = await getWallets();
      setWallets(w);
    };
    fetchWallets();
  }, []);

  const handleReset = () => {
    Alert.alert(
      'Reset App',
      'This will clear all wallets, transactions, and goals. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.multiRemove([
              STORAGE_KEYS.wallets,
              STORAGE_KEYS.transactions,
              STORAGE_KEYS.goals,
              STORAGE_KEYS.isSetup,
            ]);
            onReset();
          },
        },
      ]
    );
  };

  const handleClearTransactions = () => {
    Alert.alert(
      'Clear History',
      'This will permanently delete all transaction history.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await saveTransactions([]);
            Alert.alert('Done', 'Transaction history cleared.');
          },
        },
      ]
    );
  };

  const handleClearGoals = () => {
    Alert.alert(
      'Clear Goals',
      'This will permanently delete all savings goals.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await saveGoals([]);
            Alert.alert('Done', 'Goals cleared.');
          },
        },
      ]
    );
  };

  const total = wallets.savings + wallets.expense;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Manage your SplitVault data</Text>
      </View>

      {/* Wallet Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Current Balance</Text>
        <Text style={styles.summaryTotal}>{formatPeso(total)}</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summarySub}>
            🐷 {formatPeso(wallets.savings)}
          </Text>
          <Text style={styles.summarySub}>
            💳 {formatPeso(wallets.expense)}
          </Text>
        </View>
      </View>

      {/* Data Management Section */}
      <Text style={styles.sectionLabel}>Data Management</Text>

      <View style={styles.card}>
        <TouchableOpacity style={styles.row} onPress={handleClearTransactions}>
          <View style={styles.rowLeft}>
            <Text style={styles.rowEmoji}>🗂️</Text>
            <View>
              <Text style={styles.rowTitle}>Clear Transaction History</Text>
              <Text style={styles.rowSub}>Removes all recorded transactions</Text>
            </View>
          </View>
          <Text style={styles.rowArrow}>›</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.row} onPress={handleClearGoals}>
          <View style={styles.rowLeft}>
            <Text style={styles.rowEmoji}>🎯</Text>
            <View>
              <Text style={styles.rowTitle}>Clear Savings Goals</Text>
              <Text style={styles.rowSub}>Removes all saved goals</Text>
            </View>
          </View>
          <Text style={styles.rowArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* App Info Section */}
      <Text style={styles.sectionLabel}>About</Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Text style={styles.rowEmoji}>💰</Text>
            <View>
              <Text style={styles.rowTitle}>SplitVault</Text>
              <Text style={styles.rowSub}>Version 1.0.0</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Text style={styles.rowEmoji}>🇵🇭</Text>
            <View>
              <Text style={styles.rowTitle}>Currency</Text>
              <Text style={styles.rowSub}>Philippine Peso (₱)</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Danger Zone */}
      <Text style={styles.sectionLabel}>Danger Zone</Text>

      <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
        <Text style={styles.resetEmoji}>⚠️</Text>
        <View>
          <Text style={styles.resetTitle}>Reset App</Text>
          <Text style={styles.resetSub}>Clears all data and returns to setup</Text>
        </View>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 24,
    paddingTop: 56,
    paddingBottom: 48,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.subtext,
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    alignItems: 'center',
    marginBottom: 28,
  },
  summaryTitle: {
    fontSize: 13,
    color: COLORS.subtext,
    marginBottom: 4,
  },
  summaryTotal: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 20,
  },
  summarySub: {
    fontSize: 13,
    color: COLORS.subtext,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.subtext,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 4,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 28,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  rowEmoji: {
    fontSize: 22,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  rowSub: {
    fontSize: 12,
    color: COLORS.subtext,
  },
  rowArrow: {
    fontSize: 20,
    color: COLORS.subtext,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 16,
  },
  resetBtn: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.danger,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resetEmoji: {
    fontSize: 24,
  },
  resetTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.danger,
    marginBottom: 2,
  },
  resetSub: {
    fontSize: 12,
    color: COLORS.subtext,
  },
});