import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Title } from 'react-native-paper';
import Layout from '../components/Layout';
import Header from '../components/Header';
import Footer from '../components/Footer';

const voucherOptions = [
  { image: require('../../assets/Vouchers/tea.png') },
  { image: require('../../assets/Vouchers/coffee.png') },
  { image: require('../../assets/Vouchers/mask.png') },
  { image: require('../../assets/Vouchers/chips.png') },
  { image: require('../../assets/Vouchers/Love.png') },
  { image: require('../../assets/Vouchers/choco.png') },
];

export default function Vouchers({ navigation }) {
  return (
    <Layout navigation={navigation} subtitle="Choose a care voucher:">
      <Title style={styles.title}>Choose a care voucher:</Title>

      <View style={styles.grid}>
        {voucherOptions.map((voucher) => (
          <TouchableOpacity
            key={voucher.name}
            style={[styles.card, { backgroundColor: voucher.color }]}
            onPress={() => navigation.navigate('SendVoucher', { voucher })}
          >
            <Image source={voucher.image} style={styles.cardImage} />
            <Text style={styles.cardText}>{voucher.name}</Text>
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
  cardText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4a148c',
    textAlign: 'center',
  },
});
