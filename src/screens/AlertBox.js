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
import { useTheme } from '../context/ThemeContext'; 

export default function AlertBox({ navigation }) {
  const { user } = useAuth();
  const userId = user?.uid;
  const { colors, isDarkMode } = useTheme();

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingMap, setProcessingMap] = useState({});

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
    if (!alert || !responseMessage) return;
    const alertId = alert.id;
    const cant = isCantResponse(responseMessage);
    const positive = !cant;

    const prevAlerts = alerts;

    if (positive) {
      setAlerts(prev => prev.filter(a => a.id !== alertId));
    } else {
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, answered: true } : a));
    }

    setProcessing(alertId, true);

    try {
      const res = await respondToEmergency(alertId, userId, responseMessage);

      if (!res.success) {
        setAlerts(prevAlerts);
        Alert.alert('Error', 'Could not send response. Try again.');
        return;
      }

      if (res.emergency) {
        if (res.emergency.status === 'resolved') {
          setAlerts(prev => prev.filter(a => a.id !== alertId));
          navigation.navigate('Dashboard', { refresh: Date.now() });
        } else {
          setAlerts(prev => prev.map(a => a.id === alertId ? res.emergency : a));
        }
      } else {
        if (positive) navigation.navigate('Dashboard', { refresh: Date.now() });
      }
    } catch (err) {
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
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header navigation={navigation} />

      <ScrollView contentContainerStyle={styles(colors, isDarkMode).scrollContainer}>
        <Text style={styles(colors, isDarkMode).title}>Received Emergency Alerts</Text>

        {loading ? (
          <ActivityIndicator animating={true} color={isDarkMode ? '#e3d2f0ff' : '#4a148c'} />
        ) : alerts.length === 0 ? (
          <Text style={[styles(colors, isDarkMode).subtitle, isDarkMode && { color: '#e3d2f0ff' }]}>
            No active alerts.
          </Text>
        ) : (
          alerts.map(alert => {
            const processing = !!processingMap[alert.id];
            const answered = !!alert.answered;
            return (
              <View key={alert.id} style={styles(colors, isDarkMode).alertCard}>
                <Text style={styles(colors, isDarkMode).alertType}>
                  {getEmergencyTypeDisplay(alert.type)}
                </Text>

                <Text style={styles(colors, isDarkMode).alertDetail}>
                  From: {alert.senderName} • {new Date(alert.createdAt).toLocaleString()}
                </Text>

                {alert.message ? (
                  <Text style={styles(colors, isDarkMode).alertMessage}>"{alert.message}"</Text>
                ) : null}

                {Array.isArray(alert.responses) && alert.responses.length > 0 && (
                  <View style={styles(colors, isDarkMode).responsesContainer}>
                    {alert.responses.map((r, i) => (
                      <Text key={i} style={styles(colors, isDarkMode).responseText}>
                        <Text style={{ fontWeight: 'bold' }}>{r.userName}: </Text>
                        {r.message}
                      </Text>
                    ))}
                  </View>
                )}

                <View style={styles(colors, isDarkMode).buttonContainer}>
                  {PREDEFINED_RESPONSES.map((resp, idx) => {
                    const cantResp = isCantResponse(resp);
                    const disabled = processing || (answered && cantResp);
                    return (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => handleAnswer(alert, resp)}
                        style={[
                          styles(colors, isDarkMode).answerButton,
                          disabled && styles(colors, isDarkMode).answerButtonDisabled,
                          cantResp && styles(colors, isDarkMode).cantButton
                        ]}
                        disabled={disabled}
                      >
                        <Text style={styles(colors, isDarkMode).answerButtonText}>{resp}</Text>
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

const styles = (colors, isDarkMode) =>
  StyleSheet.create({
    scrollContainer: {
      padding: 20,
      paddingBottom: 100,
      backgroundColor: colors.background,
    },

    title: {
      fontSize: 22,
      fontWeight: 'bold',
      color: isDarkMode ? '#e3d2f0ff' : colors.text,
      textAlign: 'center',
      marginBottom: 20,
      paddingBottom: isDarkMode ? 4 : 0,
      borderBottomWidth: isDarkMode ? 2 : 0,
      borderBottomColor: isDarkMode ? '#7a001f' : 'transparent',
      alignSelf: 'center',
    },

    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 10,
    },

    alertCard: {
      backgroundColor: colors.cardBackground,
      padding: 20,
      borderRadius: 18,
      marginBottom: 15,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: colors.shadowOpacity,
      shadowRadius: 6,
      elevation: 6,
    },

    alertType: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },

    alertDetail: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 4,
    },

    alertMessage: {
      fontSize: 14,
      fontStyle: 'italic',
      color: colors.text,
      marginTop: 6,
      marginBottom: 12,
    },

    responsesContainer: {
      marginTop: 8,
      marginBottom: 12,
    },

    responseText: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 4,
    },

    buttonContainer: {
      flexDirection: 'column',
      marginTop: 10,
    },

    answerButton: {
      backgroundColor: colors.accent,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 25,
      alignSelf: 'flex-start',
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: colors.shadowOpacity,
      shadowRadius: 4,
      elevation: 5,
      marginBottom: 8,
    },

    cantButton: {
      backgroundColor: colors.accentSecondary,
    },

    answerButtonDisabled: {
      backgroundColor: colors.disabled,
      opacity: 0.8,
    },

    answerButtonText: {
      color: colors.buttonText,
      fontWeight: 'bold',
      fontSize: 15,
    },
  });
