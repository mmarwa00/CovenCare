import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Title, Button, Card, TextInput, HelperText, ActivityIndicator, Paragraph } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { logPreviousPeriods, getUserPeriods, predictNextPeriod } from '../services/periodService';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Calendar } from 'react-native-calendars';
import { db } from '../config/firebaseConfig';
import { deleteDoc, doc } from 'firebase/firestore';
import { Alert } from "react-native";

// Helper function to format date objects
const formatDate = (date) => {
    if (!date) return 'N/A';
    // Ensure we handle Firestore Timestamp objects by calling .toDate()
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

// Helper: convert JS Date → YYYY-MM-DD
const toDateString = (date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
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

    // --- Date selection logic ---
    const handleDayPress = (day) => {
        const dateStr = day.dateString;
        const today = new Date();
        const clicked = new Date(dateStr);

        // check if user tapped on existing logged period
        const existing = findPeriodByDay(dateStr);
        if (existing) {
            Alert.alert(
                "Delete Period?",
                `${formatDate(existing.startDate)} - ${formatDate(existing.endDate)}`,
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Delete", style: "destructive", onPress: () => deletePeriod(existing) }
                ]
            );
            return;
        }

         // Start CANNOT be in future
        if (!startDate) {
            if (clicked > today) {
                Alert.alert("Not allowed", "Start date cannot be in the future 😊");
                return;
            }
            setStartDate(dateStr);
            setEndDate('');
            return;
        }

        // If start selected & end empty, set end
        if (!endDate) {
            if (clicked < new Date(startDate)) {
                setStartDate(dateStr); // reset start if earlier clicked
                return;
            }
            setEndDate(dateStr);
            return;
        }

        // If both chosen → restart selection
        setStartDate(dateStr);
        setEndDate('');
    };

    const getPeriodMarkedDates = () => {
        const marks = {};

        periods.forEach(p => {
            const start = p.startDate.toDate ? p.startDate.toDate() : new Date(p.startDate);
            const end = p.endDate.toDate ? p.endDate.toDate() : new Date(p.endDate);

            let current = new Date(start);

            while (current <= end) {
                const key = toDateString(current);

                marks[key] = {
                    customStyles: {
                        container: {
                            backgroundColor: '#e6c9ff',
                            borderRadius: 20,
                        },
                        text: {
                            color: '#4a148c',
                            fontWeight: 'bold',
                        }
                    }
                };
                current.setDate(current.getDate() + 1);
            }
        });
        return marks;
    };

    // Highlight currently selected range
    const getSelectedRangeMarks = () => {
        const marks = {};
        if (!startDate) return marks;

        marks[startDate] = {
            startingDay: true,
            color: '#7b1fa2',
            textColor: 'white'
        };

        if (endDate) {
            marks[endDate] = {
                endingDay: true,
                color: '#9c4dcc',
                textColor: 'white'
            };
        }
        return marks;
    };

    const todayString = new Date().toISOString().split("T")[0];

    // disable dates are light gray
    const getFutureDisabledDates = (existingMarks) => {
        const marks = { ...existingMarks };
        const today = new Date();

        for (let i = 1; i <= 365; i++) {
            const d = new Date();
            d.setDate(today.getDate() + i);

            const key = toDateString(d);
            // ❗ Do NOT override period days
            if (!marks[key]) {
                marks[key] = { disabled: true };
            }
        }
        return marks;
    };


    const getAllMarkedDates = () => {
       let baseMarks = {
            ...getPeriodMarkedDates(),
            ...getSelectedRangeMarks(),
            [todayString]: {
                customStyles: {
                    container: {
                        backgroundColor: "#4a148c",
                        borderRadius: 20,
                    },
                    text: {
                        color: "white",
                        fontWeight: "bold",
                    },
                },
            },
            
        };
        baseMarks = getFutureDisabledDates(baseMarks);
        return baseMarks;
    };

    // --- Log Period Handler ---
    const handleLogPeriod = async () => {
        setLoading(true);
        setError('');
        setSuccess('');

        const result = await logPreviousPeriods(userId, startDate, endDate);

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

    const findPeriodByDay = (dateStr) => {
        const clicked = new Date(dateStr);

        return periods.find(p => {
            const start = p.startDate.toDate ? p.startDate.toDate() : new Date(p.startDate);
            const end = p.endDate.toDate ? p.endDate.toDate() : new Date(p.endDate);
            return clicked >= start && clicked <= end;
        });
    };

    const deletePeriod = async (period) => {
        try {
            await deleteDoc(doc(db, 'periods', period.id));
            setSuccess('Period deleted');
            setStartDate('');
            setEndDate('');
            fetchData();
        } catch (e) {
            console.log(e);
            setError('Failed to delete period');
        }
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

                {/* --- Log Period --- */}
                <Card style={styles.card}>
                    <Card.Content>
                        <Title style={styles.cardTitle}>Log New Period</Title>
                        <Calendar
                            firstDay={1} 
                            disableAllTouchEventsForDisabledDays={false}
                            onDayPress={handleDayPress}
                            markedDates={getAllMarkedDates()}
                            markingType="custom"
                            theme={{
                                todayTextColor: '#4a148c',
                                arrowColor: '#4a148c',
                                textDisabledColor: '#aaaaaa'
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