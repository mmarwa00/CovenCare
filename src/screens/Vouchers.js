import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Title } from 'react-native-paper';
import Layout from '../components/Layout';
import Header from '../components/Header';
import Footer from '../components/Footer';

const voucherOptions = [
  { name: 'THE TEA', image: require('../../assets/Vouchers/tea.png'), color: '#a8d5ba' },
  { name: 'THE COFFEE', image: require('../../assets/Vouchers/coffee.png'), color: '#b0d4f1' },
  { name: 'THE MASK', image: require('../../assets/Vouchers/mask.png'), color: '#f7c1dc' },
  { name: 'THE CHIPS', image: require('../../assets/Vouchers/chips.png'), color: '#f9e29c' },
  { name: 'THE LOVE', image: require('../../assets/Vouchers/Love.png'), color: '#f7b98d' },
  { name: 'THE CHOCO', image: require('../../assets/Vouchers/choco.png'), color: '#d4a5ff' },
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
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  card: {
    width: 100,
    height: 120,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  cardImage: {
    width: 40,
    height: 40,
    marginBottom: 8,
    resizeMode: 'contain',
  },
  cardText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4a148c',
    textAlign: 'center',
  },
});
