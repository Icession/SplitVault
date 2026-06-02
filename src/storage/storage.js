import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, CATEGORIES } from '../constants';

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

// CATEGORIES
export const getCategories = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.categories);
    return data ? JSON.parse(data) : CATEGORIES;
  } catch (e) {
    console.error('getCategories error:', e);
    return CATEGORIES;
  }
};

export const saveCategories = async (categories) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(categories));
  } catch (e) {
    console.error('saveCategories error:', e);
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

// BACKUP
export const exportData = async () => {
  const [wallets, transactions, goals, profile, categories, isSetup] = await Promise.all([
    getWallets(),
    getTransactions(),
    getGoals(),
    getProfile(),
    getCategories(),
    getIsSetup(),
  ]);
  return {
    app: 'SplitVault',
    schema: 1,
    exportedAt: new Date().toISOString(),
    data: { wallets, transactions, goals, profile, categories, isSetup },
  };
};

// Remove every app data key (used by the "Forgot PIN" full reset).
export const clearAllData = async () => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.wallets,
      STORAGE_KEYS.transactions,
      STORAGE_KEYS.goals,
      STORAGE_KEYS.isSetup,
      STORAGE_KEYS.profile,
      STORAGE_KEYS.categories,
    ]);
  } catch (e) {
    console.error('clearAllData error:', e);
  }
};