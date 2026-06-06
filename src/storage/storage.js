import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';

import { db, auth } from '../firebase/firebaseConfig';
import { CATEGORIES } from '../constants';

// LOCAL-FIRST + CLOUD SYNC
// ------------------------
// The phone's local storage (AsyncStorage) is the source of truth: every read
// comes from local (instant + works offline). Every save writes local first,
// then pushes to Firestore in the background as a cloud backup. On a brand-new
// device, syncOnLogin() pulls cloud data down to restore it.

const uid = () => (auth.currentUser ? auth.currentUser.uid : null);

const KEYS = ['wallets', 'transactions', 'goals', 'profile', 'categories', 'meta'];

// Local keys are scoped per user so multiple accounts on one device don't mix.
const localKey = (u, key) => `sv:${u}:${key}`;
const cloudRef = (u, key) => doc(db, 'users', u, 'app', key);

// ---- LOCAL (source of truth) ----
const readLocal = async (key, fallback) => {
  try {
    const u = uid();
    if (!u) return fallback;
    const raw = await AsyncStorage.getItem(localKey(u, key));
    return raw != null ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.error(`readLocal ${key} error:`, e);
    return fallback;
  }
};

const writeLocal = async (key, data) => {
  try {
    const u = uid();
    if (!u) return;
    await AsyncStorage.setItem(localKey(u, key), JSON.stringify(data));
  } catch (e) {
    console.error(`writeLocal ${key} error:`, e);
  }
};

// ---- CLOUD (best-effort backup) ----
const writeCloud = (key, data) => {
  const u = uid();
  if (!u) return;
  // Fire-and-forget. If offline, this fails quietly; the next sync catches up.
  setDoc(cloudRef(u, key), data).catch(() => {});
};

// Save = write local now (awaited), back up to cloud in the background.
const save = async (key, data) => {
  await writeLocal(key, data);
  writeCloud(key, data);
};

// ---- SYNC ----
const pushAllToCloud = async () => {
  const u = uid();
  if (!u) return;
  for (const key of KEYS) {
    try {
      const raw = await AsyncStorage.getItem(localKey(u, key));
      if (raw != null) await setDoc(cloudRef(u, key), JSON.parse(raw));
    } catch (e) {
      break; // offline or error: stop (best-effort)
    }
  }
};

const pullAllToLocal = async () => {
  const u = uid();
  if (!u) return;
  for (const key of KEYS) {
    try {
      const snap = await getDoc(cloudRef(u, key));
      if (snap.exists()) {
        await AsyncStorage.setItem(localKey(u, key), JSON.stringify(snap.data()));
      }
    } catch (e) {
      break; // offline: can't restore right now
    }
  }
};

// Run right after login. If this device already has local data, back it up to
// the cloud. If it's a fresh device, pull the cloud copy down to restore it.
export const syncOnLogin = async () => {
  const u = uid();
  if (!u) return;
  try {
    const hasLocal = await AsyncStorage.getItem(localKey(u, 'meta'));
    if (hasLocal != null) {
      pushAllToCloud(); // background backup
    } else {
      await pullAllToLocal(); // wait so setup state is correct on a new device
    }
  } catch (e) {
    console.error('syncOnLogin error:', e);
  }
};

// ---- PUBLIC API (same signatures the screens already use) ----
export const getWallets = async () => {
  const d = await readLocal('wallets', { savings: 0, expense: 0 });
  return { savings: d.savings || 0, expense: d.expense || 0 };
};

export const saveWallets = async (wallets) =>
  save('wallets', { savings: wallets.savings || 0, expense: wallets.expense || 0 });

export const getTransactions = async () => {
  const d = await readLocal('transactions', { list: [] });
  return Array.isArray(d.list) ? d.list : [];
};

export const saveTransactions = async (transactions) =>
  save('transactions', { list: transactions });

export const addTransaction = async (entry) => {
  const existing = await getTransactions();
  const updated = [entry, ...existing]; // newest first
  await saveTransactions(updated);
  return updated;
};

export const getGoals = async () => {
  const d = await readLocal('goals', { list: [] });
  return Array.isArray(d.list) ? d.list : [];
};

export const saveGoals = async (goals) => save('goals', { list: goals });

export const getProfile = async () => {
  const d = await readLocal('profile', {
    firstName: '',
    lastName: '',
    fullName: '',
    username: '',
    email: '',
    currency: 'PHP',
  });
  const firstName = d.firstName || '';
  const lastName = d.lastName || '';
  const fullName =
    firstName || lastName ? `${firstName} ${lastName}`.trim() : d.fullName || '';
  // Email always reflects the signed-up account, even for older profiles.
  const email = d.email || (auth.currentUser ? auth.currentUser.email : '') || '';
  return {
    firstName,
    lastName,
    fullName,
    username: d.username || '',
    email,
    currency: d.currency || 'PHP',
  };
};

export const saveProfile = async (profile) => {
  const firstName = (profile.firstName || '').trim();
  const lastName = (profile.lastName || '').trim();
  const fullName =
    firstName || lastName
      ? `${firstName} ${lastName}`.trim()
      : (profile.fullName || '').trim();
  return save('profile', {
    firstName,
    lastName,
    fullName,
    username: (profile.username || '').trim(),
    email: profile.email || '',
    currency: profile.currency || 'PHP',
  });
};

export const getCategories = async () => {
  const d = await readLocal('categories', null);
  if (d && Array.isArray(d.list)) return d.list;
  return CATEGORIES;
};

export const saveCategories = async (categories) =>
  save('categories', { list: categories });

export const getIsSetup = async () => {
  const d = await readLocal('meta', { isSetup: false });
  return d.isSetup === true;
};

export const setIsSetup = async () => save('meta', { isSetup: true });

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

// Wipe this user's data locally and in the cloud (best-effort).
export const clearAllData = async () => {
  const u = uid();
  if (!u) return;
  try {
    await AsyncStorage.multiRemove(KEYS.map((k) => localKey(u, k)));
  } catch (e) {
    console.error('clear local error:', e);
  }
  for (const key of KEYS) {
    deleteDoc(cloudRef(u, key)).catch(() => {});
  }
};