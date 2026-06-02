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
import FadeInView from '../components/FadeInView';
import PressableScale from '../components/PressableScale';

export default function AddIncomeScreen({ navigation, onClose }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [amount, setAmount] = useState('');
  const [label, setLabel] = useState('');
  const [wallets, setWallets] = useState({ savings: 0, expense: 0 });

  useEffect(() => {
    const loadWallets = async () => {
      const w = await getWallets();
      setWallets(w);
    };
    loadWallets();
  }, []);

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
      savings: wallets.savings + parsedAmount,
    };

    const transaction = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      type: 'income',
      wallet: 'savings',
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
    Alert.alert(
      'Income Added',
      `${formatPeso(parsedAmount)} added to your Savings wallet.`
    );
    handleClose();
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
            <Text style={styles.subtitle}>Funds are added to your Savings wallet</Text>
          </View>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Savings Wallet</Text>
          <Text style={styles.balanceAmount}>{formatPeso(wallets.savings)}</Text>
          <Text style={styles.balanceHint}>
            After adding: {formatPeso(wallets.savings + (parseFloat(amount) || 0))}
          </Text>
        </View>

        <Text style={styles.label}>Amount (₱)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 5000"
          placeholderTextColor={colors.subtext}
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Salary, Freelance, Allowance"
          placeholderTextColor={colors.subtext}
          value={label}
          onChangeText={setLabel}
        />

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Transfer funds to your Expense wallet when you're ready to spend.
          </Text>
        </View>

        <PressableScale
          style={[
            styles.button,
            { opacity: amount && label ? 1 : 0.5 },
          ]}
          onPress={handleSubmit}
          disabled={!amount || !label}
        >
          <Text style={styles.buttonText}>Add Income</Text>
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
  balanceCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.savings,
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
    color: COLORS.savings,
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
  infoBox: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 28,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.subtext,
    lineHeight: 18,
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