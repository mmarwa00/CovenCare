import React from 'react';
import { View, StyleSheet, ImageBackground, Dimensions, ScrollView, TouchableOpacity, Text } from 'react-native';
import Header from '../components/Header';
import Footer from '../components/Footer';
// Alignment and size controls
const OFFSET_X = 2;      // pixels to the right
const OFFSET_Y = 32;      // pixels down
const SLOT_WIDTH = 226;  // button width in px
const SLOT_HEIGHT = 40;  // button height in px

const screenWidth = Dimensions.get('window').width;

export default function VendingMachineMenu({ navigation }) {
  return (
    <View style={styles.screen}>
      <Header />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ImageBackground
          source={require('../../assets/icons/menu.png')}
          style={styles.machine}
          resizeMode="contain"
        >
    
          {/* Window 1 → Events */}
          <TouchableOpacity
            style={[styles.slot, { top: '16%', left: '8%', width: SLOT_WIDTH, height: SLOT_HEIGHT, transform: [{ translateX: OFFSET_X }, { translateY: OFFSET_Y }] }]}
            onPress={() => navigation.navigate('Events')}
          />

          {/* Window 2 → Stash */}
          <TouchableOpacity
            style={[styles.slot, { top: '27%', left: '8%', width: SLOT_WIDTH, height: SLOT_HEIGHT, transform: [{ translateX: OFFSET_X }, { translateY: OFFSET_Y }] }]}
            onPress={() => navigation.navigate('Stash')}
          />

          {/* Window 3 → Alerts */}
          <TouchableOpacity
            style={[styles.slot, { top: '38%', left: '8%', width: SLOT_WIDTH, height: SLOT_HEIGHT, transform: [{ translateX: OFFSET_X }, { translateY: OFFSET_Y }] }]}
            onPress={() => navigation.navigate('Alerts')}
          />

          {/* Window 4 → Vouchers */}
          <TouchableOpacity
            style={[styles.slot, { top: '50%', left: '8%', width: SLOT_WIDTH, height: SLOT_HEIGHT, transform: [{ translateX: OFFSET_X }, { translateY: OFFSET_Y }] }]}
            onPress={() => navigation.navigate('Vouchers')}
          />



        </ImageBackground>
      </ScrollView>

      <Footer navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#e3d2f0ff',
  },
  scrollContent: {
    paddingHorizontal: 1,
    paddingTop: 0,
  },
  machine: {
    width: screenWidth - 2,
    height: 500,
    alignSelf: 'center',
    marginTop: 0,
  },
  slot: {
    position: 'absolute',
    backgroundColor: 'rgba(4, 0, 6, 0.3)',
  },
});
