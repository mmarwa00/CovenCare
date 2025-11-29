import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { Button, TextInput, HelperText, ActivityIndicator, Avatar, Card, Title as PaperTitle } from 'react-native-paper'; 
import { useAuth } from '../context/AuthContext';
import { getUserProfile, updateUserProfile } from '../services/userService'; // Your data services
import { updateProfile } from 'firebase/auth'; // Needed to update Firebase Auth profile object
import { auth } from '../config/firebaseConfig'; // Get the auth instance

export default function ProfileScreen({ navigation }) {
  const { user } = useAuth();
  
  // Local state for profile data
  const [displayName, setDisplayName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(user?.photoURL || null); // New state for photo URL
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [firestoreData, setFirestoreData] = useState(null);

  // --- 1. DATA FETCHING ---
  const fetchProfile = useCallback(async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    setError('');
    
    // 1. Fetch data from Firestore
    const result = await getUserProfile(user.uid); 
    
    if (result.success) {
      setFirestoreData(result.user);
      setDisplayName(result.user.displayName || '');
      setProfileEmail(result.user.email || '');
      // Update photo URL from the Firebase Auth object
      setProfilePhotoUrl(auth.currentUser?.photoURL || null); 
      setSuccess('');
    } else {
      setError(`Failed to load profile: ${result.error}`);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);


  // --- 2. DATA SAVING ---
  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    let needsFirestoreUpdate = false;
    let needsAuthUpdate = false;

    // A. Check for Display Name Change (Firestore and Auth)
    if (displayName !== firestoreData.displayName) {
        if (displayName.length < 3) {
            setError("Display name must be at least 3 characters.");
            setLoading(false);
            return;
        }
        needsFirestoreUpdate = true;
        needsAuthUpdate = true; // Update Firebase Auth profile as well
    }

    // B. Check for Photo URL Change (Auth only in this simplified version)
    if (profilePhotoUrl !== auth.currentUser?.photoURL) {
        needsAuthUpdate = true;
    }

    if (!needsFirestoreUpdate && !needsAuthUpdate) {
        setSuccess('No changes detected.');
        setLoading(false);
        setIsEditing(false);
        return;
    }

    try {
        // 1. Update Firestore (for displayName)
        if (needsFirestoreUpdate) {
            await updateUserProfile(user.uid, { displayName });
        }

        // 2. Update Firebase Auth (for display name and photo URL)
        if (needsAuthUpdate) {
            await updateProfile(auth.currentUser, { 
                displayName: displayName,
                photoURL: profilePhotoUrl // Set the new URL
            });
            // Update the local user state to reflect the Auth change immediately
            user.displayName = displayName;
            user.photoURL = profilePhotoUrl;
        }

        setSuccess('Profile updated successfully!');
        setIsEditing(false);
        await fetchProfile(); // Re-fetch all data to ensure sync
    } catch (e) {
        setError(e.message || 'Failed to save changes.');
    }
    setLoading(false);
  };
  
  // --- Simplified Photo Selection (In a real app, this uses an ImagePicker) ---
  const handlePhotoChange = () => {
      // In a real Expo app, you would use: ImagePicker.launchImageLibraryAsync()
      // For testing, we simulate setting a placeholder URL.
      if (!isEditing) return;

      const newUrl = prompt(
          "Enter new Profile Picture URL (e.g., https://placehold.co/100x100):"
      );

      if (newUrl) {
          setProfilePhotoUrl(newUrl);
          setSuccess("Photo URL updated locally. Press 'Save Changes' to finalize.");
      }
  };

  // --- Render Logic ---
  const renderAvatar = () => {
    if (profilePhotoUrl) {
        return (
            <Avatar.Image 
                size={80} 
                source={{ uri: profilePhotoUrl }} 
                style={{ backgroundColor: '#ccc' }} 
            />
        );
    }
    return (
        <Avatar.Icon 
            size={80} 
            icon="account-circle" 
            style={{ backgroundColor: '#6a1b9a' }} 
        />
    );
  };

  if (!firestoreData) {
      // Use the existing loading/error handlers
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
                    <Text style={styles.errorText}>
                        {error} 
                    </Text>
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
        {/* Back Button */}
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
            
            {/* Photo Change Button */}
            <Button 
                mode="text" 
                onPress={handlePhotoChange} 
                disabled={!isEditing}
                style={{ marginTop: 5 }}
            >
                {isEditing ? 'Change Photo URL' : 'View Profile'}
            </Button>

            <PaperTitle style={styles.cardTitle}>Your Coven Profile</PaperTitle>
        </View>

        {/* Status Messages */}
        {success ? (
            <HelperText type="info" visible={!!success} style={styles.successText}>
                {success}
            </HelperText>
        ) : null}
        {error && <HelperText type="error" visible={!!error}>{error}</HelperText>}
        
        {/* Email Display (Non-editable) */}
        <TextInput
          label="Email (Read Only)"
          value={profileEmail}
          mode="outlined"
          style={styles.input}
          disabled={true} 
        />
        
        {/* Display Name Input (Editable) */}
        <TextInput
          label="Display Name"
          value={displayName}
          onChangeText={setDisplayName}
          mode="outlined"
          style={styles.input}
          disabled={!isEditing || loading}
        />
        
        <Text style={styles.uidText}>UID: {user?.uid}</Text>

        {/* Buttons */}
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
                onPress={() => { setIsEditing(false); fetchProfile(); }} 
                disabled={loading}
                style={{ marginTop: 10 }}
            >
                Cancel
            </Button>
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4a148c',
  },
  errorTextTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 5,
  },
  errorText: {
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorTip: {
    fontSize: 12,
    color: '#777',
    marginTop: 15,
    paddingHorizontal: 20,
    textAlign: 'center',
  },
  profileCard: {
    width: '100%',
    padding: 20,
    borderRadius: 12,
    elevation: 6,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4a148c',
    marginTop: 10,
  },
  uidText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 15,
  },
  input: {
    marginBottom: 15,
  },
  saveButton: {
    marginTop: 10,
    backgroundColor: '#388e3c', // Green for success/save
  },
  editButton: {
    marginTop: 10,
    borderColor: '#6a1b9a',
  },
  successText: {
    backgroundColor: '#e8f5e9',
    borderRadius: 4,
    marginBottom: 10,
  },
  backButton: {
      alignSelf: 'flex-start',
      marginBottom: 15,
      // Ensure it doesn't take up full width
  },
  backButtonLabel: {
      color: '#6a1b9a',
      fontSize: 14,
      fontWeight: '600'
  }
});