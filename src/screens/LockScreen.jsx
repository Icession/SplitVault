import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as LocalAuthentication from 'expo-local-authentication';

import { useTheme } from '../theme/ThemeContext';
import { getPin, isBiometricEnabled } from '../storage/lock';
import PinPad from '../components/PinPad';
import useConfirm from '../components/useConfirm';

export default function LockScreen({ onUnlock, onReset }) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { confirm, dialog } = useConfirm();

  const [pin, setPin] = useState('');
  const [storedPin, setStoredPin] = useState(null);
  const [error, setError] = useState(false);
  const [bioOn, setBioOn] = useState(false);

  const tryBiometric = useCallback(async () => {
    try {
      const hw = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hw || !enrolled) return;
      const res = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock SplitVault',
        fallbackLabel: 'Use PIN',
      });
      if (res.success) onUnlock();
    } catch (e) {}
  }, [onUnlock]);

  useEffect(() => {
    let active = true;
    (async () => {
      const sp = await getPin();
      const bio = await isBiometricEnabled();
      if (!active) return;
      setStoredPin(sp);
      setBioOn(bio);
      if (bio) tryBiometric();
    })();
    return () => { active = false; };
  }, [tryBiometric]);

  useEffect(() => {
    if (pin.length !== 4) return;
    if (storedPin && pin === storedPin) {
      onUnlock();
    } else {
      setError(true);
      const t = setTimeout(() => { setPin(''); setError(false); }, 600);
      return () => clearTimeout(t);
    }
  }, [pin, storedPin, onUnlock]);

  const handleForgot = async () => {
    const ok = await confirm({
      title: 'Forgot PIN?',
      message: "Your data is stored only on this device, so a forgotten PIN can't be recovered. Resetting the app erases everything and starts fresh.",
      confirmText: 'Reset App',
      destructive: true,
      icon: 'warning-outline',
    });
    if (ok) onReset();
  };

  return (
    <View style={styles.root}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.badge}>
        <Ionicons name="lock-closed" size={28} color="#fff" />
      </View>
      <Text style={styles.title}>Enter your PIN</Text>
      <Text style={styles.subtitle}>Unlock SplitVault to continue</Text>

      <PinPad
        value={pin}
        onChange={setPin}
        error={error}
        leftIcon={bioOn ? 'finger-print' : undefined}
        onLeftPress={bioOn ? tryBiometric : undefined}
      />

      <TouchableOpacity onPress={handleForgot} hitSlop={10} style={styles.forgot}>
        <Text style={styles.forgotText}>Forgot PIN?</Text>
      </TouchableOpacity>

      {dialog}
    </View>
  );
}

const makeStyles = (COLORS) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  badge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.subtext,
    marginBottom: 40,
  },
  forgot: { marginTop: 28, padding: 8 },
  forgotText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
});