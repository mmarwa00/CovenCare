import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, Switch } from 'react-native';
import { Button, TextInput, HelperText, ActivityIndicator, Avatar, Card, Title as PaperTitle } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext'; 
import { getUserProfile, updateUserProfile } from '../services/userService';
import { updateProfile } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import Header from '../components/Header';
import Footer from '../components/Footer';

const photoMap = {
  witch1: require('../../assets/Profile_pics/witch1.png'),
  witch2: require('../../assets/Profile_pics/witch2.png'),
  witch3: require('../../assets/Profile_pics/witch3.png'),
  witch4: require('../../assets/Profile_pics/witch4.png'),
  witch5: require('../../assets/Profile_pics/witch5.png'),
  wizz1: require('../../assets/Profile_pics/wizz1.png'),
  wizz2: require('../../assets/Profile_pics/wizz2.png'),
  wizz3: require('../../assets/Profile_pics/wizz3.png'),
};

const photoOptions = Object.keys(photoMap);

export default function ProfileScreen({ navigation }) {
  const { user } = useAuth();
  const { isDarkMode, toggleTheme, colors } = useTheme(); // ADD THIS

  const [displayName, setDisplayName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [firestoreData, setFirestoreData] = useState(null);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!user?.uid) return;

    setLoading(true);
    setError('');

    const result = await getUserProfile(user.uid);

    if (result.success) {
      const doc = result.user;
      setFirestoreData(doc);
      setDisplayName(doc.displayName || '');
      setProfileEmail(doc.email || '');

      const key = doc.profilePhoto;
      const resolved = key ? photoMap[key] : null;
      setSelectedPhoto(resolved || null);

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
      setError('Display name must be at least 3 characters.');
      setLoading(false);
      return;
    }

    if (firestoreData && displayName === firestoreData.displayName) {
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

  const handlePhotoSelect = async (photoName) => {
    const resolved = photoMap[photoName] || null;
    setSelectedPhoto(resolved);
    setShowPhotoPicker(false);

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
        <TouchableOpacity onPress={isEditing ? () => setShowPhotoPicker(true) : null} disabled={!isEditing}>
          <Image source={selectedPhoto} style={styles.avatar} />
        </TouchableOpacity>
      );
    }
    return (
      <TouchableOpacity onPress={isEditing ? () => setShowPhotoPicker(true) : null} disabled={!isEditing}>
        <Avatar.Icon size={100} icon="account-circle" style={[styles.defaultAvatar, { backgroundColor: colors.accent }]} />
      </TouchableOpacity>
    );
  };

  const styles = createStyles(colors, isDarkMode); 

  if (!firestoreData) {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Loading Coven identity...</Text>
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorTextTitle}>Profile Load Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.errorTip}>Tip: Publish the correct Firestore rule if this is a permissions error.</Text>
          <Button onPress={fetchProfile} mode="contained" style={{ marginTop: 20, backgroundColor: colors.accent }}>
            Try Again
          </Button>
        </View>
      );
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Button mode="text" onPress={() => navigation.navigate('Dashboard')} style={styles.backButton} labelStyle={styles.backButtonLabel}>
          ← Back to Dashboard
        </Button>

        {/* VAMPIRE MODE TOGGLE CARD - ADD THIS */}
        <Card style={styles.themeCard}>
          <View style={styles.themeToggleRow}>
            <View style={styles.themeTextContainer}>
              <PaperTitle style={styles.themeTitle}>
                {isDarkMode ? '🦇 Vampire Mode' : '☀️ Light Mode'}
              </PaperTitle>
              <Text style={styles.themeSubtitle}>
                {isDarkMode 
                  ? 'Embrace the darkness with blood-red accents' 
                  : 'Soft purples and gentle vibes'}
              </Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: '#d4a5ff', true: '#8b0a50' }}
              thumbColor={isDarkMode ? '#1a0a1f' : '#4a148c'}
              ios_backgroundColor="#d4a5ff"
            />
          </View>
        </Card>

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
            disabled 
            textColor={colors.text}
            theme={{ colors: { text: colors.text, placeholder: colors.textSecondary } }}
          />

          <TextInput
            label="Display Name"
            value={displayName}
            onChangeText={setDisplayName}
            mode="outlined"
            style={styles.input}
            disabled={!isEditing || loading}
            textColor={colors.text}
            theme={{ colors: { text: colors.text, placeholder: colors.textSecondary } }}
          />

          <Text style={styles.uidText}>UID: {user?.uid}</Text>

          {isEditing ? (
            <Button
              mode="contained"
              onPress={handleSave}
              loading={loading}
              disabled={loading || displayName.length < 3}
              style={styles.saveButton}
              buttonColor={colors.accent}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          ) : (
            <Button
              mode="outlined"
              onPress={() => setIsEditing(true)}
              style={styles.editButton}
              labelStyle={{
                fontWeight: 'bold',
                color: colors.accent,
              }}
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
              textColor={colors.textSecondary}
            >
              Cancel
            </Button>
          )}
        </Card>

        <Modal visible={showPhotoPicker} transparent animationType="fade" onRequestClose={() => setShowPhotoPicker(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.photoPickerModal}>
              <PaperTitle style={styles.modalTitle}>Choose Your Avatar</PaperTitle>

              <View style={styles.photoGrid}>
                {photoOptions.map((name) => (
                  <TouchableOpacity key={name} onPress={() => handlePhotoSelect(name)} style={styles.photoOption}>
                    <Image source={photoMap[name]} style={styles.photoOptionImage} />
                    <Text style={styles.photoLabel}>{name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Button mode="outlined" onPress={() => setShowPhotoPicker(false)} style={styles.cancelButton} textColor={colors.accent}>
                Cancel
              </Button>
            </View>
          </View>
        </Modal>
      </ScrollView>
      <Footer navigation={navigation} />
    </View>
  );
}

const createStyles = (colors, isDarkMode) => StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 100,
    backgroundColor: colors.background,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  backButtonLabel: {
    color: colors.accent,
  },
  themeCard: {
    padding: 20,
    borderRadius: 15,
    elevation: 3,
    backgroundColor: colors.cardBackground,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: colors.shadowOpacity,
    shadowRadius: 15,
    elevation: 8,
  },
  themeToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  themeTextContainer: {
    flex: 1,
    marginRight: 15,
  },
  themeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 5,
  },
  themeSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  profileCard: {
    padding: 20,
    borderRadius: 15,
    elevation: 3,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: colors.shadowOpacity,
    shadowRadius: 15,
    elevation: 8,
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
    borderWidth: 2,
    borderColor: colors.border,
  },
  defaultAvatar: {
    backgroundColor: colors.accent,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  input: {
  marginBottom: 15,
  backgroundColor: isDarkMode ? colors.cardBackground : '#ffffff',
  },

  uidText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginVertical: 10,
  },
  saveButton: {
    marginTop: 15,
    backgroundColor: colors.accent,
  },
  editButton: {
  marginTop: 15,
  borderWidth: 2,
  borderColor: colors.accent,
  borderRadius: 8,
  backgroundColor: 'transparent',
  },

  successText: {
    backgroundColor: isDarkMode ? '#1b4d1b' : '#e8f5e9',
    color: isDarkMode ? '#81c784' : '#388e3c',
    borderRadius: 4,
    padding: 5,
    marginBottom: 10,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 10,
    color: colors.text,
  },
  errorTextTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.accent,
    marginBottom: 10,
  },
  errorText: {
    color: colors.accent,
    textAlign: 'center',
    marginBottom: 10,
  },
  errorTip: {
    color: colors.textSecondary,
    textAlign: 'center',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPickerModal: {
    backgroundColor: colors.cardBackground,
    padding: 20,
    borderRadius: 15,
    width: '85%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 20,
    color: colors.text,
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
    alignItems: 'center',
  },
  photoOptionImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginBottom: 6,
    borderWidth: 2,
    borderColor: colors.border,
  },
  photoLabel: {
    fontSize: 12,
    color: colors.text,
    textAlign: 'center',
  },
  cancelButton: {
    marginTop: 10,
    borderColor: colors.accent,
  },
});