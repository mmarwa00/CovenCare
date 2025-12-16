import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Title, Button, Card, TextInput, HelperText, ActivityIndicator, Paragraph } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { logPeriod, getUserPeriods, predictNextPeriod } from '../services/periodService';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Calendar } from 'react-native-calendars';

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

    // Handle date selection on calendar
    const handleDayPress = (day) => {
        const dateStr = day.dateString;

        // If nothing selected → set start
        if (!startDate) {
            setStartDate(dateStr);
            setEndDate('');
            return;
        }

        // If start selected & end empty → set end
        if (!endDate) {
            if (new Date(dateStr) < new Date(startDate)) {
                // If end < start → new start
                setStartDate(dateStr);
                return;
            }
            setEndDate(dateStr);
            return;
        }

        // If both chosen → restart selection
        setStartDate(dateStr);
        setEndDate('');
    };

    // Marked dates for calendar (highlight range)
    const getMarkedDates = () => {
        const marks = {};

        if (startDate) {
            marks[startDate] = { startingDay: true, color: '#7b1fa2', textColor: 'white' };
        }
        if (endDate) {
            marks[endDate] = { endingDay: true, color: '#9c4dcc', textColor: 'white' };
        }

        return marks;
    };

    // Create range of dates between start/end
    const generateDateRange = (start, end) => {
        const dates = [];
        let current = new Date(start);
        const last = new Date(end);

        while (current <= last) {
            const yyyy = current.getFullYear();
            const mm = String(current.getMonth() + 1).padStart(2, '0');
            const dd = String(current.getDate()).padStart(2, '0');
            dates.push(`${yyyy}-${mm}-${dd}`);
            current.setDate(current.getDate() + 1);
        }
        return dates;
    };

    // Mark all historical period days
    const getPeriodMarkedDates = () => {
        const marks = {};

        periods.forEach(p => {
            const days = generateDateRange(p.startDate.toDate(), p.endDate.toDate());

            days.forEach(d => {
                marks[d] = {
                    customStyles: {
                        container: {
                            backgroundColor: '#f1d8ff', // soft lilac-pink
                            borderRadius: 20,
                        },
                        text: {
                            color: '#4a148c',
                            fontWeight: '600',
                        }
                    }
                };
            });
        });

        return marks;
    };

    // Merge selected dates + historical flow dates
    const getAllMarkedDates = () => {
        return {
            ...getPeriodMarkedDates(),
            ...getMarkedDates(),
        };
    };

    // --- Log Period Handler ---
    const handleLogPeriod = async () => {
        setLoading(true);
        setError('');
        setSuccess('');

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
                    Tip: {prediction.error}. Log more periods to get a precise prediction!
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
        <View style={{ flex: 1 }}>
            <Header navigation={navigation} />

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

                {loading && (
                    <ActivityIndicator animating={true} color="#4a148c" size="small" />
                )}
                {error && (
                    <HelperText type="error" visible={!!error} style={{ textAlign: 'center' }}>
                        {error}
                    </HelperText>
                )}
                {success && (
                    <HelperText type="info" visible={!!success} style={styles.successText}>
                        {success}
                    </HelperText>
                )}

                {/* --- Prediction Card --- */}
                <Card style={styles.card}>
                    <Card.Content>
                        <Title style={styles.cardTitle}>Next Cycle Prediction</Title>
                        {renderPrediction()}
                    </Card.Content>
                </Card>

                {/* --- Log Period Calender--- */}
                <Card style={styles.card}>
                    <Card.Content>
                        <Title style={styles.cardTitle}>Log New Period</Title>
                        <Calendar
                            onDayPress={handleDayPress}
                            markedDates={getAllMarkedDates()}
                            markingType={'custom'}
                            theme={{
                                todayTextColor: '#4a148c',
                                arrowColor: '#4a148c',
                            }}
                        />

                        <Paragraph style={{ marginTop: 10, color: '#4a148c' }}>
                            Start: {startDate || '-'}   |   End: {endDate || '-'}
                        </Paragraph>

                        <Button
                            mode="outlined"
                            onPress={handleLogPeriod}
                            disabled={!startDate || !endDate}
                            style={styles.logFlowButton}
                            labelStyle={styles.logFlowLabel}
                            icon="water"
                        >
                            Log Flow
                        </Button>
                    </Card.Content>
                </Card>

                {/* --- History --- */}
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

            <Footer navigation={navigation} />
        </View>
    );

}
const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
        paddingTop: 20,
        paddingBottom: 120,
        backgroundColor: '#e3d2f0ff',
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
        color: '#4a148c',
        textAlign: 'center',
        marginBottom: 20,
    },
    card: {
        width: '90%',
        alignSelf: 'center',
        marginBottom: 20,
        borderRadius: 12,
        backgroundColor: '#d4a5ff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },

    cardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#4a148c',
        marginBottom: 10,
    },
    logFlowButton: {
        marginTop: 10,
        backgroundColor: '#f8f8ff',
        borderColor: '#4a148c',
        borderWidth: 2,
        width: 200,
        alignSelf: 'center',
        borderRadius: 50,
        height: 45,
        justifyContent: 'center',
    },

    logFlowLabel: {
        fontSize: 14,
        color: '#4a148c',
        fontWeight: 'bold',
    },


    successText: {
        backgroundColor: '#c6add9ff',
        color: '#4a148c',
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
        color: '#4a148c',
    },
    predictionBox: {
        padding: 10,
        backgroundColor: '#d4a5ff',
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#4a148c',
    },
    predictionText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4a148c',
    },
    predictionDate: {
        color: '#4a148c',
    },
    tipText: {
        color: '#4a148c',
        fontSize: 14,
    },
    backButton: {
        alignSelf: 'flex-start',
        marginBottom: 10,
        color: '#4a148c',
    },
});