import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDrzvcfymaky2rTfx7NWFnME3nB8Vu0XBs",
  authDomain: "proyectnexus-b060b.firebaseapp.com",
  projectId: "proyectnexus-b060b",
  storageBucket: "proyectnexus-b060b.firebasestorage.app",
  messagingSenderId: "1008927596866",
  appId: "1:1008927596866:web:2fe5fde61922f8ec1ea8db",
  measurementId: "G-NZ4DQ2E3XC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Storage
export const storage = getStorage(app);

// Initialize Firebase Auth
export const auth = getAuth(app);

export default app; 