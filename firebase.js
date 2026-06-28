import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC-KgjAQ09sMSqIsBWdHpPieMZ9kDvhx3U",
  authDomain: "chatapp-94a9f.firebaseapp.com",
  projectId: "chatapp-94a9f",
  storageBucket: "chatapp-94a9f.firebasestorage.app",
  messagingSenderId: "531772612027",
  appId: "1:531772612027:web:900c98bd078128e169789e"
};

const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
export const db = getFirestore(app);