import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { formatPeso } from '../constants';
import { getWallets, saveWallets, addTransaction } from '../storage/storage';
import { useTheme } from '../theme/ThemeContext';

export default function TransferScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState('savingsToExpense');
  const [wallets, setWallets] = useState({ savings: 0, expense: 0 });

  useEffect(() => {
    const loadWallets = async () => {
      const w = await getWallets();
      setWallets(w);
      // Start on a direction that actually has funds to move.
      if (w.savings <= 0 && w.expense > 0) setDirection('expenseToSavings');
    };
    loadWallets();
  }, []);

  const isExpenseToSavings = direction === 'expenseToSavings';
  const sourceWallet = isExpenseToSavings ? 'expense' : 'savings';
  const destinationWallet = isExpenseToSavings ? 'savings' : 'expense';
  const sourceBalance = wallets[sourceWallet];

  const savingsEmpty = wallets.savings <= 0;
  const expenseEmpty = wallets.expense <= 0;

  const amountNum = parseFloat(amount) || 0;
  let amountError = '';
  if (amount.length > 0) {
    if (amountNum <= 0) amountError = 'Enter a valid amount';
    else if (amountNum > sourceBalance) {
      amountError = `Exceeds available balance (${formatPeso(sourceBalance)})`;
    }
  }
  const isValid = amountNum > 0 && amountNum <= sourceBalance;

  const savingsRole = isExpenseToSavings ? 'To' : 'From';
  const expenseRole = isExpenseToSavings ? 'From' : 'To';

  const fillMax = () => {
    if (sourceBalance > 0) setAmount(String(sourceBalance));
  };

  const toggleDirection = () => {
    const next = isExpenseToSavings ? 'savingsToExpense' : 'expenseToSavings';
    const nextSourceEmpty = next === 'savingsToExpense' ? savingsEmpty : expenseEmpty;
    if (nextSourceEmpty) return;
    setDirection(next);
  };

  const handleTransfer = async () => {
    if (!isValid) return;
    const parsedAmount = amountNum;

    const updatedWallets = {
      ...wallets,
      [sourceWallet]: wallets[sourceWallet] - parsedAmount,
      [destinationWallet]: wallets[destinationWallet] + parsedAmount,
    };

    const transaction = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      type: 'transfer',
      wallet: sourceWallet,
      amount: parsedAmount,
      label: `Transfer to ${destinationWallet.charAt(0).toUpperCase() + destinationWallet.slice(1)}`,
      category: 'Transfer',
      date: new Date().toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    };

    await saveWallets(updatedWallets);
    await addTransaction(transaction);

    setAmount('');
    Alert.alert(
      'Transfer Complete',
      `${formatPeso(parsedAmount)} moved from ${sourceWallet} to ${destinationWallet} wallet.`
    );
    navigation.navigate('Home');
  };

  const directionOptions = [
    {
      key: 'savingsToExpense',
      from: 'Savings',
      to: 'Expense',
      fromIcon: 'wallet',
      toIcon: 'card',
      fromColor: colors.savings,
      toColor: colors.expense,
    },
    {
      key: 'expenseToSavings',
      from: 'Expense',
      to: 'Savings',
      fromIcon: 'card',
      toIcon: 'wallet',
      fromColor: colors.expense,
      toColor: colors.savings,
    },
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.inner}>
          <View style={styles.header}>
            <Text style={styles.title}>Transfer Funds</Text>
            <Text style={styles.subtitle}>Move money between your wallets</Text>
          </View>

          <View style={styles.walletsRow}>
            <View style={[styles.walletCard, { borderColor: colors.savings }]}>
              <Ionicons name="wallet" size={24} color={colors.savings} style={styles.walletIcon} />
              <Text style={styles.walletLabel}>Savings</Text>
              <Text style={styles.roleTag}>{savingsRole}</Text>
              <Text style={[styles.walletAmount, { color: colors.savings }]}>
                {formatPeso(wallets.savings)}
              </Text>
            </View>

            <TouchableOpacity style={styles.swapBtn} onPress={toggleDirection} activeOpacity={0.6}>
              <Ionicons name="swap-horizontal" size={24} color={colors.subtext} />
            </TouchableOpacity>

            <View style={[styles.walletCard, { borderColor: colors.expense }]}>
              <Ionicons name="card" size={24} color={colors.expense} style={styles.walletIcon} />
              <Text style={styles.walletLabel}>Expense</Text>
              <Text style={styles.roleTag}>{expenseRole}</Text>
              <Text style={[styles.walletAmount, { color: colors.expense }]}>
                {formatPeso(wallets.expense)}
              </Text>
            </View>
          </View>

          <Text style={styles.label}>Transfer Direction</Text>
          <View style={styles.directionRow}>
            {directionOptions.map((option) => {
              const optDisabled = option.key === 'savingsToExpense' ? savingsEmpty : expenseEmpty;
              const selected = direction === option.key;
              return (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.directionBtn,
                    selected && styles.directionBtnSelected,
                    optDisabled && styles.directionBtnDisabled,
                  ]}
                  onPress={() => setDirection(option.key)}
                  disabled={optDisabled}
                >
                  <View style={styles.directionInner}>
                    <Ionicons name={option.fromIcon} size={18} color={option.fromColor} />
                    <Ionicons name="arrow-forward" size={14} color={colors.subtext} />
                    <Ionicons name={option.toIcon} size={18} color={option.toColor} />
                  </View>
                  <Text style={styles.directionSub}>{option.from} to {option.to}</Text>
                  {optDisabled && <Text style={styles.directionNote}>No funds</Text>}
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={styles.sourceInfo}
            onPress={fillMax}
            disabled={sourceBalance <= 0}
            activeOpacity={0.6}
          >
            <Text style={styles.sourceInfoText}>
              Available in {sourceWallet} wallet:{' '}
              <Text style={{ color: colors.text, fontWeight: '700' }}>
                {formatPeso(sourceBalance)}
              </Text>
            </Text>
          </TouchableOpacity>

          <View style={styles.field}>
            <Text style={styles.label}>Amount (₱)</Text>
            <View style={[styles.amountWrap, amountError && styles.amountWrapError]}>
              <TextInput
                style={styles.amountInput}
                placeholder="e.g. 1000"
                placeholderTextColor={colors.subtext}
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
              <TouchableOpacity onPress={fillMax} disabled={sourceBalance <= 0}>
                <Text style={[styles.maxBtn, { opacity: sourceBalance > 0 ? 1 : 0.4 }]}>MAX</Text>
              </TouchableOpacity>
            </View>
            {amountError ? <Text style={styles.errorText}>{amountError}</Text> : null}
          </View>

          {isValid && (
            <View style={styles.previewBox}>
              <Text style={styles.previewTitle}>After Transfer</Text>
              <View style={styles.previewRow}>
                <Text style={styles.previewItem}>
                  Savings:{' '}
                  <Text style={{ color: colors.savings, fontWeight: '700' }}>
                    {formatPeso(
                      isExpenseToSavings
                        ? wallets.savings + amountNum
                        : wallets.savings - amountNum
                    )}
                  </Text>
                </Text>
                <Text style={styles.previewItem}>
                  Expense:{' '}
                  <Text style={{ color: colors.expense, fontWeight: '700' }}>
                    {formatPeso(
                      isExpenseToSavings
                        ? wallets.expense - amountNum
                        : wallets.expense + amountNum
                    )}
                  </Text>
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, { opacity: isValid ? 1 : 0.5 }]}
            onPress={handleTransfer}
            disabled={!isValid}
          >
            <Text style={styles.buttonText}>Confirm Transfer</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (COLORS) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 24,
    paddingTop: 56,
    paddingBottom: 40,
  },
  inner: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  header: {
    marginBottom: 28,
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
  walletsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
    gap: 8,
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
    marginBottom: 6,
  },
  walletLabel: {
    fontSize: 12,
    color: COLORS.subtext,
    marginBottom: 2,
  },
  roleTag: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: COLORS.subtext,
    marginBottom: 4,
  },
  walletAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  swapBtn: {
    padding: 6,
    borderRadius: 999,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  directionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  directionBtn: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: 14,
    alignItems: 'center',
    gap: 8,
  },
  directionBtnSelected: {
    borderColor: COLORS.savings,
    backgroundColor: COLORS.savings + '22',
  },
  directionBtnDisabled: {
    opacity: 0.4,
  },
  directionInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  directionSub: {
    fontSize: 11,
    color: COLORS.subtext,
    fontWeight: '600',
    textAlign: 'center',
  },
  directionNote: {
    fontSize: 10,
    color: COLORS.danger,
    fontWeight: '600',
  },
  sourceInfo: {
    marginBottom: 20,
  },
  sourceInfoText: {
    fontSize: 13,
    color: COLORS.subtext,
  },
  field: {
    marginBottom: 20,
  },
  amountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
  },
  amountWrapError: {
    borderColor: COLORS.danger,
  },
  amountInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },
  maxBtn: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: COLORS.primary,
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.danger,
    marginTop: 6,
  },
  previewBox: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 24,
  },
  previewTitle: {
    fontSize: 13,
    color: COLORS.subtext,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  previewItem: {
    fontSize: 13,
    color: COLORS.subtext,
  },
  button: {
    backgroundColor: COLORS.savings,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});