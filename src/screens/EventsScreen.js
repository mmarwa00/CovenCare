import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button, Card, TextInput, Title } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { createCircleEvent, getCircleEvents, rsvpToEvent, updateEvent, deleteEvent, RSVP_OPTIONS } from '../services/eventsService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import Layout from '../components/Layout';
import { Image, TouchableOpacity } from 'react-native';
import { useRef } from 'react';

export default function EventsScreen({ navigation }) {
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
  const [userCircles, setUserCircles] = useState([]);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const scrollRef = useRef(null);

  const [orbPositions, setOrbPositions] = useState([]);
  const [highlightedEventId, setHighlightedEventId] = useState(null);

  const [editingEventId, setEditingEventId] = useState(null);
  const [editEventName, setEditEventName] = useState('');
  const [editEventDate, setEditEventDate] = useState('');
  const [editEventTime, setEditEventTime] = useState('');
  const [editEventDescription, setEditEventDescription] = useState('');

  const handleDeleteEvent = async (eventId) => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteEvent(eventId, userId);
            if (result.success) {
              Alert.alert('Success', 'Event deleted');
              fetchEvents();
            } else {
              Alert.alert('Error', result.error);
            }
          }
        }
      ]
    );
  };

  const handleStartEdit = (event) => {
    setEditingEventId(event.id);
    setEditEventName(event.name);
    setEditEventDate(event.date);
    setEditEventTime(event.time);
    setEditEventDescription(event.description || '');
  };

  const handleSaveEdit = async (eventId) => {
    if (!editEventName || !editEventDate || !editEventTime) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    const result = await updateEvent(eventId, userId, {
      name: editEventName,
      date: editEventDate,
      time: editEventTime,
      description: editEventDescription
    });

    if (result.success) {
      Alert.alert('Success', 'Event updated');
      setEditingEventId(null);
      fetchEvents();
    } else {
      Alert.alert('Error', result.error);
    }
    setLoading(false);
  };

  const handleCancelEdit = () => {
    setEditingEventId(null);
    setEditEventName('');
    setEditEventDate('');
    setEditEventTime('');
    setEditEventDescription('');
  };

  const fetchActiveCircle = useCallback(async () => {
    if (!userId) return;
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      setActiveCircleId(userData.activeCircleId);
      
      if (userData.circles && userData.circles.length > 0) {
        setUserCircles(userData.circles);
      }
    }
  }, [userId]);

  const fetchEvents = useCallback(async () => {
    if (!userCircles || userCircles.length === 0) return;
    
    setLoading(true);
    
    try {
      const allEvents = [];
      
      for (const circleId of userCircles) {
        const result = await getCircleEvents(circleId, true);
        if (result.success && result.events) {
          const eventsWithCircle = result.events.map(event => ({
            ...event,
            circleId: circleId
          }));
          allEvents.push(...eventsWithCircle);
        }
      }
      
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

  useFocusEffect(useCallback(() => { fetchActiveCircle(); }, [fetchActiveCircle]));
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

    setLoading(true);
    const result = await createCircleEvent(userId, activeCircleId, {
      name: eventName,
      date: eventDate,
      time: eventTime,
      description: eventDescription
    });

    if (result.success) {
      Alert.alert('Success', 'Event created in your active circle!');

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

  const getOrbPosition = (index, total) => {
    const baseRadius = 130;
    const angle = (index * 2 * Math.PI) / Math.max(total, 1);

    return {
      top: 150 + baseRadius * Math.sin(angle),
      left: 150 + baseRadius * Math.cos(angle),
    };
  };

  const styles = createStyles(colors, isDarkMode, DM_TEXT, BURGUNDY, PURPLE, DARK_BG, BORDER_WIDTH);

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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
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

          {/* Create Form */}
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

          {/* Events List */}
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
                  style={[
                    styles.eventCard,
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
                    {isActiveCircle && (
                      <View style={[styles.circleBadge, { backgroundColor: isDarkMode ? BURGUNDY : PURPLE }]}>
                        <Text style={styles.circleBadgeText}>Active Circle</Text>
                      </View>
                    )}

                    {/* Edit Mode */}
                    {editingEventId === event.id ? (
                      <>
                        <TextInput
                          label="Event Name *"
                          value={editEventName}
                          onChangeText={setEditEventName}
                          mode="outlined"
                          style={styles.input}
                        />
                        <TextInput
                          label="Date (YYYY-MM-DD) *"
                          value={editEventDate}
                          onChangeText={setEditEventDate}
                          mode="outlined"
                          style={styles.input}
                        />
                        <TextInput
                          label="Time (HH:MM) *"
                          value={editEventTime}
                          onChangeText={setEditEventTime}
                          mode="outlined"
                          style={styles.input}
                        />
                        <TextInput
                          label="Description"
                          value={editEventDescription}
                          onChangeText={setEditEventDescription}
                          mode="outlined"
                          style={styles.input}
                          multiline
                          numberOfLines={3}
                        />
                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                          <Button
                            mode="contained"
                            onPress={() => handleSaveEdit(event.id)}
                            style={{ flex: 1 }}
                            buttonColor={isDarkMode ? BURGUNDY : PURPLE}
                            textColor={DM_TEXT}
                          >
                            Save
                          </Button>
                          <Button
                            mode="outlined"
                            onPress={handleCancelEdit}
                            style={{ flex: 1 }}
                            textColor={isDarkMode ? DM_TEXT : PURPLE}
                            theme={{
                              colors: {
                                outline: isDarkMode ? BURGUNDY : PURPLE
                              }
                            }}
                          >
                            Cancel
                          </Button>
                        </View>
                      </>
                    ) : (
                      <>
                        {/* Normal Display */}
                        <Title style={styles.eventTitle}>{event.name}</Title>
                        <Text style={styles.eventDetail}>📅 {new Date(event.dateTime).toLocaleString()}</Text>
                        {event.description && <Text style={styles.eventDescription}>{event.description}</Text>}
                        <Text style={styles.eventDetail}>Created by: {event.creatorName}</Text>

                        {/* Edit/Delete Buttons (only for creator) */}
                        {event.createdBy === userId && (
                          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10, marginBottom: 10 }}>
                            <Button
                              mode="outlined"
                              onPress={() => handleStartEdit(event)}
                              style={{ flex: 1 }}
                              icon="pencil"
                              textColor={isDarkMode ? DM_TEXT : PURPLE}
                              theme={{
                                colors: {
                                  outline: isDarkMode ? BURGUNDY : PURPLE
                                }
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              mode="outlined"
                              onPress={() => handleDeleteEvent(event.id)}
                              style={{ flex: 1 }}
                              icon="delete"
                              textColor={isDarkMode ? DM_TEXT : PURPLE}
                              theme={{
                                colors: {
                                  outline: isDarkMode ? BURGUNDY : PURPLE
                                }
                              }}
                            >
                              Delete
                            </Button>
                          </View>
                        )}

                        {/* RSVP Section */}
                        <View style={styles.rsvpContainer}>
                          <Text style={styles.rsvpLabel}>Your RSVP:</Text>
                          <View style={styles.rsvpButtons}>
                            {rsvpButton('Going', RSVP_OPTIONS.GOING)}
                            {rsvpButton('Maybe', RSVP_OPTIONS.MAYBE)}
                            {rsvpButton("Can't Go", RSVP_OPTIONS.NOT_GOING)}
                          </View>
                        </View>

                        {/* RSVPs List */}
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
                      </>
                    )}
                  </Card.Content>
                </Card>
              );
            })
          )}
        </ScrollView>
      </Layout>
    </SafeAreaView>
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