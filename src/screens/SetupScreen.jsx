import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar as RNStatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { formatPeso, sanitizeAmount } from '../constants';
import { saveWallets, setIsSetup } from '../storage/storage';
import { useTheme } from '../theme/ThemeContext';
import FadeInView from '../components/FadeInView';
import PressableScale from '../components/PressableScale';
import FloatingField from '../components/FloatingField';

const HERO = '#064E3B';
const heroTopPad =
  (Platform.OS === 'android' ? (RNStatusBar.currentHeight || 24) : 54) + 22;

export default function SetupScreen({ onComplete }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [totalAmount, setTotalAmount] = useState('');
  const parsedAmount = parseFloat(totalAmount) || 0;

  // Keep only digits and a single decimal point.
  const handleAmount = (t) => setTotalAmount(sanitizeAmount(t));

  const handleSetup = async () => {
    if (!totalAmount || parsedAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid starting amount.');
      return;
    }
    await saveWallets({ savings: parsedAmount, expense: 0 });
    await setIsSetup();
    onComplete();
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Edge-to-edge hero */}
          <FadeInView delay={0}>
            <View style={styles.hero}>
              <View style={styles.blobA} />
              <View style={styles.blobB} />
              <View style={styles.heroContent}>
                <View style={styles.badgeRing}>
                  <View style={styles.badge}>
                    <Ionicons name="wallet" size={24} color="#fff" />
                  </View>
                </View>
                <Text style={styles.brandName}>Welcome to SplitVault</Text>
                <Text style={styles.brandTagline}>Let's set up your vault</Text>
              </View>
            </View>
          </FadeInView>

          {/* Form sheet */}
          <View style={styles.sheet}>
            <View style={styles.sheetInner}>

              <FadeInView delay={120}>
                <Text style={styles.heading}>Your starting balance</Text>
                <Text style={styles.subtitle}>
                  Enter your total funds. It all starts in Savings — transfer to
                  Expense when you're ready to spend.
                </Text>

                <FloatingField
                  label="Total amount (₱)"
                  icon="cash-outline"
                  value={totalAmount}
                  onChangeText={handleAmount}
                  keyboardType="numeric"
                />
              </FadeInView>

              {parsedAmount > 0 && (
                <FadeInView duration={300} offset={8} style={styles.previewContainer}>
                  <Text style={styles.previewTitle}>YOUR STARTING WALLETS</Text>
                  <View style={styles.previewRow}>
                    <View style={[styles.previewCard, { backgroundColor: colors.savingsCardBg }]}>
                      <View style={[styles.previewIcon, { backgroundColor: colors.savings + '22' }]}>
                        <Ionicons name="wallet" size={18} color={colors.savings} />
                      </View>
                      <Text style={styles.previewLabel}>Savings</Text>
                      <Text style={[styles.previewAmount, { color: colors.savings }]}>
                        {formatPeso(parsedAmount)}
                      </Text>
                    </View>
                    <View style={[styles.previewCard, { backgroundColor: colors.expenseCardBg }]}>
                      <View style={[styles.previewIcon, { backgroundColor: colors.expense + '22' }]}>
                        <Ionicons name="card" size={18} color={colors.expense} />
                      </View>
                      <Text style={styles.previewLabel}>Expense</Text>
                      <Text style={[styles.previewAmount, { color: colors.expense }]}>
                        {formatPeso(0)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.hintRow}>
                    <Ionicons name="bulb-outline" size={14} color={colors.subtext} />
                    <Text style={styles.previewHint}>
                      Move funds to Expense anytime you're ready to spend.
                    </Text>
                  </View>
                </FadeInView>
              )}

              <FadeInView delay={180}>
                <PressableScale
                  style={[styles.button, { opacity: parsedAmount > 0 ? 1 : 0.5 }]}
                  onPress={handleSetup}
                  disabled={parsedAmount <= 0}
                  android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
                >
                  <Text style={styles.buttonText}>Start Using SplitVault</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </PressableScale>

                <View style={styles.trustRow}>
                  <Ionicons name="shield-checkmark-outline" size={13} color={colors.subtext} />
                  <Text style={styles.trustText}>Stored privately on your device</Text>
                </View>
              </FadeInView>

            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const createStyles = (COLORS) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: HERO,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
  },
  hero: {
    backgroundColor: HERO,
    paddingTop: heroTopPad,
    paddingBottom: 56,
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  blobA: {
    position: 'absolute',
    top: -40,
    right: -50,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  blobB: {
    position: 'absolute',
    bottom: -70,
    left: -40,
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: 'rgba(52,211,153,0.16)',
  },
  heroContent: {
    alignItems: 'center',
  },
  badgeRing: {
    width: 70,
    height: 70,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  brandName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  brandTagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  sheet: {
    flexGrow: 1,
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -28,
    paddingTop: 26,
    paddingHorizontal: 22,
    paddingBottom: 32 + (Platform.OS === 'ios' ? 12 : 0),
  },
  sheetInner: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  heading: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.subtext,
    lineHeight: 20,
    marginBottom: 22,
  },
  previewContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  previewTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.subtext,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  previewRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  previewCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
  },
  previewIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  previewLabel: {
    fontSize: 13,
    color: COLORS.subtext,
    marginBottom: 4,
  },
  previewAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  previewHint: {
    fontSize: 12,
    color: COLORS.subtext,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 20,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 16,
  },
  trustText: {
    fontSize: 12,
    color: COLORS.subtext,
  },
});