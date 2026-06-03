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

import { CATEGORIES, formatPeso } from '../constants';
import { getWallets, saveWallets, addTransaction } from '../storage/storage';
import { useToast } from '../components/ToastProvider';
import { useTheme } from '../theme/ThemeContext';

export default function AddExpenseScreen({ navigation, onClose }) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  const [amount, setAmount] = useState('');
  const [label, setLabel] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedWallet, setSelectedWallet] = useState('expense');
  const [wallets, setWallets] = useState({ savings: 0, expense: 0 });

  useEffect(() => {
    const loadWallets = async () => {
      const w = await getWallets();
      setWallets(w);
    };
    loadWallets();
  }, []);

  const showToast = useToast();

  const handleClose = () => {
    if (onClose) onClose();
    else navigation.navigate('Home');
  };

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

    const updatedWallets = {
      ...wallets,
      [selectedWallet]: wallets[selectedWallet] - parsedAmount,
    };

    const transaction = {
      id: Date.now().toString(),
      type: 'expense',
      wallet: selectedWallet,
      amount: parsedAmount,
      label: label.trim(),
      category: selectedCategory.label,
      date: new Date().toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    };

    await saveWallets(updatedWallets);
    await addTransaction(transaction);

    setAmount('');
    setLabel('');
    setSelectedCategory(null);
    setSelectedWallet('expense');
    handleClose();
    showToast(`${formatPeso(parsedAmount)} spent from ${selectedWallet}`, {
      icon: 'remove-circle',
      color: COLORS.expense,
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
          <TouchableOpacity style={styles.backBtn} onPress={handleClose}>
            <Ionicons name="arrow-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Add Expense</Text>
            <Text style={styles.subtitle}>Deduct from your wallet</Text>
          </View>
        </View>

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
              <Ionicons
                name={wallet === 'savings' ? 'wallet' : 'card'}
                size={22}
                color={wallet === 'savings' ? COLORS.savings : COLORS.expense}
              />
              <Text style={styles.walletBtnLabel}>
                {wallet.charAt(0).toUpperCase() + wallet.slice(1)}
              </Text>
              <Text style={[
                styles.walletBtnBalance,
                { color: wallet === 'savings' ? COLORS.savings : COLORS.expense },
              ]}>
                {formatPeso(wallets[wallet])}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Amount (₱)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 250"
          placeholderTextColor={COLORS.subtext}
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Lunch at Jollibee"
          placeholderTextColor={COLORS.subtext}
          value={label}
          onChangeText={setLabel}
        />

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
              <Text style={[
                styles.categoryLabel,
                selectedCategory?.label === cat.label && { color: COLORS.danger },
              ]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            { opacity: amount && selectedCategory && label ? 1 : 0.5 },
          ]}
          onPress={handleSubmit}
          disabled={!amount || !selectedCategory || !label}
        >
          <Text style={styles.buttonText}>Record Expense</Text>
        </TouchableOpacity>

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 28,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.subtext,
    marginTop: 2,
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
    gap: 6,
  },
  walletBtnLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryBtnSelected: {
    borderColor: COLORS.danger,
    backgroundColor: COLORS.danger + '22',
  },
  categoryLabel: {
    fontSize: 13,
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