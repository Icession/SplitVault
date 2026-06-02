import React from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../theme/ThemeContext';
import PressableScale from './PressableScale';

// Themed in-app confirmation dialog. Works on web and native (unlike Alert
// button callbacks, which don't fire on react-native-web).
export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  destructive = false,
  icon,
  onConfirm,
  onCancel,
}) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const accent = destructive ? colors.danger : colors.primary;

  return (
    <Modal visible={!!visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.box}>
          {icon ? (
            <View style={[styles.iconWrap, { backgroundColor: accent + '22' }]}>
              <Ionicons name={icon} size={24} color={accent} />
            </View>
          ) : null}
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {message ? <Text style={styles.message}>{message}</Text> : null}

          <View style={styles.actions}>
            <PressableScale
              style={styles.cancelBtn}
              onPress={onCancel}
              android_ripple={{ color: colors.border }}
            >
              <Text style={styles.cancelText}>{cancelText}</Text>
            </PressableScale>
            <PressableScale
              style={[styles.confirmBtn, { backgroundColor: accent }]}
              onPress={onConfirm}
              android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
            >
              <Text style={styles.confirmText}>{confirmText}</Text>
            </PressableScale>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (COLORS) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  box: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.card,
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  message: {
    fontSize: 14,
    color: COLORS.subtext,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    overflow: 'hidden',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.subtext,
  },
  confirmBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    overflow: 'hidden',
  },
  confirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});