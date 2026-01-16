import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Button, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <Button
        mode="outlined"
        onPress={() => navigation.navigate('ProfileScreen')}
        style={styles.item}
        textColor="#4a148c"
      >
        Profile
      </Button>

      <Button
        mode="outlined"
        onPress={() => {}}
        style={styles.item}
        textColor="#4a148c"
      >
        Notifications
      </Button>

      <Button
        mode="outlined"
        onPress={() => navigation.navigate('PrivacyPolicy')}
        style={styles.item}
        textColor="#4a148c"
      >
        Privacy Policy
      </Button>

      <Button
        mode="outlined"
        onPress={() => navigation.navigate('TermsOfService')}
        style={styles.item}
        textColor="#4a148c"
      >
        Terms of Service
      </Button>

      <Divider style={{ marginVertical: 20 }} />

      {/* Birthday Button ALWAYS visible for testing */}
      <Button
        mode="contained"
        onPress={() => navigation.navigate('SilviaBirthdayScreen')}
        style={styles.birthdayButton}
        textColor="#e3d2f0ff"
      >
        🎂 Celebrate Silvia's Birthday!
      </Button>
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4a148c',
    marginBottom: 20,
  },
  item: {
    borderWidth: 2,
    borderColor: '#4a148c',
    marginBottom: 10,
  },
  birthdayButton: {
    backgroundColor: '#4a148c',
    borderWidth: 3,
    borderColor: '#4a148c',
    marginTop: 10,
  },
});
