import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

import { formatPeso, STORAGE_KEYS } from '../constants';
import { getWallets, saveTransactions, saveGoals, getProfile, saveProfile } from '../storage/storage';
import { useTheme } from '../theme/ThemeContext';
import FadeInView from '../components/FadeInView';
import PressableScale from '../components/PressableScale';

const CURRENCIES = [
  { code: 'PHP', label: 'Philippine Peso (₱)' },
  { code: 'USD', label: 'US Dollar ($)' },
  { code: 'EUR', label: 'Euro (€)' },
  { code: 'GBP', label: 'British Pound (£)' },
  { code: 'JPY', label: 'Japanese Yen (¥)' },
  { code: 'CAD', label: 'Canadian Dollar (C$)' },
  { code: 'AUD', label: 'Australian Dollar (A$)' },
];

export default function SettingsScreen({ onReset }) {
  const navigation = useNavigation();
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [wallets, setWallets] = useState({ savings: 0, expense: 0 });
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [currency, setCurrency] = useState('PHP');
  const [showCurrency, setShowCurrency] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const w = await getWallets();
      setWallets(w);
      const p = await getProfile();
      setFullName(p.fullName || '');
      setEmail(p.email || '');
      setCurrency(p.currency || 'PHP');
    };
    fetchData();
  }, []);

  const selectedCurrency =
    CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0];

  const handleSaveProfile = async () => {
    await saveProfile({ fullName: fullName.trim(), email: email.trim(), currency });
    Alert.alert('Profile Saved', 'Your profile has been updated.');
  };

  const handleChangePassword = () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Missing Fields', 'Please fill in both password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }
    Alert.alert('Password Changed', 'Your password has been updated.');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleReset = () => {
    Alert.alert(
      'Reset App',
      'This will clear all wallets, transactions, and goals. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.multiRemove([
              STORAGE_KEYS.wallets,
              STORAGE_KEYS.transactions,
              STORAGE_KEYS.goals,
              STORAGE_KEYS.isSetup,
              STORAGE_KEYS.profile,
            ]);
            onReset();
          },
        },
      ]
    );
  };

  const handleClearTransactions = () => {
    Alert.alert('Clear History', 'This will permanently delete all transaction history.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await saveTransactions([]);
          Alert.alert('Done', 'Transaction history cleared.');
        },
      },
    ]);
  };

  const handleClearGoals = () => {
    Alert.alert('Clear Goals', 'This will permanently delete all savings goals.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await saveGoals([]);
          Alert.alert('Done', 'Goals cleared.');
        },
      },
    ]);
  };

  const total = wallets.savings + wallets.expense;

  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <FadeInView>

        <View style={styles.balanceSummary}>
          <Text style={styles.balanceSummaryLabel}>Total Balance</Text>
          <Text style={styles.balanceSummaryAmount}>{formatPeso(total)}</Text>
          <View style={styles.walletSummaryRow}>
            <View style={styles.walletSummaryItem}>
              <Ionicons name="wallet" size={13} color={colors.primary} />
              <Text style={styles.walletSummaryText}>{formatPeso(wallets.savings)}</Text>
            </View>
            <View style={styles.walletSummaryItem}>
              <Ionicons name="card" size={13} color={colors.danger} />
              <Text style={styles.walletSummaryText}>{formatPeso(wallets.expense)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="person-outline" size={16} color={colors.primary} />
            <Text style={styles.sectionTitle}>PROFILE</Text>
          </View>

          <Text style={styles.fieldLabel}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            placeholderTextColor={colors.subtext}
            value={fullName}
            onChangeText={setFullName}
          />

          <Text style={styles.fieldLabel}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor={colors.subtext}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.fieldLabel}>Default Currency</Text>
          <TouchableOpacity
            style={styles.currencyRow}
            onPress={() => setShowCurrency((s) => !s)}
            activeOpacity={0.7}
          >
            <Text style={styles.currencyText}>{selectedCurrency.label}</Text>
            <Ionicons
              name={showCurrency ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={colors.subtext}
            />
          </TouchableOpacity>

          {showCurrency && (
            <View style={styles.currencyList}>
              {CURRENCIES.map((c) => {
                const active = c.code === currency;
                return (
                  <TouchableOpacity
                    key={c.code}
                    style={[styles.currencyOption, active && styles.currencyOptionActive]}
                    onPress={() => {
                      setCurrency(c.code);
                      setShowCurrency(false);
                    }}
                  >
                    <Text style={[
                      styles.currencyOptionText,
                      active && styles.currencyOptionTextActive,
                    ]}>
                      {c.label}
                    </Text>
                    {active && <Ionicons name="checkmark" size={16} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <PressableScale style={styles.saveBtn} onPress={handleSaveProfile}>
            <Ionicons name="save-outline" size={16} color="#fff" />
            <Text style={styles.saveBtnText}>Save Profile</Text>
          </PressableScale>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="color-palette-outline" size={16} color={colors.primary} />
            <Text style={styles.sectionTitle}>APPEARANCE</Text>
          </View>

          <View style={styles.themeRow}>
            <View>
              <Text style={styles.themeLabel}>Theme</Text>
              <Text style={styles.themeSubtext}>{isDark ? 'Dark mode' : 'Light mode'}</Text>
            </View>
            <PressableScale style={styles.themeToggleBtn} onPress={toggleTheme}>
              <Ionicons name={isDark ? 'sunny' : 'moon'} size={20} color={colors.text} />
            </PressableScale>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="lock-closed-outline" size={16} color={colors.primary} />
            <Text style={styles.sectionTitle}>SECURITY</Text>
          </View>

          <Text style={styles.fieldLabel}>New Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter new password"
            placeholderTextColor={colors.subtext}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />

          <Text style={styles.fieldLabel}>Confirm New Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Confirm new password"
            placeholderTextColor={colors.subtext}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <PressableScale style={styles.changePasswordBtn} onPress={handleChangePassword}>
            <Text style={styles.changePasswordText}>Change Password</Text>
          </PressableScale>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="server-outline" size={16} color={colors.primary} />
            <Text style={styles.sectionTitle}>DATA MANAGEMENT</Text>
          </View>

          <PressableScale style={styles.dataRow} onPress={handleClearTransactions}>
            <View style={styles.dataRowLeft}>
              <View style={[styles.dataIconBox, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="receipt-outline" size={16} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.dataRowTitle}>Clear Transaction History</Text>
                <Text style={styles.dataRowSub}>Removes all recorded transactions</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.subtext} />
          </PressableScale>

          <View style={styles.divider} />

          <PressableScale style={styles.dataRow} onPress={handleClearGoals}>
            <View style={styles.dataRowLeft}>
              <View style={[styles.dataIconBox, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="flag-outline" size={16} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.dataRowTitle}>Clear Savings Goals</Text>
                <Text style={styles.dataRowSub}>Removes all saved goals</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.subtext} />
          </PressableScale>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="log-out-outline" size={16} color={colors.primary} />
            <Text style={styles.sectionTitle}>ACCOUNT</Text>
          </View>

          <PressableScale style={styles.logoutBtn} onPress={handleReset}>
            <Ionicons name="log-out-outline" size={18} color="#fff" />
            <Text style={styles.logoutBtnText}>Log Out</Text>
          </PressableScale>
        </View>

        <View style={{ height: 40 }} />
        </FadeInView>
      </ScrollView>
    </View>
  );
}

const createStyles = (COLORS) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 12,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  content: {
    padding: 20,
  },
  balanceSummary: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  balanceSummaryLabel: {
    fontSize: 13,
    color: COLORS.subtext,
    marginBottom: 4,
  },
  balanceSummaryAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  walletSummaryRow: {
    flexDirection: 'row',
    gap: 20,
  },
  walletSummaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  walletSummaryText: {
    fontSize: 13,
    color: COLORS.subtext,
  },
  sectionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.subtext,
    letterSpacing: 0.5,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 14,
  },
  currencyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  currencyText: {
    fontSize: 15,
    color: COLORS.text,
  },
  currencyList: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: COLORS.card,
    marginTop: -6,
    marginBottom: 14,
    overflow: 'hidden',
  },
  currencyOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  currencyOptionActive: {
    backgroundColor: COLORS.primary + '15',
  },
  currencyOptionText: {
    fontSize: 15,
    color: COLORS.text,
  },
  currencyOptionTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  themeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  themeLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  themeSubtext: {
    fontSize: 12,
    color: COLORS.subtext,
    marginTop: 2,
  },
  themeToggleBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  changePasswordBtn: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  changePasswordText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  dataRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  dataIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dataRowTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  dataRowSub: {
    fontSize: 12,
    color: COLORS.subtext,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 8,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.danger,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  logoutBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});