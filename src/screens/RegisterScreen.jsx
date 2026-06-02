import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../theme/ThemeContext';
import FadeInView from '../components/FadeInView';
import PressableScale from '../components/PressableScale';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterScreen({ onSubmit, onGoogle, onGoToLogin }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focused, setFocused] = useState(null);

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

  const isFormValid = emailValid && passwordValid && passwordsMatch;

  const wrapStyle = (field, error) => [
    styles.inputWrap,
    focused === field && styles.inputWrapFocus,
    error && styles.inputWrapError,
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inner}>

          <FadeInView delay={0} style={styles.headerBlock}>
            <View style={styles.brandBadge}>
              <Ionicons name="lock-closed" size={26} color="#fff" />
            </View>
            <Text style={styles.brandName}>SplitVault</Text>
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>Start splitting your money in minutes</Text>
          </FadeInView>

          <FadeInView delay={120}>
            <View style={styles.card}>
              <PressableScale style={styles.googleBtn} onPress={onGoogle}>
                <Ionicons name="logo-google" size={18} color="#EA4335" />
                <Text style={styles.googleText}>Continue with Google</Text>
              </PressableScale>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Email</Text>
                <View style={wrapStyle('email', emailError)}>
                  <Ionicons name="mail-outline" size={18} color={focused === 'email' ? colors.primary : colors.subtext} />
                  <TextInput
                    style={styles.input}
                    placeholder="you@example.com"
                    placeholderTextColor={colors.subtext}
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused(null)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="emailAddress"
                    autoComplete="email"
                  />
                </View>
                {emailError && (
                  <Text style={styles.errorText}>Enter a valid email address</Text>
                )}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Password</Text>
                <View style={wrapStyle('password', false)}>
                  <Ionicons name="lock-closed-outline" size={18} color={focused === 'password' ? colors.primary : colors.subtext} />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor={colors.subtext}
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused(null)}
                    secureTextEntry={!showPassword}
                    textContentType="newPassword"
                    autoComplete="password-new"
                  />
                  <TouchableOpacity onPress={() => setShowPassword((s) => !s)} hitSlop={8}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={colors.subtext}
                    />
                  </TouchableOpacity>
                </View>

                {password.length > 0 && (
                  <FadeInView duration={300} offset={6} style={styles.reqsContainer}>
                    {reqs.map((r) => (
                      <View key={r.label} style={styles.reqRow}>
                        <Ionicons
                          name={r.met ? 'checkmark-circle' : 'ellipse-outline'}
                          size={14}
                          color={r.met ? colors.income : colors.subtext}
                        />
                        <Text style={[
                          styles.reqText,
                          { color: r.met ? colors.income : colors.subtext },
                        ]}>
                          {r.label}
                        </Text>
                      </View>
                    ))}
                  </FadeInView>
                )}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={wrapStyle('confirm', confirmError)}>
                  <Ionicons name="lock-closed-outline" size={18} color={focused === 'confirm' ? colors.primary : colors.subtext} />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor={colors.subtext}
                    value={confirm}
                    onChangeText={setConfirm}
                    onFocus={() => setFocused('confirm')}
                    onBlur={() => setFocused(null)}
                    secureTextEntry={!showConfirm}
                    textContentType="newPassword"
                    autoComplete="password-new"
                  />
                  <TouchableOpacity onPress={() => setShowConfirm((s) => !s)} hitSlop={8}>
                    <Ionicons
                      name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={colors.subtext}
                    />
                  </TouchableOpacity>
                </View>
                {confirmError && (
                  <Text style={styles.errorText}>Passwords don't match</Text>
                )}
                {passwordsMatch && (
                  <Text style={styles.successText}>Passwords match</Text>
                )}
              </View>

              <PressableScale
                style={[styles.primaryBtn, { opacity: isFormValid ? 1 : 0.5 }]}
                onPress={onSubmit}
                disabled={!isFormValid}
              >
                <Text style={styles.primaryBtnText}>Create account</Text>
              </PressableScale>
            </View>
          </FadeInView>

          <FadeInView delay={240} style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={onGoToLogin} hitSlop={8}>
              <Text style={styles.footerLink}>Log in</Text>
            </TouchableOpacity>
          </FadeInView>

        </View>
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
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  inner: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  headerBlock: {
    alignItems: 'center',
    marginBottom: 24,
  },
  brandBadge: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  brandName: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: COLORS.primary,
    marginBottom: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.subtext,
    textAlign: 'center',
    marginTop: 6,
  },
  card: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 4,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 13,
    marginBottom: 18,
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
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 7,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
  },
  inputWrapFocus: {
    borderColor: COLORS.primary,
  },
  inputWrapError: {
    borderColor: COLORS.danger,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.danger,
    marginTop: 6,
  },
  successText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.income,
    marginTop: 6,
  },
  reqsContainer: {
    marginTop: 12,
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
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 6,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 22,
  },
  footerText: {
    fontSize: 13,
    color: COLORS.subtext,
  },
  footerLink: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
});