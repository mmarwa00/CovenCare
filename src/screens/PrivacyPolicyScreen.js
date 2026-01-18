import React from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

export default function PrivacyPolicyScreen() {
  const { colors, isDarkMode } = useTheme();
  const styles = createStyles(colors, isDarkMode);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
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
    </SafeAreaView>
  );
}

const createStyles = (colors, isDarkMode) =>
  StyleSheet.create({
    container: {
      padding: 20,
      backgroundColor: colors.background,
    },
    title: {
      fontSize: 22,
      fontWeight: 'bold',
      marginBottom: 15,
      color: isDarkMode ? colors.accent : colors.text,
    },
    text: {
      fontSize: 14,
      marginBottom: 12,
      lineHeight: 20,
      color: isDarkMode ? '#ffffff' : colors.textSecondary,
    },
  });
