import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
// Note: You will need to install 'react-native-paper' for professional components
import { Button, HelperText, ActivityIndicator } from 'react-native-paper'; 
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('testuser@example.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signIn, isAuthenticated } = useAuth();

  // If the user is already authenticated (from context check), go to Dashboard
  if (isAuthenticated) {
    // In a real navigator, you'd navigate('Dashboard');
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Welcome Back!</Text>
        <Text style={styles.subtitle}>User is already logged in.</Text>
        <Button mode="contained" onPress={() => console.log('Navigate to Dashboard')}>
          Go to Dashboard
        </Button>
      </View>
    );
  }

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    
    // 1. Call the signIn function from the AuthContext
    const result = await signIn(email, password);

    if (result.success) {
      // Success! The AuthContext listener will automatically handle navigation 
      // by updating isAuthenticated and reloading the app stack.
      console.log('Login successful, state update imminent.');
    } else {
      // 2. Display the error message
      setError(result.error || 'Login failed. Please check your credentials.');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CovenCare Login 🌒</Text>
      <Text style={styles.subtitle}>Enter your magical credentials.</Text>

      {/* Email Input */}
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!loading}
      />
      
      {/* Password Input */}
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
      />

      {/* Error Message */}
      {error ? (
        <HelperText type="error" visible={!!error} style={styles.errorText}>
          {error}
        </HelperText>
      ) : null}

      {/* Login Button */}
      <Button 
        mode="contained" 
        onPress={handleLogin} 
        disabled={loading || !email || !password}
        style={styles.button}
        contentStyle={styles.buttonContent}
      >
        {loading ? <ActivityIndicator color="#fff" /> : 'Sign In'}
      </Button>

      {/* Placeholder for Register */}
      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>Don't have an account? Register</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 30,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4a148c', // Deep purple
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#6a1b9a', // Lighter purple
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    height: 50,
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
  },
  button: {
    marginTop: 10,
    borderRadius: 8,
    backgroundColor: '#6a1b9a',
  },
  buttonContent: {
    height: 50,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 10,
  },
  link: {
    marginTop: 20,
    color: '#4a148c',
    textAlign: 'center',
  },
});