import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { ActivityIndicator, Button } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { getSentEmergencies, resolveEmergency, getTimeUntilAutoResolve } from '../services/emergencyService';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useTheme } from '../context/ThemeContext';

export default function MyEmergenciesScreen({ navigation }) {
  const { user } = useAuth();
  const userId = user?.uid;
  const { colors, isDarkMode } = useTheme();

  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedIds, setExpandedIds] = useState(new Set());

  const fetchEmergencies = async () => {
    if (!userId) return;
    try {
      const result = await getSentEmergencies(userId);
      if (result.success) {
        // Filter out expired ones
        const now = new Date();
        const filtered = result.emergencies.filter(e => {
          if (e.status !== 'active') return true;
          if (!e.autoResolveAt) return true;
          const resolveTime = e.autoResolveAt instanceof Date 
            ? e.autoResolveAt 
            : (e.autoResolveAt?.toDate ? e.autoResolveAt.toDate() : new Date(e.autoResolveAt));
          return resolveTime > now;
        });
        setEmergencies(filtered);
      }
    } catch (err) {
      console.error('Error fetching emergencies:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEmergencies();
  }, [userId]);

  // Auto-refresh every minute to update timers
  useEffect(() => {
    const interval = setInterval(fetchEmergencies, 60000);
    return () => clearInterval(interval);
  }, [userId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEmergencies();
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

  const handleResolve = async (emergencyId) => {
    const result = await resolveEmergency(emergencyId, userId);
    if (result.success) {
      fetchEmergencies();
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

  const getStatusBadge = (status) => {
    const badges = {
      active: { text: '🟢 Active', color: colors.accent },
      resolved: { text: '✅ Resolved', color: '#4caf50' },
      expired: { text: '⏰ Expired', color: colors.textSecondary }
    };
    return badges[status] || { text: status, color: colors.textSecondary };
  };

  const getTimeRemainingText = (autoResolveAt) => {
    if (!autoResolveAt) return null;
    const timeInfo = getTimeUntilAutoResolve(autoResolveAt);
    if (timeInfo.expired) return null;
    if (timeInfo.hours === 0 && timeInfo.minutes < 30) {
      return `⏰ ${timeInfo.minutes}min left`;
    }
    return `⏰ ${timeInfo.hours}h ${timeInfo.minutes}min left`;
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header />

      <ScrollView
        contentContainerStyle={styles(colors, isDarkMode).scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles(colors, isDarkMode).title}>My Emergencies</Text>
        <Text style={styles(colors, isDarkMode).subtitle}>
          View all your sent emergencies and responses
        </Text>

        {loading ? (
          <ActivityIndicator animating={true} color={isDarkMode ? '#e3d2f0ff' : '#4a148c'} />
        ) : emergencies.length === 0 ? (
          <Text style={styles(colors, isDarkMode).emptyText}>
            No emergencies sent yet.
          </Text>
        ) : (
          emergencies.map(emergency => {
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
                              {response.timestamp?.toDate 
                                ? response.timestamp.toDate().toLocaleString()
                                : new Date(response.timestamp).toLocaleString()}
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
      marginBottom: 8,
    },

    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 20,
    },

    emptyText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 40,
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

    emergencyHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
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
      fontSize: 10,
      color: colors.accent,
      fontWeight: 'bold',
    },

    emergencyMessage: {
      fontSize: 13,
      fontStyle: 'italic',
      color: colors.text,
      marginBottom: 12,
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