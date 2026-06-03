import React, { useState, useEffect } from 'react';
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

import { COLORS, formatPeso } from '../constants';
import { getWallets, saveWallets, addTransaction } from '../storage/storage';
import { useToast } from '../components/ToastProvider';

export default function TransferScreen({ navigation }) {

  const showToast = useToast();

  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState('savingsToExpense');
  const [wallets, setWallets] = useState({ savings: 0, expense: 0 });

  useEffect(() => {
    const loadWallets = async () => {
      const w = await getWallets();
      setWallets(w);
    };
    loadWallets();
  }, []);

  const isExpenseToSavings = direction === 'expenseToSavings';
  const sourceWallet = isExpenseToSavings ? 'expense' : 'savings';
  const destinationWallet = isExpenseToSavings ? 'savings' : 'expense';
  const sourceBalance = wallets[sourceWallet];

  const handleTransfer = async () => {
    const parsedAmount = parseFloat(amount);

    if (!amount || parsedAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid transfer amount.');
      return;
    }
    if (parsedAmount > sourceBalance) {
      Alert.alert(
        'Insufficient Balance',
        `Your ${sourceWallet} wallet only has ${formatPeso(sourceBalance)}.`
      );
      return;
    }

    const updatedWallets = {
      ...wallets,
      [sourceWallet]: wallets[sourceWallet] - parsedAmount,
      [destinationWallet]: wallets[destinationWallet] + parsedAmount,
    };

    const transaction = {
      id: Date.now().toString(),
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
    navigation.navigate('Home');
    showToast(`${formatPeso(parsedAmount)} moved to ${destinationWallet}`, {
      icon: 'swap-horizontal',
      color: COLORS.savings,
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >

        <View style={styles.header}>
          <Text style={styles.title}>Transfer Funds</Text>
          <Text style={styles.subtitle}>Move money between your wallets</Text>
        </View>

        <View style={styles.walletsRow}>
          <View style={[styles.walletCard, { borderColor: COLORS.savings }]}>
            <Ionicons name="wallet" size={24} color={COLORS.savings} style={styles.walletIcon} />
            <Text style={styles.walletLabel}>Savings</Text>
            <Text style={[styles.walletAmount, { color: COLORS.savings }]}>
              {formatPeso(wallets.savings)}
            </Text>
          </View>

          <Ionicons name="swap-horizontal" size={24} color={COLORS.subtext} />

          <View style={[styles.walletCard, { borderColor: COLORS.expense }]}>
            <Ionicons name="card" size={24} color={COLORS.expense} style={styles.walletIcon} />
            <Text style={styles.walletLabel}>Expense</Text>
            <Text style={[styles.walletAmount, { color: COLORS.expense }]}>
              {formatPeso(wallets.expense)}
            </Text>
          </View>
        </View>

        <Text style={styles.label}>Transfer Direction</Text>
        <View style={styles.directionRow}>
          {[
            {
              key: 'savingsToExpense',
              from: 'Savings',
              to: 'Expense',
              fromIcon: 'wallet',
              toIcon: 'card',
              fromColor: COLORS.savings,
              toColor: COLORS.expense,
            },
            {
              key: 'expenseToSavings',
              from: 'Expense',
              to: 'Savings',
              fromIcon: 'card',
              toIcon: 'wallet',
              fromColor: COLORS.expense,
              toColor: COLORS.savings,
            },
          ].map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.directionBtn,
                direction === option.key && styles.directionBtnSelected,
              ]}
              onPress={() => setDirection(option.key)}
            >
              <View style={styles.directionInner}>
                <Ionicons name={option.fromIcon} size={18} color={option.fromColor} />
                <Ionicons name="arrow-forward" size={14} color={COLORS.subtext} />
                <Ionicons name={option.toIcon} size={18} color={option.toColor} />
              </View>
              <Text style={styles.directionSub}>{option.from} to {option.to}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sourceInfo}>
          <Text style={styles.sourceInfoText}>
            Available in {sourceWallet} wallet:{' '}
            <Text style={{ color: COLORS.text, fontWeight: '700' }}>
              {formatPeso(sourceBalance)}
            </Text>
          </Text>
        </View>

        <Text style={styles.label}>Amount (₱)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 1000"
          placeholderTextColor={COLORS.subtext}
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />

        {parseFloat(amount) > 0 && (
          <View style={styles.previewBox}>
            <Text style={styles.previewTitle}>After Transfer</Text>
            <View style={styles.previewRow}>
              <Text style={styles.previewItem}>
                Savings:{' '}
                <Text style={{ color: COLORS.savings, fontWeight: '700' }}>
                  {formatPeso(
                    isExpenseToSavings
                      ? wallets.savings + (parseFloat(amount) || 0)
                      : wallets.savings - (parseFloat(amount) || 0)
                  )}
                </Text>
              </Text>
              <Text style={styles.previewItem}>
                Expense:{' '}
                <Text style={{ color: COLORS.expense, fontWeight: '700' }}>
                  {formatPeso(
                    isExpenseToSavings
                      ? wallets.expense - (parseFloat(amount) || 0)
                      : wallets.expense + (parseFloat(amount) || 0)
                  )}
                </Text>
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, { opacity: amount ? 1 : 0.5 }]}
          onPress={handleTransfer}
          disabled={!amount}
        >
          <Text style={styles.buttonText}>Confirm Transfer</Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingBottom: 40,
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
    marginBottom: 4,
  },
  walletAmount: {
    fontSize: 15,
    fontWeight: '700',
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
  sourceInfo: {
    marginBottom: 20,
  },
  sourceInfoText: {
    fontSize: 13,
    color: COLORS.subtext,
  },
  input: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 20,
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