import React, { useRef } from 'react';
import { Animated, Pressable, Platform } from 'react-native';

const USE_NATIVE = Platform.OS !== 'web';

export default function PressableScale({
  children,
  style,
  onPress,
  disabled = false,
  scaleTo = 0.97,
  ...rest
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const animate = (toValue) => {
    Animated.spring(scale, {
      toValue,
      useNativeDriver: USE_NATIVE,
      bounciness: 0,
      speed: 40,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => !disabled && animate(scaleTo)}
      onPressOut={() => animate(1)}
      disabled={disabled}
      {...rest}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}