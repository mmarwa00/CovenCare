import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Layout from '../components/Layout';

export default function SendAlert({ route, navigation }) {
  return (
    <Layout navigation={navigation} subtitle="Send Alert">
      <View style={styles.container}>
        <Text style={styles.text}>SendAlert screen placeholder</Text>
      </View>
    </Layout>
  );
}

const styles = StyleSheet.create({
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