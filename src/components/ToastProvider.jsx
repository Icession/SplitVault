import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { Animated, StyleSheet, Text, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../theme/ThemeContext';

const ToastContext = createContext(() => {});
export const useToast = () => useContext(ToastContext);
export function ToastProvider({ children }) {
  const { colors } = useTheme();
  const [toast, setToast] = useState({ message: '', icon: 'checkmark-circle', color: colors.primary });
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;
  const timer = useRef(null);

  const showToast = useCallback((message, opts = {}) => {
    if (!message) return;
    setToast({
      message,
      icon: opts.icon || 'checkmark-circle',
      color: opts.color || colors.primary,
    });
    if (timer.current) clearTimeout(timer.current);
    opacity.setValue(0);
    translateY.setValue(24);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 6, speed: 14 }),
    ]).start();
    timer.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 24, duration: 220, useNativeDriver: true }),
      ]).start();
    }, 2200);
  }, [colors.primary, opacity, translateY]);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <Animated.View
        pointerEvents="none"
        style={[styles.wrap, { opacity, transform: [{ translateY }] }]}
      >
        {toast.message ? (
          <View style={[styles.toast, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name={toast.icon} size={18} color={toast.color} />
            <Text style={[styles.text, { color: colors.text }]} numberOfLines={2}>
              {toast.message}
            </Text>
          </View>
        ) : null}
      </Animated.View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: Platform.OS === 'ios' ? 96 : 84,
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    maxWidth: 440,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  text: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
});