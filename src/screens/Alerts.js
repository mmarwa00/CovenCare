import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Title } from 'react-native-paper';
import Layout from '../components/Layout';
import { useTheme } from '../context/ThemeContext'; 

const screenWidth = Dimensions.get('window').width;

const CARD_ASPECT_RATIO = 1;
const GAP = screenWidth * 0.04;
const HORIZONTAL_PADDING = screenWidth * 0.08;
const CARD_WIDTH = (screenWidth - (HORIZONTAL_PADDING * 2) - GAP) / 2;
const CARD_HEIGHT = CARD_WIDTH / CARD_ASPECT_RATIO;

const alertOptions = [
  { image: require('../../assets/Alerts/Heat.png'),      type: 'the_heat' }, 
  { image: require('../../assets/Alerts/Pad.png'),       type: 'pads' },   
  { image: require('../../assets/Alerts/tampon.png'),    type: 'tampon' },
  { image: require('../../assets/Alerts/painkiller.png'),type: 'painkiller'},
  { image: require('../../assets/Alerts/ear.png'),       type: 'the_ear' },
  { image: require('../../assets/Alerts/PMS.png'),       type: 'the_pms' }, 
];

export default function Alerts({ navigation }) {
  const { isDarkMode } = useTheme();
  const DM_TEXT = '#e3d2f0ff';

  return (
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
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4a148c',
    textAlign: 'center',
    marginBottom: 16,
    marginTop: 26, // moved down from header
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
