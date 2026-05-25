import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// ─── SCREEN IMPORTS ───────────────────────────────────
// We import each screen so the navigator knows what to show
// when the user taps a tab. We'll create these files next.
import HomeScreen from '../screens/HomeScreen';
import AddExpenseScreen from '../screens/AddExpenseScreen';
import AddIncomeScreen from '../screens/AddIncomeScreen';
import TransferScreen from '../screens/TransferScreen';
import HistoryScreen from '../screens/HistoryScreen';
import GoalsScreen from '../screens/GoalsScreen';

import { COLORS } from '../constants';

// ─── TAB NAVIGATOR INSTANCE ───────────────────────────
// createBottomTabNavigator() gives us a Tab object with
// two parts: Tab.Navigator (the container) and Tab.Screen
// (each individual tab/page)
const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      // ─── TAB BAR STYLING ────────────────────────────
      // This controls how the entire bottom bar looks
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.card,
          borderTopColor: COLORS.border,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: COLORS.savings,
        tabBarInactiveTintColor: COLORS.subtext,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      {/* ─── EACH TAB ─────────────────────────────────
          Tab.Screen registers a screen to a tab.
          - name: used internally for navigation
          - component: the screen to render
          - options: label and icon for that tab        */}

      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => (
            // We'll replace these with icons later
            // For now, emojis work as placeholders
            <Text style={{ fontSize: 20 }}>🏠</Text>
          ),
        }}
      />

      <Tab.Screen
        name="AddExpense"
        component={AddExpenseScreen}
        options={{
          tabBarLabel: 'Expense',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20 }}>➖</Text>
          ),
        }}
      />

      <Tab.Screen
        name="AddIncome"
        component={AddIncomeScreen}
        options={{
          tabBarLabel: 'Income',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20 }}>➕</Text>
          ),
        }}
      />

      <Tab.Screen
        name="Transfer"
        component={TransferScreen}
        options={{
          tabBarLabel: 'Transfer',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20 }}>🔁</Text>
          ),
        }}
      />

      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarLabel: 'History',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20 }}>📋</Text>
          ),
        }}
      />

      <Tab.Screen
        name="Goals"
        component={GoalsScreen}
        options={{
          tabBarLabel: 'Goals',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20 }}>🎯</Text>
          ),
        }}
      />

    </Tab.Navigator>
  );
}