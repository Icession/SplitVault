import { Platform } from 'react-native';
if (Platform.OS !== 'web') {
  require('react-native-gesture-handler');
}

import React, { useState, useEffect, useMemo } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { getIsSetup, clearAllData } from './src/storage/storage';
import { isLockEnabled, clearLock } from './src/storage/lock';
import { subscribeToAuth, logOut } from './src/firebase/auth';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { ToastProvider } from './src/components/ToastProvider';
import TabNavigator from './src/navigation/TabNavigator';
import SetupScreen from './src/screens/SetupScreen';
import AuthFlow from './src/navigation/AuthFlow';
import LockScreen from './src/screens/LockScreen';

function AppContent() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  const [isSetup, setIsSetup] = useState(false);
  const [loadingSetup, setLoadingSetup] = useState(false);

  const [lockChecked, setLockChecked] = useState(false);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToAuth((u) => {
      setUser(u);
      setAuthReady(true);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    let active = true;
    isLockEnabled().then((on) => {
      if (active) {
        setLocked(on);
        setLockChecked(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    let active = true;
    setLoadingSetup(true);
    getIsSetup().then((setupComplete) => {
      if (active) {
        setIsSetup(setupComplete);
        setLoadingSetup(false);
      }
    });
    return () => {
      active = false;
    };
  }, [user]);

  const navTheme = isDark
    ? { ...DarkTheme, colors: { ...DarkTheme.colors, background: colors.background } }
    : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.background } };

  const handleFullReset = async () => {
    await clearAllData();
    await clearLock();
    setLocked(false);
    await logOut();
  };

  const Spinner = () => (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.savings} />
      </View>
    </SafeAreaView>
  );

  if (!lockChecked || !authReady) {
    return <Spinner />;
  }

  if (locked) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <LockScreen onUnlock={() => setLocked(false)} onReset={handleFullReset} />
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <AuthFlow />
      </SafeAreaView>
    );
  }

  if (loadingSetup) {
    return <Spinner />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <NavigationContainer theme={navTheme}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        {isSetup ? (
          <TabNavigator onReset={handleFullReset} />
        ) : (
          <SetupScreen onComplete={() => setIsSetup(true)} />
        )}
      </NavigationContainer>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const createStyles = (COLORS) => StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});