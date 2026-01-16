import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Button } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import {
  getActiveEmergencies,
  getSentEmergencies,
  respondToEmergency,
  resolveEmergency,
  PREDEFINED_RESPONSES,
  getTimeUntilAutoResolve
} from '../services/emergencyService';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useTheme } from '../context/ThemeContext'; 

export default function AlertBox({ navigation }) {
  const { user } = useAuth();
  const userId = user?.uid;
  const { colors, isDarkMode } = useTheme();

  const [activeTab, setActiveTab] = useState('received'); // 'received' or 'sent'
  const [receivedAlerts, setReceivedAlerts] = useState([]);
  const [sentEmergencies, setSentEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingMap, setProcessingMap] = useState({});
  const [expandedIds, setExpandedIds] = useState(new Set());

  // Filter out expired emergencies in real-time
  const filterExpiredAlerts = (alertsList) => {
    const now = new Date();
    return alertsList.filter(alert => {
      if (!alert.autoResolveAt) return true;
      const resolveTime = alert.autoResolveAt instanceof Date 
        ? alert.autoResolveAt 
        : (alert.autoResolveAt?.toDate ? alert.autoResolveAt.toDate() : new Date(alert.autoResolveAt));
      return resolveTime > now;
    });
  };

  const fetchReceivedAlerts = async () => {
    if (!userId) return;
    try {
      console.log('Fetching received alerts for user:', userId);
      const result = await getActiveEmergencies(userId);
      console.log('Received alerts result:', result);
      if (result.success) {
        const filtered = filterExpiredAlerts(result.emergencies);
        console.log('Filtered received alerts:', filtered.length, 'out of', result.emergencies.length);
        setReceivedAlerts(filtered);
      } else {
        console.error('Error fetching received alerts:', result.error);
      }
    } catch (err) {
      console.error('Error fetching received alerts:', err);
    }
  };

  const fetchSentEmergencies = async () => {
    if (!userId) return;
    try {
      const result = await getSentEmergencies(userId);
      console.log('Sent emergencies result:', result);
      if (result.success) {
        // Don't filter by expiration for sent emergencies - show all
        setSentEmergencies(result.emergencies || []);
      } else {
        console.error('Error fetching sent emergencies:', result.error);
      }
    } catch (err) {
      console.error('Error fetching sent emergencies:', err);
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchReceivedAlerts(), fetchSentEmergencies()]);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchAll();
  }, [userId]);

  useEffect(() => {
    const interval = setInterval(() => {
      setReceivedAlerts(prev => filterExpiredAlerts(prev));
      // Don't filter sent emergencies - keep them all for history
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAll();
  };

  const CANT_PHRASE = "Can't right now but ❤️";

  const isCantResponse = (text) => {
    return text?.toLowerCase().trim() === CANT_PHRASE.toLowerCase().trim();
  };

  const setProcessing = (alertId, value) => {
    setProcessingMap(prev => ({ ...prev, [alertId]: value }));
  };

  const toggleExpanded = (id) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleAnswer = async (alert, responseMessage) => {
    if (!alert || !responseMessage) return;
    const alertId = alert.id;
    const cant = isCantResponse(responseMessage);
    const positive = !cant;

    const prevAlerts = receivedAlerts;

    if (positive) {
      setReceivedAlerts(prev => prev.filter(a => a.id !== alertId));
    } else {
      setReceivedAlerts(prev => prev.map(a => a.id === alertId ? { ...a, answered: true } : a));
    }

    setProcessing(alertId, true);

    try {
      const res = await respondToEmergency(alertId, userId, responseMessage);

      if (!res.success) {
        setReceivedAlerts(prevAlerts);
        Alert.alert('Error', 'Could not send response. Try again.');
        return;
      }

      if (res.emergency) {
        if (res.emergency.status === 'resolved') {
          setReceivedAlerts(prev => prev.filter(a => a.id !== alertId));
          navigation.navigate('Dashboard', { refresh: Date.now() });
        } else {
          setReceivedAlerts(prev => prev.map(a => a.id === alertId ? res.emergency : a));
        }
      } else {
        if (positive) navigation.navigate('Dashboard', { refresh: Date.now() });
      }
    } catch (err) {
      setReceivedAlerts(prevAlerts);
      Alert.alert('Error', 'Network error while sending response.');
    } finally {
      setProcessing(alertId, false);
    }
  };

  const handleResolve = async (emergencyId) => {
    const result = await resolveEmergency(emergencyId, userId);
    if (result.success) {
      fetchSentEmergencies();
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

  const getTimeRemainingText = (autoResolveAt) => {
    if (!autoResolveAt) return null;
    const timeInfo = getTimeUntilAutoResolve(autoResolveAt);
    if (timeInfo.expired) return '⏰ Expired';
    if (timeInfo.hours === 0 && timeInfo.minutes < 30) {
      return `⏰ ${timeInfo.minutes}min left`;
    }
    return `⏰ ${timeInfo.hours}h ${timeInfo.minutes}min left`;
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { text: '🟢 Active', color: colors.accent },
      resolved: { text: 'Resolved', color: '#4caf50' },
      expired: { text: '⏰ Expired', color: colors.textSecondary }
    };
    return badges[status] || { text: status, color: colors.textSecondary };
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Header navigation={navigation} />

        <View style={styles(colors, isDarkMode).tabContainer}>
          <TouchableOpacity
            style={[
              styles(colors, isDarkMode).tab,
              activeTab === 'received' && styles(colors, isDarkMode).activeTab
            ]}
            onPress={() => setActiveTab('received')}
          >
            <Text style={[
              styles(colors, isDarkMode).tabText,
              activeTab === 'received' && styles(colors, isDarkMode).activeTabText
            ]}>
              📥 Received ({receivedAlerts.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles(colors, isDarkMode).tab,
              activeTab === 'sent' && styles(colors, isDarkMode).activeTab
            ]}
            onPress={() => setActiveTab('sent')}
        >
            <Text style={[
              styles(colors, isDarkMode).tabText,
              activeTab === 'sent' && styles(colors, isDarkMode).activeTabText
            ]}>
              📤 Sent ({sentEmergencies.length})
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles(colors, isDarkMode).scrollContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {loading ? (
            <ActivityIndicator animating={true} color={isDarkMode ? '#e3d2f0ff' : '#4a148c'} />
          ) : activeTab === 'received' ? (
            // RECEIVED ALERTS TAB
            receivedAlerts.length === 0 ? (
              <Text style={styles(colors, isDarkMode).emptyText}>
                No active alerts.
              </Text>
            ) : (
              receivedAlerts.map(alert => {
                const processing = !!processingMap[alert.id];
                const answered = !!alert.answered;
                const timeRemaining = getTimeRemainingText(alert.autoResolveAt);
              
                return (
                  <View key={alert.id} style={styles(colors, isDarkMode).alertCard}>
                    <View style={styles(colors, isDarkMode).alertHeader}>
                      <Text style={styles(colors, isDarkMode).alertType}>
                        {getEmergencyTypeDisplay(alert.type)}
                      </Text>
                      {timeRemaining && (
                        <Text style={styles(colors, isDarkMode).timeRemaining}>
                          {timeRemaining}
                        </Text>
                      )}
                    </View>

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
          )
        ) : (
          // SENT EMERGENCIES TAB
          sentEmergencies.length === 0 ? (
            <Text style={styles(colors, isDarkMode).emptyText}>
              No emergencies sent yet.
            </Text>
          ) : (
            sentEmergencies.map(emergency => {
              const isExpanded = expandedIds.has(emergency.id);
              const statusBadge = getStatusBadge(emergency.status);
              const timeRemaining = emergency.status === 'active' ? getTimeRemainingText(emergency.autoResolveAt) : null;
              const responses = Array.isArray(emergency.responses) ? emergency.responses : [];

              return (
                <TouchableOpacity
                  key={emergency.id}
                  style={styles(colors, isDarkMode).emergencyCard}
                  onPress={() => toggleExpanded(emergency.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles(colors, isDarkMode).emergencyHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles(colors, isDarkMode).emergencyType}>
                        {getEmergencyTypeDisplay(emergency.type)}
                      </Text>
                      <Text style={styles(colors, isDarkMode).emergencyDate}>
                        {new Date(emergency.createdAt).toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles(colors, isDarkMode).statusContainer}>
                      <Text style={[styles(colors, isDarkMode).statusBadge, { color: statusBadge.color }]}>
                        {statusBadge.text}
                      </Text>
                      {timeRemaining && (
                        <Text style={styles(colors, isDarkMode).timeRemaining}>
                          {timeRemaining}
                        </Text>
                      )}
                    </View>
                  </View>

                  {emergency.message && (
                    <Text style={styles(colors, isDarkMode).emergencyMessage}>
                      "{emergency.message}"
                    </Text>
                  )}

                    <View style={styles(colors, isDarkMode).responseSummary}>
                      <Text style={styles(colors, isDarkMode).responseCount}>
                        📩 {responses.length} {responses.length === 1 ? 'Response' : 'Responses'}
                      </Text>
                      <Text style={styles(colors, isDarkMode).expandText}>
                        {isExpanded ? '▲ Collapse' : '▼ View Details'}
                      </Text>
                    </View>

                    {isExpanded && (
                      <View style={styles(colors, isDarkMode).expandedContent}>
                        <View style={styles(colors, isDarkMode).divider} />

                        {responses.length === 0 ? (
                          <Text style={styles(colors, isDarkMode).noResponses}>
                            No responses yet. Waiting for help...
                          </Text>
                        ) : (
                          <>
                            <Text style={styles(colors, isDarkMode).responsesTitle}>
                              Responses:
                            </Text>
                            {responses.map((response, idx) => (
                              <View key={idx} style={styles(colors, isDarkMode).responseItem}>
                                <Text style={styles(colors, isDarkMode).responderName}>
                                  {response.userName}
                                </Text>
                                <Text style={styles(colors, isDarkMode).responseMessage}>
                                  {response.message}
                                </Text>
                                <Text style={styles(colors, isDarkMode).responseTime}>
                                  {(() => {
                                    try {
                                      if (response.timestamp?.toDate) {
                                        return response.timestamp.toDate().toLocaleString();
                                      } else if (response.timestamp) {
                                        return new Date(response.timestamp).toLocaleString();
                                      }
                                      return 'Unknown time';
                                    } catch (e) {
                                      return 'Unknown time';
                                    }
                                  })()}
                                </Text>
                              </View>
                            ))}
                          </>
                        )}

                        {emergency.status === 'active' && (
                          <Button
                            mode="contained"
                            onPress={() => handleResolve(emergency.id)}
                            style={styles(colors, isDarkMode).resolveButton}
                            labelStyle={styles(colors, isDarkMode).resolveButtonLabel}
                          >
                            ✅ Mark as Resolved
                          </Button>
                        )}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
            )
          )}
        </ScrollView>

        <Footer navigation={navigation} />
      </View>
    </SafeAreaView>
  );
}

const styles = (colors, isDarkMode) =>
  StyleSheet.create({
    scrollContainer: {
      padding: 20,
      paddingBottom: 100,
      backgroundColor: colors.background,
    },

    tabContainer: {
      flexDirection: 'row',
      backgroundColor: colors.cardBackground,
      borderBottomWidth: 2,
      borderBottomColor: colors.border,
    },

    tab: {
      flex: 1,
      paddingVertical: 14,
      alignItems: 'center',
      backgroundColor: colors.cardBackground,
    },

    activeTab: {
      borderBottomWidth: 3,
      borderBottomColor: colors.accent,
    },

    tabText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '600',
    },

    activeTabText: {
      color: colors.accent,
      fontWeight: 'bold',
    },

    emptyText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 40,
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

    emergencyCard: {
      backgroundColor: colors.cardBackground,
      padding: 16,
      borderRadius: 18,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: colors.shadowOpacity,
      shadowRadius: 5,
      elevation: 4,
    },

    alertHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },

    emergencyHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },

    alertType: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      flex: 1,
    },

    emergencyType: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },

    emergencyDate: {
      fontSize: 11,
      color: colors.textSecondary,
    },

    statusContainer: {
      alignItems: 'flex-end',
    },

    statusBadge: {
      fontSize: 12,
      fontWeight: 'bold',
      marginBottom: 4,
    },

    timeRemaining: {
      fontSize: 12,
      fontWeight: 'bold',
      color: colors.accent,
      marginLeft: 8,
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

    emergencyMessage: {
      fontSize: 13,
      fontStyle: 'italic',
      color: colors.text,
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

    responseSummary: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },

    responseCount: {
      fontSize: 13,
      fontWeight: 'bold',
      color: colors.accent,
    },

    expandText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '600',
    },

    expandedContent: {
      marginTop: 12,
    },

    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginBottom: 12,
    },

    noResponses: {
      fontSize: 13,
      color: colors.textSecondary,
      fontStyle: 'italic',
      textAlign: 'center',
      paddingVertical: 16,
    },

    responsesTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },

    responseItem: {
      backgroundColor: isDarkMode ? '#2a1a2e' : '#f5f5f5',
      padding: 12,
      borderRadius: 12,
      marginBottom: 8,
      borderLeftWidth: 3,
      borderLeftColor: colors.accent,
    },

    responderName: {
      fontSize: 13,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },

    responseMessage: {
      fontSize: 13,
      color: colors.text,
      marginBottom: 6,
    },

    responseTime: {
      fontSize: 10,
      color: colors.textSecondary,
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

    resolveButton: {
      marginTop: 12,
      backgroundColor: colors.accent,
      borderRadius: 12,
      elevation: 4,
    },

    resolveButtonLabel: {
      color: colors.buttonText,
      fontWeight: 'bold',
    },
  });