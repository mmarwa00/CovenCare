import React, { useState } from 'react';
import { View, StyleSheet, ImageBackground, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { Button } from 'react-native-paper';
import Header from '../components/Header';
import Footer from '../components/Footer';

const screenWidth = Dimensions.get('window').width;
const IMAGE_ASPECT_RATIO = 1; // Your image appears to be square
const containerWidth = screenWidth - 4;
const containerHeight = containerWidth / IMAGE_ASPECT_RATIO;

export default function VendingMachineMenu({ navigation }) {
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  // These percentages are based on the ACTUAL image content
  // Adjust these by measuring your PNG file directly
  const buttons = [
    { name: 'Events', top: 10, left: 10, width: 62, height: 12 },
    { name: 'Stash', top: 25, left: 10, width: 62, height: 12 },
    { name: 'Alerts', top: 41, left: 10, width: 62, height: 12 },
    { name: 'Vouchers', top: 57, left: 10, width: 62, height: 12 },
  ];

  return (
    <View style={styles.screen}>
      <Header />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Button
          mode="text"
          onPress={() => navigation.navigate('Dashboard')}
          style={styles.backButton}
        >
          ← Back to Dashboard
        </Button>

        <View 
          style={[styles.machineContainer, { width: containerWidth, height: containerHeight }]}
          onLayout={(event) => {
            const { width, height } = event.nativeEvent.layout;
            setImageSize({ width, height });
          }}
        >
          <ImageBackground
            source={require('../../assets/icons/menu.png')}
            style={styles.machine}
            resizeMode="contain"
          >
            {imageSize.width > 0 && buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.slot, { 
                  top: `${button.top}%`, 
                  left: `${button.left}%`, 
                  width: `${button.width}%`, 
                  height: `${button.height}%` 
                }]}
                onPress={() => navigation.navigate(button.name)}
              />
            ))}
          </ImageBackground>
        </View>
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
    paddingHorizontal: 2,
    paddingTop: 0,
    alignItems: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 5,
  },
  machineContainer: {
    alignSelf: 'center',
  },
  machine: {
    width: '100%',
    height: '100%',
  },
  slot: {
    position: 'absolute',
    backgroundColor: 'rgba(21, 19, 19, 0.3)',
  },
});