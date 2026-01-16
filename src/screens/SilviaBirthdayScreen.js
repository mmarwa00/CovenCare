import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Header from '../components/Header';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SilviaBirthdayScreen() {
  const navigation = useNavigation();

  const items = [
    { label: 'Cake', image: require('../../assets/Bday/cake.png') },   // FIXED
    { label: 'Cheers', image: require('../../assets/Bday/cheers.png') },
    { label: 'Gift', image: require('../../assets/Bday/gift.png') },
    { label: 'Tulips', image: require('../../assets/Bday/tulips.png') },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
    <View style={{ flex: 1, backgroundColor: '#e3d2f0ff' }}>
      <Header />

      <ScrollView style={styles.container}>
        <Text style={styles.mainTitle}>🎂 Happy Birthday Silvia!</Text>
        <Text style={styles.subtitle}>Choose what to send to Silvia</Text>

        <View style={styles.grid}>
          {items.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.card}
              onPress={() => navigation.navigate('SendSilvia', item)}
            >
              <Image source={item.image} style={styles.image} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 20,
    backgroundColor: '#e3d2f0ff',
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4a148c',
    marginBottom: 5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#4a148c',
    marginBottom: 25,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: 'transparent',
    paddingVertical: 15,
    paddingHorizontal: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  image: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
  },
});
