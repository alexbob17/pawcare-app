import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeAuth,
  getReactNativePersistence,
  getAuth,
  browserLocalPersistence,
  indexedDBLocalPersistence,
} from 'firebase/auth';
import { initializeFirestore, getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyDi_fk9dg5OkMUuvoGlTAUo4nu5o_jHsvk",
  authDomain: "pawcare-app-af30e.firebaseapp.com",
  projectId: "pawcare-app-af30e",
  storageBucket: "pawcare-app-af30e.firebasestorage.app",
  messagingSenderId: "1083580494874",
  appId: "1:1083580494874:web:206ef29aac28cd7797cda3"
};

const yaInicializada = getApps().length > 0;
const app = yaInicializada ? getApp() : initializeApp(firebaseConfig);

// Auth: garantizamos persistencia en almacenamiento local en navegador (IndexedDB/LocalStorage)
// y en móvil con AsyncStorage para que la sesión nunca se pierda al recargar la página.
let auth;
if (yaInicializada) {
  auth = getAuth(app);
} else if (Platform.OS === 'web') {
  try {
    auth = initializeAuth(app, {
      persistence: [indexedDBLocalPersistence, browserLocalPersistence],
    });
  } catch {
    auth = getAuth(app);
  }
} else {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

// Firestore: en móvil habilitamos auto-detect long polling para evitar cuelgues de WebChannel.
let db;
try {
  db = yaInicializada
    ? getFirestore(app)
    : initializeFirestore(app, {
        experimentalAutoDetectLongPolling: Platform.OS !== 'web',
        experimentalForceLongPolling: false,
      });
} catch (e) {
  db = getFirestore(app);
}

export { app, auth, db };
export default app;
