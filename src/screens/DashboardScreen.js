import React from 'react';
import { View, Text, StyleSheet, Image,TouchableOpacity } from 'react-native';
import { Button, Card, Title, Paragraph } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';

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
            <Header />
            <Title style={styles.title}>Welcome to the Coven, {displayName}!</Title>
            <Paragraph style={styles.subtitle}>
                Your home base for tracking, support, and care.
            </Paragraph>

            {/* --- Core Features --- */}
            <View style={styles.cardContainer}>

                {/* 1. Profile/Account Management: DIRECT NAVIGATION TO ProfileScreen */}
                <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('ProfileScreen')}>
                    <Image
                        source={require('../../assets/icons/hat.png')}
                        style={styles.bigMenuIcon}
                    />
                    <Title style={styles.menuTitle}>My Profile</Title>
                    <Paragraph style={styles.menuSubtitle}>View stats, update details, manage account.</Paragraph>
                </TouchableOpacity>

                {/* 2. Period/Health Tracking: DIRECT NAVIGATION */}
                <View style={styles.menuItem} onTouchEnd={() => navigation.navigate('CalendarScreen')}>
                    <Image
                        source={require('../../assets/icons/Log.png')}
                        style={styles.bigMenuIcon}
                    />
                    <Title style={styles.menuTitle}>Log your period</Title>
                    <Paragraph style={styles.menuSubtitle}>in the Grimoire</Paragraph>
                </View>

                {/* 3. Circle Management: DIRECT NAVIGATION */}
                <View style={styles.menuItem} onTouchEnd={() => navigation.navigate('CircleScreen')}>
                    <Image
                        source={require('../../assets/icons/circles.png')}
                        style={styles.bigMenuIcon}
                    />
                    <Title style={styles.menuTitle}>Create a circle</Title>
                    <Paragraph style={styles.menuSubtitle}>and summon your coven</Paragraph>
                </View>
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
    menuContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 3,
},
menuItem: {
    alignItems: 'center',
    marginBottom: 3,
},
bigMenuIcon: {
    width: 120,
    height: 80,
    marginBottom: 5,
    marginTop: 5,
    resizeMode: 'contain',
},
menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4a148c',
    textAlign: 'center',
},
menuSubtitle: {
    fontSize: 10,
    color: '#6a1b9a',
    textAlign: 'center',
},
container: {
        flex: 1,
        padding: 10,
        backgroundColor: '#f8f8ff', 
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#4a148c',
        marginTop: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#6a1b9a',
        marginBottom: 30,
        textAlign: 'center',
    },
    
    logoutButton: {
        marginTop: 20,
        borderColor: '#8c2abdff',
        borderWidth: 1,
    },
    logoutLabel: {
        color: '#a91796ff',
    },
    menuIcon: {
    width: 120,
    height: 80,
    marginBottom: 10,
    resizeMode: 'contain',
    }
});