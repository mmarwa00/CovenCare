import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { PaperProvider, Text } from 'react-native-paper'; 
import { AuthProvider, useAuth } from './src/context/AuthContext'; 

// Import all necessary screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import DashboardScreen from './src/screens/DashboardScreen'; // Placeholder

// --- Simple Navigation Logic (The App Switcher) ---

function AppNavigator() {
  // Get global state from AuthContext
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    // Show a global loading indicator while Firebase checks initial auth status
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6a1b9a" />
        <Text style={styles.loadingText}>Connecting to Coven...</Text>
      </View>
    );
  }

  // We use a local state to toggle between Login and Register views when logged out.
  const [currentScreen, setCurrentScreen] = React.useState('Login');

  // Define simple navigate function for our mock navigation
  const navigate = (screenName) => {
    setCurrentScreen(screenName);
  };
  
  const navigationProps = {
    // Pass a simplified 'navigation' object to screens
    navigation: { navigate }, 
  };

  // 1. If Authenticated, show the main dashboard
  if (isAuthenticated) {
    return <DashboardScreen {...navigationProps} />;
  } 
  
  // 2. If Not Authenticated, determine if they want to Login or Register
  else {
    if (currentScreen === 'Register') {
        // Render Register screen, passing navigation props
        return <RegisterScreen {...navigationProps} />;
    } else {
        // Render Login screen (default), passing navigation props
        return <LoginScreen {...navigationProps} />;
    }
  }
}

// --- Main Export: Wraps the entire application with necessary providers ---

export default function App() {
  return (
    <PaperProvider> 
      <AuthProvider>
        <View style={styles.mainWrapper}>
          <AppNavigator />
        </View>
      </AuthProvider>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
    paddingTop: 40, // Add padding for status bar visibility
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6a1b9a',
  },
});