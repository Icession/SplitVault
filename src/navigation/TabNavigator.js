import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeScreen from '../screens/HomeScreen';
import TransferScreen from '../screens/TransferScreen';
import HistoryScreen from '../screens/HistoryScreen';
import GoalsScreen from '../screens/GoalsScreen';
import SettingsScreen from '../screens/SettingsScreen';

import { useTheme } from '../theme/ThemeContext';

const Tab = createBottomTabNavigator();

const getTabIcon = (routeName, color) => {
  switch (routeName) {
    case 'Home': return <Ionicons name="home" size={22} color={color} />;
    case 'Transfer': return <Ionicons name="swap-horizontal" size={22} color={color} />;
    case 'Goals': return <Ionicons name="flag" size={22} color={color} />;
    case 'History': return <Ionicons name="time" size={22} color={color} />;
    case 'Settings': return <Ionicons name="settings-outline" size={22} color={color} />;
    default: return null;
  }
};

export default function TabNavigator({ onReset }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 65 + insets.bottom,
          paddingBottom: 10 + insets.bottom,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.subtext,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ color }) => getTabIcon(route.name, color),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Transfer" component={TransferScreen} />
      <Tab.Screen name="Goals" component={GoalsScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Settings">
        {() => <SettingsScreen onReset={onReset} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}