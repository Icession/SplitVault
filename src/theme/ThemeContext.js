// theme/ThemeContext.js
//
// One shared source of truth for the current theme. Any component can call
// useTheme() to get the active colors and to flip the theme. The choice is
// saved to AsyncStorage so it survives app restarts.

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { STORAGE_KEYS } from '../constants';
import { lightColors, darkColors } from './Themes';

// Default value is used if a component calls useTheme() WITHOUT being wrapped
// in <ThemeProvider>. It falls back to light mode instead of crashing.
const ThemeContext = createContext({
  colors: lightColors,
  isDark: false,
  toggleTheme: () => {},
  setScheme: () => {},
  ready: true,
});

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);
  const [ready, setReady] = useState(false);

  // Load the saved choice once, on startup.
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEYS.theme);
        if (saved === 'dark') setIsDark(true);
      } catch (e) {
        // ignore – fall back to light
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const persist = useCallback(async (dark) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.theme, dark ? 'dark' : 'light');
    } catch (e) {
      // ignore write failures
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      persist(next);
      return next;
    });
  }, [persist]);

  const setScheme = useCallback(
    (scheme) => {
      const dark = scheme === 'dark';
      setIsDark(dark);
      persist(dark);
    },
    [persist]
  );

  const value = {
    colors: isDark ? darkColors : lightColors,
    isDark,
    toggleTheme,
    setScheme,
    ready,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}