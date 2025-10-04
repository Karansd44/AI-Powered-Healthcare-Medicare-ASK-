// firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDSqw1cVaCPH2MwQTUeFsAg4Uu9JWeiM7A", // Find this in Project settings -> General -> Web API Key
  authDomain: "medicare-6f98b.firebaseapp.com", // This is usually your projectId.firebaseapp.com
  projectId: "medicare-6f98b", // This is your Project ID!
  storageBucket: "medicare-6f98b.appspot.com", // Usually your projectId.appspot.com
  messagingSenderId: "393454182543", // This is your Project Number!
  appId: "1:393454182543:web:abcdef123456" // Find this in Project settings -> Your apps -> Web app
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
