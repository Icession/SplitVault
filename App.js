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
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import TabNavigator from './src/navigation/TabNavigator';
import SetupScreen from './src/screens/SetupScreen';
import AuthFlow from './src/navigation/AuthFlow';
import LockScreen from './src/screens/LockScreen';

function AppContent() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSetup, setIsSetup] = useState(false);
  const [loading, setLoading] = useState(true);

  const [lockChecked, setLockChecked] = useState(false);
  const [locked, setLocked] = useState(false);
  
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
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    getIsSetup().then((setupComplete) => {
      if (active) {
        setIsSetup(setupComplete);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [isLoggedIn]);

  const navTheme = isDark
    ? { ...DarkTheme, colors: { ...DarkTheme.colors, background: colors.background } }
    : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.background } };

  const handleLockReset = async () => {
    await clearAllData();
    await clearLock();
    setLocked(false);
    setIsLoggedIn(false);
    setIsSetup(false);
  };

  if (!lockChecked) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.savings} />
        </View>
      </SafeAreaView>
    );
  }

  if (locked) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <LockScreen
          onUnlock={() => {
            setLocked(false);
            setIsLoggedIn(true);
          }}
          onReset={handleLockReset}
        />
      </SafeAreaView>
    );
  }

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <AuthFlow onAuthenticated={() => setIsLoggedIn(true)} />
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.savings} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <NavigationContainer theme={navTheme}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        {isSetup ? (
          <TabNavigator
            onReset={() => {
              setIsLoggedIn(false);
            }}
          />
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
        <AppContent />
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