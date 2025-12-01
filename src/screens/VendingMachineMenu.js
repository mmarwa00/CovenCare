import React from 'react';
import { View, StyleSheet, Image, Dimensions, ScrollView } from 'react-native';
import { Button } from 'react-native-paper';
import Header from '../components/Header';
import Footer from '../components/Footer';

const screenWidth = Dimensions.get('window').width;

export default function VendingMachineMenu({ navigation }) {
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

        <Image
          source={require('../../assets/icons/menu.png')}
          style={styles.machine}
          resizeMode="contain"
        />
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

  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 3,
  },
  machine: {
    width: screenWidth - 2,
    alignSelf: 'center',
    marginTop: 0,
  },
});
