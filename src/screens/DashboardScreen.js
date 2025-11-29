import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';

export default function DashboardScreen() {
    const { signOutUser, user } = useAuth();
    
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Coven Dashboard 🌕</Text>
            <Text style={styles.subtitle}>Welcome, {user?.email}!</Text>
            <Text style={styles.text}>Your Firebase profile fetch should be working now!</Text>

            <Button mode="contained" onPress={signOutUser} style={styles.button}>
                Log Out
            </Button>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#6a1b9a',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 18,
        color: '#4a148c',
        marginBottom: 30,
    },
    text: {
        fontSize: 16,
        color: '#333',
        marginBottom: 50,
        textAlign: 'center',
    },
    button: {
        backgroundColor: '#ff9500', // Yellow/Orange for logout
    }
});