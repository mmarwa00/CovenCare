import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Button, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

export default function SettingsScreen() {
  const navigation = useNavigation();

  const { colors, isDarkMode } = useTheme();
  const styles = createStyles(colors, isDarkMode);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background  }}>
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <Button
        mode="outlined"
        onPress={() => navigation.navigate('ProfileScreen')}
        style={styles.item}
        textColor={isDarkMode ? '#e3d2f0ff' : '#4a148c'}
      >
        Profile
      </Button>

      <Button
        mode="outlined"
        onPress={() => navigation.navigate('PrivacyPolicy')}
        style={styles.item}
        textColor={isDarkMode ? '#e3d2f0ff' : '#4a148c'}
      >
        Privacy Policy
      </Button>

      <Button
        mode="outlined"
        onPress={() => navigation.navigate('TermsOfService')}
        style={styles.item}
        textColor={isDarkMode ? '#e3d2f0ff' : '#4a148c'}
      >
        Terms of Service
      </Button>

      <Button
        mode="text"
        onPress={() => navigation.navigate('Dashboard')}
        style={styles.backButton}
        labelStyle={isDarkMode ? { color: '#e3d2f0ff' } : {}}
      >
        ← Back to Dashboard
      </Button>

      <Divider style={{ marginVertical: 20, backgroundColor: colors.border }} />

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

const createStyles = (colors, isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: isDarkMode ? '#e3d2f0ff' : colors.text,
    marginBottom: 20,
  },
  item: {
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: 10,
    backgroundColor: colors.cardBackground,
  },
  birthdayButton: {
    backgroundColor: colors.accent,
    borderWidth: 3,
    borderColor: colors.accent,
    marginTop: 10,
  },
});
