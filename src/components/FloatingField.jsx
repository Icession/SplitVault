import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../theme/ThemeContext';

// Material-style filled text field with a floating label and animated underline.
export default function FloatingField({
  label,
  value,
  onChangeText,
  icon,
  secure = false,
  error = false,
  errorText,
  success = false,
  successText,
  keyboardType,
  autoCapitalize = 'none',
  autoComplete,
  textContentType,
  autoCorrect = false,
  inputRef,
  returnKeyType,
  onSubmitEditing,
  blurOnSubmit,
}) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [focused, setFocused] = useState(false);
  const [hide, setHide] = useState(secure);

  const active = focused || (value && value.length > 0);
  const anim = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: active ? 1 : 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [active]);

  const labelTop = anim.interpolate({ inputRange: [0, 1], outputRange: [19, 8] });
  const labelSize = anim.interpolate({ inputRange: [0, 1], outputRange: [16, 12] });
  const labelColor = error
    ? colors.danger
    : focused
    ? colors.primary
    : colors.subtext;
  const underlineColor = error
    ? colors.danger
    : focused
    ? colors.primary
    : colors.border;

  return (
    <View style={styles.wrap}>
      <View style={[
        styles.field,
        { borderBottomColor: underlineColor, borderBottomWidth: focused || error ? 2 : 1.5 },
      ]}>
        {icon ? (
          <Ionicons
            name={icon}
            size={20}
            color={focused ? colors.primary : colors.subtext}
            style={styles.icon}
          />
        ) : null}

        <View style={styles.center}>
          <Animated.Text
            pointerEvents="none"
            style={[styles.label, { top: labelTop, fontSize: labelSize, color: labelColor }]}
          >
            {label}
          </Animated.Text>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            secureTextEntry={hide}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            autoComplete={autoComplete}
            textContentType={textContentType}
            autoCorrect={autoCorrect}
            returnKeyType={returnKeyType}
            onSubmitEditing={onSubmitEditing}
            blurOnSubmit={blurOnSubmit}
          />
        </View>

        {secure ? (
          <TouchableOpacity onPress={() => setHide((h) => !h)} hitSlop={12}>
            <Ionicons
              name={hide ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={colors.subtext}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      {error && errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
      {!error && success && successText ? (
        <Text style={styles.successText}>{successText}</Text>
      ) : null}
    </View>
  );
}

const makeStyles = (COLORS) => StyleSheet.create({
  wrap: {
    marginBottom: 14,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    paddingHorizontal: 14,
    height: 60,
  },
  icon: {
    marginRight: 10,
  },
  center: {
    flex: 1,
    height: '100%',
    position: 'relative',
    justifyContent: 'center',
  },
  label: {
    position: 'absolute',
    left: 0,
    fontWeight: '500',
  },
  input: {
    fontSize: 16,
    color: COLORS.text,
    paddingTop: 20,
    paddingBottom: 6,
    height: '100%',
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
});