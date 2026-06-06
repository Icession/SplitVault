import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser,
} from 'firebase/auth';

import { auth } from './firebaseConfig';

// Turn Firebase's error codes into friendly, human messages.
const friendlyError = (code) => {
  switch (code) {
    case 'auth/invalid-email':
      return 'That email address looks invalid.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/requires-recent-login':
      return 'Please re-enter your password to continue.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    default:
      return 'Something went wrong. Please try again.';
  }
};

// Each returns { success: true, user } or { success: false, error: 'message' }.
export const signUp = async (email, password) => {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    return { success: true, user: cred.user };
  } catch (e) {
    return { success: false, error: friendlyError(e.code) };
  }
};

export const signIn = async (email, password) => {
  try {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    return { success: true, user: cred.user };
  } catch (e) {
    return { success: false, error: friendlyError(e.code) };
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (e) {
    return { success: false, error: friendlyError(e.code) };
  }
};

// Subscribe to auth state changes; returns an unsubscribe function.
export const subscribeToAuth = (callback) => onAuthStateChanged(auth, callback);

// Re-confirm the user's password (required before sensitive actions like
// deleting the account).
export const reauthenticate = async (password) => {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) {
      return { success: false, error: 'No user is signed in.' };
    }
    const cred = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, cred);
    return { success: true };
  } catch (e) {
    return { success: false, error: friendlyError(e.code) };
  }
};

export const deleteCurrentUser = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return { success: false, error: 'No user is signed in.' };
    await deleteUser(user);
    return { success: true };
  } catch (e) {
    return { success: false, error: friendlyError(e.code) };
  }
};