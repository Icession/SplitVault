import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';

import { db, auth } from '../firebase/firebaseConfig';
import { CATEGORIES } from '../constants';

// Every user's data lives under users/{uid}/app/{key}, so accounts never
// see each other's data. Each "key" below mirrors the old storage keys.
const uid = () => (auth.currentUser ? auth.currentUser.uid : null);
const ref = (u, key) => doc(db, 'users', u, 'app', key);

const readDoc = async (key, fallback) => {
  try {
    const u = uid();
    if (!u) return fallback;
    const snap = await getDoc(ref(u, key));
    return snap.exists() ? snap.data() : fallback;
  } catch (e) {
    console.error(`read ${key} error:`, e);
    return fallback;
  }
};

const writeDoc = async (key, data) => {
  try {
    const u = uid();
    if (!u) return;
    await setDoc(ref(u, key), data);
  } catch (e) {
    console.error(`write ${key} error:`, e);
  }
};

// WALLETS
export const getWallets = async () => {
  const d = await readDoc('wallets', { savings: 0, expense: 0 });
  return { savings: d.savings || 0, expense: d.expense || 0 };
};

export const saveWallets = async (wallets) =>
  writeDoc('wallets', {
    savings: wallets.savings || 0,
    expense: wallets.expense || 0,
  });

// TRANSACTIONS (stored as one document holding the array, mirroring the old shape)
export const getTransactions = async () => {
  const d = await readDoc('transactions', { list: [] });
  return Array.isArray(d.list) ? d.list : [];
};

export const saveTransactions = async (transactions) =>
  writeDoc('transactions', { list: transactions });

export const addTransaction = async (entry) => {
  const existing = await getTransactions();
  const updated = [entry, ...existing]; // newest first
  await saveTransactions(updated);
  return updated;
};

// GOALS
export const getGoals = async () => {
  const d = await readDoc('goals', { list: [] });
  return Array.isArray(d.list) ? d.list : [];
};

export const saveGoals = async (goals) => writeDoc('goals', { list: goals });

// PROFILE
export const getProfile = async () => {
  const d = await readDoc('profile', { fullName: '', email: '', currency: 'PHP' });
  return {
    fullName: d.fullName || '',
    email: d.email || '',
    currency: d.currency || 'PHP',
  };
};

export const saveProfile = async (profile) =>
  writeDoc('profile', {
    fullName: profile.fullName || '',
    email: profile.email || '',
    currency: profile.currency || 'PHP',
  });

// CATEGORIES
export const getCategories = async () => {
  const d = await readDoc('categories', null);
  if (d && Array.isArray(d.list)) return d.list;
  return CATEGORIES;
};

export const saveCategories = async (categories) =>
  writeDoc('categories', { list: categories });

// SETUP FLAG
export const getIsSetup = async () => {
  const d = await readDoc('meta', { isSetup: false });
  return d.isSetup === true;
};

export const setIsSetup = async () => writeDoc('meta', { isSetup: true });

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

// Remove all of the signed-in user's data (used by the full reset).
export const clearAllData = async () => {
  try {
    const u = uid();
    if (!u) return;
    const keys = ['wallets', 'transactions', 'goals', 'profile', 'categories', 'meta'];
    await Promise.all(keys.map((k) => deleteDoc(ref(u, k))));
  } catch (e) {
    console.error('clearAllData error:', e);
  }
};