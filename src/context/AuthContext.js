import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth'; // Only need this function here

// --- CRITICAL FIX ---
// We only import the FINAL, initialized 'auth' object.
// We DO NOT import the Auth Service functions directly into the Context file 
// to avoid circular dependency issues that cause re-initialization.
import { auth } from '../config/firebaseConfig'; 
import { loginUser, logoutUser } from '../services/authService';

// Create the context
const AuthContext = createContext();

// Hook to use the authentication context easily
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Firebase User Object
  const [isLoading, setIsLoading] = useState(true);

  // Listener for Firebase Auth state changes
  useEffect(() => {
    // This listener runs ONCE on load, and then whenever auth state changes.
    // It uses the ALREADY INITIALIZED 'auth' object.
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
      console.log('Firebase Auth State Changed:', currentUser ? 'LOGGED IN' : 'LOGGED OUT');
    });

    // Clean up the subscription
    return unsubscribe;
  }, []); // Empty dependency array ensures it runs only once

  // Wrapper function for Login
  const signIn = async (email, password) => {
    // We call the service function here
    const result = await loginUser(email, password);
    if (!result.success) {
      console.error('Login Failed:', result.error);
    }
    return result;
  };

  // Wrapper function for Logout
  const signOutUser = async () => {
    // We call the service function here
    const result = await logoutUser();
    if (!result.success) {
      console.error('Logout Failed:', result.error);
    }
    return result;
  };

  const value = {
    user,
    isLoading,
    signIn,
    signOutUser,
    isAuthenticated: !!user,
  };

  if (isLoading) {
    // We must return a valid element while loading
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#6a1b9a" />
        </View>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Simple view for the loading state (requires react-native imports)
import { View, ActivityIndicator } from 'react-native';