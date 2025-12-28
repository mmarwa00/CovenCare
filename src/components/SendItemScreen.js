import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ImageBackground, Image, ScrollView, Dimensions, TouchableOpacity, Text, ActivityIndicator, Alert } from 'react-native';
import { Title, Button } from 'react-native-paper';
import Layout from './Layout';
import { getCircleMembers } from '../services/circleService';
import { sendVoucher } from '../services/voucherService'; 
import { createEmergency } from '../services/emergencyService'; 
import { auth, db } from '../config/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { useTheme } from '../context/ThemeContext';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const CARD_WIDTH = screenWidth * 0.5;
const CARD_HEIGHT = CARD_WIDTH * 1.4;

export default function SendItemScreen({ 
  navigation, 
  selectedItem, 
  itemType,
  backgroundImage 
}) {
  const { colors, isDarkMode } = useTheme();
  const DM_TEXT = '#e3d2f0ff';

  const [selectedPeople, setSelectedPeople] = useState([]);
  const [allPeople, setAllPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCircleId, setActiveCircleId] = useState(null); 
  const [isSending, setIsSending] = useState(false); 

  const witch1 = require('../../assets/Profile_pics/witch1.png');
  const witch2 = require('../../assets/Profile_pics/witch2.png');
  const witch3 = require('../../assets/Profile_pics/witch3.png');
  const witch4 = require('../../assets/Profile_pics/witch4.png');
  const witch5 = require('../../assets/Profile_pics/witch5.png');
  const wizz1 = require('../../assets/Profile_pics/wizz1.png');
  const wizz2 = require('../../assets/Profile_pics/wizz2.png');
  const wizz3 = require('../../assets/Profile_pics/wizz3.png');

  const photoMap = { witch1, witch2, witch3, witch4, witch5, wizz1, wizz2, wizz3 };

  useEffect(() => {
    loadPeopleFromAllCircles();
  }, []);

  const loadPeopleFromAllCircles = async () => {
    try {
      setLoading(true);
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert('Error', 'You must be logged in');
        navigation.goBack();
        return;
      }

      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) throw new Error('User not found');

      const userData = userSnap.data();
      const circleIds = userData.circles || userData.joinedCircles || [];

      if (!circleIds.length) {
        Alert.alert('No Circles', 'You are not in any circles yet.');
        return;
      }

      const uniqueUsers = new Map();

      // Go through all the circles
      for (const circleId of circleIds) {
        const membersResult = await getCircleMembers(circleId);
        if (!membersResult.success) continue;

        for (const member of membersResult.members) {
          if (member.id === userId) continue; // do not add yourself

          if (!uniqueUsers.has(member.id)) {
            try {
              const userRef = doc(db, 'users', member.id);
              const userSnap = await getDoc(userRef);

              if (userSnap.exists()) {
                const data = userSnap.data();
                uniqueUsers.set(member.id, {
                  id: member.id,
                  displayName: data.displayName || member.displayName || 'Unknown',
                  profilePhoto: data.profilePhoto || null
                });
              } else {
                uniqueUsers.set(member.id, {
                  id: member.id,
                  displayName: member.displayName || 'Unknown',
                  profilePhoto: null
                });
              }

            } catch {
              uniqueUsers.set(member.id, {
                id: member.id,
                displayName: member.displayName || 'Unknown',
                profilePhoto: null
              });
            }
          }
        }
      }

      const peopleList = Array.from(uniqueUsers.values());

      if (peopleList.length === 0) {
        Alert.alert('No Members', 'There are no other people across your circles yet.');
      }

      setAllPeople(peopleList);

    } catch (error) {
      Alert.alert('Error', 'Failed to load members: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const togglePersonSelection = (personId) => {
    if (selectedPeople.includes(personId)) {
      setSelectedPeople(selectedPeople.filter(id => id !== personId));
    } else {
      setSelectedPeople([...selectedPeople, personId]);
    }
  };

  const handleSend = async () => {
    if (selectedPeople.length === 0) {
      Alert.alert('No Recipients', 'Please select at least one person');
      return;
    }

    const userId = auth.currentUser?.uid;
    const message = selectedItem?.message || '';
    const recipients = selectedPeople;
    const type = String(selectedItem?.type || selectedItem?.name || selectedItem?.id || selectedItem?.value || 'unknown');

    if (!userId || !type) {
      Alert.alert('Sending Blocked', 'Missing required data.');
      return;
    }

    // pick circle id for sending
    let circleIdToUse = activeCircleId;
    if (!circleIdToUse) {
      circleIdToUse = "multi";
    }

    setIsSending(true);

    let result;
    if (itemType === 'voucher') {
      result = await sendVoucher(userId, recipients, circleIdToUse, type, message);
    } else if (itemType === 'alert') {
      result = await createEmergency(userId, circleIdToUse, type, recipients, message);
      if (result.success) result.count = recipients.length;
    } else {
      Alert.alert('Error', 'Invalid item type.');
      setIsSending(false);
      return;
    }

    setIsSending(false);

    if (result?.success) {
      Alert.alert(
        'Success!',
        `${itemType === 'voucher' ? 'Voucher' : 'Alert'} sent to ${result.count}!`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } else {
      Alert.alert('Failed', result?.error || 'Unknown error');
    }
  };

  const Content = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.cardContainer}>
        <Image 
          source={selectedItem.image} 
          style={[styles.selectedCard, { width: CARD_WIDTH, height: CARD_HEIGHT }]}
          resizeMode="contain"
        />
      </View>

      <View style={[
        styles.selectionArea,
        isDarkMode && {
          backgroundColor: 'rgba(0,0,0,0.4)',
          borderColor: colors.border,
        }
      ]}>
        <Title style={[styles.sectionTitle, isDarkMode && { color: DM_TEXT }]}>
          Select Recipients:
        </Title>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={isDarkMode ? DM_TEXT : "#4a148c"} />
            <Text style={[styles.loadingText, isDarkMode && { color: DM_TEXT }]}>
              Loading circle members...
            </Text>
          </View>
        ) : allPeople.length === 0 ? (
          <View style={[
            styles.placeholder,
            isDarkMode && { borderColor: DM_TEXT }
          ]}>
            <Title style={[styles.placeholderText, isDarkMode && { color: DM_TEXT }]}>
              No circle members found
            </Title>
          </View>
        ) : (
          <ScrollView style={styles.peopleList}>
            {allPeople.map((person) => (
              <TouchableOpacity
                key={person.id}
                style={[
                  styles.personCard,
                  isDarkMode && {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.border,
                  },
                  selectedPeople.includes(person.id) && {
                    backgroundColor: isDarkMode ? colors.primary : '#e9d5ff',
                    borderColor: isDarkMode ? DM_TEXT : '#7b1fa2',
                  }
                ]}
                onPress={() => togglePersonSelection(person.id)}
              >
                <View style={styles.personInfo}>
                  {person.profilePhoto && photoMap[person.profilePhoto] ? (
                    <Image
                      source={photoMap[person.profilePhoto]} 
                      style={[
                        styles.avatar,
                        isDarkMode && { borderColor: DM_TEXT }
                      ]}
                    />
                  ) : (
                    <View style={[
                      styles.avatarPlaceholder,
                      isDarkMode && { backgroundColor: colors.primary }
                    ]}>
                      <Text style={[
                        styles.avatarText,
                        isDarkMode && { color: DM_TEXT }
                      ]}>
                        {person.displayName?.charAt(0).toUpperCase() || '?'}
                      </Text>
                    </View>
                  )}
                  
                  <View style={styles.personDetails}>
                    <Text style={[
                      styles.personName,
                      isDarkMode && { color: DM_TEXT }
                    ]}>
                      {person.displayName}
                    </Text>
                  </View>
                </View>

                <View style={[
                  styles.checkbox,
                  isDarkMode && {
                    borderColor: DM_TEXT,
                    backgroundColor: colors.cardBackground,
                  },
                  selectedPeople.includes(person.id) && {
                    backgroundColor: isDarkMode ? DM_TEXT : '#7b1fa2',
                  }
                ]}>
                  {selectedPeople.includes(person.id) && (
                    <Text style={[
                      styles.checkmark,
                      isDarkMode && { color: colors.background }
                    ]}>
                      ✓
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      <Button
        mode="contained"
        onPress={handleSend}
        style={[
          styles.sendButton,
          isDarkMode && {
            backgroundColor: colors.cardBackground,
            borderColor: colors.border,
            shadowColor: colors.shadowColor,
            shadowOpacity: colors.shadowOpacity,
            shadowRadius: 15,
            elevation: 8,
          }
        ]}
        labelStyle={[
          styles.sendButtonLabel,
          isDarkMode && { color: DM_TEXT }
        ]}
        disabled={selectedPeople.length === 0 || isSending} 
      >
        {isSending 
          ? <ActivityIndicator color={isDarkMode ? DM_TEXT : "#fff"} size="small" /> 
          : `Send to ${selectedPeople.length || 0} ${selectedPeople.length === 1 ? 'person' : 'people'}`
        }
      </Button>
    </ScrollView>
  );

  return (
    <Layout navigation={navigation} subtitle={`Send ${itemType}`}>
      <View style={[
        styles.backgroundWrapper,
        isDarkMode && { backgroundColor: colors.background }
      ]}>
        {backgroundImage ? (
          <ImageBackground
            source={backgroundImage}
            style={styles.background}
            resizeMode="cover"
            imageStyle={styles.backgroundImage}
          >
            <Content />
          </ImageBackground>
        ) : (
          <View style={styles.background}>
            <Content />
          </View>
        )}
      </View>
    </Layout>
  );
}

const styles = StyleSheet.create({
  backgroundWrapper: {
    flex: 1,
    backgroundColor: '#eaddf7ff',
  },
  background: {
    flex: 1,
    width: '100%',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  cardContainer: {
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  selectedCard: {
    borderRadius: 12,
  },
  selectionArea: {
    width: '90%',
    flex: 1,
    minHeight: screenHeight * 0.3,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4a148c',
    marginBottom: 15,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#4a148c',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4a148c',
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 20,
  },
  placeholderText: {
    fontSize: 16,
    color: '#7b1fa2',
    textAlign: 'center',
  },
  peopleList: {
    flex: 1,
  },
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9f5ff',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  personCardSelected: {
    backgroundColor: '#e9d5ff',
    borderColor: '#7b1fa2',
  },
  personInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#7b1fa2',
  },
  avatarPlaceholder: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#7b1fa2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  personDetails: {
    flex: 1,
  },
  personName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#4a148c',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#7b1fa2',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  checkboxSelected: {
    backgroundColor: '#7b1fa2',
  },
  checkmark: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sendButton: {
    width: '80%',
    paddingVertical: 8,
    backgroundColor: '#d4a5ff',
    borderWidth: 2,
    borderColor: '#4a148c',
    borderRadius: 25, 
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8, 
  },
  sendButtonLabel: {
    color: '#4a148c',
    fontWeight: 'bold',
  },
});
