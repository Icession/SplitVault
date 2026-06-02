import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../theme/ThemeContext';
import PressableScale from './PressableScale';
export default function PinPad({ value, onChange, length = 4, error = false, leftIcon, onLeftPress }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const press = (d) => { if (value.length < length) onChange(value + d); };
  const del = () => onChange(value.slice(0, -1));
  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <View style={styles.wrap}>
      <View style={styles.dots}>
        {Array.from({ length }).map((_, i) => {
          const filled = i < value.length;
          return (
            <View
              key={i}
              style={[
                styles.dot,
                filled && { backgroundColor: colors.primary, borderColor: colors.primary },
                error && { backgroundColor: colors.danger, borderColor: colors.danger },
              ]}
            />
          );
        })}
      </View>

      <View style={styles.grid}>
        {digits.map((d) => (
          <PressableScale key={d} style={styles.key} onPress={() => press(d)}>
            <Text style={styles.keyText}>{d}</Text>
          </PressableScale>
        ))}

        {leftIcon ? (
          <PressableScale style={styles.key} onPress={onLeftPress}>
            <Ionicons name={leftIcon} size={26} color={colors.primary} />
          </PressableScale>
        ) : (
          <View style={styles.key} />
        )}

        <PressableScale style={styles.key} onPress={() => press('0')}>
          <Text style={styles.keyText}>0</Text>
        </PressableScale>

        <PressableScale style={styles.key} onPress={del}>
          <Ionicons name="backspace-outline" size={26} color={colors.text} />
        </PressableScale>
      </View>
    </View>
  );
}

const makeStyles = (COLORS) => StyleSheet.create({
  wrap: { alignItems: 'center' },
  dots: { flexDirection: 'row', gap: 18, marginBottom: 36 },
  dot: {
    width: 15,
    height: 15,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: 'transparent',
  },
  grid: {
    width: 300,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  key: {
    width: '33.33%',
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    fontSize: 28,
    fontWeight: '600',
    color: COLORS.text,
  },
});