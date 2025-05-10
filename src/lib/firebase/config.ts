// This is a mock Firebase configuration.
// In a real application, replace this with your actual Firebase config.

// Simulate Firebase App type
interface FirebaseApp {
  name: string;
  options: Record<string, unknown>;
}

// Simulate Firebase Auth type
interface Auth {
  // Mock methods as needed
  onAuthStateChanged: (callback: (user: any | null) => void) => () => void;
}

// Simulate Firestore type
interface Firestore {
  // Mock methods as needed
}

// Simulate Firebase Storage type
interface Storage {
  // Mock methods as needed
}

const MOCK_FIREBASE_CONFIG = {
  apiKey: "MOCK_API_KEY",
  authDomain: "MOCK_AUTH_DOMAIN",
  projectId: "MOCK_PROJECT_ID",
  storageBucket: "MOCK_STORAGE_BUCKET",
  messagingSenderId: "MOCK_SENDER_ID",
  appId: "MOCK_APP_ID",
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: Storage | null = null;

const initializeMockFirebase = () => {
  if (!app) {
    // console.log("Initializing Mock Firebase App with config:", MOCK_FIREBASE_CONFIG);
    app = { name: "[DEFAULT]", options: MOCK_FIREBASE_CONFIG };
    
    // Mock Auth initialization
    auth = {
      onAuthStateChanged: (callback) => {
        // Simulate auth state change, initially no user
        setTimeout(() => callback(null), 100);
        return () => {}; // Unsubscribe function
      }
    };
    
    // Mock Firestore initialization
    db = {};
    
    // Mock Storage initialization
    storage = {};
  }
  return { app, auth, db, storage };
};

// Initialize on import (simulates Firebase SDK behavior)
initializeMockFirebase();

export { app, auth, db, storage, initializeMockFirebase };
