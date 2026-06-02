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

import { formatPeso, sanitizeAmount } from '../constants';
import { getWallets, saveWallets, addTransaction } from '../storage/storage';
import { useTheme } from '../theme/ThemeContext';
import FadeInView from '../components/FadeInView';
import PressableScale from '../components/PressableScale';
import { useToast } from '../components/ToastProvider';

const WALLET_OPTIONS = [
  { key: 'savings', label: 'Savings', icon: 'wallet' },
  { key: 'expense', label: 'Expense', icon: 'card' },
];

export default function AddIncomeScreen({ navigation, onClose }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const showToast = useToast();

  const [amount, setAmount] = useState('');
  const [label, setLabel] = useState('');
  const [destination, setDestination] = useState('savings'); // 'savings' | 'expense'
  const [wallets, setWallets] = useState({ savings: 0, expense: 0 });

  useEffect(() => {
    const loadWallets = async () => {
      const w = await getWallets();
      setWallets(w);
    };
    loadWallets();
  }, []);

  const accent = destination === 'savings' ? colors.savings : colors.expense;
  const destLabel = destination === 'savings' ? 'Savings' : 'Expense';
  const currentBalance = wallets[destination] || 0;

  const handleClose = () => {
    if (onClose) onClose();
    else navigation.navigate('Home');
  };

  const handleSubmit = async () => {
    const parsedAmount = parseFloat(amount);

    if (!amount || parsedAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid income amount.');
      return;
    }
    if (!label.trim()) {
      Alert.alert('No Label', 'Please enter a short description.');
      return;
    }

    const updatedWallets = {
      ...wallets,
      [destination]: (wallets[destination] || 0) + parsedAmount,
    };

    const transaction = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      type: 'income',
      wallet: destination,
      amount: parsedAmount,
      label: label.trim(),
      category: 'Income',
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
    handleClose();
    showToast(`${formatPeso(parsedAmount)} added to ${destLabel}`, {
      color: accent,
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
        <FadeInView>

          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={handleClose}>
              <Ionicons name="arrow-back" size={22} color={colors.text} />
            </TouchableOpacity>
            <View>
              <Text style={styles.title}>Add Income</Text>
              <Text style={styles.subtitle}>Choose which wallet receives it</Text>
            </View>
          </View>

          {/* Destination wallet picker */}
          <Text style={styles.label}>Add to</Text>
          <View style={styles.walletRow}>
            {WALLET_OPTIONS.map((opt) => {
              const active = destination === opt.key;
              const optColor = opt.key === 'savings' ? colors.savings : colors.expense;
              return (
                <PressableScale
                  key={opt.key}
                  style={[
                    styles.walletCard,
                    active && { borderColor: optColor, backgroundColor: optColor + '14' },
                  ]}
                  onPress={() => setDestination(opt.key)}
                >
                  <Ionicons
                    name={opt.icon}
                    size={20}
                    color={active ? optColor : colors.subtext}
                  />
                  <Text style={[styles.walletLabel, active && { color: optColor }]}>
                    {opt.label}
                  </Text>
                  {active && (
                    <Ionicons name="checkmark-circle" size={16} color={optColor} />
                  )}
                </PressableScale>
              );
            })}
          </View>

          <View style={[styles.balanceCard, { borderColor: accent }]}>
            <Text style={styles.balanceLabel}>{destLabel} Wallet</Text>
            <Text style={[styles.balanceAmount, { color: accent }]}>
              {formatPeso(currentBalance)}
            </Text>
            <Text style={styles.balanceHint}>
              After adding: {formatPeso(currentBalance + (parseFloat(amount) || 0))}
            </Text>
          </View>

          <Text style={styles.label}>Amount (₱)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 5000"
            placeholderTextColor={colors.subtext}
            keyboardType="numeric"
            value={amount}
            onChangeText={(t) => setAmount(sanitizeAmount(t))}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Salary, Freelance, Allowance"
            placeholderTextColor={colors.subtext}
            value={label}
            onChangeText={setLabel}
          />

          <PressableScale
            style={[
              styles.button,
              { backgroundColor: accent, opacity: amount && label ? 1 : 0.5 },
            ]}
            onPress={handleSubmit}
            disabled={!amount || !label}
          >
            <Text style={styles.buttonText}>Add to {destLabel}</Text>
          </PressableScale>

        </FadeInView>
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
  walletRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  walletCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingVertical: 16,
  },
  walletLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.subtext,
  },
  balanceCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 20,
    alignItems: 'center',
    marginBottom: 28,
  },
  balanceLabel: {
    fontSize: 13,
    color: COLORS.subtext,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 6,
  },
  balanceHint: {
    fontSize: 13,
    color: COLORS.subtext,
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
  button: {
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});