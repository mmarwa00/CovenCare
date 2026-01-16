import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Title } from 'react-native-paper';
import Layout from '../components/Layout';
import { useTheme } from '../context/ThemeContext';

const screenWidth = Dimensions.get('window').width;

const CARD_ASPECT_RATIO = 1;
const GAP = screenWidth * 0.04;
const HORIZONTAL_PADDING = screenWidth * 0.08;
const CARD_WIDTH = (screenWidth - (HORIZONTAL_PADDING * 2) - GAP) / 2;
const CARD_HEIGHT = CARD_WIDTH / CARD_ASPECT_RATIO;

export default function Alerts({ navigation }) {
  const { isDarkMode } = useTheme();
  const DM_TEXT = '#e3d2f0ff';

  // STATIC REQUIRE MAP — React Native requires literal paths
  const alertImages = {
    heating_pad: {
      light: require('../../assets/Alerts/Heat.png'),
      dark: require('../../assets/Alerts/rest.png'), // gothic swap
    },
    pads: {
      light: require('../../assets/Alerts/Pad.png'),
      dark: require('../../assets/Alerts/Pad2.png'),
    },
    tampon: {
      light: require('../../assets/Alerts/tampon.png'),
      dark: require('../../assets/Alerts/tampon2.png'),
    },
    painkiller: {
      light: require('../../assets/Alerts/painkiller.png'),
      dark: require('../../assets/Alerts/garlic.png'), // gothic swap
    },
    the_ear: {
      light: require('../../assets/Alerts/ear.png'),
      dark: require('../../assets/Alerts/ear2.png'),
    },
    the_pms: {
      light: require('../../assets/Alerts/PMS.png'),
      dark: require('../../assets/Alerts/PMS.png'),
    },
  };

  // Build alert options with correct backend types
  const alertOptions = [
    { image: isDarkMode ? alertImages.heating_pad.dark : alertImages.heating_pad.light, type: 'heating_pad' },
    { image: isDarkMode ? alertImages.pads.dark : alertImages.pads.light, type: 'pads' },
    { image: isDarkMode ? alertImages.tampon.dark : alertImages.tampon.light, type: 'tampon' },
    { image: isDarkMode ? alertImages.painkiller.dark : alertImages.painkiller.light, type: 'painkiller' },
    { image: isDarkMode ? alertImages.the_ear.dark : alertImages.the_ear.light, type: 'the_ear' },
    { image: isDarkMode ? alertImages.the_pms.dark : alertImages.the_pms.light, type: 'the_pms' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
    <Layout navigation={navigation} subtitle="Send an emergency alert:">
      <Title style={[styles.title, isDarkMode && { color: DM_TEXT }]}>
        Send an emergency alert:
      </Title>

      <View style={styles.container}>
        <View style={[styles.grid, { maxWidth: CARD_WIDTH * 2 + GAP }]}>
          {alertOptions.map((alert, index) => (
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
              onPress={() => navigation.navigate('SendAlert', alert)}
            >
              <Image source={alert.image} style={styles.cardImage} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Layout>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
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
