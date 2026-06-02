import React, { useRef, useEffect } from 'react';
import { Animated, Platform } from 'react-native';

const USE_NATIVE = Platform.OS !== 'web';

export default function FadeInView({
  children,
  style,
  delay = 0,
  duration = 450,
  offset = 14,
}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: USE_NATIVE,
    }).start();
  }, []);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [offset, 0],
  });

  return (
    <Animated.View style={[style, { opacity: progress, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}