import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// PLEASE REPLACE these values with your actual Firebase Project keys.
// const firebaseConfig = {
//     apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
//     authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN",
//     projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "wedding-90e4c",
//     storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET",
//     messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
//     appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID"
// };
const firebaseConfig = {
  apiKey: "AIzaSyDIRKW8v3ElHFHRHP9hJko_2c-d9BAwpKc",
  authDomain: "wedding-90e4c.firebaseapp.com",
  projectId: "wedding-90e4c",
  storageBucket: "wedding-90e4c.firebasestorage.app",
  messagingSenderId: "940174548126",
  appId: "1:940174548126:web:7d3b473809017667606f8f",
  measurementId: "G-7MTCYH6W77"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
