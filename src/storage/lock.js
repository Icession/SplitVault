import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const PIN_KEY = 'sv_pin';
const ENABLED_KEY = 'sv_applock';
const BIO_KEY = 'sv_biometric';
const WEB = Platform.OS === 'web';

export const setPin = async (pin) => {
  if (WEB) return;
  try { await SecureStore.setItemAsync(PIN_KEY, String(pin)); } catch (e) {}
};

export const getPin = async () => {
  if (WEB) return null;
  try { return await SecureStore.getItemAsync(PIN_KEY); } catch (e) { return null; }
};

export const setLockEnabled = async (on) => {
  if (WEB) return;
  try { await SecureStore.setItemAsync(ENABLED_KEY, on ? '1' : '0'); } catch (e) {}
};

export const isLockEnabled = async () => {
  if (WEB) return false;
  try { return (await SecureStore.getItemAsync(ENABLED_KEY)) === '1'; } catch (e) { return false; }
};

export const setBiometricEnabled = async (on) => {
  if (WEB) return;
  try { await SecureStore.setItemAsync(BIO_KEY, on ? '1' : '0'); } catch (e) {}
};

export const isBiometricEnabled = async () => {
  if (WEB) return false;
  try { return (await SecureStore.getItemAsync(BIO_KEY)) === '1'; } catch (e) { return false; }
};

export const clearLock = async () => {
  if (WEB) return;
  try {
    await SecureStore.deleteItemAsync(PIN_KEY);
    await SecureStore.deleteItemAsync(ENABLED_KEY);
    await SecureStore.deleteItemAsync(BIO_KEY);
  } catch (e) {}
};