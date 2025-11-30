import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, ActivityIndicator, Button } from 'react-native-paper';
import { db } from '../config/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

export default function CircleDetailsScreen({ route, navigation }) {
    const { circle } = route.params;

    const [usernames, setUsernames] = useState({});
    const [loading, setLoading] = useState(true);

    // Fetch usernames for all members
    const fetchUsernames = async () => {
        const map = {};

        await Promise.all(
            circle.members.map(async (uid) => {
                try {
                    const userRef = doc(db, 'users', uid);
                    const snap = await getDoc(userRef);
                    if (snap.exists()) {
                        map[uid] = snap.data().username || 'Unknown';
                    } else {
                        map[uid] = 'Unknown';
                    }
                } catch {
                    map[uid] = 'Unknown';
                }
            })
        );

        setUsernames(map);
        setLoading(false);
    };

    useEffect(() => {
        fetchUsernames();
    }, []);

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Button mode="text" onPress={() => navigation.goBack()} style={styles.backButton}>
                ← Back
            </Button>

            <Title style={styles.title}>{circle.name}</Title>
            <Paragraph style={styles.subtitle}>Circle ID: {circle.id}</Paragraph>
            <Paragraph style={styles.subtitle}>Invite Code: {circle.inviteCode}</Paragraph>

            <Card style={styles.card}>
                <Card.Content>
                    <Title style={styles.sectionTitle}>
                        Participants ({circle.members.length})
                    </Title>

                    {loading ? (
                        <ActivityIndicator animating={true} color="#4a148c" />
                    ) : (
                        circle.members.map((uid, index) => (
                            <View key={uid} style={styles.memberItem}>
                                <Text style={styles.memberText}>
                                    • {usernames[uid] || 'Unknown'}
                                </Text>
                            </View>
                        ))
                    )}
                </Card.Content>
            </Card>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#f0e6f5ff',
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
        fontSize: 14,
        color: '#4a148c',
    },
});

