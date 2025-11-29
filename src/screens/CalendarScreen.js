import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Title, Button, Card, TextInput, HelperText, ActivityIndicator, Paragraph } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { logPeriod, getUserPeriods, predictNextPeriod } from '../services/periodService';

// Helper function to format date objects
const formatDate = (date) => {
    if (!date) return 'N/A';
    // Ensure we handle Firestore Timestamp objects by calling .toDate()
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

export default function CalendarScreen({ navigation }) {
    const { user } = useAuth();
    const userId = user?.uid;

    // State for logging a new period
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    // State for display
    const [periods, setPeriods] = useState([]);
    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // --- Data Fetching ---
    const fetchData = async () => {
        if (!userId) return;
        setLoading(true);
        setError('');

        // 1. Fetch History
        const historyResult = await getUserPeriods(userId);
        if (historyResult.success) {
            setPeriods(historyResult.periods);
        } else {
            setError(historyResult.error);
        }

        // 2. Fetch Prediction
        const predictionResult = await predictNextPeriod(userId);
        if (predictionResult.success) {
            setPrediction(predictionResult);
        } else if (predictionResult.error) {
             setPrediction({ prediction: null, error: predictionResult.error });
        }
        
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [userId]);


    // --- Log Period Handler ---
    const handleLogPeriod = async () => {
        setLoading(true);
        setError('');
        setSuccess('');

        // Basic date format validation (YYYY-MM-DD expected)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
            setError('Please use YYYY-MM-DD format for dates.');
            setLoading(false);
            return;
        }

        const result = await logPeriod(userId, startDate, endDate);

        if (result.success) {
            setSuccess('Period successfully logged!');
            setStartDate('');
            setEndDate('');
            fetchData(); // Refresh all data and prediction
        } else {
            setError(result.error);
        }
        setLoading(false);
    };
    
    // --- Render Logic ---
    const renderPrediction = () => {
        if (prediction?.error) {
            return (
                <Paragraph style={styles.tipText}>
                    Tip: {prediction.error}. Log more periods to get a prediction!
                </Paragraph>
            );
        }
        if (prediction?.prediction) {
            return (
                <View style={styles.predictionBox}>
                    <Text style={styles.predictionText}>
                        Next Period Predicted: 
                        <Text style={styles.predictionDate}> {formatDate(prediction.prediction)}</Text>
                    </Text>
                    <Text style={styles.detailText}>
                        Avg Cycle: {prediction.averageCycle} days (Confidence: {prediction.confidence})
                    </Text>
                </View>
            );
        }
        return <Paragraph style={styles.tipText}>Awaiting data for prediction...</Paragraph>;
    };

    return (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <Button 
                mode="text" 
                onPress={() => navigation.navigate('Dashboard')} 
                style={styles.backButton}
            >
                ← Back to Dashboard
            </Button>
            
            <Title style={styles.title}>Cycle Calendar 🗓️</Title>
            <Paragraph style={styles.subtitle}>
                Log your flow and predict your future.
            </Paragraph>

            {loading && <ActivityIndicator animating={true} color="#4a148c" size="small" />}
            {error && <HelperText type="error" visible={!!error} style={{ textAlign: 'center' }}>{error}</HelperText>}
            {success && <HelperText type="info" visible={!!success} style={styles.successText}>{success}</HelperText>}
            
            {/* --- 1. Prediction Card --- */}
            <Card style={styles.card}>
                <Card.Content>
                    <Title style={styles.cardTitle}>Next Cycle Prediction</Title>
                    {renderPrediction()}
                </Card.Content>
            </Card>

            {/* --- 2. Log Period --- */}
            <Card style={styles.card}>
                <Card.Content>
                    <Title style={styles.cardTitle}>Log New Period</Title>
                    <TextInput
                        label="Start Date (YYYY-MM-DD)"
                        value={startDate}
                        onChangeText={setStartDate}
                        mode="outlined"
                        style={styles.input}
                        disabled={loading}
                    />
                    <TextInput
                        label="End Date (YYYY-MM-DD)"
                        value={endDate}
                        onChangeText={setEndDate}
                        mode="outlined"
                        style={styles.input}
                        disabled={loading}
                    />
                    <Button 
                        mode="contained" 
                        onPress={handleLogPeriod} 
                        disabled={loading || !startDate || !endDate}
                        style={styles.actionButton}
                    >
                        Log Flow
                    </Button>
                </Card.Content>
            </Card>

            {/* --- 3. History --- */}
            <Card style={styles.card}>
                <Card.Content>
                    <Title style={styles.cardTitle}>History ({periods.length} Logged)</Title>
                    {periods.length === 0 ? (
                        <Paragraph style={{ color: '#555' }}>No past periods logged yet.</Paragraph>
                    ) : (
                        periods.map((p, index) => (
                            <View key={index} style={styles.historyItem}>
                                <Text style={styles.historyText}>
                                    Flow: {formatDate(p.startDate)} - {formatDate(p.endDate)}
                                </Text>
                                <Text style={styles.detailText}>
                                    Cycle Length: {p.cycleLength || 'N/A'} days
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
    scrollContainer: {
        flexGrow: 1,
        padding: 20,
        backgroundColor: '#f9f9f9',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#b71c1c', // Deep red/maroon
        marginBottom: 5,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#777',
        textAlign: 'center',
        marginBottom: 20,
    },
    card: {
        width: '100%',
        marginBottom: 20,
        borderRadius: 12,
        elevation: 3,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#8e24aa',
        marginBottom: 10,
    },
    input: {
        marginBottom: 10,
    },
    actionButton: {
        marginTop: 10,
        backgroundColor: '#b71c1c',
    },
    successText: {
        backgroundColor: '#ffebee',
        color: '#b71c1c',
        borderRadius: 4,
        padding: 5,
        marginBottom: 10,
    },
    historyItem: {
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    historyText: {
        fontSize: 16,
        fontWeight: '600',
    },
    detailText: {
        fontSize: 12,
        color: '#555',
    },
    predictionBox: {
        padding: 10,
        backgroundColor: '#fff3e0',
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#ff9800',
    },
    predictionText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    predictionDate: {
        color: '#d84315',
    },
    tipText: {
        color: '#999',
        fontSize: 14,
    },
    backButton: {
        alignSelf: 'flex-start',
        marginBottom: 10,
        color: '#4a148c',
    }
});