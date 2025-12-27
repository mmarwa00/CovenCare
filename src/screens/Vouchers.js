import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Title } from 'react-native-paper';
import Layout from '../components/Layout';
import { useTheme } from '../context/ThemeContext';

const screenWidth = Dimensions.get('window').width;

const CARD_ASPECT_RATIO = 1;
const GAP = screenWidth * 0.04;
const HORIZONTAL_PADDING = screenWidth * 0.08;
const CARD_WIDTH = (screenWidth - (HORIZONTAL_PADDING * 2) - GAP) / 2;
const CARD_HEIGHT = CARD_WIDTH / CARD_ASPECT_RATIO;

export default function Vouchers({ navigation }) {
  const { isDarkMode } = useTheme();
  const DM_TEXT = '#e3d2f0ff';

  // STATIC REQUIRE MAP — the only method React Native accepts
  const voucherImages = {
    tea: {
      light: require('../../assets/Vouchers/tea.png'),
      dark: require('../../assets/Vouchers/tea2.png'),
    },
    coffee: {
      light: require('../../assets/Vouchers/coffee.png'),
      dark: require('../../assets/Vouchers/coffee2.png'),
    },
    face_mask: {
      light: require('../../assets/Vouchers/mask.png'),
      dark: require('../../assets/Vouchers/mask2.png'),
    },
    chips: {
      light: require('../../assets/Vouchers/chips.png'),
      dark: require('../../assets/Vouchers/chips.png'),
    },
    love: {
      light: require('../../assets/Vouchers/Love.png'),
      dark: require('../../assets/Vouchers/love2.png'),
    },
    chocolate: {
      light: require('../../assets/Vouchers/choco.png'),
      dark: require('../../assets/Vouchers/choco2.png'),
    },
  };

  // Build the options using the static map
  const voucherOptions = [
    { image: isDarkMode ? voucherImages.tea.dark : voucherImages.tea.light, type: 'tea' },
    { image: isDarkMode ? voucherImages.coffee.dark : voucherImages.coffee.light, type: 'coffee' },
    { image: isDarkMode ? voucherImages.face_mask.dark : voucherImages.face_mask.light, type: 'face_mask' },
    { image: isDarkMode ? voucherImages.chips.dark : voucherImages.chips.light, type: 'chips' },
    { image: isDarkMode ? voucherImages.love.dark : voucherImages.love.light, type: 'love' },
    { image: isDarkMode ? voucherImages.chocolate.dark : voucherImages.chocolate.light, type: 'chocolate' },
  ];

  return (
    <Layout navigation={navigation} subtitle="Choose a care voucher:">
      <Title style={[styles.title, isDarkMode && { color: DM_TEXT }]}>
        Choose a care voucher:
      </Title>

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
              onPress={() => navigation.navigate('SendVoucher', voucher)}
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
    marginBottom: 16,
    marginTop: 26,
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
