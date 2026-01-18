import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ImageBackground, Image, ScrollView, Dimensions, TouchableOpacity, Text, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Title, Button } from 'react-native-paper';
import Layout from './Layout';
import { getCircleMembers } from '../services/circleService';
import { sendVoucher } from '../services/voucherService'; 
import { createEmergency } from '../services/emergencyService'; 
import { auth, db } from '../config/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { useTheme } from '../context/ThemeContext';
import { collection, query, where, getDocs } from "firebase/firestore";

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const CARD_WIDTH = screenWidth * 0.5;
const CARD_HEIGHT = CARD_WIDTH * 1.4;

export default function SendItemScreen({ 
  navigation, 
  selectedItem, 
  itemType, // 'voucher' or 'alert'
  backgroundImage,
  forceRecipient  
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

    // Load people from ACTIVE circle only
  useEffect(() => {
    if (itemType === 'alert') {
      loadPeopleFromAllCircles();
    } else {
      loadPeopleFromActiveCircle();
    }
  }, [itemType]);

  const loadPeopleFromActiveCircle = async () => {
    try {
      setLoading(true);
      const userId = auth.currentUser?.uid;

      const userSnap = await getDoc(doc(db, "users", userId));
      const activeCircleId = userSnap.data()?.activeCircleId;

      if (!activeCircleId) {
        Alert.alert("No Active Circle");
        return;
      }

      const membersResult = await getCircleMembers(activeCircleId);

      let list = [];

      for (let member of membersResult.members) {
        if (member.id !== userId) {
          const snap = await getDoc(doc(db, "users", member.id));
          if (snap.exists()) {
            const data = snap.data();
            list.push({
              id: member.id,
              displayName: data.displayName || "Unknown",
              profilePhoto: data.profilePhoto || null,
              circleId: activeCircleId
            });
          }
        }
      }

      setAllPeople(list);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const loadPeopleFromAllCircles = async () => {
    try {
      setLoading(true);
      const userId = auth.currentUser?.uid;

      const circlesSnap = await getDocs(collection(db, "circles"));

      let peopleMap = {};

      circlesSnap.forEach(docSnap => {
        const data = docSnap.data();

        const isMember = data.members?.some(m => m.userId === userId);

        if (isMember) {
          for (let m of data.members) {
            if (m.userId !== userId && !peopleMap[m.userId]) {
              peopleMap[m.userId] = {
                id: m.userId,
                displayName: m.displayName || "Unknown",
                profilePhoto: m.profilePhoto || null,
                circleId: docSnap.id
              };
            }
          }
        }
      });

      // load user names
      for (let id in peopleMap) {
        const snap = await getDoc(doc(db, "users", id));
        if (snap.exists()) {
          const d = snap.data();
          peopleMap[id].displayName = d.displayName || peopleMap[id].displayName;
          peopleMap[id].profilePhoto = d.profilePhoto || null;
        }
      }

      setAllPeople(Object.values(peopleMap));
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "Failed to load circles");
    } finally {
      setLoading(false);
    }
  };

  // Add or remove person from selection
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

    console.log('=== SENDING ===');
    console.log('Type:', itemType);
    console.log('Item:', selectedItem);
    console.log('Recipients:', selectedPeople);
    console.log('===============');

    setIsSending(true);

    try {
      // Get user's active circle
      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error('Not logged in');
      }

      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      const activeCircleId = userSnap.data()?.activeCircleId;

      if (!activeCircleId) {
        throw new Error('No active circle set');
      }

      let result;

      if (itemType === 'voucher') {
        // Send voucher
        result = await sendVoucher(
          userId,
          [selectedPeople[0]],
          activeCircleId,
          selectedItem.type
        );
      } else if (itemType === 'alert') {
        // Send emergency alert
        result = await createEmergency(
          userId,
          activeCircleId,
          selectedItem.type,
          selectedPeople,
          '' // optional message
        );
      }

      if (result.success) {
        Alert.alert(
          'Success!',
          `${itemType === 'voucher' ? 'Voucher' : 'Alert'} sent to ${selectedPeople.length} ${selectedPeople.length === 1 ? 'person' : 'people'}!`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        throw new Error(result.error || 'Failed to send');
      }

    } catch (error) {
      console.error('Error sending:', error);
      Alert.alert('Error', error.message || 'Failed to send. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // Render person's avatar
  const renderPersonAvatar = (person) => {
    // If user has profilePhoto and it exists in photoMap, show the image
    if (person.profilePhoto && photoMap[person.profilePhoto]) {
      return (
        <Image 
          source={photoMap[person.profilePhoto]} 
          style={styles.avatar} 
        />
      );
   }
    // Otherwise show circle with first letter
    return (
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarText}>
          {person.displayName?.charAt(0).toUpperCase() || '?'}
        </Text>
      </View>
    );
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
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
    </SafeAreaView>
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
