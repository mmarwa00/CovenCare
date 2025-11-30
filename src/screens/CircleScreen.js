import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { Button, Title, Paragraph, TextInput, Card, HelperText, ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { createCircle, joinCircle, getUserCircles } from '../services/circleService';
import Header from '../components/Header';

export default function CircleScreen({ navigation }) {
    const { user } = useAuth();
    
    const [circleName, setCircleName] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [circles, setCircles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const userId = user?.uid;

    // --- Data Fetching ---
    const fetchCircles = async () => {
        if (!userId) return;
        setLoading(true);
        setError('');
        const result = await getUserCircles(userId);
        if (result.success) {
            setCircles(result.circles);
        } else {
            setError(`Failed to fetch circles: ${result.error}`);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchCircles();
    }, [userId]);

    // --- Create Circle Handler ---
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
            fetchCircles(); // Refresh the list
        } else {
            setError(result.error);
        }
        setLoading(false);
    };

    // --- Join Circle Handler ---
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
            fetchCircles(); // Refresh the list
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
                Test your `circleService` functions below.
            </Paragraph>

            {loading && <ActivityIndicator animating={true} color="#4a148c" size="small" />}
            {error && <HelperText type="error" visible={!!error} style={{ textAlign: 'center' }}>{error}</HelperText>}
            {success && <HelperText type="info" visible={!!success} style={styles.successText}>{success}</HelperText>}
            
            
            {/* --- 1. Create Circle --- */}
            <Card style={styles.card}>
                <Card.Content>
                    <Title style={styles.cardTitle}>Create New Circle</Title>
                    <TextInput
                        label="Circle Name (e.g., The Midnight Trio)"
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
                        labelStyle={{ color: '#4a148c', fontSize: 14, fontWeight: 'bold' }}
                    >
                        Create Circle
                    </Button>
                </Card.Content>
            </Card>

            {/* --- 2. Join Circle --- */}
            <Card style={styles.card}>
                <Card.Content>
                    <Title style={styles.cardTitle}>Join Circle</Title>
                    <TextInput
                        label="Invite Code (8 characters)"
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
                        labelStyle={{ color: '#4a148c', fontSize: 14, fontWeight: 'bold' }}
                    >
                        Join Circle
                    </Button>
                </Card.Content>
            </Card>

            {/* --- 3. View Circles --- */}
            <Card style={styles.card}>
                <Card.Content>
                    <Title style={styles.cardTitle}>My Circles ({circles.length})</Title>
                    {circles.length === 0 ? (
                        <Paragraph>You are not currently in any circles.</Paragraph>
                    ) : (
                        circles.map((circle, index) => (
                    <View key={circle.id} style={styles.circleItem}>
                        <Image
                            source={
                                index % 3 === 0 ? require('../../assets/icons/circle_small1.png') :
                                index % 3 === 1 ? require('../../assets/icons/circle_small2.png') :
                                require('../../assets/icons/circle_small3.png')
                            }
                            style={styles.circleIcon}
                        />    
                            <View style={styles.circleInfo}>
                                <Text style={styles.circleName}>{circle.name}</Text>
                                <Text style={styles.circleDetail}>ID: {circle.id}</Text>
                                <Text style={styles.circleDetail}>Code: {circle.inviteCode}</Text>
                                <Text style={styles.circleDetail}>{circle.members.length} members</Text>
                            </View>
                        </View>    
                        ))
                    )}
                    <Button mode="text" onPress={fetchCircles} style={{marginTop: 10}}
                        labelStyle={{ color: '#4a148c', fontSize: 14, fontWeight: 'bold' }}>
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
        backgroundColor: '#f0e6f5ff', // Very light green/lavender
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#4a148c',
        marginBottom: 5,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#5c1862ff',
        textAlign: 'center',
        marginBottom: 20,
    },
    cardContainer: {
        width: '100%',
        marginBottom: 40,
        gap: 15,
    },
    card: {
        width: '100%',
        marginBottom: 20,
        borderRadius: 12,
        elevation: 3,
        backgroundColor: '#d4a5ff',
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
    actionButton: {
    marginTop: 10,
    backgroundColor: '#b98ae5ff',
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: '#4a148c',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    }
});