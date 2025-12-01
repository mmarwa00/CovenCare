import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Button, Card, Title, Paragraph, ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import { db } from '../config/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

export default function DashboardScreen({ navigation }) {
    // Auth
    const { signOutUser, user } = useAuth();
    const displayName = user?.displayName || user?.email || 'Fellow Coven Member';
    const userId = user?.uid;

    // Active Circle State
    const [activeCircle, setActiveCircle] = useState(null);
    const [loadingCircle, setLoadingCircle] = useState(true);

    // Fetch Active Circle
    useEffect(() => {
        const fetchActiveCircle = async () => {
            if (!userId) return;

            const userRef = doc(db, "users", userId);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const activeId = userSnap.data().activeCircleId;

                if (activeId) {
                    const circleRef = doc(db, "circles", activeId);
                    const circleSnap = await getDoc(circleRef);

                    if (circleSnap.exists()) {
                        setActiveCircle({ id: activeId, ...circleSnap.data() });
                    }
                }
            }

            setLoadingCircle(false);
        };

        fetchActiveCircle();
    }, [userId]);

    return (
    <View style={{ flex: 1 }}>
      <Header />

            {/* --- Core Features --- */}
            <View style={styles.cardContainer}>

                {/* Profile */}
                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => navigation.navigate('ProfileScreen')}
                >
                    <Image
                        source={require('../../assets/icons/hat.png')}
                        style={styles.bigMenuIcon}
                    />
                    <Title style={styles.menuTitle}>My Profile</Title>
                    <Paragraph style={styles.menuSubtitle}>
                        View stats, update details, manage account.
                    </Paragraph>
                </TouchableOpacity>

                {/* --- Active Circle Message --- */}
                {loadingCircle ? (
                    <ActivityIndicator animating={true} color="#4a148c" />
                ) : activeCircle ? (
                    <Text style={styles.activeCircleText}>
                        Active Circle: {activeCircle.name} ({activeCircle.members?.length || 0} members)
                    </Text>
                ) : (
                    <Text style={styles.activeCircleText}>
                        No active circle selected.
                    </Text>
                )}


                {/* Period Logging */}
                <View
                    style={styles.menuItem}
                    onTouchEnd={() => navigation.navigate('CalendarScreen')}
                >
                    <Image
                        source={require('../../assets/icons/Log.png')}
                        style={styles.bigMenuIcon}
                    />
                    <Title style={styles.menuTitle}>Log your period</Title>
                    <Paragraph style={styles.menuSubtitle}>in the Grimoire</Paragraph>
                </View>

                {/* Circle Management */}
                <View
                    style={styles.menuItem}
                    onTouchEnd={() => navigation.navigate('CircleScreen')}
                >
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
                onPress={signOutUser}
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
    cardContainer: {
        width: '100%',
        alignItems: 'center',
    },
    menuItem: {
        alignItems: 'center',
        marginBottom: 3,
    },
    bigMenuIcon: {
        width: 120,
        height: 80,
        marginBottom: 5,
        marginTop: 10,
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
    activeCircleText: {
    fontSize: 14,
    color: '#4a148c',
    marginVertical: 10,
    textAlign: 'center',
    fontWeight: '600',
    },
    logoutButton: {
        marginTop: 20,
        borderColor: '#8c2abdff',
        borderWidth: 2,
        width: 180,
        alignSelf: 'center',
        borderRadius: 25,
        height: 45,
    },

    logoutLabel: {
        fontSize: 14,
        color: '#8c2abdff',
        fontWeight: 'bold',
    },
});