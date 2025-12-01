import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, ActivityIndicator, Button } from 'react-native-paper';
import { db } from '../config/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import Header from '../components/Header';
import Footer from '../components/Footer';

// NOTE: We rely on App.js to pass the circle object inside route.params.
export default function CircleDetailsScreen({ route, navigation }) {
    // Check if route.params exists, and destructure circle from it
    const { circle } = route.params || {};

    // Safety check: If circle is somehow missing, navigate back
    if (!circle || !circle.id) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorTextTitle}>Error: Circle data missing.</Text>
                <Button onPress={() => navigation.goBack()}>Go Back</Button>
            </View>
        );
    }

    const [memberDetails, setMemberDetails] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch usernames and details for all members
    const fetchMemberDetails = async () => {
        const details = [];
        const memberPromises = circle.members.map(async (memberObject) => {
            const uid = memberObject.userId; // <-- CORRECTLY EXTRACT USER ID
            try {
                const userRef = doc(db, 'users', uid);
                const snap = await getDoc(userRef);
                
                if (snap.exists()) {
                    const userData = snap.data();
                    details.push({
                        id: uid,
                        displayName: userData.displayName || 'Unknown User',
                        email: userData.email,
                        privacyLevel: memberObject.privacyLevel,
                        role: memberObject.role || 'member'
                    });
                } else {
                    details.push({ id: uid, displayName: 'User Deleted' });
                }
            } catch (e) {
                console.error("Error fetching user detail:", e);
                details.push({ id: uid, displayName: 'Fetch Error' });
            }
        });

        await Promise.all(memberPromises);
        setMemberDetails(details);
        setLoading(false);
    };

    useEffect(() => {
        fetchMemberDetails();
    }, [circle.members]);


    return (
        <View style={{ flex: 1 }}>
            <Header />
            <ScrollView contentContainerStyle={styles.container}>
                <Button mode="text" onPress={() => navigation.navigate('Dashboard')} style={styles.backButton}>
                    ← Back to Dashboard
                </Button>

                <Title style={styles.title}>{circle.name}</Title>
                <Paragraph style={styles.subtitle}>Invite Code: {circle.inviteCode}</Paragraph>

                <Card style={styles.card}>
                    <Card.Content>
                        <Title style={styles.sectionTitle}>
                            Participants ({memberDetails.length})
                        </Title>

                        {loading ? (
                            <ActivityIndicator animating={true} color="#4a148c" />
                        ) : (
                            memberDetails.map((member) => (
                                // Use a unique key guaranteed to exist
                                <View key={member.id} style={styles.memberItem}>
                                    <Text style={styles.memberText}>
                                        • {member.displayName} ({member.role})
                                    </Text>
                                    <Text style={styles.memberDetail}>Privacy: {member.privacyLevel}</Text>
                                </View>
                            ))
                        )}
                    </Card.Content>
                </Card>
            </ScrollView>
            <Footer navigation={navigation} />
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#e3d2f0ff',
    },
    backButton: {
        alignSelf: 'flex-start',
        marginBottom: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#4a148c',
        textAlign: 'center',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 14,
        color: '#6a1b9a',
        textAlign: 'center',
        marginBottom: 5,
    },
    card: {
        marginTop: 20,
        padding: 10,
        borderRadius: 12,
        backgroundColor: '#d4a5ff',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#4a148c',
        marginBottom: 10,
    },
    memberItem: {
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    memberText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4a148c',
    },
    memberDetail: {
        fontSize: 12,
        color: '#6a1b9a',
    },
});