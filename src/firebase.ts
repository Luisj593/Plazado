import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// OFICINA OFICIAL DE PRODUCCIÓN PLAZADO.COM
export const firebaseConfig = {
  projectId: "dazzling-spirit-271219",
  appId: "1:614865830106:web:1e794bea21ad5e013da5e3",
  apiKey: "AIzaSyAOoG0qvvCMbcGvHg49iN-HHcxaVCpLxHY",
  authDomain: "dazzling-spirit-271219.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-plazadocommarket-bdb8ac78-6fcb-4d18-bf24-2ca374dda0e5",
  storageBucket: "dazzling-spirit-271219.firebasestorage.app",
  messagingSenderId: "614865830106"
};

// Singleton Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Conexión directa a la base de datos Firestore de Producción
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Autenticación de Producción
export const auth = getAuth(app);
