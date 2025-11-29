import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Button, HelperText, ActivityIndicator } from 'react-native-paper'; 
import { registerUser } from '../services/authService'; // Direct call to service

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    setError('');
    setLoading(true);

    if (!displayName) {
        setError('Display name is required for your Coven profile.');
        setLoading(false);
        return;
    }
    
    // 1. Call the registerUser function from the service file
    const result = await registerUser(email, password, displayName);

    if (result.success) {
      // Success! Alert the user and navigate back to the Login screen.
      Alert.alert(
        'Registration Success',
        'Your account has been created! Please log in.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login'), // Mocks navigating back
          },
        ],
      );
    } else {
      // 2. Display the error message (e.g., Firebase: Error (auth/email-already-in-use))
      setError(result.error || 'Registration failed. Check your network.');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join the Coven 🌙</Text>
      <Text style={styles.subtitle}>Create your new magical profile.</Text>

      {/* Display Name Input */}
      <TextInput
        style={styles.input}
        placeholder="Display Name (Your Coven Identity)"
        value={displayName}
        onChangeText={setDisplayName}
        autoCapitalize="words"
        editable={!loading}
      />

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
        placeholder="Password (min 8 characters)"
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

      {/* Register Button */}
      <Button 
        mode="contained" 
        onPress={handleRegister} 
        disabled={loading || !email || !password || !displayName}
        style={styles.button}
        contentStyle={styles.buttonContent}
      >
        {loading ? <ActivityIndicator color="#fff" /> : 'Register'}
      </Button>

      {/* Link back to Login */}
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Already a member? Log in</Text>
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
    backgroundColor: '#4a148c', // Darker purple for action
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
    color: '#6a1b9a',
    textAlign: 'center',
  },
});