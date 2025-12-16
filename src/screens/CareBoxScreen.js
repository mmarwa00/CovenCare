import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Image, Text, Dimensions } from 'react-native';
import { Title } from 'react-native-paper';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { getReceivedVouchers } from '../services/voucherService';

const screenWidth = Dimensions.get('window').width;
const CARD_WIDTH = (screenWidth - 60) / 3;
const CARD_HEIGHT = CARD_WIDTH * 1.4;

// Map voucher types to images
const getVoucherImage = (type) => {
  const images = {
    chocolate: require('../../assets/Vouchers/choco.png'),
    coffee: require('../../assets/Vouchers/coffee.png'),
    face_mask: require('../../assets/Vouchers/mask.png'),
    tea: require('../../assets/Vouchers/tea.png'),
    chips: require('../../assets/Vouchers/chips.png'),
    love: require('../../assets/Vouchers/Love.png'),
  };
  return images[type] || require('../../assets/Vouchers/choco.png');
};

// Map voucher types to display names
const getVoucherName = (type) => {
  const names = {
    chocolate: 'Chocolate',
    coffee: 'Coffee',
    face_mask: 'Face Mask',
    tea: 'Tea',
    chips: 'Chips',
    love: 'Love',
  };
  return names[type] || type;
};

export default function CareBoxScreen({ navigation }) {
  const { user } = useAuth();
  const userId = user?.uid;
  const [receivedItems, setReceivedItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVouchers = async () => {
      if (!userId) return;
      setLoading(true);
      const result = await getReceivedVouchers(userId, 'unredeemed');
      
      if (result.success) {
        // Group vouchers by type
        const grouped = {};
        result.vouchers.forEach(voucher => {
          if (!grouped[voucher.type]) {
            grouped[voucher.type] = {
              id: voucher.type,
              itemImage: getVoucherImage(voucher.type),
              itemName: getVoucherName(voucher.type),
              type: voucher.type,
              count: 0,
              senders: []
            };
          }
          grouped[voucher.type].count++;
          grouped[voucher.type].senders.push({
            voucherId: voucher.id,
            senderId: voucher.senderId,
            senderName: voucher.senderName,
            sentAt: new Date(voucher.sentAt).toLocaleDateString(),
            code: voucher.code,
            redeemed: voucher.status === 'redeemed'
          });
        });
        
        setReceivedItems(Object.values(grouped));
      } else {
        console.error('Error fetching vouchers:', result.error);
      }
      setLoading(false);
    };

    fetchVouchers();
  }, [userId]);

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
        {loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Loading...</Text>
          </View>
        ) : receivedItems.length === 0 ? (
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
