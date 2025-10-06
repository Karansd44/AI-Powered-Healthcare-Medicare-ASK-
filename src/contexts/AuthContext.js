// contexts/AuthContext.js
import React, { useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

const AuthContext = React.createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function signup(email, password, userType, fullName) {
    // If userType is not provided, default to 'doctor' for email/password signups
    const finalUserType = userType || 'doctor';
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: fullName });
    // Store userType in localStorage for now
    localStorage.setItem(`userType_${userCredential.user.uid}`, finalUserType);
    // Save user info to Firestore
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      email,
      fullName,
      userType: finalUserType,
      createdAt: new Date().toISOString(),
    }, { merge: true });
    return userCredential;
  }

  async function login(email, password) {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Authentication error:", error.code, error.message);
      throw error; // Re-throw to handle in the component
    }
  }

  function logout() {
    return signOut(auth);
  }

  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  function getUserType() {
    if (!currentUser) return null;
    return localStorage.getItem(`userType_${currentUser.uid}`);
  }

  async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    // Always set userType as 'patient' for Google sign-in
    localStorage.setItem(`userType_${result.user.uid}`, 'patient');
    await setDoc(doc(db, 'users', result.user.uid), {
      email: result.user.email,
      fullName: result.user.displayName || '',
      userType: 'patient',
      createdAt: new Date().toISOString(),
    }, { merge: true });
    return result;
  }

  async function signInWithApple() {
    const provider = new OAuthProvider('apple.com');
    const result = await signInWithPopup(auth, provider);
    // Always set userType as 'patient' for Apple sign-in
    localStorage.setItem(`userType_${result.user.uid}`, 'patient');
    await setDoc(doc(db, 'users', result.user.uid), {
      email: result.user.email,
      fullName: result.user.displayName || '',
      userType: 'patient',
      createdAt: new Date().toISOString(),
    }, { merge: true });
    return result;
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    logout,
    resetPassword,
    getUserType,
    signInWithGoogle,
    signInWithApple
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}