import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants';

//  WALLETS 
export const getWallets = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.wallets);
    return data ? JSON.parse(data) : { savings: 0, expense: 0 };
  } catch (e) {
    console.error('getWallets error:', e);
    return { savings: 0, expense: 0 };
  }
};

export const saveWallets = async (wallets) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.wallets, JSON.stringify(wallets));
  } catch (e) {
    console.error('saveWallets error:', e);
  }
};

// TRANSACTIONS
export const getTransactions = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.transactions);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('getTransactions error:', e);
    return [];
  }
};

export const saveTransactions = async (transactions) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(transactions));
  } catch (e) {
    console.error('saveTransactions error:', e);
  }
};

export const addTransaction = async (entry) => {
  try {
    const existing = await getTransactions();
    const updated = [entry, ...existing];
    await saveTransactions(updated);
    return updated;
  } catch (e) {
    console.error('addTransaction error:', e);
  }
};

// GOALS
export const getGoals = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.goals);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('getGoals error:', e);
    return [];
  }
};

export const saveGoals = async (goals) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.goals, JSON.stringify(goals));
  } catch (e) {
    console.error('saveGoals error:', e);
  }
};

// PROFILE
export const getProfile = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.profile);
    return data ? JSON.parse(data) : { fullName: '', email: '', currency: 'PHP' };
  } catch (e) {
    console.error('getProfile error:', e);
    return { fullName: '', email: '', currency: 'PHP' };
  }
};

export const saveProfile = async (profile) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile));
  } catch (e) {
    console.error('saveProfile error:', e);
  }
};

// SETUP FLAG
export const getIsSetup = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.isSetup);
    return data === 'true';
  } catch (e) {
    console.error('getIsSetup error:', e);
    return false;
  }
};

export const setIsSetup = async () => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.isSetup, 'true');
  } catch (e) {
    console.error('setIsSetup error:', e);
  }
};