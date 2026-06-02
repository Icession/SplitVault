import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StatusBar as RNStatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { useTheme } from '../theme/ThemeContext';
import FadeInView from '../components/FadeInView';
import PressableScale from '../components/PressableScale';
import FloatingField from '../components/FloatingField';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HERO = '#064E3B';
const heroTopPad =
  (Platform.OS === 'android' ? (RNStatusBar.currentHeight || 24) : 54) + 22;

export default function ForgotPasswordScreen({ onBack }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const emailValid = EMAIL_RE.test(email.trim());
  const emailError = email.length > 0 && !emailValid;

  const handleSend = () => {
    if (!emailValid) return;
    // Frontend only — a real reset email is sent once the backend exists.
    setSent(true);
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
          <FadeInView delay={0}>
            <View style={styles.hero}>
              <View style={styles.blobA} />
              <View style={styles.blobB} />
              <TouchableOpacity style={styles.backBtn} onPress={onBack} hitSlop={10}>
                <Ionicons name="arrow-back" size={22} color="#fff" />
              </TouchableOpacity>
              <View style={styles.heroContent}>
                <View style={styles.badgeRing}>
                  <View style={styles.badge}>
                    <Ionicons name={sent ? 'mail-open' : 'key'} size={24} color="#fff" />
                  </View>
                </View>
                <Text style={styles.brandName}>Reset password</Text>
                <Text style={styles.brandTagline}>We'll help you back in</Text>
              </View>
            </View>
          </FadeInView>

          <View style={styles.sheet}>
            <View style={styles.sheetInner}>
              {!sent ? (
                <FadeInView delay={120}>
                  <Text style={styles.heading}>Forgot your password?</Text>
                  <Text style={styles.subtitle}>
                    Enter the email tied to your account and we'll send a link to
                    reset your password.
                  </Text>

                  <FloatingField
                    label="Email"
                    icon="mail-outline"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoComplete="email"
                    textContentType="emailAddress"
                    error={emailError}
                    errorText="Enter a valid email address"
                  />

                  <PressableScale
                    style={[styles.primaryBtn, { opacity: emailValid ? 1 : 0.5 }]}
                    onPress={handleSend}
                    disabled={!emailValid}
                    android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
                  >
                    <Text style={styles.primaryBtnText}>Send reset link</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </PressableScale>

                  <TouchableOpacity style={styles.linkWrap} onPress={onBack} hitSlop={8}>
                    <Text style={styles.linkText}>Back to log in</Text>
                  </TouchableOpacity>
                </FadeInView>
              ) : (
                <FadeInView delay={0}>
                  <View style={styles.sentIconWrap}>
                    <Ionicons name="checkmark-circle" size={48} color={colors.primary} />
                  </View>
                  <Text style={styles.heading}>Check your email</Text>
                  <Text style={styles.subtitle}>
                    If an account exists for {email.trim()}, we've sent a link to
                    reset your password. It may take a few minutes to arrive.
                  </Text>

                  <PressableScale
                    style={styles.primaryBtn}
                    onPress={onBack}
                    android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
                  >
                    <Text style={styles.primaryBtnText}>Back to log in</Text>
                  </PressableScale>

                  <TouchableOpacity
                    style={styles.linkWrap}
                    onPress={() => setSent(false)}
                    hitSlop={8}
                  >
                    <Text style={styles.linkText}>Use a different email</Text>
                  </TouchableOpacity>
                </FadeInView>
              )}

              <View style={styles.trustRow}>
                <Ionicons name="shield-checkmark-outline" size={13} color={colors.subtext} />
                <Text style={styles.trustText}>We'll never share your email</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const createStyles = (COLORS) => StyleSheet.create({
  root: { flex: 1, backgroundColor: HERO },
  flex: { flex: 1 },
  scroll: { flexGrow: 1 },
  hero: {
    backgroundColor: HERO,
    paddingTop: heroTopPad,
    paddingBottom: 56,
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  backBtn: {
    position: 'absolute',
    top: heroTopPad - 4,
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
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
  heroContent: { alignItems: 'center' },
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
  brandName: { fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  brandTagline: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
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
  sheetInner: { width: '100%', maxWidth: 440, alignSelf: 'center' },
  sentIconWrap: { alignItems: 'center', marginBottom: 8 },
  heading: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.subtext,
    lineHeight: 20,
    marginBottom: 22,
    textAlign: 'center',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 4,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  linkWrap: { alignItems: 'center', paddingVertical: 14, marginTop: 4 },
  linkText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 18,
  },
  trustText: { fontSize: 12, color: COLORS.subtext },
});