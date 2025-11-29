import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { PaperProvider, Text } from 'react-native-paper'; 
import { AuthProvider, useAuth } from './src/context/AuthContext'; 

// Import all necessary screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import DashboardScreen from './src/screens/DashboardScreen'; 
import ProfileScreen from './src/screens/ProfileScreen'; // Required for navigation
// You will need to create placeholder files for these two:
import CalendarScreen from './src/screens/CalendarScreen'; 
import CircleScreen from './src/screens/CircleScreen';

// --- Simple Navigation Logic (The App Switcher) ---

function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  
  // State to handle screen switching when logged out (Login/Register)
  const [currentUnauthScreen, setCurrentUnauthScreen] = React.useState('Login'); 
  // State to handle screen switching when logged in (Dashboard/Profile/etc.)
  const [currentAuthScreen, setCurrentAuthScreen] = React.useState('Dashboard'); 

  // Unified navigate function
  const navigate = (screenName) => {
    if (isAuthenticated) {
        setCurrentAuthScreen(screenName);
    } else {
        setCurrentUnauthScreen(screenName);
    }
  };
  
  const navigationProps = {
    navigation: { navigate }, 
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6a1b9a" />
        <Text style={styles.loadingText}>Connecting to Coven...</Text>
      </View>
    );
  }

  // --- Authenticated Screens ---
  if (isAuthenticated) {
    switch (currentAuthScreen) {
        case 'ProfileScreen':
            return <ProfileScreen {...navigationProps} />;
        case 'CalendarScreen':
            return <CalendarScreen {...navigationProps} />;
        case 'CircleScreen':
            return <CircleScreen {...navigationProps} />;
        case 'Dashboard':
        default:
            return <DashboardScreen {...navigationProps} />;
    }
  } 
  
  // --- Unauthenticated Screens ---
  else {
    switch (currentUnauthScreen) {
        case 'Register':
            return <RegisterScreen {...navigationProps} />;
        case 'Login':
        default:
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
    paddingTop: 40,
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