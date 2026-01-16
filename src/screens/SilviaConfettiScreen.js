import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SilviaConfettiScreen({ navigation, route }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      const returnTo = route?.params?.returnTo || "Dashboard";
      navigation.navigate(returnTo);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
    <View style={styles.container}>
      <ConfettiCannon
        count={200}
        origin={{ x: -10, y: 0 }}
        fadeOut={true}
        autoStart={true}
        explosionSpeed={450}
      />
      <Text style={styles.text}>THANK YOU!</Text>
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e3d2f0ff',   // ⭐ your lilac
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 48,
    fontWeight: '900',
    color: '#4a148c',
    textAlign: 'center',
  },
});
