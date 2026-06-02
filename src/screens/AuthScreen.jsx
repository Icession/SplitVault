import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar as RNStatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { useTheme } from '../theme/ThemeContext';
import FadeInView from '../components/FadeInView';
import PressableScale from '../components/PressableScale';
import FloatingField from '../components/FloatingField';
import { signIn, signUp } from '../firebase/auth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HERO = '#064E3B';

const heroTopPad =
  (Platform.OS === 'android' ? (RNStatusBar.currentHeight || 24) : 54) + 22;

export default function AuthScreen({ onForgotPassword }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');

  const [segW, setSegW] = useState(0);
  const seg = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;
  const slide = useRef(new Animated.Value(0)).current;

  const isRegister = mode === 'register';

  const emailValid = EMAIL_RE.test(email.trim());
  const emailError = email.length > 0 && !emailValid;

  const reqs = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One number', met: /[0-9]/.test(password) },
  ];
  const passwordValid = reqs.every((r) => r.met);
  const passwordsMatch = confirm.length > 0 && password === confirm;
  const confirmError = confirm.length > 0 && password !== confirm;

  const isValid = isRegister
    ? emailValid && passwordValid && passwordsMatch
    : emailValid && password.length > 0;

  const switchMode = (next) => {
    if (next === mode) return;
    setAuthError('');
    const dir = next === 'register' ? 1 : -1;
    Animated.spring(seg, {
      toValue: next === 'register' ? 1 : 0,
      useNativeDriver: true,
      bounciness: 6,
      speed: 16,
    }).start();
    Animated.timing(fade, { toValue: 0, duration: 110, useNativeDriver: true }).start(() => {
      setMode(next);
      slide.setValue(dir * 26);
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 170, useNativeDriver: true }),
        Animated.spring(slide, { toValue: 0, useNativeDriver: true, bounciness: 4, speed: 14 }),
      ]).start();
    });
  };

  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    setAuthError('');
    setSubmitting(true);
    const result = isRegister
      ? await signUp(email, password)
      : await signIn(email, password);
    setSubmitting(false);
    if (!result.success) {
      setAuthError(result.error);
    }
  };

  const handleGoogle = () => {
    Alert.alert(
      'Coming soon',
      'Google sign-in will be available in an upcoming update. For now, please use your email and password.'
    );
  };

  const segTranslate = seg.interpolate({
    inputRange: [0, 1],
    outputRange: [0, segW / 2],
  });

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
                    <Ionicons name="lock-closed" size={24} color="#fff" />
                  </View>
                </View>
                <Text style={styles.brandName}>SplitVault</Text>
                <Text style={styles.brandTagline}>Your money, split smart</Text>
              </View>
            </View>
          </FadeInView>

          {/* Form sheet */}
          <View style={styles.sheet}>
            <View style={styles.sheetInner}>

              {/* Segmented control */}
              <View
                style={styles.segment}
                onLayout={(e) => setSegW(e.nativeEvent.layout.width)}
              >
                <Animated.View
                  style={[
                    styles.segHighlight,
                    { width: segW / 2, transform: [{ translateX: segTranslate }] },
                  ]}
                />
                <Pressable
                  style={styles.segBtn}
                  onPress={() => switchMode('login')}
                  android_ripple={{ color: colors.border, borderless: false }}
                >
                  <Text style={[styles.segText, !isRegister && styles.segTextActive]}>
                    Log In
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.segBtn}
                  onPress={() => switchMode('register')}
                  android_ripple={{ color: colors.border, borderless: false }}
                >
                  <Text style={[styles.segText, isRegister && styles.segTextActive]}>
                    Sign Up
                  </Text>
                </Pressable>
              </View>

              {/* Crossfading form body */}
              <Animated.View style={{ opacity: fade, transform: [{ translateX: slide }] }}>
                <Text style={styles.formSubtitle}>
                  {isRegister
                    ? 'Create your account — free and offline'
                    : 'Welcome back to your vault'}
                </Text>

                <PressableScale
                  style={styles.googleBtn}
                  onPress={handleGoogle}
                  android_ripple={{ color: colors.border }}
                >
                  <Ionicons name="logo-google" size={18} color="#EA4335" />
                  <Text style={styles.googleText}>Continue with Google</Text>
                </PressableScale>

                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>

                <FloatingField
                  label="Email"
                  icon="mail-outline"
                  value={email}
                  onChangeText={(t) => { setEmail(t); if (authError) setAuthError(''); }}
                  keyboardType="email-address"
                  autoComplete="email"
                  textContentType="emailAddress"
                  error={emailError}
                  errorText="Enter a valid email address"
                />

                <FloatingField
                  label="Password"
                  icon="lock-closed-outline"
                  value={password}
                  onChangeText={(t) => { setPassword(t); if (authError) setAuthError(''); }}
                  secure
                  autoComplete={isRegister ? 'password-new' : 'password'}
                  textContentType={isRegister ? 'newPassword' : 'password'}
                />

                {isRegister && password.length > 0 && (
                  <FadeInView duration={260} offset={6} style={styles.reqsContainer}>
                    {reqs.map((r) => (
                      <View key={r.label} style={styles.reqRow}>
                        <Ionicons
                          name={r.met ? 'checkmark-circle' : 'ellipse-outline'}
                          size={14}
                          color={r.met ? colors.income : colors.subtext}
                        />
                        <Text style={[styles.reqText, { color: r.met ? colors.income : colors.subtext }]}>
                          {r.label}
                        </Text>
                      </View>
                    ))}
                  </FadeInView>
                )}

                {isRegister && (
                  <FloatingField
                    label="Confirm Password"
                    icon="lock-closed-outline"
                    value={confirm}
                    onChangeText={setConfirm}
                    secure
                    autoComplete="password-new"
                    textContentType="newPassword"
                    error={confirmError}
                    errorText="Passwords don't match"
                    success={passwordsMatch}
                    successText="Passwords match"
                  />
                )}

                {!isRegister && (
                  <TouchableOpacity
                    style={styles.forgotWrap}
                    onPress={onForgotPassword}
                    hitSlop={8}
                  >
                    <Text style={styles.forgot}>Forgot password?</Text>
                  </TouchableOpacity>
                )}

                {authError ? (
                  <View style={styles.authErrorRow}>
                    <Ionicons name="alert-circle" size={15} color={colors.danger} />
                    <Text style={styles.authErrorText}>{authError}</Text>
                  </View>
                ) : null}

                <PressableScale
                  style={[styles.primaryBtn, { opacity: isValid && !submitting ? 1 : 0.5 }]}
                  onPress={handleSubmit}
                  disabled={!isValid || submitting}
                  android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.primaryBtnText}>
                        {isRegister ? 'Create account' : 'Log In'}
                      </Text>
                      <Ionicons name="arrow-forward" size={18} color="#fff" />
                    </>
                  )}
                </PressableScale>
              </Animated.View>

              <View style={styles.trustRow}>
                <Ionicons name="shield-checkmark-outline" size={13} color={colors.subtext} />
                <Text style={styles.trustText}>No ads. Your data stays on your device</Text>
              </View>

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
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
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
    paddingTop: 24,
    paddingHorizontal: 22,
    paddingBottom: 32 + (Platform.OS === 'ios' ? 12 : 0),
  },
  sheetInner: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 4,
    height: 48,
    marginBottom: 20,
    position: 'relative',
  },
  segHighlight: {
    position: 'absolute',
    top: 4,
    left: 4,
    bottom: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
  },
  segBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  segText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.subtext,
  },
  segTextActive: {
    color: '#fff',
  },
  formSubtitle: {
    fontSize: 14,
    color: COLORS.subtext,
    textAlign: 'center',
    marginBottom: 18,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 18,
    overflow: 'hidden',
  },
  googleText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.subtext,
    marginHorizontal: 10,
    letterSpacing: 1,
  },
  reqsContainer: {
    marginTop: 2,
    marginBottom: 14,
    gap: 7,
  },
  reqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reqText: {
    fontSize: 12,
  },
  forgotWrap: {
    alignSelf: 'flex-end',
    paddingVertical: 6,
    marginBottom: 4,
  },
  forgot: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 8,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  authErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    marginBottom: 2,
  },
  authErrorText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.danger,
    fontWeight: '600',
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 22,
  },
  trustText: {
    fontSize: 12,
    color: COLORS.subtext,
  },
});