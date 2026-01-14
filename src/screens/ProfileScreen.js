import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Image, Modal, Switch, KeyboardAvoidingView, Platform, 
  TouchableWithoutFeedback, Keyboard, Alert 
} from 'react-native';
import { Button, TextInput, HelperText, ActivityIndicator, Avatar, Card, Title as PaperTitle } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext'; 
import { getUserProfile, updateUserProfile } from '../services/userService';
import { updateProfile } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import Header from '../components/Header';
import Footer from '../components/Footer';

// Keep your photoMap as is
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
  const { isDarkMode, toggleTheme, colors } = useTheme();

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
      setSelectedPhoto(key ? photoMap[key] : null);
    } else {
      setError(`Failed to load profile: ${result.error}`);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async () => {
    setError('');
    setSuccess('');

    // TOUGH LOVE VALIDATION: Stop the hang and tell the user!
    if (displayName.trim().length < 3) {
      setError('Display name must be at least 3 characters.');
      Alert.alert('Short Name', 'Your magical name must be at least 3 characters long! 🔮');
      return; 
    }

    setLoading(true);
    try {
      await updateUserProfile(user.uid, { displayName: displayName.trim() });
      await updateProfile(auth.currentUser, { displayName: displayName.trim() });
      
      setSuccess('Profile updated successfully! ✨');
      setIsEditing(false);
      await fetchProfile();
    } catch (e) {
      setError(e.message || 'Failed to save changes.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoSelect = async (photoName) => {
    setSelectedPhoto(photoMap[photoName]);
    setShowPhotoPicker(false);
    try {
      await updateUserProfile(user.uid, { profilePhoto: photoName });
      setSuccess('Avatar updated! 🎭');
    } catch (e) {
      setError('Failed to save avatar');
    }
  };

  const styles = createStyles(colors, isDarkMode);

  // Loading & Error States... (Keep your existing if(!firestoreData) logic here)

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <Header />
      
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back Button */}
          <Button mode="text" onPress={() => navigation.navigate('Dashboard')} style={styles.backButton} labelStyle={{color: colors.accent}}>
            ← Back to Dashboard
          </Button>

          {/* Theme Toggle */}
          <Card style={styles.themeCard}>
            <View style={styles.themeToggleRow}>
              <View style={styles.themeTextContainer}>
                <PaperTitle style={styles.themeTitle}>
                  {isDarkMode ? '🦇 Vampire Mode' : '☀️ Light Mode'}
                </PaperTitle>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={toggleTheme}
                trackColor={{ false: '#d4a5ff', true: '#8b0a50' }}
                thumbColor={isDarkMode ? '#1a0a1f' : '#4a148c'}
              />
            </View>
          </Card>

          <Card style={styles.profileCard}>
            <View style={styles.header}>
              <TouchableOpacity onPress={isEditing ? () => setShowPhotoPicker(true) : null} disabled={!isEditing}>
                {selectedPhoto ? (
                  <Image source={selectedPhoto} style={styles.avatar} />
                ) : (
                  <Avatar.Icon size={100} icon="account-circle" style={{ backgroundColor: colors.accent }} />
                )}
              </TouchableOpacity>
              <PaperTitle style={[styles.cardTitle, { color: colors.text }]}>Your Coven Profile</PaperTitle>
            </View>

            {success ? <HelperText type="info" style={{color: 'green'}}>{success}</HelperText> : null}
            {error ? <HelperText type="error">{error}</HelperText> : null}

            <TextInput 
              label="Email (Read Only)" 
              value={profileEmail} 
              mode="outlined" 
              style={styles.input} 
              editable={false} 
              textColor={isDarkMode ? '#ffffff' : '#222222'}
              theme={{
                colors: {
                  text: isDarkMode ? '#ffffff' : '#222222',
                  placeholder: isDarkMode ? '#ffffff' : '#666666',
                  primary: isDarkMode ? '#ffffff' : colors.accent,
                  onSurface: isDarkMode ? '#ffffff' : '#222222',
                  onSurfaceVariant: isDarkMode ? '#ffffff' : '#666666',
                  outline: isDarkMode ? '#ffffff' : '#999999',
                }
              }}            
            />

            <TextInput
              label="Display Name"
              value={displayName}
              onChangeText={setDisplayName}
              mode="outlined"
              style={styles.input}
              editable={isEditing && !loading} 
              textColor={isDarkMode ? '#ffffff' : '#222222'}
              error={displayName.length > 0 && displayName.length < 3}
              theme={{
                colors: {
                  text: isDarkMode ? '#ffffff' : '#222222',
                  placeholder: isDarkMode ? '#ffffff' : '#666666',
                  primary: isDarkMode ? '#ffffff' : colors.accent,
                  onSurface: isDarkMode ? '#ffffff' : '#222222',
                  onSurfaceVariant: isDarkMode ? '#ffffff' : '#666666',
                  outline: isDarkMode ? '#ffffff' : '#999999',
                }
              }}
            />

            {isEditing ? (
              <Button
                mode="contained"
                onPress={handleSave}
                loading={loading}
                style={styles.saveButton}
                buttonColor={colors.accent}
              >
                Save Changes
              </Button>
            ) : (
              <Button
                mode="outlined"
                onPress={() => setIsEditing(true)}
                style={styles.editButton}
                textColor={colors.accent}
              >
                Edit Profile
              </Button>
            )}

            {isEditing && (
              <Button mode="text" onPress={() => { setIsEditing(false); fetchProfile(); }} textColor={colors.textSecondary}>
                Cancel
              </Button>
            )}
          </Card>

          {/* Spacer for bottom so keyboard doesn't hide content */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </TouchableWithoutFeedback>

      <Footer navigation={navigation} />

      {/* Photo Picker Modal... (Keep your existing Modal code) */}
    </KeyboardAvoidingView>
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