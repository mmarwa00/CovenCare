import React from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

export default function TermsOfServiceScreen() {
  const { colors, isDarkMode } = useTheme();
  const styles = createStyles(colors, isDarkMode);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
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

const createStyles = (colors, isDarkMode) =>
  StyleSheet.create({
    container: {
      flex: 1,
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
