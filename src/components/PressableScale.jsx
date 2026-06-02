import React, { useRef } from 'react';
import { Animated, Pressable, Platform } from 'react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const USE_NATIVE = Platform.OS !== 'web';

// A pressable that gently scales while pressed. The passed `style` is applied
// directly to the (animated) Pressable, so layout props like flex:1 work
// correctly and the whole element — background included — scales.
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
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => !disabled && animate(scaleTo)}
      onPressOut={() => animate(1)}
      disabled={disabled}
      style={[style, { transform: [{ scale }] }]}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}