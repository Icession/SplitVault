import { Platform } from 'react-native';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyATNTq55Dxw3WahhfKxpdbbiu5wmwO3zNc',
  authDomain: 'splitvault-5d01b.firebaseapp.com',
  projectId: 'splitvault-5d01b',
  storageBucket: 'splitvault-5d01b.firebasestorage.app',
  messagingSenderId: '1019244900739',
  appId: '1:1019244900739:web:1dd38d4fb5d746017b46b6',
};

const app = initializeApp(firebaseConfig);

let auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

export { auth };
export const db = getFirestore(app);
export default app;