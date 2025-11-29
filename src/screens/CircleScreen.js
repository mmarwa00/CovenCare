import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Title, Button } from 'react-native-paper';

export default function CircleScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Title style={styles.title}>Coven Circles 🫂</Title>
      <Text style={styles.subtitle}>
        (Placeholder for Week 3: Create, join, and manage your trusted support circle.)
      </Text>
      <Button mode="contained" onPress={() => navigation.navigate('Dashboard')} style={{marginTop: 20}}>
        Back to Dashboard
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4a148c',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
  }
});