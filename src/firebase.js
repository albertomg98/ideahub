import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDTu8064cn6DmbBkkummaiPlzrsIHCfyGw",
  authDomain: "idealmente-c4819.firebaseapp.com",
  projectId: "idealmente-c4819",
  storageBucket: "idealmente-c4819.firebasestorage.app",
  messagingSenderId: "497483703952",
  appId: "1:497483703952:web:c24b31cbb8c3c426f59a15"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);