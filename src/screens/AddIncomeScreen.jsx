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

import { COLORS, formatPeso } from '../constants';
import { getWallets, saveWallets, addTransaction } from '../storage/storage';

export default function AddIncomeScreen({ navigation }) {

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
      type: 'income',
      wallet: 'savings',
      amount: parsedAmount,
      label: label.trim(),
      category: 'Income',
      emoji: '💵',
      date: new Date().toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    };

    await saveWallets(updatedWallets);
    await addTransaction(transaction);

    Alert.alert(
      'Income Added',
      `${formatPeso(parsedAmount)} added to your Savings wallet.`,
      [
        {
          text: 'OK',
          onPress: () => {
            setAmount('');
            setLabel('');
            navigation.navigate('Home');
          },
        },
      ]
    );
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
          <Text style={styles.title}>Add Income</Text>
          <Text style={styles.subtitle}>Funds are added to your Savings wallet</Text>
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
          placeholderTextColor={COLORS.subtext}
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Salary, Freelance, Allowance"
          placeholderTextColor={COLORS.subtext}
          value={label}
          onChangeText={setLabel}
        />

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 Transfer funds to your Expense wallet when you're ready to spend.
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            { opacity: amount && label ? 1 : 0.5 },
          ]}
          onPress={handleSubmit}
          disabled={!amount || !label}
        >
          <Text style={styles.buttonText}>Add Income ➕</Text>
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