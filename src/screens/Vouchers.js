import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Title } from 'react-native-paper';
import Layout from '../components/Layout';

const screenWidth = Dimensions.get('window').width;

// Calculate card size based on screen dimensions
const CARD_ASPECT_RATIO = 1; // square cards
const GAP = screenWidth * 0.04; // 4% of screen width for gaps
const HORIZONTAL_PADDING = screenWidth * 0.08; // 8% padding on sides
const CARD_WIDTH = (screenWidth - (HORIZONTAL_PADDING * 2) - GAP) / 2; // 2 columns
const CARD_HEIGHT = CARD_WIDTH / CARD_ASPECT_RATIO;

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

      <View style={styles.container}>
        <View style={[styles.grid, { maxWidth: CARD_WIDTH * 2 + GAP }]}>
          {voucherOptions.map((voucher, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.card,
                {
                  width: CARD_WIDTH,
                  height: CARD_HEIGHT,
                  marginRight: index % 2 === 0 ? GAP : 0,
                  marginBottom: index < 4 ? GAP : 0,
                }
              ]}
              onPress={() => navigation.navigate('SendVoucher', { voucher })}
            >
              <Image source={voucher.image} style={styles.cardImage} />
            </TouchableOpacity>
          ))}
        </View>
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
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  card: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
});