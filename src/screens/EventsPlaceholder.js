// src/screens/EventsPlaceholder.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Layout from '../components/Layout';
import { useTheme } from '../context/ThemeContext'; 

export default function EventsPlaceholder({ navigation }) {
  const { colors, isDarkMode } = useTheme(); const styles = createStyles(colors, isDarkMode);
  return (
    <Layout navigation={navigation} subtitle="Events">
      <View style={styles.container}>
        <Text style={styles.text}>Events screen coming soon…</Text>
      </View>
    </Layout>
  );
}

const createStyles = (colors, isDarkMode) => StyleSheet.create({

  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 18,
    color: '#4a148c',
  },
});
