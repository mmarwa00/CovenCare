import React from 'react';
import { View, TouchableOpacity, Image, StyleSheet, Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function FooterNav({ navigation }) {
  const { colors, isDarkMode } = useTheme();

  return (
    <View style={[styles.footer, { backgroundColor: colors.cardBackground, borderTopColor: colors.border }]}>
      {/* Circles */}
      <TouchableOpacity
        style={styles.footerItem}
        onPress={() => navigation.navigate('CircleScreen')}
      >
        <Image
          source={
            isDarkMode
              ? require('../../assets/icons/circlesVamp.png')
              : require('../../assets/icons/circles.png')
          }
          style={styles.icon}
        />
        <Text style={[styles.label, { color: colors.text }]}>Circles</Text>
      </TouchableOpacity>

      {/* Log */}
      <TouchableOpacity
        style={styles.footerItem}
        onPress={() => navigation.navigate('CalendarScreen')}
      >
        <Image
          source={
            isDarkMode
              ? require('../../assets/icons/Log_vamp.png')
              : require('../../assets/icons/Log.png')
          }
          style={styles.icon}
        />
        <Text style={[styles.label, { color: colors.text }]}>Log</Text>
      </TouchableOpacity>

      {/* Potions */}
      <TouchableOpacity onPress={() => navigation.navigate('VendingMachineMenu')}>
        <Image
          source={
            isDarkMode
              ? require('../../assets/icons/PotionsVamp.png')
              : require('../../assets/icons/Potions1.png')
          }
          style={styles.icon}
        />
        <View style={styles.labelWrapper}>
          <Text style={styles.label}>Home</Text>
        </View>

      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    width: '100%',
    height: 100,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 10,
  },
  footerItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 45,
    height: 45,
    resizeMode: 'contain',
    marginBottom: 55,
    marginTop: 5,
  },
  label: {
  fontSize: 14,
  fontWeight: 'bold',
  position: 'absolute',
  bottom: 35,
  }
  

});
