import React, { useState } from 'react';
import { View, Text, StyleSheet, ImageBackground, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { Button } from 'react-native-paper';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useTheme } from '../context/ThemeContext'; 

const screenWidth = Dimensions.get('window').width;
const IMAGE_ASPECT_RATIO = 1;
const containerWidth = screenWidth - 4;
const containerHeight = containerWidth / IMAGE_ASPECT_RATIO;

export default function VendingMachineMenu({ navigation }) {
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const { colors, isDarkMode } = useTheme();
  const DM_TEXT = '#e3d2f0ff';
  const styles = createStyles(colors, isDarkMode, DM_TEXT);

  const buttons = [
    { name: 'Events', top: 8, left: 15, width: 54, height: 12 },
    { name: 'Spells', top: 20, left: 15, width: 54, height: 12 },
    { name: 'CareBox', top: 34, left: 15, width: 54, height: 12 },
    { name: 'Alerts', top: 48, left: 15, width: 54, height: 12 },
    { name: 'Vouchers', top: 60, left: 15, width: 54, height: 12 },
  ];

  return (
    <View style={styles.screen}>
      <Header />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Button
          mode="text"
          onPress={() => navigation.navigate('Dashboard')}
          style={styles.backButton}
          labelStyle={isDarkMode ? { color: DM_TEXT } : {}}
        >
          ← Back to Dashboard
        </Button>

        <Text style={styles.title}>
          Mystical remedies for common woes
        </Text>

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

const createStyles = (colors, isDarkMode, DM_TEXT) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: isDarkMode ? colors.background : '#e3d2f0ff',
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: isDarkMode ? DM_TEXT : '#4a148c',
    textAlign: 'center',
    marginVertical: 16,
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
    backgroundColor: 'rgba(121, 119, 119, 0.3)',
  },
});
