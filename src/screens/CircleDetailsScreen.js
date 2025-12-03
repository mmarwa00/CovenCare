import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { Card, Title, Paragraph, ActivityIndicator, Button } from 'react-native-paper';
import { db } from '../config/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { auth } from '../config/firebaseConfig'; // Add this import
import Header from '../components/Header';
import Footer from '../components/Footer';
import { leaveCircle } from '../services/circleService';

export default function CircleDetailsScreen({ route, navigation }) {

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
    const [leaveLoading, setLeaveLoading] = useState(false); // Add loading state for leave button

    const witch1 = require('../../assets/Profile_pics/witch1.png');
    const witch2 = require('../../assets/Profile_pics/witch2.png');
    const witch3 = require('../../assets/Profile_pics/witch3.png');
    const witch4 = require('../../assets/Profile_pics/witch4.png');

    const photoMap = {
        witch1,
        witch2,
        witch3,
        witch4,
    };

    // Fetch usernames and details for all members
    const fetchMemberDetails = async () => {
        const details = [];
        const memberPromises = circle.members.map(async (memberObject) => {
            const uid = memberObject.userId;
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
                        role: memberObject.role || 'member',
                        profilePhoto: userData.profilePhoto || null,
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

    const renderMemberAvatar = (member) => {
        if (member.profilePhoto && photoMap[member.profilePhoto]) {
            return (
                <Image
                    source={photoMap[member.profilePhoto]}
                    style={styles.memberAvatar}
                    resizeMode="cover"
                />
            );
        }
        return null;
    };

    const handleLeaveCircle = async () => {
        try {
            setLeaveLoading(true);
            
            // Get current user ID from Firebase Auth
            const currentUserId = auth.currentUser?.uid;
            
            if (!currentUserId) {
                console.error('No user logged in');
                setLeaveLoading(false);
                return;
            }

            // Get circle ID from the circle object
            const circleId = circle.id;

            // Call leaveCircle with userId and circleId
            await leaveCircle(currentUserId, circleId);
            
            // Navigate back to dashboard after successfully leaving
            navigation.navigate('Dashboard');
        } catch (e) {
            console.error('Error leaving circle:', e);
            setLeaveLoading(false);
        }
    };

    return (
        <View style={{ flex: 1 }}>
            <Header />
            <ScrollView contentContainerStyle={styles.scrollContainer}>
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
                                <View key={member.id} style={styles.memberItem}>
                                    <View style={styles.memberRow}>
                                        {renderMemberAvatar(member)}
                                        <View style={styles.memberTextWrap}>
                                            <Text style={styles.memberText}>
                                                {member.displayName} <Text style={styles.memberRole}>({member.role})</Text>
                                            </Text>
                                            <Text style={styles.memberDetail}>Privacy: {member.privacyLevel}</Text>
                                            {member.email ? (
                                                <Text style={styles.memberSmall}>Email: {member.email}</Text>
                                            ) : null}
                                        </View>
                                    </View>
                                </View>
                            ))
                        )}
                    </Card.Content>
                </Card>

                {/* --- Leave Circle Button --- */}
                <Button
                    mode="outlined"
                    onPress={handleLeaveCircle}
                    style={styles.leaveButton}
                    labelStyle={styles.leaveLabel}
                    icon="exit-to-app"
                    disabled={leaveLoading}
                    loading={leaveLoading}
                >
                    {leaveLoading ? 'Leaving...' : 'Leave Circle'}
                </Button>

            </ScrollView>

            <Footer navigation={navigation} />
        </View>
    );
}

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 120,
        backgroundColor: '#e3d2f0ff',
    },
    dashboardBox: {
        backgroundColor: '#d4a5ff',
        padding: 15,
        borderRadius: 12,
        marginVertical: 10,
        width: '90%',
        alignSelf: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
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
    memberAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 10,
    },
    leaveButton: {
        marginTop: 20,
        backgroundColor: '#f8f8ff',
        borderColor: '#4a148c',
        borderWidth: 2,
        width: 200,
        alignSelf: 'center',
        borderRadius: 50,
        height: 45,
        justifyContent: 'center',
    },
    leaveLabel: {
        fontSize: 14,
        color: '#4a148c',
        fontWeight: 'bold',
    },
});