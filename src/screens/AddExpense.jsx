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

import { COLORS, CATEGORIES, formatPeso } from '../constants';
import { getWallets, saveWallets, addTransaction } from '../storage/storage';

export default function AddExpenseScreen({ navigation }) {

  // ─── STATE ────────────────────────────────────────────
  const [amount, setAmount] = useState('');
  const [label, setLabel] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedWallet, setSelectedWallet] = useState('expense');
  const [wallets, setWallets] = useState({ savings: 0, expense: 0 });

  // ─── LOAD CURRENT BALANCES ────────────────────────────
  useEffect(() => {
    const loadWallets = async () => {
      const w = await getWallets();
      setWallets(w);
    };
    loadWallets();
  }, []);

  // ─── HANDLE SUBMISSION ────────────────────────────────
  const handleSubmit = async () => {
    const parsedAmount = parseFloat(amount);

    if (!amount || parsedAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid expense amount.');
      return;
    }
    if (!selectedCategory) {
      Alert.alert('No Category', 'Please select a category.');
      return;
    }
    if (!label.trim()) {
      Alert.alert('No Label', 'Please enter a short description.');
      return;
    }
    if (wallets[selectedWallet] < parsedAmount) {
      Alert.alert(
        'Insufficient Balance',
        `Your ${selectedWallet} wallet only has ${formatPeso(wallets[selectedWallet])}.`
      );
      return;
    }

    // Deduct from the selected wallet
    const updatedWallets = {
      ...wallets,
      [selectedWallet]: wallets[selectedWallet] - parsedAmount,
    };

    // Build the transaction entry
    const transaction = {
      id: Date.now().toString(),
      type: 'expense',
      wallet: selectedWallet,
      amount: parsedAmount,
      label: label.trim(),
      category: selectedCategory.label,
      emoji: selectedCategory.emoji,
      date: new Date().toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    };

    await saveWallets(updatedWallets);
    await addTransaction(transaction);

    Alert.alert('Expense Recorded', `${formatPeso(parsedAmount)} deducted from ${selectedWallet} wallet.`, [
      {
        text: 'OK',
        onPress: () => {
          // Reset form and navigate back to Home
          setAmount('');
          setLabel('');
          setSelectedCategory(null);
          setSelectedWallet('expense');
          navigation.navigate('Home');
        },
      },
    ]);
  };

  // ─── UI ───────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── HEADER ──────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.title}>Add Expense</Text>
          <Text style={styles.subtitle}>Deduct from your wallet</Text>
        </View>

        {/* ── WALLET SELECTOR ─────────────────────────── */}
        <Text style={styles.label}>Deduct From</Text>
        <View style={styles.walletRow}>
          {['expense', 'savings'].map((wallet) => (
            <TouchableOpacity
              key={wallet}
              style={[
                styles.walletBtn,
                selectedWallet === wallet && {
                  borderColor: wallet === 'savings' ? COLORS.savings : COLORS.expense,
                  backgroundColor: wallet === 'savings'
                    ? COLORS.savings + '22'
                    : COLORS.expense + '22',
                },
              ]}
              onPress={() => setSelectedWallet(wallet)}
            >
              <Text style={styles.walletBtnEmoji}>
                {wallet === 'savings' ? '🐷' : '💳'}
              </Text>
              <Text style={styles.walletBtnLabel}>
                {wallet.charAt(0).toUpperCase() + wallet.slice(1)}
              </Text>
              <Text style={[
                styles.walletBtnBalance,
                {
                  color: wallet === 'savings' ? COLORS.savings : COLORS.expense,
                },
              ]}>
                {formatPeso(wallets[wallet])}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── AMOUNT INPUT ────────────────────────────── */}
        <Text style={styles.label}>Amount (₱)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 250"
          placeholderTextColor={COLORS.subtext}
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />

        {/* ── DESCRIPTION INPUT ───────────────────────── */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Lunch at Jollibee"
          placeholderTextColor={COLORS.subtext}
          value={label}
          onChangeText={setLabel}
        />

        {/* ── CATEGORY SELECTOR ───────────────────────── */}
        <Text style={styles.label}>Category</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.label}
              style={[
                styles.categoryBtn,
                selectedCategory?.label === cat.label && styles.categoryBtnSelected,
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
              <Text style={styles.categoryLabel}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── SUBMIT BUTTON ───────────────────────────── */}
        <TouchableOpacity
          style={[
            styles.button,
            { opacity: amount && selectedCategory && label ? 1 : 0.5 },
          ]}
          onPress={handleSubmit}
          disabled={!amount || !selectedCategory || !label}
        >
          <Text style={styles.buttonText}>Record Expense ➖</Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── STYLES ───────────────────────────────────────────
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
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
  walletRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  walletBtn: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: 14,
    alignItems: 'center',
  },
  walletBtnEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  walletBtnLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  walletBtnBalance: {
    fontSize: 12,
    fontWeight: '700',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 28,
  },
  categoryBtn: {
    width: '22%',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
    alignItems: 'center',
  },
  categoryBtnSelected: {
    borderColor: COLORS.savings,
    backgroundColor: COLORS.savings + '22',
  },
  categoryEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  categoryLabel: {
    fontSize: 10,
    color: COLORS.subtext,
    fontWeight: '600',
  },
  button: {
    backgroundColor: COLORS.danger,
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