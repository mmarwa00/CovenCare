import React, { useEffect, useRef } from 'react';
import { PaperProvider } from 'react-native-paper';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import { db, auth } from './src/config/firebaseConfig';

// Configure notification handler (outside component)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  const notificationListener = useRef();
  const responseListener = useRef();

  // Register for push notifications when user logs in
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        console.log('User logged in:', user.uid);
        registerForPushNotifications(user.uid);
      }
    });

    return unsubscribe;
  }, []);

  // Listen for notifications
useEffect(() => {
  notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification received:', notification);
  });

  responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('User tapped notification:', response);
  });

  return () => {
    // Check if listeners exist before removing
    if (notificationListener.current && typeof notificationListener.current.remove === 'function') {
      notificationListener.current.remove();
    }
    if (responseListener.current && typeof responseListener.current.remove === 'function') {
      responseListener.current.remove();
    }
  };
}, []);

  async function registerForPushNotifications(userId) {
    try {
      if (!Device.isDevice) {
        console.log('Must use physical device for Push Notifications');
        return;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Permission denied for notifications');
        return;
      }

      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      
      if (!projectId) {
        console.log('No EAS project ID found');
        return;
      }

      const token = await Notifications.getDevicePushTokenAsync({ projectId });
      console.log('FCM Token obtained:', token.data);

      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        fcmTokens: arrayUnion(token.data),
        updatedAt: new Date().toISOString(),
      });

      console.log('FCM token saved to Firestore!');

    } catch (error) {
      console.error('Error registering for push notifications:', error);
    }
  }

  return (
    <PaperProvider>
      <AuthProvider>
        <ThemeProvider>
          <AppNavigator />
        </ThemeProvider>
      </AuthProvider>
    </PaperProvider>
  );
}