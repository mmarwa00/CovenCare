import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Button, HelperText, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { resetPassword } from '../services/authService';

export default function ResetPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [isSent, setIsSent] = useState(false);

  const handleReset = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    setIsSent(false);

    const result = await resetPassword(email);

    if (result.success) {
      setSuccess(`Password reset email successfully sent to ${email}.`);
      setEmail('');
      setIsSent(true);
      setLoading(false);
      
      // Navigate back to login after a short delay
      setTimeout(() => {
        navigation.navigate('Login'); 
      }, 2000);

    } else {
      setError(result.error || 'Failed to send reset email. Check email address.');
      setLoading(false);
    }
  };

  const buttonText = () => {
    if (loading) return <ActivityIndicator color="#fff" />;
    if (isSent) return 'Email Sent! Redirecting...';
    return 'Send Reset Link';
  };
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
    <View style={styles.container}>
      <Text style={styles.title}>Reset Password 🔑</Text>
      <Text style={styles.subtitle}>Enter the email linked to your Coven account.</Text>

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
      
      {/* Status Messages */}
      {success ? (
         <HelperText type="info" visible={!!success} style={styles.successText}>
            {success}
        </HelperText>
      ) : null}
      {error ? (
        <HelperText type="error" visible={!!error} style={styles.errorText}>
          {error}
        </HelperText>
      ) : null}

      {/* Reset Button */}
      <Button 
        mode="contained" 
        onPress={handleReset} 
        disabled={loading || !email || isSent}
        style={styles.button}
        contentStyle={styles.buttonContent}
      >
        {buttonText()}
      </Button>

      {/* Back to Login Link */}
      <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={loading}>
        <Text style={styles.link}>← Back to Login</Text>
      </TouchableOpacity>
    </View>
    </SafeAreaView>
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
    color: '#4a148c',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#6f1aa4ff',
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
  successText: {
    backgroundColor: '#e0f7fa',
    color: '#ed77ebff',
    borderRadius: 4,
    marginBottom: 10,
    padding: 8
  },
  link: {
    marginTop: 20,
    color: '#4a148c',
    textAlign: 'center',
  },
});