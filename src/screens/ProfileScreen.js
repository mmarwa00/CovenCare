import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal } from 'react-native';
import { Button, TextInput, HelperText, ActivityIndicator, Avatar, Card, Title as PaperTitle } from 'react-native-paper'; 
import { useAuth } from '../context/AuthContext';
import { getUserProfile, updateUserProfile } from '../services/userService';
import { updateProfile } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';

export default function ProfileScreen({ navigation }) {
  const { user } = useAuth();
  
  const [displayName, setDisplayName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [firestoreData, setFirestoreData] = useState(null);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);

  const witch1 = require('../../assets/Profile_pics/witch1.png');
  const witch2 = require('../../assets/Profile_pics/witch2.png');
  const witch3 = require('../../assets/Profile_pics/witch3.png');
  const witch4 = require('../../assets/Profile_pics/witch4.png');

  const fetchProfile = useCallback(async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    setError('');
    
    const result = await getUserProfile(user.uid); 
    
    if (result.success) {
      setFirestoreData(result.user);
      setDisplayName(result.user.displayName || '');
      setProfileEmail(result.user.email || '');
  
      // Load saved photo
      if (result.user.profilePhoto) {
        const photoMap = {
          'witch1': witch1,
          'witch2': witch2,
          'witch3': witch3,
          'witch4': witch4,
        };
        setSelectedPhoto(photoMap[result.user.profilePhoto]);
      }
      
      setSuccess('');
    } else {
      setError(`Failed to load profile: ${result.error}`);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    if (displayName.length < 3) {
      setError("Display name must be at least 3 characters.");
      setLoading(false);
      return;
    }

    if (displayName === firestoreData.displayName) {
      setSuccess('No changes detected.');
      setLoading(false);
      setIsEditing(false);
      return;
    }

    try {
      await updateUserProfile(user.uid, { displayName });
      await updateProfile(auth.currentUser, { displayName });
      user.displayName = displayName;

      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      await fetchProfile();
    } catch (e) {
      setError(e.message || 'Failed to save changes.');
    }
    setLoading(false);
  };

  const handlePhotoSelect = async (photoSource, photoName) => {
    setSelectedPhoto(photoSource);
    setShowPhotoPicker(false);
  
    // Save to Firestore immediately
    try {
      await updateUserProfile(user.uid, { profilePhoto: photoName });
      setSuccess('Avatar updated!');
    } catch (e) {
      setError('Failed to save avatar');
    }
  };

  const renderAvatar = () => {
    if (selectedPhoto) {
      return (
        <TouchableOpacity 
          onPress={isEditing ? () => setShowPhotoPicker(true) : null}
          disabled={!isEditing}
        >
          <Image source={selectedPhoto} style={styles.avatar} />
        </TouchableOpacity>
      );
    }
    return (
      <TouchableOpacity 
        onPress={isEditing ? () => setShowPhotoPicker(true) : null}
        disabled={!isEditing}
      >
        <Avatar.Icon 
          size={100} 
          icon="account-circle" 
          style={styles.defaultAvatar} 
        />
      </TouchableOpacity>
    );
  };

  if (!firestoreData) {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4a148c" />
          <Text style={styles.loadingText}>Loading Coven identity...</Text>
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorTextTitle}>Profile Load Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.errorTip}>
            Tip: If this is a "permissions" error, you MUST publish the correct Firestore rule.
          </Text>
          <Button onPress={fetchProfile} mode="contained" style={{marginTop: 20}}>
            Try Again
          </Button>
        </View>
      );
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <Button 
        mode="text" 
        onPress={() => navigation.navigate('Dashboard')} 
        style={styles.backButton}
        labelStyle={styles.backButtonLabel}
      >
        ← Back to Dashboard
      </Button>

      <Card style={styles.profileCard}>
        <View style={styles.header}>
          {renderAvatar()}
          <PaperTitle style={styles.cardTitle}>Your Coven Profile</PaperTitle>
        </View>

        {success ? (
          <HelperText type="info" visible={!!success} style={styles.successText}>
            {success}
          </HelperText>
        ) : null}
        {error && <HelperText type="error" visible={!!error}>{error}</HelperText>}
        
        <TextInput
          label="Email (Read Only)"
          value={profileEmail}
          mode="outlined"
          style={styles.input}
          disabled={true} 
        />
        
        <TextInput
          label="Display Name"
          value={displayName}
          onChangeText={setDisplayName}
          mode="outlined"
          style={styles.input}
          disabled={!isEditing || loading}
        />
        
        <Text style={styles.uidText}>UID: {user?.uid}</Text>

        {isEditing ? (
          <Button 
            mode="contained" 
            onPress={handleSave} 
            loading={loading}
            disabled={loading || displayName.length < 3}
            style={styles.saveButton}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        ) : (
          <Button 
            mode="outlined" 
            onPress={() => setIsEditing(true)} 
            style={styles.editButton}
          >
            Edit Profile
          </Button>
        )}

        {isEditing && (
          <Button 
            mode="text" 
            onPress={() => { 
              setIsEditing(false); 
              fetchProfile(); 
            }} 
            disabled={loading}
            style={{ marginTop: 10 }}
          >
            Cancel
          </Button>
        )}
      </Card>

      <Modal
        visible={showPhotoPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPhotoPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.photoPickerModal}>
            <PaperTitle style={styles.modalTitle}>Choose Your Witch</PaperTitle>
            
            <View style={styles.photoGrid}>
              <TouchableOpacity 
                onPress={() => handlePhotoSelect(witch1, 'witch1')}
                style={styles.photoOption}
              >
                <Image source={witch1} style={styles.photoOptionImage} />
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => handlePhotoSelect(witch2, 'witch2')}
                style={styles.photoOption}
              >
                <Image source={witch2} style={styles.photoOptionImage} />
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => handlePhotoSelect(witch3, 'witch3')}
                style={styles.photoOption}
              >
                <Image source={witch3} style={styles.photoOptionImage} />
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => handlePhotoSelect(witch4, 'witch4')}
                style={styles.photoOption}
              >
                <Image source={witch4} style={styles.photoOptionImage} />
              </TouchableOpacity>
            </View>

            <Button 
              mode="outlined" 
              onPress={() => setShowPhotoPicker(false)}
              style={styles.cancelButton}
            >
              Cancel
            </Button>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f3e5f5',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  backButtonLabel: {
    color: '#6a1b9a',
  },
  profileCard: {
    padding: 20,
    borderRadius: 15,
    elevation: 3,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  defaultAvatar: {
    backgroundColor: '#6a1b9a',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6a1b9a',
    textAlign: 'center',
  },
  input: {
    marginBottom: 15,
  },
  uidText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginVertical: 10,
  },
  saveButton: {
    marginTop: 15,
    backgroundColor: '#4a148c',
  },
  editButton: {
    marginTop: 15,
    borderColor: '#8e24aa',
  },
  successText: {
    backgroundColor: '#e8f5e9',
    color: '#388e3c',
    borderRadius: 4,
    padding: 5,
    marginBottom: 10,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#6a1b9a',
  },
  errorTextTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 10,
  },
  errorText: {
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorTip: {
    color: '#666',
    textAlign: 'center',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPickerModal: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#4a148c',
    fontSize: 20,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  photoOption: {
    margin: 10,
    borderRadius: 50,
    overflow: 'hidden',
  },
  photoOptionImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  cancelButton: {
    marginTop: 10,
    borderColor: '#8e24aa',
  },
});