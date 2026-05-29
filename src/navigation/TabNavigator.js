import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import TransferScreen from '../screens/TransferScreen';
import HistoryScreen from '../screens/HistoryScreen';
import GoalsScreen from '../screens/GoalsScreen';
import SettingsScreen from '../screens/SettingsScreen';

import { COLORS } from '../constants';

const Tab = createBottomTabNavigator();

export default function TabNavigator({ onReset }) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.card,
          borderTopColor: COLORS.border,
          height: 65,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarInactiveTintColor: COLORS.subtext,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarActiveTintColor: COLORS.savings,
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Transfer"
        component={TransferScreen}
        options={{
          tabBarActiveTintColor: COLORS.transfer,
          tabBarIcon: ({ color }) => (
            <Ionicons name="swap-horizontal" size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Goals"
        component={GoalsScreen}
        options={{
          tabBarActiveTintColor: COLORS.goals,
          tabBarIcon: ({ color }) => (
            <Ionicons name="flag" size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarActiveTintColor: COLORS.expense,
          tabBarIcon: ({ color }) => (
            <Ionicons name="receipt" size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        options={{
          tabBarActiveTintColor: COLORS.text,
          tabBarIcon: ({ color }) => (
            <Ionicons name="settings-sharp" size={22} color={color} />
          ),
        }}
      >
        {() => <SettingsScreen onReset={onReset} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}