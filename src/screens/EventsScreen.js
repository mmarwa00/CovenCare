import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button, Card, TextInput, Title } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { createCircleEvent, getCircleEvents, rsvpToEvent, RSVP_OPTIONS } from '../services/eventsService';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import Layout from '../components/Layout';
import { Image, TouchableOpacity } from 'react-native';
import { useRef } from 'react';

export default function EventsScreen({ navigation }) {
  // Current logged user
  const { user } = useAuth();
  const userId = user?.uid;

  const { colors, isDarkMode } = useTheme();
  const DM_TEXT = '#e3d2f0ff';
  const BURGUNDY = '#4a001f';
  const PURPLE = '#4a148c';
  const DARK_BG = colors.cardBackground;
  const BORDER_WIDTH = 3;

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeCircleId, setActiveCircleId] = useState(null);
  const [userCircles, setUserCircles] = useState([]); //  Store all user's circles

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const scrollRef = useRef(null);

  const [orbPositions, setOrbPositions] = useState([]);
  const [highlightedEventId, setHighlightedEventId] = useState(null);

  // Fetch active circle AND all user circles
  const fetchActiveCircle = useCallback(async () => {
    if (!userId) return;
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      setActiveCircleId(userData.activeCircleId);
      
      // Get all circles user belongs to
      if (userData.circles && userData.circles.length > 0) {
        setUserCircles(userData.circles);
      }
    }
  }, [userId]);

  // Fetch events from ALL user's circles
  const fetchEvents = useCallback(async () => {
    if (!userCircles || userCircles.length === 0) return;
    
    setLoading(true);
    
    try {
      // Fetch events from ALL circles the user belongs to
      const allEvents = [];
      
      for (const circleId of userCircles) {
        const result = await getCircleEvents(circleId, true);
        if (result.success && result.events) {
          // Add circle info to each event
          const eventsWithCircle = result.events.map(event => ({
            ...event,
            circleId: circleId
          }));
          allEvents.push(...eventsWithCircle);
        }
      }
      
      // Sort by date (newest first)
      allEvents.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
      
      setEvents(allEvents);

      const positions = allEvents.map((_, index) =>
        getOrbPosition(index, allEvents.length)
      );
      setOrbPositions(positions);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
    
    setLoading(false);
  }, [userCircles]);

  // load active circle
  useFocusEffect(useCallback(() => { fetchActiveCircle(); }, [fetchActiveCircle]));
  // load events
  useFocusEffect(useCallback(() => { 
    if (userCircles.length > 0) fetchEvents(); 
  }, [fetchEvents, userCircles]));

  const handleCreateEvent = async () => {
    if (!eventName || !eventDate || !eventTime) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!activeCircleId) {
      Alert.alert('Error', 'Please select an active circle first');
      return;
    }

    // Send event to Firebase
    setLoading(true);
    const result = await createCircleEvent(userId, activeCircleId, {
      name: eventName,
      date: eventDate,
      time: eventTime,
      description: eventDescription
    });

    if (result.success) {
      Alert.alert('Success', 'Event created in your active circle!');

      // Reset form 
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

  // Send user RSVP response (Going/Maybe/Can't Go)
  const handleRSVP = async (eventId, response) => {
    const result = await rsvpToEvent(eventId, userId, response);
    if (result.success) {
      // refresh list
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

  // Helper to get circle name
  const getCircleName = async (circleId) => {
    try {
      const circleDoc = await getDoc(doc(db, 'circles', circleId));
      return circleDoc.exists() ? circleDoc.data().name : 'Unknown Circle';
    } catch {
      return 'Unknown Circle';
    }
  };

  // Calculate circular positions for event orbs around center point
  const getOrbPosition = (index, total) => {
    const baseRadius = 130;

    const angle =
      (index * 2 * Math.PI) / Math.max(total, 1);

    return {
      top: 150 + baseRadius * Math.sin(angle),
      left: 150 + baseRadius * Math.cos(angle),
    };
  };


  const styles = createStyles(colors, isDarkMode, DM_TEXT, BURGUNDY, PURPLE, DARK_BG, BORDER_WIDTH);

  // If no active circle, prompt to select one
  if (!activeCircleId) {
    return (
      <Layout navigation={navigation} subtitle="Events">
        <View style={styles.container}>
          <Text style={styles.emptyText}>Please select an active circle to create events</Text>
        </View>
      </Layout>
    );
  }

  return (
    <Layout navigation={navigation} subtitle="Circle Events">

      <ScrollView
        ref={scrollRef}
        style={styles.scrollContainer}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <Button
          mode="text"
          onPress={() => navigation.navigate('Dashboard')}
          style={styles.backButton}
          labelStyle={isDarkMode ? { color: DM_TEXT } : {}}
        >
          ← Back to Dashboard
        </Button>

        <Title style={styles.title}>All Your Circle Events</Title>

        {/* Orb graphic with event orbs */}
          <View
            style={{
              width: 360,
              height: 360,
              alignSelf: 'center',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              marginBottom: 0,
              marginTop: -10,
            }}
          >
          
          {/* Portal button to open create event form */}
          <TouchableOpacity onPress={() => setShowCreateForm(p => !p)}>
            <Image
              source={
                isDarkMode
                  ? require('../../assets/Event/Magic_portal_dark.gif')
                  : require('../../assets/Event/Magic_portal.gif')
              }
              style={{ width: 340, height: 340, resizeMode: 'contain', transform: [{ translateX: -5 }] }}
            />
          </TouchableOpacity>

          {events.map((event, index) => {
            const pos = orbPositions[index];
            if (!pos) return null;

            return (
              <TouchableOpacity
                key={event.id}
                onPress={() => {
                  const yPos = 420 + index * 200;

                  // Scroll to event card
                  scrollRef.current?.scrollTo({
                    y: yPos,
                    animated: true,
                  });

                  setHighlightedEventId(event.id);

                  setTimeout(() => {
                    setHighlightedEventId(null);
                  }, 2000);
                }}
                style={{
                  position: 'absolute',
                  top: pos.top,
                  left: pos.left,
                }}
              >
                <Image
                  source={require('../../assets/Event/Event.png')}
                  style={{ width: 60, height: 60, opacity: 0.9 }}
                />
              </TouchableOpacity>
            );
          })}
        </View>


        {showCreateForm && (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={[styles.helperText, { color: colors.textSecondary, marginBottom: 10 }]}>
                Event will be created in your active circle
              </Text>
              <TextInput label="Event Name *" value={eventName} onChangeText={setEventName} mode="outlined" style={styles.input} />
              <TextInput label="Date (YYYY-MM-DD) *" value={eventDate} onChangeText={setEventDate} mode="outlined" style={styles.input} />
              <TextInput label="Time (HH:MM) *" value={eventTime} onChangeText={setEventTime} mode="outlined" style={styles.input} />
              <TextInput label="Description" value={eventDescription} onChangeText={setEventDescription} mode="outlined" style={styles.input} multiline numberOfLines={3} />

              <Button
                mode="contained"
                onPress={handleCreateEvent}
                loading={loading}
                disabled={loading}
                buttonColor={isDarkMode ? DARK_BG : PURPLE}
                textColor={DM_TEXT}
                style={{ borderWidth: BORDER_WIDTH, borderColor: isDarkMode ? BURGUNDY : PURPLE }}
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
            const isActiveCircle = event.circleId === activeCircleId;

            const rsvpButton = (label, value) => {
              const selected = userRsvp === value;

              return (
                <Button
                  mode={selected ? 'contained' : 'outlined'}
                  onPress={() => handleRSVP(event.id, value)}
                  style={styles.rsvpButton}
                  compact
                  buttonColor={
                    selected
                      ? (isDarkMode ? BURGUNDY : PURPLE)
                      : 'transparent'
                  }
                  textColor={DM_TEXT}
                  theme={{
                    colors: {
                      outline: isDarkMode ? BURGUNDY : PURPLE
                    }
                  }}
                >
                  {label}
                </Button>
              );
            };

            return (
              <Card
                key={event.id}
                style={[ styles.eventCard,
                  highlightedEventId === event.id && {
                    borderWidth: 3,
                    borderColor: isDarkMode ? BURGUNDY : PURPLE,
                    shadowOpacity: 0.8,
                    shadowRadius: 10,
                    elevation: 10,
                  },
                ]}
              >

                <Card.Content>
                  {/* Show circle badge */}
                  {isActiveCircle && (
                    <View style={[styles.circleBadge, { backgroundColor: isDarkMode ? BURGUNDY : PURPLE }]}>
                      <Text style={styles.circleBadgeText}>Active Circle</Text>
                    </View>
                  )}
                  
                  <Title style={styles.eventTitle}>{event.name}</Title>
                  <Text style={styles.eventDetail}>📅 {new Date(event.dateTime).toLocaleString()}</Text>
                  {event.description && <Text style={styles.eventDescription}>{event.description}</Text>}
                  <Text style={styles.eventDetail}>Created by: {event.creatorName}</Text>

                  <View style={styles.rsvpContainer}>
                    <Text style={styles.rsvpLabel}>Your RSVP:</Text>
                    <View style={styles.rsvpButtons}>
                      {rsvpButton('Going', RSVP_OPTIONS.GOING)}
                      {rsvpButton('Maybe', RSVP_OPTIONS.MAYBE)}
                      {rsvpButton("Can't Go", RSVP_OPTIONS.NOT_GOING)}
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

const createStyles = (colors, isDarkMode, DM_TEXT, BURGUNDY, PURPLE, DARK_BG, BORDER_WIDTH) => StyleSheet.create({
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 10,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: isDarkMode ? DM_TEXT : PURPLE,
    textAlign: 'center',
    marginBottom: 0,
  },
  createButton: {
    marginBottom: 20,
    borderWidth: BORDER_WIDTH,
    borderColor: isDarkMode ? BURGUNDY : PURPLE,
  },
  card: {
    marginBottom: 20,
    backgroundColor: colors.cardBackground,
  },
  input: {
    marginBottom: 15,
  },
  eventCard: {
    marginBottom: 9,
    backgroundColor: colors.cardBackground,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: isDarkMode ? DM_TEXT : PURPLE,
    marginBottom: 8,
  },
  eventDetail: {
    fontSize: 14,
    color: isDarkMode ? DM_TEXT : PURPLE,
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 14,
    color: isDarkMode ? DM_TEXT : PURPLE,
    fontStyle: 'italic',
    marginVertical: 8,
  },
  rsvpContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: BORDER_WIDTH,
    borderTopColor: isDarkMode ? BURGUNDY : PURPLE,
  },
  rsvpLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: isDarkMode ? DM_TEXT : PURPLE,
    marginBottom: 8,
  },
  rsvpButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  rsvpButton: {
    flex: 1,
    marginHorizontal: 4,
    borderWidth: BORDER_WIDTH,
    borderColor: isDarkMode ? BURGUNDY : PURPLE,
  },
  attendeesContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: BORDER_WIDTH,
    borderTopColor: isDarkMode ? BURGUNDY : PURPLE,
  },
  attendeesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: isDarkMode ? DM_TEXT : PURPLE,
    marginBottom: 8,
  },
  attendeeText: {
    fontSize: 13,
    color: isDarkMode ? DM_TEXT : PURPLE,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 16,
    color: isDarkMode ? DM_TEXT : PURPLE,
    textAlign: 'center',
    marginTop: 40,
  },
  loadingText: {
    fontSize: 16,
    color: isDarkMode ? DM_TEXT : PURPLE,
    textAlign: 'center',
    marginTop: 20,
  },
  helperText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  circleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  circleBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});