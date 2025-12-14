import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Image, Text, Dimensions } from 'react-native';
import { Title } from 'react-native-paper';
import Layout from '../components/Layout';

const screenWidth = Dimensions.get('window').width;
const CARD_WIDTH = (screenWidth - 60) / 3;
const CARD_HEIGHT = CARD_WIDTH * 1.4;

export default function CareBoxScreen({ navigation }) {
  const [receivedItems, setReceivedItems] = useState([]);

  useEffect(() => {
    setReceivedItems([
      {
        id: 1,
        itemImage: require('../../assets/Vouchers/choco.png'),
        itemName: 'Chocolate',
        count: 2,
        senders: [
          { senderId: 5, senderName: 'Alice', sentAt: '2025-01-10', redeemed: false },
          { senderId: 8, senderName: 'Bob', sentAt: '2025-01-12', redeemed: false }
        ]
      },
      {
        id: 2,
        itemImage: require('../../assets/Vouchers/tea.png'),
        itemName: 'Tea',
        count: 1,
        senders: [
          { senderId: 3, senderName: 'Carol', sentAt: '2025-01-11', redeemed: false }
        ]
      }
    ]);
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('CareBoxDetails', { ...item })}
    >
      <Image source={item.itemImage} style={styles.cardImage} />
      <Text style={styles.cardCount}>{item.count}x</Text>
    </TouchableOpacity>
  );

  return (
    <Layout navigation={navigation} subtitle="Your Care Box">
      <View style={styles.scrollContainer}>
        <Title style={styles.title}>Your Care Box</Title>
        {receivedItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No items received yet</Text>
          </View>
        ) : (
          <FlatList
            data={receivedItems}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            numColumns={3}
            contentContainerStyle={styles.grid}
          />
        )}
      </View>
    </Layout>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#e3d2f0ff',
    paddingBottom: 100,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4a148c',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  grid: {
    padding: 10,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    margin: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImage: {
    width: CARD_WIDTH - 10,
    height: CARD_HEIGHT - 30,
    resizeMode: 'contain',
  },
  cardCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4a148c',
    marginTop: 5,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#4a148c',
  },
});
