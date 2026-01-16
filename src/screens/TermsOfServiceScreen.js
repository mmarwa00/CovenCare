import React from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TermsOfServiceScreen() {
  return (
    <SafeAreaView style={styles.safeArea}> 
      
      {/* This fills the rest of the screen with white */}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: { 
    flex: 1, 
    backgroundColor: '#ffffff',
    padding: 20 
  },
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
    color: '#000000',
  },
});