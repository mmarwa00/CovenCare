import React from 'react';
import { View, StyleSheet, ImageBackground, Dimensions, ScrollView, TouchableOpacity, Text } from 'react-native';
import Header from '../components/Header';
import Footer from '../components/Footer';

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
          <TouchableOpacity
            style={[styles.slot, { top: '6%', left: '6%', width: '40%', height: '8%' }]}
            onPress={() => navigation.navigate('Vouchers')}
          />
          <TouchableOpacity
            style={[styles.slot, { top: '16%', left: '6%', width: '40%', height: '8%' }]}
            onPress={() => navigation.navigate('Alerts')}
          />
          <TouchableOpacity
            style={[styles.slot, { top: '26%', left: '6%', width: '40%', height: '8%' }]}
            onPress={() => navigation.navigate('SendVoucher')}
          />
          <TouchableOpacity
            style={[styles.slot, { top: '36%', left: '6%', width: '40%', height: '8%' }]}
            onPress={() => navigation.navigate('ProfileScreen')}
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
    backgroundColor: 'rgba(0,0,0,0)',
  },
});
