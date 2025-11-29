import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button, Card, Title, Paragraph } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';

export default function DashboardScreen({ navigation }) {
    // Get user and signOut function from the global Auth Context
    const { signOutUser, user } = useAuth();
    
    // We expect the user object to exist here because App.js only navigates
    // here if isAuthenticated is true.
    const displayName = user?.displayName || user?.email || 'Fellow Coven Member';

    // IMPORTANT: The navigation function is called directly on press.
    // This uses the mock navigation object provided by App.js.

    return (
        <View style={styles.container}>
            <Title style={styles.title}>Welcome to the Coven, {displayName}!</Title>
            <Paragraph style={styles.subtitle}>
                Your home base for tracking, support, and care.
            </Paragraph>

            {/* --- Core Features --- */}
            <View style={styles.cardContainer}>
                
                {/* 1. Profile/Account Management: DIRECT NAVIGATION TO ProfileScreen */}
                <Card 
                    style={styles.card} 
                    onPress={() => navigation.navigate('ProfileScreen')}
                >
                    <Card.Content>
                        <Title style={styles.cardTitle}>My Profile</Title>
                        <Paragraph>View stats, update details, manage account.</Paragraph>
                    </Card.Content>
                </Card>

                {/* 2. Period/Health Tracking: DIRECT NAVIGATION */}
                <Card 
                    style={styles.card} 
                    onPress={() => navigation.navigate('CalendarScreen')}
                >
                    <Card.Content>
                        <Title style={styles.cardTitle}>Log Period / Cycle</Title>
                        <Paragraph>Input today's cycle data and symptoms.</Paragraph>
                    </Card.Content>
                </Card>
                
                {/* 3. Circle Management: DIRECT NAVIGATION */}
                <Card 
                    style={styles.card} 
                    onPress={() => navigation.navigate('CircleScreen')}
                >
                    <Card.Content>
                        <Title style={styles.cardTitle}>Create / Join Circle</Title>
                        <Paragraph>Manage your trusted support group.</Paragraph>
                    </Card.Content>
                </Card>

            </View>

            {/* --- Log Out Button --- */}
            <Button 
                mode="outlined" 
                onPress={signOutUser} // Calls the working logout function from AuthContext
                icon="logout"
                style={styles.logoutButton}
                labelStyle={styles.logoutLabel}
            >
                Log Out
            </Button>
            
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f8f8ff', 
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#4a148c',
        marginTop: 30,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#6a1b9a',
        marginBottom: 30,
        textAlign: 'center',
    },
    cardContainer: {
        width: '100%',
        marginBottom: 40,
        gap: 15,
    },
    card: {
        elevation: 4, 
        borderRadius: 10,
        backgroundColor: '#fff',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#8e24aa', 
    },
    logoutButton: {
        marginTop: 20,
        borderColor: '#ff9500',
        borderWidth: 1,
    },
    logoutLabel: {
        color: '#ff9500',
    }
});