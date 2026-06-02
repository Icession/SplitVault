import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  TextInput,
  Modal,
  Platform,
  Share,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';
import * as LocalAuthentication from 'expo-local-authentication';

import { formatPeso, STORAGE_KEYS } from '../constants';
import { getWallets, saveTransactions, saveGoals, getProfile, saveProfile, getCategories, saveCategories, exportData } from '../storage/storage';
import { useTheme } from '../theme/ThemeContext';
import FadeInView from '../components/FadeInView';
import PressableScale from '../components/PressableScale';
import useConfirm from '../components/useConfirm';
import PinPad from '../components/PinPad';
import {
  setPin as savePin,
  setLockEnabled,
  isLockEnabled,
  setBiometricEnabled,
  clearLock,
} from '../storage/lock';
import { logOut } from '../firebase/auth';

const CURRENCIES = [
  { code: 'PHP', label: 'Philippine Peso (₱)' },
  { code: 'USD', label: 'US Dollar ($)' },
  { code: 'EUR', label: 'Euro (€)' },
  { code: 'GBP', label: 'British Pound (£)' },
  { code: 'JPY', label: 'Japanese Yen (¥)' },
  { code: 'CAD', label: 'Canadian Dollar (C$)' },
  { code: 'AUD', label: 'Australian Dollar (A$)' },
];

const APP_VERSION = Constants.expoConfig?.version || '1.0.0';

const PRIVACY_TEXT = `SplitVault works entirely on your device. We do not collect, transmit, sell, or share any of your data. There are no accounts, no ads, and no tracking.

Information we collect
We do not collect any personal information. Everything you enter — wallet balances, transactions, goals, categories, and any profile details — is stored only on your device. It never leaves your device and is never sent to us or anyone else.

Third-party services
SplitVault contains no third-party advertising, analytics, or tracking. No cookies or similar technologies are used.

Permissions
The app does not request access to your contacts, location, camera, microphone, or photos to function.

Data retention and deletion
Your data stays on your device until you remove it. Clear it anytime via Settings → Data Management, reset everything via Settings → Account → Reset App, or uninstall the app to remove all local data.

Children's privacy
SplitVault is not directed to children, and since no data is collected, no personal information from any user is gathered.

Changes
If future versions add features like cloud backup or accounts, this policy will be updated and the date revised.`;

export default function SettingsScreen({ onReset }) {
  const navigation = useNavigation();
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { confirm, dialog } = useConfirm();

  const [wallets, setWallets] = useState({ savings: 0, expense: 0 });
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [currency, setCurrency] = useState('PHP');
  const [showCurrency, setShowCurrency] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [privacyVisible, setPrivacyVisible] = useState(false);

  const [lockEnabled, setLockEnabledState] = useState(false);
  const [bioAvailable, setBioAvailable] = useState(false);
  const [lockStep, setLockStep] = useState(null);
  const [firstPin, setFirstPin] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const w = await getWallets();
      setWallets(w);
      const p = await getProfile();
      setFullName(p.fullName || '');
      setEmail(p.email || '');
      setCurrency(p.currency || 'PHP');
      const c = await getCategories();
      setCategories(c);
    };
    fetchData();
  }, []);

  // Read lock status + biometric availability on mount.
  useEffect(() => {
    let active = true;
    (async () => {
      const on = await isLockEnabled();
      let hw = false;
      try {
        hw = (await LocalAuthentication.hasHardwareAsync()) &&
             (await LocalAuthentication.isEnrolledAsync());
      } catch (e) {}
      if (active) {
        setLockEnabledState(on);
        setBioAvailable(hw);
      }
    })();
    return () => { active = false; };
  }, []);

  const closeLockModal = () => {
    setLockStep(null);
    setFirstPin('');
    setPinInput('');
    setPinError(false);
  };

  const onToggleLock = async (value) => {
    if (value) {
      setFirstPin('');
      setPinInput('');
      setPinError(false);
      setLockStep('create');
    } else {
      const ok = await confirm({
        title: 'Turn Off App Lock',
        message: 'You will no longer need a PIN or biometrics to open SplitVault.',
        confirmText: 'Turn Off',
        destructive: true,
        icon: 'lock-open-outline',
      });
      if (!ok) return;
      await clearLock();
      setLockEnabledState(false);
    }
  };

  const finishBiometric = async (enable) => {
    await setBiometricEnabled(enable);
    closeLockModal();
  };

  // Drive the PIN setup steps as digits are entered.
  useEffect(() => {
    if (pinInput.length !== 4) return;
    if (lockStep === 'create') {
      setFirstPin(pinInput);
      setPinInput('');
      setLockStep('confirm');
    } else if (lockStep === 'confirm') {
      if (pinInput === firstPin) {
        (async () => {
          await savePin(firstPin);
          await setLockEnabled(true);
          setLockEnabledState(true);
          setPinInput('');
          if (bioAvailable) {
            setLockStep('biometric');
          } else {
            closeLockModal();
          }
        })();
      } else {
        setPinError(true);
        const t = setTimeout(() => {
          setPinError(false);
          setPinInput('');
          setFirstPin('');
          setLockStep('create');
        }, 700);
        return () => clearTimeout(t);
      }
    }
  }, [pinInput, lockStep, firstPin, bioAvailable]);

  const handleAddCategory = async () => {
    const name = newCategory.trim();
    if (!name) return;
    if (categories.some((c) => c.label.toLowerCase() === name.toLowerCase())) {
      Alert.alert('Already Exists', 'That category already exists.');
      return;
    }
    const updated = [...categories, { label: name }];
    await saveCategories(updated);
    setCategories(updated);
    setNewCategory('');
  };

  const handleDeleteCategory = async (label) => {
    if (categories.length <= 1) {
      Alert.alert('Keep One', 'You need at least one category.');
      return;
    }
    const ok = await confirm({
      title: 'Delete Category',
      message: `Remove "${label}"?`,
      confirmText: 'Delete',
      destructive: true,
      icon: 'trash-outline',
    });
    if (!ok) return;
    const updated = categories.filter((c) => c.label !== label);
    await saveCategories(updated);
    setCategories(updated);
  };

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

  const handleLogout = async () => {
    const ok = await confirm({
      title: 'Log Out',
      message: 'You can log back in anytime. Your data stays on this device.',
      confirmText: 'Log Out',
      icon: 'log-out-outline',
    });
    if (!ok) return;
    await logOut();
  };

  const handleExport = async () => {
    try {
      const payload = await exportData();
      const json = JSON.stringify(payload, null, 2);
      const stamp = new Date().toISOString().slice(0, 10);
      const filename = `splitvault-backup-${stamp}.json`;

      if (Platform.OS === 'web') {
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        await Share.share({ title: filename, message: json });
      }
    } catch (e) {
      Alert.alert('Export Failed', 'Something went wrong creating your backup.');
    }
  };

  const handleReset = async () => {
    const ok = await confirm({
      title: 'Reset App',
      message: 'This erases all wallets, transactions, goals, and your profile, then starts fresh from setup. This cannot be undone.',
      confirmText: 'Reset',
      destructive: true,
      icon: 'warning-outline',
    });
    if (!ok) return;
    await onReset();
  };

  const handleClearTransactions = async () => {
    const ok = await confirm({
      title: 'Clear History',
      message: 'This will permanently delete all transaction history.',
      confirmText: 'Clear',
      destructive: true,
      icon: 'trash-outline',
    });
    if (!ok) return;
    await saveTransactions([]);
    Alert.alert('Done', 'Transaction history cleared.');
  };

  const handleClearGoals = async () => {
    const ok = await confirm({
      title: 'Clear Goals',
      message: 'This will permanently delete all savings goals.',
      confirmText: 'Clear',
      destructive: true,
      icon: 'trash-outline',
    });
    if (!ok) return;
    await saveGoals([]);
    Alert.alert('Done', 'Goals cleared.');
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
            <Ionicons name="pricetags-outline" size={16} color={colors.primary} />
            <Text style={styles.sectionTitle}>EXPENSE CATEGORIES</Text>
          </View>

          <View style={styles.catChips}>
            {categories.map((cat) => (
              <View key={cat.label} style={styles.catChip}>
                <Text style={styles.catChipText}>{cat.label}</Text>
                <TouchableOpacity
                  onPress={() => handleDeleteCategory(cat.label)}
                  hitSlop={8}
                >
                  <Ionicons name="close-circle" size={16} color={colors.subtext} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={styles.catAddRow}>
            <TextInput
              style={styles.catInput}
              placeholder="Add a category..."
              placeholderTextColor={colors.subtext}
              value={newCategory}
              onChangeText={setNewCategory}
              maxLength={20}
            />
            <PressableScale
              style={[styles.catAddButton, { opacity: newCategory.trim() ? 1 : 0.5 }]}
              onPress={handleAddCategory}
              disabled={!newCategory.trim()}
            >
              <Ionicons name="add" size={18} color="#fff" />
            </PressableScale>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="lock-closed-outline" size={16} color={colors.primary} />
            <Text style={styles.sectionTitle}>SECURITY</Text>
          </View>

          <View style={styles.lockRow}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.themeLabel}>App Lock</Text>
              <Text style={styles.themeSubtext}>
                {Platform.OS === 'web'
                  ? 'Available on the mobile app'
                  : 'Require PIN or biometrics to open'}
              </Text>
            </View>
            <Switch
              value={lockEnabled}
              onValueChange={onToggleLock}
              disabled={Platform.OS === 'web'}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.divider} />

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

          <PressableScale style={styles.dataRow} onPress={handleExport}>
            <View style={styles.dataRowLeft}>
              <View style={[styles.dataIconBox, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="download-outline" size={16} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.dataRowTitle}>Export Backup</Text>
                <Text style={styles.dataRowSub}>Save a copy of all your data</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.subtext} />
          </PressableScale>

          <View style={styles.divider} />

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

          <PressableScale style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={18} color={colors.text} />
            <Text style={styles.logoutBtnText}>Log Out</Text>
          </PressableScale>
          <Text style={styles.accountHint}>
            You can log back in anytime. Your data stays on this device.
          </Text>

          <View style={styles.divider} />

          <PressableScale style={styles.resetBtn} onPress={handleReset}>
            <Ionicons name="warning-outline" size={18} color="#fff" />
            <Text style={styles.resetBtnText}>Reset App</Text>
          </PressableScale>
          <Text style={styles.accountHint}>
            Erases everything and starts fresh from setup.
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
            <Text style={styles.sectionTitle}>ABOUT</Text>
          </View>

          <PressableScale style={styles.dataRow} onPress={() => setPrivacyVisible(true)}>
            <View style={styles.dataRowLeft}>
              <View style={[styles.dataIconBox, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="shield-checkmark-outline" size={16} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.dataRowTitle}>Privacy Policy</Text>
                <Text style={styles.dataRowSub}>How your data is handled</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.subtext} />
          </PressableScale>

          <View style={styles.divider} />

          <View style={styles.aboutRow}>
            <Text style={styles.aboutName}>SplitVault</Text>
            <Text style={styles.aboutVersion}>Version {APP_VERSION}</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
        </FadeInView>
      </ScrollView>

      {dialog}

      <Modal
        visible={lockStep !== null}
        transparent
        animationType="slide"
        onRequestClose={closeLockModal}
      >
        <View style={styles.privacyOverlay}>
          <View style={styles.lockSheet}>
            {lockStep === 'biometric' ? (
              <>
                <View style={styles.lockBadge}>
                  <Ionicons name="finger-print" size={28} color="#fff" />
                </View>
                <Text style={styles.lockTitle}>Enable biometric unlock?</Text>
                <Text style={styles.lockSub}>
                  Use your fingerprint or face to unlock, with your PIN as a backup.
                </Text>
                <PressableScale
                  style={styles.lockPrimaryBtn}
                  onPress={() => finishBiometric(true)}
                >
                  <Text style={styles.lockPrimaryText}>Enable</Text>
                </PressableScale>
                <TouchableOpacity onPress={() => finishBiometric(false)} style={styles.lockSkip}>
                  <Text style={styles.lockSkipText}>Use PIN only</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.lockTitle}>
                  {lockStep === 'create' ? 'Create a PIN' : 'Confirm your PIN'}
                </Text>
                <Text style={styles.lockSub}>
                  {lockStep === 'create'
                    ? 'Choose a 4-digit PIN to lock the app'
                    : pinError
                    ? "PINs didn't match — try again"
                    : 'Re-enter your PIN'}
                </Text>
                <PinPad value={pinInput} onChange={setPinInput} error={pinError} />
                <TouchableOpacity onPress={closeLockModal} style={styles.lockSkip}>
                  <Text style={styles.lockSkipText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={privacyVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPrivacyVisible(false)}
      >
        <View style={styles.privacyOverlay}>
          <View style={styles.privacySheet}>
            <View style={styles.privacyHeader}>
              <Text style={styles.privacyTitle}>Privacy Policy</Text>
              <TouchableOpacity onPress={() => setPrivacyVisible(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.privacyText}>{PRIVACY_TEXT}</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  catChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 7,
  },
  catChipText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '600',
  },
  catAddRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  catInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: COLORS.text,
  },
  catAddButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  logoutBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.danger,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  resetBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  accountHint: {
    fontSize: 12,
    color: COLORS.subtext,
    textAlign: 'center',
    marginTop: 8,
  },
  aboutRow: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  aboutName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  aboutVersion: {
    fontSize: 12,
    color: COLORS.subtext,
    marginTop: 2,
  },
  privacyOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  privacySheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    paddingBottom: 32,
    maxHeight: '82%',
  },
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  privacyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  privacyText: {
    fontSize: 14,
    color: COLORS.subtext,
    lineHeight: 21,
  },
  lockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  lockSheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 32,
    alignItems: 'center',
  },
  lockBadge: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  lockTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  lockSub: {
    fontSize: 14,
    color: COLORS.subtext,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  lockPrimaryBtn: {
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    overflow: 'hidden',
  },
  lockPrimaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  lockSkip: {
    paddingVertical: 14,
    marginTop: 6,
  },
  lockSkipText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.subtext,
  },
});