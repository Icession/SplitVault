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

// ─── COMPONENT ────────────────────────────────────────
// onComplete is a function passed from App.js that tells
// the app "setup is done, show the main tabs now"
export default function SetupScreen({ onComplete }) {

  // ─── STATE ──────────────────────────────────────────
  // useState stores values that can change and re-render the UI
  // These track what the user types in the input fields
  const [totalAmount, setTotalAmount] = useState('');
  const [savingsPercent, setSavingsPercent] = useState('50');

  // ─── DERIVED VALUES ─────────────────────────────────
  // We calculate the split preview in real time as the user types
  // parseFloat converts the string input into a number
  const total = parseFloat(totalAmount) || 0;
  const savingsPct = parseFloat(savingsPercent) || 0;
  const expensePct = 100 - savingsPct;
  const savingsAmount = (total * savingsPct) / 100;
  const expenseAmount = (total * expensePct) / 100;

  // ─── HANDLE SETUP ───────────────────────────────────
  // This runs when the user taps "Start Using SplitVault"
  const handleSetup = async () => {

    if (!totalAmount || total <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid starting amount.');
      return;
    }
    if (savingsPct < 0 || savingsPct > 100) {
      Alert.alert('Invalid Split', 'Savings percentage must be between 0 and 100.');
      return;
    }

    await saveWallets({
      savings: savingsAmount,
      expense: expenseAmount,
    });

    await setIsSetup();

    onComplete();
  };

  // ─── UI ─────────────────────────────────────────────
  return (
    // KeyboardAvoidingView pushes the screen up when keyboard appears
    // so the input fields are never hidden behind the keyboard
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── HEADER ───────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.emoji}>💰</Text>
          <Text style={styles.title}>Welcome to SplitVault</Text>
          <Text style={styles.subtitle}>
            Let's set up your wallets. Enter your total funds and we'll split them for you.
          </Text>
        </View>

        {/* ── TOTAL AMOUNT INPUT ───────────────────── */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Total Amount (₱)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 10000"
            placeholderTextColor={COLORS.subtext}
            keyboardType="numeric"
            value={totalAmount}
            onChangeText={setTotalAmount}
          />
        </View>

        {/* ── SAVINGS PERCENT INPUT ────────────────── */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Savings Percentage (%)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 50"
            placeholderTextColor={COLORS.subtext}
            keyboardType="numeric"
            value={savingsPercent}
            onChangeText={setSavingsPercent}
          />
          <Text style={styles.hint}>
            Expense will get {expensePct}%
          </Text>
        </View>

        {/* ── LIVE PREVIEW ─────────────────────────── */}
        {/* Only shows when user has typed a valid amount */}
        {total > 0 && (
          <View style={styles.previewContainer}>
            <Text style={styles.previewTitle}>Your Wallets Preview</Text>

            <View style={styles.previewRow}>
              {/* Savings wallet card */}
              <View style={[styles.previewCard, { borderColor: COLORS.savings }]}>
                <Text style={styles.previewEmoji}>🐷</Text>
                <Text style={styles.previewLabel}>Savings</Text>
                <Text style={[styles.previewAmount, { color: COLORS.savings }]}>
                  {formatPeso(savingsAmount)}
                </Text>
                <Text style={styles.previewPct}>{savingsPct}%</Text>
              </View>

              {/* Expense wallet card */}
              <View style={[styles.previewCard, { borderColor: COLORS.expense }]}>
                <Text style={styles.previewEmoji}>💳</Text>
                <Text style={styles.previewLabel}>Expense</Text>
                <Text style={[styles.previewAmount, { color: COLORS.expense }]}>
                  {formatPeso(expenseAmount)}
                </Text>
                <Text style={styles.previewPct}>{expensePct}%</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── SUBMIT BUTTON ────────────────────────── */}
        <TouchableOpacity
          style={[
            styles.button,
            { opacity: total > 0 ? 1 : 0.5 }
          ]}
          onPress={handleSetup}
          disabled={total <= 0}
        >
          <Text style={styles.buttonText}>Start Using SplitVault 🚀</Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── STYLES ───────────────────────────────────────────
// StyleSheet.create is React Native's way of writing CSS
// All sizes are in density-independent pixels (dp), not px
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
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
  inputGroup: {
    marginBottom: 20,
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
  },
  hint: {
    fontSize: 12,
    color: COLORS.subtext,
    marginTop: 6,
    marginLeft: 4,
  },
  previewContainer: {
    marginBottom: 28,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.subtext,
    marginBottom: 12,
    textAlign: 'center',
  },
  previewRow: {
    flexDirection: 'row',
    gap: 12,
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
    marginBottom: 2,
  },
  previewPct: {
    fontSize: 12,
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