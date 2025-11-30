import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Button, Title, Paragraph, TextInput, Card, HelperText, ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { createCircle, joinCircle, getUserCircles } from '../services/circleService';
import Header from '../components/Header';

// Firebase
import { auth, db } from '../config/firebaseConfig';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

export default function CircleScreen({ navigation }) {
    const { user } = useAuth();
    const userId = user?.uid;

    const [circleName, setCircleName] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [circles, setCircles] = useState([]);
    const [activeCircleId, setActiveCircleId] = useState(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Fetch circles
    const fetchCircles = async () => {
        if (!userId) return;
        setLoading(true);
        setError('');

        const result = await getUserCircles(userId);
        if (result.success) {
            setCircles(result.circles || []);
        } else {
            setError(`Failed to fetch circles: ${result.error}`);
        }

        setLoading(false);
    };

    // Fetch active circle
    const fetchActiveCircle = async () => {
        if (!userId) return;

        try {
            const userRef = doc(db, 'users', userId);
            const snap = await getDoc(userRef);

            if (snap.exists()) {
                setActiveCircleId(snap.data().activeCircleId || null);
            }
        } catch (err) {
            console.log('Error fetching active circle:', err);
        }
    };

    useEffect(() => {
        fetchCircles();
        fetchActiveCircle();
    }, [userId]);

    // Create circle
    const handleCreateCircle = async () => {
        setLoading(true);
        setError('');
        setSuccess('');

        if (!circleName.trim()) {
            setError('Circle name cannot be empty.');
            setLoading(false);
            return;
        }

        const result = await createCircle(userId, circleName);

        if (result.success) {
            setSuccess(`Circle created! Invite Code: ${result.inviteCode}`);
            setCircleName('');
            fetchCircles();
        } else {
            setError(result.error);
        }

        setLoading(false);
    };

    // Set active circle
    const handleSetActiveCircle = async (circleId) => {
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) return;

            await updateDoc(doc(db, 'users', currentUser.uid), {
                activeCircleId: circleId,
            });

            setActiveCircleId(circleId);
            alert('Active circle updated!');
        } catch (error) {
            console.log('Error setting active circle:', error);
        }
    };

    // Join circle
    const handleJoinCircle = async () => {
        setLoading(true);
        setError('');
        setSuccess('');

        if (!inviteCode.trim()) {
            setError('Invite code is required.');
            setLoading(false);
            return;
        }

        const result = await joinCircle(userId, inviteCode);

        if (result.success) {
            setSuccess(`Successfully joined '${result.circleName}'!`);
            setInviteCode('');
            fetchCircles();
        } else {
            setError(result.error);
        }

        setLoading(false);
    };

    return (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <Header />

            <Button
                mode="text"
                onPress={() => navigation.navigate('Dashboard')}
                style={styles.backButton}
            >
                ← Back to Dashboard
            </Button>

            <Title style={styles.title}>Coven Circles 🫂</Title>
            <Paragraph style={styles.subtitle}>
                Manage your circles and choose your active one.
            </Paragraph>

            {loading && <ActivityIndicator animating={true} color="#4a148c" size="small" />}
            {error && <HelperText type="error" visible={!!error} style={{ textAlign: 'center' }}>{error}</HelperText>}
            {success && <HelperText type="info" visible={!!success} style={styles.successText}>{success}</HelperText>}

            {/* Create Circle */}
            <Card style={styles.card}>
                <Card.Content>
                    <Title style={styles.cardTitle}>Create New Circle</Title>
                    <TextInput
                        label="Circle Name"
                        value={circleName}
                        onChangeText={setCircleName}
                        mode="outlined"
                        style={styles.input}
                        disabled={loading}
                    />
                    <Button 
                        mode="contained" 
                        onPress={handleCreateCircle} 
                        disabled={loading || !circleName.trim()}
                        style={styles.actionButton}
                    >
                        Create Circle
                    </Button>
                </Card.Content>
            </Card>

            {/* Join Circle */}
            <Card style={styles.card}>
                <Card.Content>
                    <Title style={styles.cardTitle}>Join Circle</Title>
                    <TextInput
                        label="Invite Code"
                        value={inviteCode}
                        onChangeText={setInviteCode}
                        mode="outlined"
                        style={styles.input}
                        disabled={loading}
                        autoCapitalize="characters"
                        maxLength={8}
                    />
                    <Button
                        mode="outlined"
                        onPress={handleJoinCircle}
                        disabled={loading || inviteCode.length !== 8}
                        style={styles.actionButton}
                    >
                        Join Circle
                    </Button>
                </Card.Content>
            </Card>

            {/* Circles List */}
            <Card style={styles.card}>
                <Card.Content>
                    <Title style={styles.cardTitle}>My Circles ({circles.length})</Title>

                    {circles.map((circle, index) => (
                        <TouchableOpacity
                            key={circle.id}
                            style={[
                                styles.circleItem,
                                circle.id === activeCircleId && styles.activeCircle
                            ]}
                            onPress={() => navigation.navigate('CircleDetails', { circle })}
                        >
                            <Image
                                source={
                                    index % 3 === 0
                                        ? require('../../assets/icons/circle_small1.png')
                                        : index % 3 === 1
                                        ? require('../../assets/icons/circle_small2.png')
                                        : require('../../assets/icons/circle_small3.png')
                                }
                                style={styles.circleIcon}
                            />

                            <View style={styles.circleInfo}>
                                <Text style={styles.circleName}>{circle.name}</Text>
                                <Text style={styles.circleDetail}>ID: {circle.id}</Text>
                                <Text style={styles.circleDetail}>Code: {circle.inviteCode}</Text>
                                <Text style={styles.circleDetail}>
                                    {Array.isArray(circle.members)
                                        ? `${circle.members.length} members`
                                        : '0 members'}
                                </Text>

                                <Button
                                    mode="contained"
                                    onPress={() => handleSetActiveCircle(circle.id)}
                                    style={{ marginTop: 8, backgroundColor: '#6a1b9a' }}
                                    labelStyle={{ fontSize: 12 }}
                                >
                                    ⭐ Set as Active
                                </Button>

                                {circle.id === activeCircleId && (
                                    <Text style={styles.activeBadge}>⭐ Active Circle</Text>
                                )}
                            </View>
                        </TouchableOpacity>
                    ))}

                    <Button mode="text" onPress={fetchCircles} style={{ marginTop: 10 }}>
                        Refresh List
                    </Button>
                </Card.Content>
            </Card>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
        padding: 20,
        backgroundColor: '#f0e6f5ff',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#4a148c',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#5c1862ff',
        textAlign: 'center',
        marginBottom: 20,
    },
    card: {
        width: '100%',
        marginBottom: 20,
        borderRadius: 12,
        backgroundColor: '#d4a5ff',
        paddingBottom: 10,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#4a148c',
        marginBottom: 10,
    },
    input: {
        marginBottom: 10,
    },
    actionButton: {
        marginTop: 10,
        backgroundColor: '#b98ae5ff',
    },
    successText: {
        backgroundColor: '#c7a5cdff',
        color: '#6e079eff',
        borderRadius: 4,
        padding: 5,
        marginBottom: 10,
    },
    circleItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    activeCircle: {
        backgroundColor: '#f3d9ff',
        borderLeftWidth: 4,
        borderLeftColor: '#6a1b9a',
    },
    activeBadge: {
        marginTop: 5,
        color: '#6a1b9a',
        fontWeight: 'bold',
    },
    circleIcon: {
        width: 50,
        height: 50,
        marginRight: 12,
        resizeMode: 'contain',
    },
    circleInfo: {
        flex: 1,
    },
    circleName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    circleDetail: {
        fontSize: 12,
        color: '#4a148c',
    },
    backButton: {
        alignSelf: 'flex-start',
        marginBottom: 10,
    },
});
