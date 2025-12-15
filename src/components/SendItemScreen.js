import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ImageBackground, Image, ScrollView, Dimensions, TouchableOpacity, Text, ActivityIndicator, Alert } from 'react-native';
import { Title, Button } from 'react-native-paper';
import Layout from './Layout';
import { getCircleMembers } from '../services/circleService';
import { sendVoucher } from '../services/voucherService'; 
import { createEmergency } from '../services/emergencyService'; 
import { auth, db } from '../config/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

// Card size - scales with screen
const CARD_WIDTH = screenWidth * 0.5; // 50% of screen width
const CARD_HEIGHT = CARD_WIDTH * 1.4; // Tarot card aspect ratio

export default function SendItemScreen({ 
  navigation, 
  selectedItem, 
  itemType, // 'voucher' or 'alert'
  backgroundImage 
}) {
  const [selectedPeople, setSelectedPeople] = useState([]);
  const [allPeople, setAllPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCircleId, setActiveCircleId] = useState(null); 
  const [isSending, setIsSending] = useState(false); 

  // Photo map for profile pictures (unchanged)
  const witch1 = require('../../assets/Profile_pics/witch1.png');
  const witch2 = require('../../assets/Profile_pics/witch2.png');
  const witch3 = require('../../assets/Profile_pics/witch3.png');
  const witch4 = require('../../assets/Profile_pics/witch4.png');
  const witch5 = require('../../assets/Profile_pics/witch5.png');
  const wizz1 = require('../../assets/Profile_pics/wizz1.png');
  const wizz2 = require('../../assets/Profile_pics/wizz2.png');
  const wizz3 = require('../../assets/Profile_pics/wizz3.png');

  const photoMap = {
    witch1,
    witch2,
    witch3,
    witch4,
    witch5,
    wizz1,
    wizz2,
    wizz3,
  };

  // Load people from ACTIVE circle only
  useEffect(() => {
    loadPeopleFromActiveCircle();
  }, []);

  const loadPeopleFromActiveCircle = async () => {
    try {
      setLoading(true);
      const userId = auth.currentUser?.uid;
      
      if (!userId) {
        Alert.alert('Error', 'You must be logged in');
        navigation.goBack();
        return;
      }

      // Get user's active circle ID
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        throw new Error('User not found');
      }

      const circleId = userSnap.data().activeCircleId;

      if (!circleId) {
        Alert.alert('No Active Circle', 'Please set an active circle first!', [
          {
            text: 'Go to Circles',
            onPress: () => navigation.navigate('CircleScreen') 
          },
          {
            text: 'Cancel',
            onPress: () => navigation.goBack()
          }
        ]);
        return;
      }

      setActiveCircleId(circleId);

      const membersResult = await getCircleMembers(circleId);
      
      if (!membersResult.success) {
        throw new Error(membersResult.error);
      }

      // Get full user details for each member (filtering out the current user)
      const peopleWithDetails = [];
      for (const member of membersResult.members) {
        if (member.id !== userId) {
          try {
            const userRef = doc(db, 'users', member.id);
            const userSnap = await getDoc(userRef);
            
            if (userSnap.exists()) {
              const userData = userSnap.data();
              peopleWithDetails.push({
                id: member.id,
                displayName: userData.displayName || member.displayName || 'Unknown',
                profilePhoto: userData.profilePhoto || null,
                circleId: circleId 
              });
            } else {
              peopleWithDetails.push({
                id: member.id,
                displayName: member.displayName || 'Unknown',
                profilePhoto: null,
                circleId: circleId
              });
            }
          } catch (error) {
            console.error('Error fetching user details:', error);
            peopleWithDetails.push({
              id: member.id,
              displayName: member.displayName || 'Unknown',
              profilePhoto: null,
              circleId: circleId
            });
          }
        }
      }

      if (peopleWithDetails.length === 0) {
        Alert.alert('No Members', 'Your active circle has no other members yet.');
      }

      setAllPeople(peopleWithDetails);

    } catch (error) {
      console.error('Error loading people:', error);
      Alert.alert('Error', 'Failed to load circle members: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Toggle person selection (unchanged)
  const togglePersonSelection = (personId) => {
    if (selectedPeople.includes(personId)) {
      setSelectedPeople(selectedPeople.filter(id => id !== personId));
    } else {
      setSelectedPeople([...selectedPeople, personId]);
    }
  };

  // HANDLER: Send Voucher or Alert
  const handleSend = async () => {
  if (selectedPeople.length === 0) {
    Alert.alert('No Recipients', 'Please select at least one person');
    return;
  }

  const userId = auth.currentUser?.uid;
  const message = selectedItem?.message || '';
  const recipients = selectedPeople;
  const type = String(selectedItem?.type || selectedItem?.name || selectedItem?.id || selectedItem?.value || 'unknown');

  console.log('--- SEND ATTEMPT ---');
  console.log('User ID:', userId);
  console.log('Circle ID:', activeCircleId);
  console.log('Item type:', type);
  console.log('Recipients:', recipients);

  if (!userId || !activeCircleId || !type) {
    Alert.alert(
      'Sending Blocked',
      `Required data missing: User ID: ${!!userId}, Circle ID: ${!!activeCircleId}, Type: ${type}`
    );
    return;
  }

  setIsSending(true);

  let result;


  // Add a robust check here, even if you check earlier.
  if (!userId) {
      Alert.alert('Auth Error', 'User is not authenticated.');
      setIsSending(false);
      return;
  } 

  if (itemType === 'voucher') {
    result = await sendVoucher(userId, recipients, activeCircleId, type, message);
  } else if (itemType === 'alert') {
    result = await createEmergency(userId, activeCircleId, type, recipients, message);
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
      `${itemType === 'voucher' ? 'Voucher' : 'Alert'} sent to ${result.count || recipients.length} ${recipients.length === 1 ? 'person' : 'people'}!`,
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  } else {
    Alert.alert('Failed', `Sending failed: ${result?.error || 'Unknown error'}`);
    console.error('Backend Service Failure:', result?.error);
  }
};

  // Render person's avatar (unchanged)
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


  // Content component
  const Content = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      {/* Selected Card - Top Center */}
      <View style={styles.cardContainer}>
        <Image 
          source={selectedItem.image} 
          style={[styles.selectedCard, { width: CARD_WIDTH, height: CARD_HEIGHT }]}
          resizeMode="contain"
        />
      </View>

      {/* People Selection Area */}
      <View style={styles.selectionArea}>
        <Title style={styles.sectionTitle}>Select Recipients:</Title>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4a148c" />
            <Text style={styles.loadingText}>Loading circle members...</Text>
          </View>
        ) : allPeople.length === 0 ? (
          <View style={styles.placeholder}>
            <Title style={styles.placeholderText}>
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
                  selectedPeople.includes(person.id) && styles.personCardSelected
                ]}
                onPress={() => togglePersonSelection(person.id)}
              >
                {/* Profile Picture */}
                <View style={styles.personInfo}>
                  {person.profilePhoto && photoMap[person.profilePhoto] ? (
                    <Image
                      source={photoMap[person.profilePhoto]} 
                      style={styles.avatar} 
                    />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarText}>
                        {person.displayName?.charAt(0).toUpperCase() || '?'}
                      </Text>
                    </View>
                  )}
                  
                  <View style={styles.personDetails}>
                    <Text style={styles.personName}>{person.displayName}</Text>
                  </View>
                </View>

                {/* Checkbox */}
                <View style={[
                  styles.checkbox,
                  selectedPeople.includes(person.id) && styles.checkboxSelected
                ]}>
                  {selectedPeople.includes(person.id) && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Send Button */}
      <Button
        mode="contained"
        onPress={handleSend}
        style={styles.sendButton}
        labelStyle={styles.sendButtonLabel}
        disabled={selectedPeople.length === 0 || isSending} 
      >
        {isSending 
          ? <ActivityIndicator color="#fff" size="small" /> 
          : `Send to ${selectedPeople.length || 0} ${selectedPeople.length === 1 ? 'person' : 'people'}`
        }
      </Button>
    </ScrollView>
  );

  return (
    <Layout navigation={navigation} subtitle={`Send ${itemType}`}>
      <View style={styles.backgroundWrapper}>
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

// People List
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

  // Checkbox
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