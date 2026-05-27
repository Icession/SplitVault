import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

import { COLORS, formatPeso } from '../constants';
import { saveWallets, setIsSetup } from '../storage/storage';

export default function SetupScreen({ onComplete }) {

  const [totalAmount, setTotalAmount] = useState('');

  const parsedAmount = parseFloat(totalAmount) || 0;

  const handleSetup = async () => {
    if (!totalAmount || parsedAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid starting amount.');
      return;
    }

    await saveWallets({
      savings: parsedAmount,
      expense: 0,
    });

    await setIsSetup();
    onComplete();
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
          <Text style={styles.emoji}>💰</Text>
          <Text style={styles.title}>Welcome to SplitVault</Text>
          <Text style={styles.subtitle}>
            Enter your total funds to get started. Transfer to Expense when you're ready to spend.
          </Text>
        </View>

        <Text style={styles.label}>Total Amount (₱)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 10000"
          placeholderTextColor={COLORS.subtext}
          keyboardType="numeric"
          value={totalAmount}
          onChangeText={setTotalAmount}
        />

        {parsedAmount > 0 && (
          <View style={styles.previewContainer}>
            <Text style={styles.previewTitle}>Your Starting Wallets</Text>
            <View style={styles.previewRow}>
              <View style={[styles.previewCard, { borderColor: COLORS.savings }]}>
                <Text style={styles.previewEmoji}>🐷</Text>
                <Text style={styles.previewLabel}>Savings</Text>
                <Text style={[styles.previewAmount, { color: COLORS.savings }]}>
                  {formatPeso(parsedAmount)}
                </Text>
              </View>
              <View style={[styles.previewCard, { borderColor: COLORS.expense }]}>
                <Text style={styles.previewEmoji}>💳</Text>
                <Text style={styles.previewLabel}>Expense</Text>
                <Text style={[styles.previewAmount, { color: COLORS.expense }]}>
                  {formatPeso(0)}
                </Text>
              </View>
            </View>
            <Text style={styles.previewHint}>
              💡 Transfer funds to your Expense wallet when you're ready to spend.
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, { opacity: parsedAmount > 0 ? 1 : 0.5 }]}
          onPress={handleSetup}
          disabled={parsedAmount <= 0}
        >
          <Text style={styles.buttonText}>Start Using SplitVault 🚀</Text>
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
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  emoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.subtext,
    textAlign: 'center',
    lineHeight: 20,
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
    marginBottom: 24,
  },
  previewContainer: {
    marginBottom: 32,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.subtext,
    textAlign: 'center',
    marginBottom: 12,
  },
  previewRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  previewCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    alignItems: 'center',
  },
  previewEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  previewLabel: {
    fontSize: 13,
    color: COLORS.subtext,
    marginBottom: 4,
  },
  previewAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  previewHint: {
    fontSize: 12,
    color: COLORS.subtext,
    textAlign: 'center',
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