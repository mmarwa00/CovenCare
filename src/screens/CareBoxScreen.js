import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Text,
  Dimensions
} from 'react-native';
import { Title, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { getReceivedVouchers } from '../services/voucherService';
import { useTheme } from '../context/ThemeContext'; 

const screenWidth = Dimensions.get('window').width;
const CARD_WIDTH = (screenWidth - 60) / 3;
const CARD_HEIGHT = CARD_WIDTH * 1.4;

// DARK/LIGHT ICON MAP
const voucherIcons = {
  chocolate: {
    light: require('../../assets/Vouchers/choco.png'),
    dark: require('../../assets/Vouchers/choco2.png'),
  },
  coffee: {
    light: require('../../assets/Vouchers/coffee.png'),
    dark: require('../../assets/Vouchers/coffee2.png'),
  },
  face_mask: {
    light: require('../../assets/Vouchers/mask.png'),
    dark: require('../../assets/Vouchers/mask2.png'),
  },
  tea: {
    light: require('../../assets/Vouchers/tea.png'),
    dark: require('../../assets/Vouchers/tea2.png'),
  },
  chips: {
    light: require('../../assets/Vouchers/chips.png'),
    dark: require('../../assets/Vouchers/fries.png'),
  },
  love: {
    light: require('../../assets/Vouchers/Love.png'),
    dark: require('../../assets/Vouchers/love2.png'),
  },
};

const getVoucherImage = (type, isDarkMode) =>
  isDarkMode ? voucherIcons[type].dark : voucherIcons[type].light;

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

  const { colors, isDarkMode } = useTheme();
  const DM_TEXT = '#e3d2f0ff';
  const styles = createStyles(colors, isDarkMode);

  const fetchVouchers = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    const result = await getReceivedVouchers(userId, 'unredeemed');

    if (result.success) {
      const grouped = {};

      result.vouchers.forEach(voucher => {
        if (!grouped[voucher.type]) {
          grouped[voucher.type] = {
            id: voucher.type,
            itemImage: getVoucherImage(voucher.type, isDarkMode),
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
  }, [userId, isDarkMode]);

  useFocusEffect(
    useCallback(() => {
      fetchVouchers();
    }, [fetchVouchers])
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('CareBoxDetails', item)}
    >
      <Image source={item.itemImage} style={styles.cardImage} />
      <Text style={styles.cardCount}>{item.count}x</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
    <Layout navigation={navigation} subtitle="Your Care Box">
      <View style={styles.scrollContainer}>

        {/* BACK BUTTON */}
        <Button
          mode="text"
          onPress={() => navigation.navigate('Dashboard')}
          style={styles.backButton}
          labelStyle={isDarkMode ? { color: DM_TEXT } : {}}
        >
          ← Back to Dashboard
        </Button>

        {/* TITLE */}
        <Title style={styles.title}>Your Care Box</Title>

        {/* CONTENT */}
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
            columnWrapperStyle={{ justifyContent: 'center' }}
          />
        )}
      </View>
    </Layout>
    </SafeAreaView>
  );
}

const createStyles = (colors, isDarkMode) => StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: colors.background,
    paddingBottom: 100,
  },

  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 10,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 10,
  },

  grid: {
    paddingVertical: 10,
    alignItems: 'center',
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
    color: colors.text,
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
    color: colors.textSecondary,
  },
});
