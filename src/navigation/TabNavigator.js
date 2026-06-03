import React from 'react';
import { View, Text, Pressable, Platform, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeScreen from '../screens/HomeScreen';
import TransferScreen from '../screens/TransferScreen';
import HistoryScreen from '../screens/HistoryScreen';
import GoalsScreen from '../screens/GoalsScreen';
import InsightsScreen from '../screens/InsightsScreen';
import SettingsScreen from '../screens/SettingsScreen';

import { useTheme } from '../theme/ThemeContext';

const Tab = createBottomTabNavigator();

const getTabIcon = (routeName, color) => {
  switch (routeName) {
    case 'Home': return <Ionicons name="home" size={22} color={color} />;
    case 'Transfer': return <Ionicons name="swap-horizontal" size={22} color={color} />;
    case 'Goals': return <Ionicons name="flag" size={22} color={color} />;
    case 'History': return <Ionicons name="time" size={22} color={color} />;
    case 'Insights': return <Ionicons name="pie-chart" size={22} color={color} />;
    case 'Settings': return <Ionicons name="settings-outline" size={22} color={color} />;
    default: return null;
  }
};

// Custom tab bar so we control the icon + label layout directly. This avoids
// React Navigation's built-in bar overriding bottom spacing on web (which was
// clipping the labels), while still looking the same on the phone.
function CustomTabBar({ state, navigation, colors, insets }) {
  const bottomPad = 10 + (Platform.OS === 'web' ? 12 : insets.bottom);

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          paddingBottom: bottomPad,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const color = focused ? colors.primary : colors.subtext;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable key={route.key} onPress={onPress} style={styles.tab}>
            {getTabIcon(route.name, color)}
            <Text style={[styles.label, { color }]} numberOfLines={1}>
              {route.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabNavigator({ onReset }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => (
        <CustomTabBar {...props} colors={colors} insets={insets} />
      )}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Transfer" component={TransferScreen} />
      <Tab.Screen name="Goals" component={GoalsScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Insights" component={InsightsScreen} />
      <Tab.Screen name="Settings">
        {() => <SettingsScreen onReset={onReset} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
});