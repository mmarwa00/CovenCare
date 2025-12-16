import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { getActiveEmergencies, respondToEmergency, PREDEFINED_RESPONSES } from '../services/emergencyService';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function AlertBox({ navigation }) {
  const { user } = useAuth();
  const userId = user?.uid;

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      if (!userId) return;
      setLoading(true);
      const result = await getActiveEmergencies(userId);
      if (result.success) {
        setAlerts(result.emergencies);
      } else {
        console.error('Error fetching alerts:', result.error);
      }
      setLoading(false);
    };
    fetchAlerts();
  }, [userId]);

  const handleAnswer = async (alert, responseMessage) => {
    const res = await respondToEmergency(alert.id, userId, responseMessage);
    if (res.success) {
      setAlerts(prev =>
        prev.map(a => a.id === alert.id ? { ...a, answered: true } : a)
      );
    } else {
      console.error('Error answering alert:', res.error);
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
          alerts.map(alert => (
            <View key={alert.id} style={styles.alertCard}>
              <Text style={styles.alertType}>{getEmergencyTypeDisplay(alert.type)}</Text>
              <Text style={styles.alertDetail}>
                From: {alert.senderName} • {new Date(alert.createdAt).toLocaleString()}
              </Text>
              {alert.message && (
                <Text style={styles.alertMessage}>"{alert.message}"</Text>
              )}

              <View style={styles.buttonContainer}>
                {PREDEFINED_RESPONSES.map((resp, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => handleAnswer(alert, resp)}
                    style={styles.answerButton}
                  >
                    <Text style={styles.answerButtonText}>{resp}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))
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
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: 'column',
    gap: 10,
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
  },
  answerButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});