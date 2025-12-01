import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import {
  Button,
  Title,
  Paragraph,
  TextInput,
  Card,
  HelperText,
  ActivityIndicator,
} from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { createCircle, joinCircle, getUserCircles } from '../services/circleService';
import Header from '../components/Header';
import Footer from '../components/Footer';

// Firebase
import { auth, db } from '../config/firebaseConfig';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

export default function CircleScreen({ navigation }) {
  const { user } = useAuth();
  const userId = user?.uid;

  const [circleName, setCircleName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [circles, setCircles] = useState([]);
  const [activeCircleId, setActiveCircleId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch circles for user
  const fetchCircles = async () => {
    if (!userId) return;
    setLoading(true);
    setError('');

    const result = await getUserCircles(userId);
    if (result.success) {
      setCircles(result.circles || []);
    } else {
      setError(`Failed to fetch circles: ${result.error}`);
    }

    setLoading(false);
  };

  // Fetch active circle
  const fetchActiveCircle = async () => {
    if (!userId) return;

    try {
      const userRef = doc(db, 'users', userId);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        setActiveCircleId(snap.data().activeCircleId || null);
      }
    } catch (err) {
      console.log('Error fetching active circle:', err);
    }
  };

  useEffect(() => {
    fetchCircles();
    fetchActiveCircle();
  }, [userId]);

  // Create circle
  const handleCreateCircle = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    if (!circleName.trim()) {
      setError('Circle name cannot be empty.');
      setLoading(false);
      return;
    }

    const result = await createCircle(userId, circleName);

    if (result.success) {
      setSuccess(`Circle created! Invite Code: ${result.inviteCode}`);
      setCircleName('');
      fetchCircles();
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  // Join circle
  const handleJoinCircle = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    if (!inviteCode.trim()) {
      setError('Invite code is required.');
      setLoading(false);
      return;
    }

    const result = await joinCircle(userId, inviteCode);

    if (result.success) {
      setSuccess(`Successfully joined '${result.circleName}'!`);
      setInviteCode('');
      fetchCircles();
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  // Set active circle
  const handleSetActiveCircle = async (circleId) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      await updateDoc(doc(db, 'users', currentUser.uid), {
        activeCircleId: circleId,
      });

      setActiveCircleId(circleId);
      alert('Active circle updated!');
    } catch (error) {
      console.log('Error setting active circle:', error);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Header />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Button
          mode="text"
          onPress={() => navigation.navigate('Dashboard')}
          style={styles.backButton}
        >
          ← Back to Dashboard
        </Button>

        <Title style={styles.title}>Coven Circles 🫂</Title>
        <Paragraph style={styles.subtitle}>
          Manage your circles and choose your active one.
        </Paragraph>

        {loading && (
          <ActivityIndicator animating={true} color="#4a148c" size="small" />
        )}

        {!!error && (
          <HelperText type="error" visible={true} style={{ textAlign: 'center' }}>
            {error}
          </HelperText>
        )}

        {!!success && (
          <HelperText type="info" visible={true} style={styles.successText}>
            {success}
          </HelperText>
        )}

        {/* Create Circle */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Create New Circle</Title>

            <TextInput
              label="Circle Name"
              value={circleName}
              onChangeText={setCircleName}
              mode="outlined"
              style={styles.input}
              disabled={loading}
            />

                      {/* Create Circle button: LIGHT color + Dark Shadow + ROUNDED/SIZED CONTENT */}
                      <View style={styles.buttonShadowWrapper}>
                          <Button
                              mode="contained"
                              onPress={handleCreateCircle}
                              disabled={loading || !circleName.trim()}
                              style={styles.shadowButtonContainer}
                              contentStyle={styles.topButtonContent}
                              labelStyle={styles.topButtonLabel}
                          >
                              Create Circle
                          </Button>
                      </View>
                  </Card.Content>
              </Card>

        {/* Join Circle */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Join Circle</Title>

            <TextInput
              label="Invite Code"
              value={inviteCode}
              onChangeText={setInviteCode}
              mode="outlined"
              style={styles.input}
              disabled={loading}
              autoCapitalize="characters"
              maxLength={8}
            />

                      {/* Join Circle button */}
                      <View style={styles.buttonShadowWrapper}>
                          <Button
                              mode="contained"
                              onPress={handleJoinCircle}
                              disabled={loading || inviteCode.length !== 8}
                              style={styles.shadowButtonContainer}
                              contentStyle={styles.topButtonContent}
                              labelStyle={styles.topButtonLabel}
                          >
                              Join Circle
                          </Button>
                      </View>
                  </Card.Content>
              </Card>

        {/* Circles List */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>My Circles ({circles.length})</Title>

            {circles.map((circle, index) => (
              <TouchableOpacity
                key={circle.id}
                style={[
                  styles.circleItem,
                  circle.id === activeCircleId && styles.activeCircle,
                ]}
                onPress={() => navigation.navigate('CircleDetails', { circle })}
              >
                <Image
                        source={
                            index % 3 === 0
                                ? require('../../assets/icons/circle_small1.png')
                                : index % 3 === 1
                                    ? require('../../assets/icons/circle_small2.png')
                                    : require('../../assets/icons/circle_small3.png')
                        }
                        style={styles.circleIcon}
                    />

                    <View style={styles.circleInfo}>
                        <Text style={styles.circleName}>{circle.name}</Text>
                        <Text style={styles.circleDetail}>ID: {circle.id}</Text>
                        <Text style={styles.circleDetail}>Code: {circle.inviteCode}</Text>
                        <Text style={styles.circleDetail}>
                            {Array.isArray(circle.members)
                                ? `${circle.members.length} members`
                                : '0 members'}
                        </Text>

                        {/* Set Active Button */}
                        <Button
                            mode="contained"
                            onPress={() => handleSetActiveCircle(circle.id)}
                            style={styles.activeButton}
                            labelStyle={styles.activeButtonLabel}
                        >
                            ⭐ Set as Active
                        </Button>

                        {circle.id === activeCircleId && (
                            <Text style={styles.activeBadge}>⭐ Active Circle</Text>
                        )}
                    </View>
                </TouchableOpacity>
            ))}

                        <Button mode="text" onPress={fetchCircles} style={{ marginTop: 10 }}>
                            Refresh List
                        </Button>
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
        padding: 20,
        backgroundColor: '#e3d2f0ff',
        paddingBottom: 100,
    },

    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#4a148c',
        textAlign: 'center',
    },

    subtitle: {
        fontSize: 14,
        color: '#5d1264ff',
        textAlign: 'center',
        marginBottom: 10,
    },

    card: {
        width: '100%',
        marginBottom: 10,
        borderRadius: 20,
        backgroundColor: '#d4a5ff',
        paddingBottom: 5,
    },

    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4a148c',
        marginBottom: 5,
    },

    input: {
        marginBottom: 5,
    },

    // Wrap buttons so shadows can escape Card boundaries
    buttonShadowWrapper: {
        overflow: 'visible',
    },

    // --- TOP BUTTON STYLES (Create / Join) ---
    // 1. Shadow/Container style (applied to 'style' prop) -> ADDS SHADOW
    shadowButtonContainer: {
        marginTop: 10,
        // Note: React Native Paper often sets its own default borderRadius here,
        // but the shadow should still render based on the Paper button shape.
        elevation: 12,
        shadowColor: '#4a148c',
        shadowOpacity: 1,
        shadowRadius: 22,
        shadowOffset: { width: 0, height: 8 },
        borderRadius: 12,
    },

    // 2. Content style (applied to 'contentStyle' prop) -> FORCES SHAPE/SIZE
    topButtonContent: {
        height: 40,
        borderRadius: 12,
    },

    topButtonLabel: {
        color: '#4a148c',
        fontWeight: 'bold',
    },

    successText: {
        backgroundColor: '#c7a5cdff',
        color: '#6e079eff',
        borderRadius: 4,
        padding: 5,
        marginBottom: 10,
    },

    circleItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },

    activeCircle: {
        backgroundColor: '#f3d9ff',
        borderLeftWidth: 4,
        borderLeftColor: '#6a1b9a',
    },

    activeBadge: {
        marginTop: 5,
        color: '#6a1b9a',
        fontWeight: 'bold',
    },

    circleIcon: {
        width: 50,
        height: 50,
        marginRight: 12,
        resizeMode: 'contain',
    },

    circleInfo: {
        flex: 1,
    },

    circleName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },

    circleDetail: {
        fontSize: 12,
        color: '#4a148c',
    },

    activeButton: {
        marginTop: 8,
        backgroundColor: '#6a1b9a',
        borderRadius: 16,
        height: 40,
        minWidth: 130,
        alignSelf: 'flex-start',
        elevation: 4,
    },

    activeButtonLabel: {
        fontSize: 12,
        paddingHorizontal: 0,
    },

    backButton: {
        alignSelf: 'flex-start',
        marginBottom: 5,
    },
});