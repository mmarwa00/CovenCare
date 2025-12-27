import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, Image, Text, Dimensions } from 'react-native';
import { Title } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { getSentVouchers } from '../services/voucherService';
import { useTheme } from '../context/ThemeContext'; 

const screenWidth = Dimensions.get('window').width;
const CARD_WIDTH = (screenWidth - 60) / 3;
const CARD_HEIGHT = CARD_WIDTH * 1.2;

const imagesByType = {
  chocolate: require('../../assets/Vouchers/choco.png'),
  coffee: require('../../assets/Vouchers/coffee.png'),
  face_mask: require('../../assets/Vouchers/mask.png'),
  tea: require('../../assets/Vouchers/tea.png'),
  chips: require('../../assets/Vouchers/chips.png'),
  love: require('../../assets/Vouchers/Love.png'),
};

const namesByType = {
  chocolate: 'Chocolate',
  coffee: 'Coffee',
  face_mask: 'Face Mask',
  tea: 'Tea',
  chips: 'Chips',
  love: 'Love',
};

export default function SentVouchersScreen({ navigation }) {
  const { user } = useAuth();
  const userId = user?.uid;
  const [sentItems, setSentItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const { colors, isDarkMode } = useTheme();
  const DM_TEXT = '#e3d2f0ff';

  const styles = createStyles(colors, isDarkMode, DM_TEXT);

  const fetchVouchers = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const result = await getSentVouchers(userId);

    if (result.success) {
      const grouped = {};
      const now = new Date();

      result.vouchers.forEach(voucher => {
        if (voucher.status === 'redeemed') {
          const sentDate = new Date(voucher.sentAt);
          const diffMs = now - sentDate;
          const diffDays = diffMs / (1000 * 60 * 60 * 24);
          if (diffDays > 1) return;
        }

        if (!grouped[voucher.type]) {
          grouped[voucher.type] = {
            id: voucher.type,
            itemImage: imagesByType[voucher.type],
            itemName: namesByType[voucher.type],
            type: voucher.type,
            count: 0,
            recipients: []
          };
        }
        grouped[voucher.type].count++;
        grouped[voucher.type].recipients.push({
          voucherId: voucher.id,
          recipientName: voucher.recipientName,
          sentAt: new Date(voucher.sentAt).toLocaleDateString(),
          code: voucher.code,
          redeemed: voucher.status === 'redeemed'
        });
      });

      setSentItems(Object.values(grouped));
    } else {
      console.error('Error fetching sent vouchers:', result.error);
    }
    setLoading(false);
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      fetchVouchers();
    }, [fetchVouchers])
  );

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image source={item.itemImage} style={styles.cardImage} />
      <Text style={styles.cardCount}>{item.count}x {item.itemName}</Text>

      {item.recipients.map((r) => (
        <View key={r.voucherId} style={styles.detailBlock}>
          <Text style={styles.detailText}>To: {r.recipientName}</Text>
          <Text style={styles.detailText}>Sent: {r.sentAt}</Text>
          <Text style={styles.detailText}>Code: {r.code}</Text>
          {r.redeemed && <Text style={styles.redeemed}>Redeemed ✔</Text>}
        </View>
      ))}
    </View>
  );

  return (
    <Layout navigation={navigation} subtitle="Your Sent Vouchers">
      <View style={styles.scrollContainer}>
        <Title style={styles.title}>Your Sent Vouchers</Title>

        {loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Loading...</Text>
          </View>
        ) : sentItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No vouchers sent yet</Text>
          </View>
        ) : (
          <FlatList
            data={sentItems}
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

const createStyles = (colors, isDarkMode, DM_TEXT) =>
  StyleSheet.create({
    scrollContainer: {
      flexGrow: 1,
      padding: 20,
      backgroundColor: isDarkMode ? colors.background : '#e3d2f0ff',
      paddingBottom: 50,
    },
    title: {
      fontSize: 22,
      fontWeight: 'bold',
      color: isDarkMode ? DM_TEXT : '#4a148c',
      textAlign: 'center',
      marginBottom: 20,
      marginTop: 10,
    },
    grid: {
      paddingHorizontal: 10,
    },
    card: {
      width: CARD_WIDTH,
      margin: 4,
      alignItems: 'center',
    },
    cardImage: {
      width: CARD_WIDTH - 8,
      height: CARD_HEIGHT - 20,
      resizeMode: 'contain',
    },
    cardCount: {
      fontSize: 14,
      fontWeight: 'bold',
      color: isDarkMode ? DM_TEXT : '#4a148c',
      marginTop: 2,
      textAlign: 'center',
    },
    detailBlock: {
      marginTop: 4,
      paddingTop: 2,
    },
    detailText: {
      fontSize: 14,
      color: isDarkMode ? DM_TEXT : '#4a148c',
      textAlign: 'center',
    },
    redeemed: {
      fontSize: 14,
      color: '#2e7d32',
      fontWeight: 'bold',
      marginTop: 2,
      textAlign: 'center',
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 18,
      color: isDarkMode ? DM_TEXT : '#4a148c',
    },
  });
