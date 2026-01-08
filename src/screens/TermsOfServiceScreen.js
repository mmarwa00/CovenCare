import React from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';

export default function TermsOfServiceScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Terms of Service</Text>

      <Text style={styles.text}>
        This app is provided as part of a student project and is not a medical service.
      </Text>

      <Text style={styles.text}>
        The cycle predictions and calendar features are for informational purposes only
        and should not be considered medical advice.
      </Text>

      <Text style={styles.text}>
        Users are responsible for the data they enter into the app.
      </Text>

      <Text style={styles.text}>
        We do not guarantee accuracy of predictions or uninterrupted availability.
      </Text>

      <Text style={styles.text}>
        By using this app, you agree to these terms.
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
