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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { CATEGORIES, formatPeso, sanitizeAmount } from '../constants';
import { getWallets, saveWallets, addTransaction, getCategories, saveCategories } from '../storage/storage';
import { useTheme } from '../theme/ThemeContext';
import FadeInView from '../components/FadeInView';
import PressableScale from '../components/PressableScale';

export default function AddExpenseScreen({ navigation, onClose }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [amount, setAmount] = useState('');
  const [label, setLabel] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedWallet, setSelectedWallet] = useState('expense');
  const [wallets, setWallets] = useState({ savings: 0, expense: 0 });
  const [categories, setCategories] = useState(CATEGORIES);
  const [addCatVisible, setAddCatVisible] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  useEffect(() => {
    const load = async () => {
      const w = await getWallets();
      setWallets(w);
      const c = await getCategories();
      setCategories(c);
    };
    load();
  }, []);

  const handleAddCategory = async () => {
    const name = newCatName.trim();
    if (!name) return;
    const exists = categories.some(
      (c) => c.label.toLowerCase() === name.toLowerCase()
    );
    if (exists) {
      Alert.alert('Already Exists', 'That category already exists.');
      return;
    }
    const updated = [...categories, { label: name }];
    await saveCategories(updated);
    setCategories(updated);
    setSelectedCategory({ label: name });
    setNewCatName('');
    setAddCatVisible(false);
  };

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
      createdAt: new Date().toISOString(),
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
    Alert.alert(
      'Expense Recorded',
      `${formatPeso(parsedAmount)} deducted from ${selectedWallet} wallet.`
    );
    handleClose();
  };

  const accent = selectedWallet === 'savings' ? colors.savings : colors.expense;
  const actionLabel = selectedWallet === 'savings' ? 'Record Savings' : 'Record Expense';

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
            <Text style={styles.title}>Add Expense</Text>
            <Text style={styles.subtitle}>Deduct from your wallet</Text>
          </View>
        </View>

        <Text style={styles.label}>Deduct From</Text>
        <View style={styles.walletRow}>
          {['expense', 'savings'].map((wallet) => (
            <PressableScale
              key={wallet}
              style={[
                styles.walletBtn,
                selectedWallet === wallet && {
                  borderColor: wallet === 'savings' ? colors.savings : colors.expense,
                  backgroundColor: wallet === 'savings'
                    ? colors.savings + '22'
                    : colors.expense + '22',
                },
              ]}
              onPress={() => setSelectedWallet(wallet)}
            >
              <Ionicons
                name={wallet === 'savings' ? 'wallet' : 'card'}
                size={22}
                color={wallet === 'savings' ? colors.savings : colors.expense}
              />
              <Text style={styles.walletBtnLabel}>
                {wallet.charAt(0).toUpperCase() + wallet.slice(1)}
              </Text>
              <Text style={[
                styles.walletBtnBalance,
                { color: wallet === 'savings' ? colors.savings : colors.expense },
              ]}>
                {formatPeso(wallets[wallet])}
              </Text>
            </PressableScale>
          ))}
        </View>

        <Text style={styles.label}>Amount (₱)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 250"
          placeholderTextColor={colors.subtext}
          keyboardType="numeric"
          value={amount}
          onChangeText={(t) => setAmount(sanitizeAmount(t))}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Lunch at Jollibee"
          placeholderTextColor={colors.subtext}
          value={label}
          onChangeText={setLabel}
        />

        <Text style={styles.label}>Category</Text>
        <View style={styles.categoryGrid}>
          {categories.map((cat) => (
            <PressableScale
              key={cat.label}
              style={[
                styles.categoryBtn,
                selectedCategory?.label === cat.label && {
                  borderColor: accent,
                  backgroundColor: accent + '22',
                },
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[
                styles.categoryLabel,
                selectedCategory?.label === cat.label && { color: accent },
              ]}>
                {cat.label}
              </Text>
            </PressableScale>
          ))}
          <PressableScale
            style={[styles.categoryBtn, styles.addCatBtn]}
            onPress={() => setAddCatVisible(true)}
          >
            <Ionicons name="add" size={14} color={colors.subtext} />
            <Text style={styles.categoryLabel}>New</Text>
          </PressableScale>
        </View>

        <PressableScale
          style={[
            styles.button,
            { backgroundColor: accent, opacity: amount && selectedCategory && label ? 1 : 0.5 },
          ]}
          onPress={handleSubmit}
          disabled={!amount || !selectedCategory || !label}
        >
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </PressableScale>

        </FadeInView>
      </ScrollView>

      <Modal
        visible={addCatVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAddCatVisible(false)}
      >
        <View style={styles.catModalOverlay}>
          <View style={styles.catModalBox}>
            <Text style={styles.catModalTitle}>New Category</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Groceries"
              placeholderTextColor={colors.subtext}
              value={newCatName}
              onChangeText={setNewCatName}
              autoFocus
              maxLength={20}
            />
            <View style={styles.catModalActions}>
              <PressableScale
                style={styles.catCancelBtn}
                onPress={() => { setNewCatName(''); setAddCatVisible(false); }}
              >
                <Text style={styles.catCancelText}>Cancel</Text>
              </PressableScale>
              <PressableScale
                style={[styles.catAddBtn, { opacity: newCatName.trim() ? 1 : 0.5 }]}
                onPress={handleAddCategory}
                disabled={!newCatName.trim()}
              >
                <Text style={styles.catAddText}>Add</Text>
              </PressableScale>
            </View>
          </View>
        </View>
      </Modal>
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
  addCatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderStyle: 'dashed',
  },
  catModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 32,
  },
  catModalBox: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 22,
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
  },
  catModalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 14,
  },
  catModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  catCancelBtn: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  catCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.subtext,
  },
  catAddBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 13,
    alignItems: 'center',
  },
  catAddText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
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