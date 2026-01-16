import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  ScrollView, 
  Platform, 
  TouchableWithoutFeedback, 
  Keyboard 
} from 'react-native';
import { Button, HelperText, ActivityIndicator } from 'react-native-paper'; 
import { useAuth } from '../context/AuthContext';
import { registerForPushNotifications } from '../services/notificationService';
import { SafeAreaView } from 'react-native-safe-area-context';
export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('testuser@example.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signIn, isAuthenticated } = useAuth();

  // Handle successful login state change
  if (isAuthenticated) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Welcome Back!</Text>
        <Button mode="contained" onPress={() => console.log('Redirecting...')}>
          Go to Dashboard
        </Button>
      </View>
    );
  }

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    const result = await signIn(email, password);
    if (result.success) {
      try {
        await registerForPushNotifications(result.user.uid);
      } catch (err) {
        console.log('Push notification registration failed:', err);
      }
    } else {
      setError(result.error || 'Login failed. Please check your credentials.');
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.inner}>
            <Text style={styles.title}>CovenCare Login 🌒</Text>
            <Text style={styles.subtitle}>Enter your magical credentials.</Text>

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              color="#000" // Fixes disappearing text
              editable={!loading}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              color="#000" // Fixes disappearing text
              editable={!loading}
            />

            {error ? (
              <HelperText type="error" visible={!!error} style={styles.errorText}>
                {error}
              </HelperText>
            ) : null}

            <Button 
              mode="contained" 
              onPress={handleLogin} 
              disabled={loading || !email || !password}
              style={styles.button}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              {loading ? <ActivityIndicator color="#fff" /> : 'Sign In'}
            </Button>

            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.link}>Don't have an account? Register</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Reset')}>
              <Text style={styles.link}>Forgot your Password?</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1, // Crucial for ScrollView to fill screen
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  inner: {
    padding: 30,
    width: '100%',
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
    color: '#6a1b9a',
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
    fontSize: 16,
  },
  button: {
    marginTop: 10,
    borderRadius: 8,
    backgroundColor: '#6a1b9a',
  },
  buttonContent: {
    height: 50,
  },
  buttonLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
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