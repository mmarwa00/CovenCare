import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Button, Card, TextInput, Title } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  createCircleEvent, 
  getCircleEvents, 
  rsvpToEvent,
  RSVP_OPTIONS 
} from '../services/eventsService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import Layout from '../components/Layout';

export default function EventsScreen({ navigation }) {
  const { user } = useAuth();
  const userId = user?.uid;
  const { colors, isDarkMode } = useTheme();
  const DM_TEXT = '#e3d2f0ff';

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeCircleId, setActiveCircleId] = useState(null);
  
  // Create event states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventDescription, setEventDescription] = useState('');

  const fetchActiveCircle = useCallback(async () => {
    if (!userId) return;
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      setActiveCircleId(userSnap.data().activeCircleId);
    }
  }, [userId]);

  const fetchEvents = useCallback(async () => {
    if (!activeCircleId) return;
    setLoading(true);
    
    const result = await getCircleEvents(activeCircleId, true);
    if (result.success) {
      setEvents(result.events);
    }
    setLoading(false);
  }, [activeCircleId]);

  useFocusEffect(
    useCallback(() => {
      fetchActiveCircle();
    }, [fetchActiveCircle])
  );

  useFocusEffect(
    useCallback(() => {
      if (activeCircleId) {
        fetchEvents();
      }
    }, [fetchEvents, activeCircleId])
  );

  const handleCreateEvent = async () => {
    if (!eventName || !eventDate || !eventTime) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    const result = await createCircleEvent(userId, activeCircleId, {
      name: eventName,
      date: eventDate,
      time: eventTime,
      description: eventDescription
    });

    if (result.success) {
      Alert.alert('Success', 'Event created!');
      setShowCreateForm(false);
      setEventName('');
      setEventDate('');
      setEventTime('');
      setEventDescription('');
      fetchEvents();
    } else {
      Alert.alert('Error', result.error);
    }
    setLoading(false);
  };

  const handleRSVP = async (eventId, response) => {
    const result = await rsvpToEvent(eventId, userId, response);
    if (result.success) {
      Alert.alert('Success', 'RSVP updated!');
      fetchEvents();
    } else {
      Alert.alert('Error', result.error);
    }
  };

  const getUserRSVP = (event) => {
    if (!event.rsvps) return RSVP_OPTIONS.NO_RESPONSE;
    const userRsvp = event.rsvps.find(r => r.userId === userId);
    return userRsvp?.response || RSVP_OPTIONS.NO_RESPONSE;
  };

  const styles = createStyles(colors, isDarkMode, DM_TEXT);

  if (!activeCircleId) {
    return (
      <Layout navigation={navigation} subtitle="Events">
        <View style={styles.container}>
          <Text style={styles.emptyText}>
            Please select an active circle to see events
          </Text>
        </View>
      </Layout>
    );
  }

  return (
    <Layout navigation={navigation} subtitle="Circle Events">
      <ScrollView style={styles.scrollContainer}>
        <Title style={styles.title}>Upcoming Events</Title>

        <Button
          mode="contained"
          onPress={() => setShowCreateForm(!showCreateForm)}
          style={styles.createButton}
          buttonColor={colors.accent}
        >
          {showCreateForm ? 'Cancel' : '+ Create Event'}
        </Button>

        {showCreateForm && (
          <Card style={styles.card}>
            <Card.Content>
              <TextInput
                label="Event Name *"
                value={eventName}
                onChangeText={setEventName}
                mode="outlined"
                style={styles.input}
              />
              <TextInput
                label="Date (YYYY-MM-DD) *"
                value={eventDate}
                onChangeText={setEventDate}
                mode="outlined"
                style={styles.input}
                placeholder="2025-12-31"
              />
              <TextInput
                label="Time (HH:MM) *"
                value={eventTime}
                onChangeText={setEventTime}
                mode="outlined"
                style={styles.input}
                placeholder="19:00"
              />
              <TextInput
                label="Description"
                value={eventDescription}
                onChangeText={setEventDescription}
                mode="outlined"
                style={styles.input}
                multiline
                numberOfLines={3}
              />
              <Button
                mode="contained"
                onPress={handleCreateEvent}
                loading={loading}
                disabled={loading}
                buttonColor={colors.accent}
              >
                Create Event
              </Button>
            </Card.Content>
          </Card>
        )}

        {loading ? (
          <Text style={styles.loadingText}>Loading events...</Text>
        ) : events.length === 0 ? (
          <Text style={styles.emptyText}>No upcoming events</Text>
        ) : (
          events.map(event => {
            const userRsvp = getUserRSVP(event);
            return (
              <Card key={event.id} style={styles.eventCard}>
                <Card.Content>
                  <Title style={styles.eventTitle}>{event.name}</Title>
                  <Text style={styles.eventDetail}>
                    📅 {new Date(event.dateTime).toLocaleString()}
                  </Text>
                  {event.description && (
                    <Text style={styles.eventDescription}>
                      {event.description}
                    </Text>
                  )}
                  <Text style={styles.eventDetail}>
                    Created by: {event.creatorName}
                  </Text>

                  <View style={styles.rsvpContainer}>
                    <Text style={styles.rsvpLabel}>Your RSVP:</Text>
                    <View style={styles.rsvpButtons}>
                      <Button
                        mode={userRsvp === RSVP_OPTIONS.GOING ? 'contained' : 'outlined'}
                        onPress={() => handleRSVP(event.id, RSVP_OPTIONS.GOING)}
                        style={styles.rsvpButton}
                        compact
                      >
                        Going
                      </Button>
                      <Button
                        mode={userRsvp === RSVP_OPTIONS.MAYBE ? 'contained' : 'outlined'}
                        onPress={() => handleRSVP(event.id, RSVP_OPTIONS.MAYBE)}
                        style={styles.rsvpButton}
                        compact
                      >
                        Maybe
                      </Button>
                      <Button
                        mode={userRsvp === RSVP_OPTIONS.NOT_GOING ? 'contained' : 'outlined'}
                        onPress={() => handleRSVP(event.id, RSVP_OPTIONS.NOT_GOING)}
                        style={styles.rsvpButton}
                        compact
                      >
                        Can't Go
                      </Button>
                    </View>
                  </View>

                  {event.rsvps && event.rsvps.length > 0 && (
                    <View style={styles.attendeesContainer}>
                      <Text style={styles.attendeesTitle}>RSVPs:</Text>
                      {event.rsvps.map((rsvp, idx) => (
                        <Text key={idx} style={styles.attendeeText}>
                          {rsvp.response === RSVP_OPTIONS.GOING ? '✅' :
                           rsvp.response === RSVP_OPTIONS.MAYBE ? '❓' : '❌'}{' '}
                          {rsvp.userName || 'Unknown'}
                        </Text>
                      ))}
                    </View>
                  )}
                </Card.Content>
              </Card>
            );
          })
        )}
      </ScrollView>
    </Layout>
  );
}

const createStyles = (colors, isDarkMode, DM_TEXT) => StyleSheet.create({
  scrollContainer: {
    flex: 1,
    padding: 20,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: isDarkMode ? DM_TEXT : '#4a148c',
    textAlign: 'center',
    marginBottom: 20,
  },
  createButton: {
    marginBottom: 20,
  },
  card: {
    marginBottom: 20,
    backgroundColor: colors.cardBackground,
  },
  input: {
    marginBottom: 15,
  },
  eventCard: {
    marginBottom: 15,
    backgroundColor: colors.cardBackground,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: isDarkMode ? DM_TEXT : '#4a148c',
    marginBottom: 8,
  },
  eventDetail: {
    fontSize: 14,
    color: isDarkMode ? DM_TEXT : '#4a148c',
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 14,
    color: isDarkMode ? DM_TEXT : '#6a1b9a',
    fontStyle: 'italic',
    marginVertical: 8,
  },
  rsvpContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rsvpLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: isDarkMode ? DM_TEXT : '#4a148c',
    marginBottom: 8,
  },
  rsvpButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  rsvpButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  attendeesContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  attendeesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: isDarkMode ? DM_TEXT : '#4a148c',
    marginBottom: 8,
  },
  attendeeText: {
    fontSize: 13,
    color: isDarkMode ? DM_TEXT : '#4a148c',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 16,
    color: isDarkMode ? DM_TEXT : '#4a148c',
    textAlign: 'center',
    marginTop: 40,
  },
  loadingText: {
    fontSize: 16,
    color: isDarkMode ? DM_TEXT : '#4a148c',
    textAlign: 'center',
    marginTop: 20,
  },
});