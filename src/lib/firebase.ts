import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Using hardcoded credentials to ensure the application connects to Firebase.
// For production, it's highly recommended to use environment variables for security.
const firebaseConfig = {
  apiKey: "AIzaSyDpC907VIUOOeNM23Bjsrx6U8hHmBrwWps",
  authDomain: "copyit-quick.firebaseapp.com",
  projectId: "copyit-quick",
  storageBucket: "copyit-quick.appspot.com",
  messagingSenderId: "745485562758",
  appId: "1:745485562758:web:5ae9af9ad6278639837207",
};

let app;
let auth;
let db;

// This check ensures Firebase is only initialized if a valid config is present.
if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
} else {
  // This warning will show in the console if the config is missing.
  if (typeof window !== 'undefined') {
    console.warn("Firebase configuration is missing or incomplete. All Firebase features will be disabled.");
  }
  app = null;
  auth = null;
  db = null;
}

export { app, auth, db };
