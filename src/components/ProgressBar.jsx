import React, { useRef, useEffect } from 'react';
import { Animated, View } from 'react-native';

export default function ProgressBar({
  progress,
  color,
  trackColor,
  height = 8,
  radius = 999,
  duration = 700,
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const target = Math.max(0, Math.min(1, progress || 0));

  useEffect(() => {
    Animated.timing(anim, {
      toValue: target,
      duration,
      useNativeDriver: false, 
    }).start();
  }, [target]);

  const width = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={{ height, backgroundColor: trackColor, borderRadius: radius, overflow: 'hidden' }}>
      <Animated.View style={{ height: '100%', width, backgroundColor: color, borderRadius: radius }} />
    </View>
  );
}