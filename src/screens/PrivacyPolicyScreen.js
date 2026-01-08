import React from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';

export default function PrivacyPolicyScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Privacy Policy</Text>

      <Text style={styles.text}>
        This application is a student project created for educational purposes.
      </Text>

      <Text style={styles.text}>
        We collect only the data necessary to provide the core features of the app,
        such as cycle tracking, circle membership, and in-app interactions.
      </Text>

      <Text style={styles.text}>
        Your personal data is stored securely using Firebase services.
        We do not sell or share your data with third parties.
      </Text>

      <Text style={styles.text}>
        You can control what information is visible to other users through privacy
        settings inside the app.
      </Text>

      <Text style={styles.text}>
        By using this app, you agree to this simplified privacy policy.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#4a148c',
  },
  text: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
});