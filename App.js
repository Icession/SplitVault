import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { getIsSetup } from './src/storage/storage';
import { COLORS } from './src/constants';
import TabNavigator from './src/navigation/TabNavigator';
import SetupScreen from './src/screens/SetupScreen';
import AddExpenseScreen from './src/screens/AddExpenseScreen';
import AddIncomeScreen from './src/screens/AddIncomeScreen';

const Stack = createNativeStackNavigator();

export default function App() {

  const [isSetup, setIsSetup] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSetup = async () => {
      const setupComplete = await getIsSetup();
      setIsSetup(setupComplete);
      setLoading(false);
    };
    checkSetup();
  }, []);

  if (loading) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.savings} />
        </View>
      </SafeAreaProvider>
    );
  }

  if (!isSetup) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <NavigationContainer>
            <StatusBar style="light" />
            <SetupScreen onComplete={() => setIsSetup(true)} />
          </NavigationContainer>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <NavigationContainer>
          <StatusBar style="light" />
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Main">
              {() => <TabNavigator onReset={() => setIsSetup(false)} />}
            </Stack.Screen>
            <Stack.Screen
              name="AddExpense"
              component={AddExpenseScreen}
              options={{ animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="AddIncome"
              component={AddIncomeScreen}
              options={{ animation: 'slide_from_bottom' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});