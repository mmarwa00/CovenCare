import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import Constants from 'expo-constants';

// Configure how notifications are shown
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Register for push notifications
export const registerForPushNotifications = async (userId) => {
  try {
    // Check if physical device (push notifications don't work on simulator)
    if (!Device.isDevice) {
      console.log('Push notifications only work on physical devices');
      return null;
    }

    // Request permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Permission not granted for notifications');
      return null;
    }

    // Get Expo push token
    const token = (await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    })).data;

    console.log('✅ Push token:', token);

    // Save token to Firestore
    await updateDoc(doc(db, 'users', userId), {
      fcmTokens: arrayUnion(token)
    });

    return token;

  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
};