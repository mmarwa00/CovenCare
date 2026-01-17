import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Clipboard, Alert } from 'react-native';
import { Button, Title, Paragraph, TextInput, Card, HelperText, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { createCircle, joinCircle, getUserCircles } from '../services/circleService';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useTheme } from '../context/ThemeContext';
import { auth, db } from '../config/firebaseConfig';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

export default function CircleScreen({ navigation }) {
  const { user } = useAuth();
  const userId = user?.uid;
  const { colors, isDarkMode } = useTheme();

  const DM_TEXT = '#e3d2f0ff';

  const [circleName, setCircleName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [circles, setCircles] = useState([]);
  const [activeCircleId, setActiveCircleId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  const fetchActiveCircle = async () => {
    if (!userId) return;

    try {
      const userRef = doc(db, 'users', userId);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        setActiveCircleId(snap.data().activeCircleId || null);
      }
    } catch (err) {}
  };

  useEffect(() => {
    fetchCircles();
    fetchActiveCircle();
  }, [userId]);

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

  const handleSetActiveCircle = async (circleId) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      await updateDoc(doc(db, 'users', currentUser.uid), {
        activeCircleId: circleId,
      });

      setActiveCircleId(circleId);
      alert('Active circle updated!');
    } catch (error) {}
  };

  const copyToClipboard = (code) => {
    Clipboard.setString(code);
    Alert.alert('Copied!', `Invite code ${code} copied to clipboard`);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
    <View style={{ flex: 1 }}>
      <Header />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          isDarkMode && { backgroundColor: colors.background }
        ]}
      >
        <Button
          mode="text"
          onPress={() => navigation.navigate('Dashboard')}
          style={styles.backButton}
          labelStyle={isDarkMode ? { color: DM_TEXT } : {}}
        >
          ← Back to Dashboard
        </Button>

        <Title style={[styles.title, isDarkMode && { color: DM_TEXT }]}>
          Coven Circles 🔮
        </Title>

        <Paragraph style={[styles.subtitle, isDarkMode && { color: DM_TEXT }]}>
          Manage your circles and choose your active one.
        </Paragraph>

        {loading && (
          <ActivityIndicator animating={true} color={isDarkMode ? DM_TEXT : "#4a148c"} size="small" />
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
        <Card style={[
          styles.card,
          isDarkMode && {
            backgroundColor: colors.cardBackground,
            borderColor: colors.border,
            borderWidth: 1,
            shadowColor: colors.shadowColor,
            shadowOpacity: colors.shadowOpacity,
            shadowRadius: 15,
            elevation: 8,
          }
        ]}>
          <Card.Content>
            <Title style={[styles.cardTitle, isDarkMode && { color: DM_TEXT }]}>
              Create New Circle
            </Title>

            <TextInput
              label="Circle Name"
              value={circleName}
              onChangeText={setCircleName}
              mode="outlined"
              style={styles.input}
              disabled={loading}
              theme={isDarkMode ? { colors: { text: DM_TEXT, placeholder: DM_TEXT } } : {}}
            />

            <View style={styles.buttonShadowWrapper}>
              <Button
                mode="contained"
                onPress={handleCreateCircle}
                disabled={loading || !circleName.trim()}
                style={[
                  styles.shadowButtonContainer,
                  isDarkMode && {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.border,
                    borderWidth: 2,
                    shadowColor: colors.shadowColor,
                    shadowOpacity: colors.shadowOpacity,
                    shadowRadius: 15,
                    elevation: 8,
                  }
                ]}
                contentStyle={styles.topButtonContent}
                labelStyle={[
                  styles.topButtonLabel,
                  isDarkMode && { color: DM_TEXT }
                ]}
              >
                Create Circle
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Join Circle */}
        <Card style={[
          styles.card,
          isDarkMode && {
            backgroundColor: colors.cardBackground,
            borderColor: colors.border,
            borderWidth: 1,
            shadowColor: colors.shadowColor,
            shadowOpacity: colors.shadowOpacity,
            shadowRadius: 15,
            elevation: 8,
          }
        ]}>
          <Card.Content>
            <Title style={[styles.cardTitle, isDarkMode && { color: DM_TEXT }]}>
              Join Circle
            </Title>

            <TextInput
              label="Invite Code"
              value={inviteCode}
              onChangeText={setInviteCode}
              mode="outlined"
              style={styles.input}
              disabled={loading}
              autoCapitalize="characters"
              maxLength={8}
              theme={isDarkMode ? { colors: { text: DM_TEXT, placeholder: DM_TEXT } } : {}}
            />

            <View style={styles.buttonShadowWrapper}>
              <Button
                mode="contained"
                onPress={handleJoinCircle}
                disabled={loading || inviteCode.length !== 8}
                style={[
                  styles.shadowButtonContainer,
                  isDarkMode && {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.border,
                    borderWidth: 2,
                    shadowColor: colors.shadowColor,
                    shadowOpacity: colors.shadowOpacity,
                    shadowRadius: 15,
                    elevation: 8,
                  }
                ]}
                contentStyle={styles.topButtonContent}
                labelStyle={[
                  styles.topButtonLabel,
                  isDarkMode && { color: DM_TEXT }
                ]}
              >
                Join Circle
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Circles List */}
        <Card style={[
          styles.card,
          isDarkMode && {
            backgroundColor: colors.cardBackground,
            borderColor: colors.border,
            borderWidth: 1,
            shadowColor: colors.shadowColor,
            shadowOpacity: colors.shadowOpacity,
            shadowRadius: 15,
            elevation: 8,
          }
        ]}>
          <Card.Content>
            <Title style={[styles.cardTitle, isDarkMode && { color: DM_TEXT }]}>
              My Circles ({circles.length})
            </Title>

            {circles.map((circle, index) => (
              <TouchableOpacity
                key={circle.id}
                style={[
                  styles.circleItem,
                  circle.id === activeCircleId && styles.activeCircle,
                  circle.id === activeCircleId && isDarkMode && {
                    backgroundColor: '#4a1f3d',
                    borderLeftColor: colors.primary,
                  }
                  ,
                  isDarkMode && { borderBottomColor: colors.border }
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
                  <Text style={[styles.circleName, isDarkMode && { color: DM_TEXT }]}>
                    {circle.name}
                  </Text>
                  <Text style={[styles.circleDetail, isDarkMode && { color: DM_TEXT }]}>
                    Invite Code: {circle.inviteCode}
                  </Text>

                  <TouchableOpacity
                    onPress={() => copyToClipboard(circle.inviteCode)}
                    style={[
                      styles.copyButton,
                      isDarkMode && {
                        backgroundColor:
                          circle.id === activeCircleId
                            ? '#0a1a3f'   // dark blue for ACTIVE
                            : '#8b0a50',  // dark red for INACTIVE
                      }
                    ]}
                  >
                    <Text
                      style={[
                        styles.copyButtonLabel,
                        isDarkMode && { color: '#ffffff' }
                      ]}
                    >
                      📋 Copy
                    </Text>
                  </TouchableOpacity>


                  <Text style={[styles.circleDetail, isDarkMode && { color: DM_TEXT }]}>
                    {Array.isArray(circle.members)
                      ? `${circle.members.length} members`
                      : '0 members'}
                  </Text>

                  <Button
                    mode="contained"
                    onPress={() => handleSetActiveCircle(circle.id)}
                    style={[
                      styles.activeButton,
                      isDarkMode && {
                        backgroundColor: colors.cardBackground,
                        borderColor: colors.border,
                        borderWidth: 2,
                        shadowColor: colors.shadowColor,
                        shadowOpacity: colors.shadowOpacity,
                        shadowRadius: 15,
                        elevation: 8,
                      }
                    ]}
                    labelStyle={[
                      styles.activeButtonLabel,
                      isDarkMode && { color: DM_TEXT }
                    ]}
                  >
                    ⭐ Set as Active
                  </Button>

                  {circle.id === activeCircleId && (
                    <Text style={[styles.activeBadge, isDarkMode && { color: DM_TEXT }]}>
                      ⭐ Active Circle
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}

            <Button
              mode="text"
              onPress={fetchCircles}
              style={{ marginTop: 10 }}
              labelStyle={isDarkMode ? { color: DM_TEXT } : {}}
            >
              Refresh List
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>

      <Footer navigation={navigation} />
    </View>
    </SafeAreaView>
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

  buttonShadowWrapper: {
    overflow: 'visible',
  },

  shadowButtonContainer: {
    marginTop: 10,
    elevation: 12,
    shadowColor: '#4a148c',
    shadowOpacity: 1,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 8 },
    borderRadius: 12,
  },

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

  inviteCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 2,
  },

  copyButton: {
  backgroundColor: '#6a1b9a',
  elevation: 12,
  shadowColor: '#4a148c',
  shadowOpacity: 1,
  shadowRadius: 22,
  shadowOffset: { width: 0, height: 8 },
  minWidth: 16,
  minHeight: 8,
  paddingHorizontal: 4,
  paddingVertical: 1,
  borderRadius: 8,
  flexShrink: 1,
  flexGrow: 0,
  alignSelf: 'flex-start',
},


  copyButtonLabel: {
  fontSize: 9,
  fontWeight: 'bold',
  color: '#e3d2f0ff', // light lilac for light mode
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