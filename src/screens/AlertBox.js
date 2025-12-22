import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import {
  getActiveEmergencies,
  respondToEmergency,
  PREDEFINED_RESPONSES
} from '../services/emergencyService';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function AlertBox({ navigation }) {
  const { user } = useAuth();
  const userId = user?.uid;

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingMap, setProcessingMap] = useState({}); // { [alertId]: boolean }

  useEffect(() => {
    let mounted = true;
    const fetchAlerts = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const result = await getActiveEmergencies(userId);
        if (result.success && mounted) setAlerts(result.emergencies);
        else if (!result.success) console.error('Error fetching alerts:', result.error);
      } catch (err) {
        console.error('Fetch alerts error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchAlerts();
    return () => { mounted = false; };
  }, [userId]);

  const CANT_PHRASE = "Can't right now but ❤️";

  const isCantResponse = (text) => {
    return text?.toLowerCase().trim() === CANT_PHRASE.toLowerCase().trim();
  };

  const setProcessing = (alertId, value) => {
    setProcessingMap(prev => ({ ...prev, [alertId]: value }));
  };

  const handleAnswer = async (alert, responseMessage) => {
    console.log('handleAnswer called', { alertId: alert?.id, responseMessage });

    if (!alert || !responseMessage) return;
    const alertId = alert.id;
    const cant = isCantResponse(responseMessage);
    const positive = !cant;

    // Snapshot for rollback
    const prevAlerts = alerts;

    // Optimistic UI update
    if (positive) {
      setAlerts(prev => prev.filter(a => a.id !== alertId));
    } else {
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, answered: true } : a));
    }

    setProcessing(alertId, true);

    try {
      const res = await respondToEmergency(alertId, userId, responseMessage);
      console.log('respondToEmergency result', res);

      if (!res.success) {
        console.error('respondToEmergency failed:', res.error);
        setAlerts(prevAlerts);
        Alert.alert('Error', 'Could not send response. Try again.');
        return;
      }

      // If backend returned updated emergency, use it to update local state
      if (res.emergency) {
        if (res.emergency.status === 'resolved') {
          setAlerts(prev => prev.filter(a => a.id !== alertId));
          navigation.navigate('Dashboard', { refresh: Date.now() });
        } else {
          setAlerts(prev => prev.map(a => a.id === alertId ? res.emergency : a));
        }
      } else {
        // fallback: if positive, navigate back to Dashboard to force refresh
        if (positive) navigation.navigate('Dashboard', { refresh: Date.now() });
      }
    } catch (err) {
      console.error('Network error sending response:', err);
      setAlerts(prevAlerts);
      Alert.alert('Error', 'Network error while sending response.');
    } finally {
      setProcessing(alertId, false);
    }
  };

  const getEmergencyTypeDisplay = (type) => {
    const types = {
      tampon: '🩸 Tampon Emergency',
      pads: '🩸 Pad Emergency',
      painkiller: '💊 Need Painkiller',
      heating_pad: '♨️ Heating Pad Emergency',
      the_ear: '👂 Need a Listening Ear',
      the_pms: '👹 PMS Emergency'
    };
    return types[type] || type;
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f8f8ff' }}>
      <Header navigation={navigation} />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Received Emergency Alerts</Text>

        {loading ? (
          <ActivityIndicator animating={true} color="#4a148c" />
        ) : alerts.length === 0 ? (
          <Text style={styles.subtitle}>No active alerts.</Text>
        ) : (
          alerts.map(alert => {
            const processing = !!processingMap[alert.id];
            const answered = !!alert.answered;
            return (
              <View key={alert.id} style={styles.alertCard}>
                <Text style={styles.alertType}>{getEmergencyTypeDisplay(alert.type)}</Text>
                <Text style={styles.alertDetail}>
                  From: {alert.senderName} • {new Date(alert.createdAt).toLocaleString()}
                </Text>

                {alert.message ? (
                  <Text style={styles.alertMessage}>"{alert.message}"</Text>
                ) : null}

                {/* Responses list (if any) */}
                {Array.isArray(alert.responses) && alert.responses.length > 0 && (
                  <View style={styles.responsesContainer}>
                    {alert.responses.map((r, i) => (
                      <Text key={i} style={styles.responseText}>
                        <Text style={{ fontWeight: 'bold' }}>{r.userName}: </Text>
                        {r.message}
                      </Text>
                    ))}
                  </View>
                )}

                <View style={styles.buttonContainer}>
                  {PREDEFINED_RESPONSES.map((resp, idx) => {
                    const cantResp = isCantResponse(resp);
                    const disabled = processing || (answered && cantResp);
                    return (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => handleAnswer(alert, resp)}
                        style={[
                          styles.answerButton,
                          disabled && styles.answerButtonDisabled,
                          cantResp && styles.cantButton
                        ]}
                        disabled={disabled}
                      >
                        <Text style={styles.answerButtonText}>{resp}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <Footer navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 20,
    paddingBottom: 100,
    backgroundColor: '#e3d2f0ff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4a148c',
    textAlign: 'center',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 14,
    color: '#6a1b9a',
    textAlign: 'center',
    marginTop: 10,
  },
  alertCard: {
    backgroundColor: '#d4a5ff',
    padding: 20,
    borderRadius: 18,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  alertType: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4a148c',
    marginBottom: 8,
  },
  alertDetail: {
    fontSize: 12,
    color: '#4a148c',
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#4a148c',
    marginTop: 6,
    marginBottom: 12,
  },
  responsesContainer: {
    marginTop: 8,
    marginBottom: 12,
  },
  responseText: {
    fontSize: 13,
    color: '#2e0057',
    marginBottom: 4,
  },
  buttonContainer: {
    flexDirection: 'column',
    marginTop: 10,
  },
  answerButton: {
    backgroundColor: '#4a148c',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    marginBottom: 8,
  },
  cantButton: {
    backgroundColor: '#6a1b9a',
  },
  answerButtonDisabled: {
    backgroundColor: '#999',
    opacity: 0.8,
  },
  answerButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
