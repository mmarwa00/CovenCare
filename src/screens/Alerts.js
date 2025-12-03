// src/screens/Alerts.js
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Title } from 'react-native-paper';
import Layout from '../components/Layout';
import Header from '../components/Header';
import Footer from '../components/Footer';

const alertOptions = [
  { image: require('../../assets/Alerts/Heat.png') },
  { image: require('../../assets/Alerts/Pad.png') },
  { image: require('../../assets/Alerts/tampon.png') },
  { image: require('../../assets/Alerts/painkiller.png') },
  { image: require('../../assets/Alerts/ear.png') },
  { image: require('../../assets/Alerts/PMS.png') },
];

export default function Alerts({ navigation }) {
  return (
    <Layout navigation={navigation} subtitle="Send an emergency alert:">
      <Title style={styles.title}>Send an emergency alert:</Title>

      <View style={styles.grid}>
        {alertOptions.map((alert, index) => (
          <TouchableOpacity
            key={index}
            style={styles.card} // wrapper only for positioning; no color, no name
            onPress={() => navigation.navigate('SendAlert', { alert })}
          >
            <Image source={alert.image} style={styles.cardImage} />
          </TouchableOpacity>
        ))}
      </View>
    </Layout>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4a148c',
    textAlign: 'center',
    marginBottom: 10,
    marginTop: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  card: {
    width: 140,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 3,
  },
  cardImage: {
    width: 140,
    height: 140,
    marginBottom: 3,
    resizeMode: 'contain',
  },
});

