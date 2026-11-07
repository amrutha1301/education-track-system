import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { getDatabase, onValue, push, ref, set } from 'firebase/database';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Object.values(config).every(Boolean);

const app = isFirebaseConfigured
  ? getApps().length ? getApp() : initializeApp(config)
  : null;
const auth = app ? getAuth(app) : null;
const database = app ? getDatabase(app) : null;

export function observeAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

export function signIn(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function signInWithGoogle() {
  return signInWithPopup(auth, new GoogleAuthProvider());
}

export function createAccount(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export function signOutAccount() {
  return signOut(auth);
}

export function subscribeLearners(userId, onData, onError) {
  const learnersRef = ref(database, `users/${userId}/learners`);
  return onValue(learnersRef, (snapshot) => {
    const records = snapshot.val() ?? {};
    onData(Object.entries(records).map(([id, learner]) => ({ ...learner, id })));
  }, onError);
}

export async function saveLearnerRecord(userId, learner) {
  const learnersPath = `users/${userId}/learners`;
  const learnersRef = ref(database, learnersPath);
  const recordRef = learner.id ? ref(database, `${learnersPath}/${learner.id}`) : push(learnersRef);
  const { id, ...record } = learner;
  await set(recordRef, record);
  return { ...record, id: recordRef.key };
}
