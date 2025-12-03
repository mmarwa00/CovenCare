import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Layout from '../components/Layout';

export default function SendVoucher({ route, navigation }) {
  return (
    <Layout navigation={navigation} subtitle="Send Voucher">
      <View style={styles.container}>
        <Text style={styles.text}>SendVoucher screen placeholder</Text>
      </View>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 18,
    color: '#4a148c',
  },
});
