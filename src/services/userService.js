import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

export const getUserProfile = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    return { 
      success: true, 
      user: { id: userDoc.id, ...userDoc.data() }
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return { success: false, error: error.message };
  }
};

export const updateUserProfile = async (userId, updates) => {
  try {
    if (updates.displayName) {
      if (updates.displayName.length < 3 || updates.displayName.length > 30) {
        throw new Error('Display name must be 3-30 characters');
      }
    }

    await updateDoc(doc(db, 'users', userId), {
      ...updates,
      updatedAt: new Date()
    });

    console.log('Profile updated');
    return { success: true };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { success: false, error: error.message };
  }
};