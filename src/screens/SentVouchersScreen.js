import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, Image, Text, Dimensions, TouchableOpacity, RefreshControl } from 'react-native';
import { Button, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { getSentVouchers } from '../services/voucherService';
import { useTheme } from '../context/ThemeContext'; 

const screenWidth = Dimensions.get('window').width;
const CARD_WIDTH = (screenWidth - 60) / 3;
const CARD_HEIGHT = CARD_WIDTH * 1.2;

const namesByType = {
  chocolate: 'Chocolate',
  coffee: 'Coffee',
  face_mask: 'Face Mask',
  tea: 'Tea',
  chips: 'Chips',
  love: 'Love',
};

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

export default function SentVouchersScreen({ navigation }) {
  const { user } = useAuth();
  const userId = user?.uid;
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'redeemed'
  const [activeVouchers, setActiveVouchers] = useState([]);
  const [redeemedVouchers, setRedeemedVouchers] = useState([]);
  const [activeVoucherCount, setActiveVoucherCount] = useState(0);
  const [redeemedVoucherCount, setRedeemedVoucherCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { colors, isDarkMode } = useTheme();
  const DM_TEXT = '#e3d2f0ff';

  const styles = createStyles(colors, isDarkMode, DM_TEXT);

  const fetchVouchers = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const result = await getSentVouchers(userId);

    if (result.success) {
      const activeGrouped = {};
      const redeemedGrouped = {};
      const now = new Date();
      let activeCount = 0;
      let redeemedCount = 0;

      result.vouchers.forEach(voucher => {
        // Filter redeemed vouchers older than 1 day
        if (voucher.status === 'redeemed') {
          const sentDate = new Date(voucher.sentAt);
          const diffMs = now - sentDate;
          const diffDays = diffMs / (1000 * 60 * 60 * 24);
          if (diffDays > 1) return; // Skip vouchers redeemed more than 1 day ago
          redeemedCount++;
        } else {
          activeCount++;
        }

        const grouped = voucher.status === 'redeemed' ? redeemedGrouped : activeGrouped;

        if (!grouped[voucher.type]) {
          grouped[voucher.type] = {
            id: voucher.type,
            itemImage: getVoucherImage(voucher.type, isDarkMode),
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
          status: voucher.status
        });
      });

      setActiveVouchers(Object.values(activeGrouped));
      setRedeemedVouchers(Object.values(redeemedGrouped));
      setActiveVoucherCount(activeCount);
      setRedeemedVoucherCount(redeemedCount);
      
      console.log('Active vouchers count:', activeCount);
      console.log('Redeemed vouchers count (last 24h):', redeemedCount);
      console.log('Total vouchers processed:', activeCount + redeemedCount);
    } else {
      console.error('Error fetching sent vouchers:', result.error);
    }
    setLoading(false);
    setRefreshing(false);
  }, [userId, isDarkMode]);

  useFocusEffect(
    useCallback(() => {
      fetchVouchers();
    }, [fetchVouchers])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchVouchers();
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image source={item.itemImage} style={styles.cardImage} />
      <Text style={styles.cardCount}>{item.count}x {item.itemName}</Text>

      {item.recipients.map((r) => (
        <View key={r.voucherId} style={styles.detailBlock}>
          <Text style={styles.detailText}>To: {r.recipientName}</Text>
          <Text style={styles.detailText}>Sent: {r.sentAt}</Text>
          {r.status === 'redeemed' && <Text style={styles.redeemed}>Redeemed ✔</Text>}
        </View>
      ))}
    </View>
  );

  const currentVouchers = activeTab === 'active' ? activeVouchers : redeemedVouchers;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
      <Layout navigation={navigation} subtitle="Your Sent Vouchers">
        <View style={{ width: '100%', alignItems: 'flex-start' }}>
          <Button
            mode="text"
            onPress={() => navigation.navigate('Dashboard')}
            style={styles.backButton}
            labelStyle={isDarkMode ? { color: DM_TEXT } : { color: '#4a148c' }}
          >
            ← Back to Dashboard
          </Button>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'active' && styles.activeTab
            ]}
            onPress={() => setActiveTab('active')}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'active' && styles.activeTabText
            ]}>
              📤 Active ({activeVoucherCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'redeemed' && styles.activeTab
            ]}
            onPress={() => setActiveTab('redeemed')}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'redeemed' && styles.activeTabText
            ]}>
              Redeemed ({redeemedVoucherCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator animating={true} color={isDarkMode ? DM_TEXT : '#4a148c'} />
          </View>
        ) : currentVouchers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {activeTab === 'active' 
                ? 'No active vouchers sent yet' 
                : 'No recently redeemed vouchers'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={currentVouchers}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            numColumns={3}
            contentContainerStyle={[styles.grid, { paddingBottom: 100 }]}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh}
                tintColor={isDarkMode ? DM_TEXT : '#4a148c'}
              />
            }
          />
        )}
      </Layout>
    </SafeAreaView>
  );
}

const createStyles = (colors, isDarkMode, DM_TEXT) =>
  StyleSheet.create({
    backButton: {
      marginBottom: 10,
    },
    
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },

    tab: {
      flex: 1,
      paddingVertical: 14,
      alignItems: 'center',
      backgroundColor: colors.cardBackground,
    },

    activeTab: {
      backgroundColor: isDarkMode ? '#2a1a2e' : '#d4b5e8',
      borderBottomWidth: 3,
      borderBottomColor: colors.accent,
    },

    tabText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '600',
    },

    activeTabText: {
      color: isDarkMode ? DM_TEXT : '#4a148c',
      fontWeight: 'bold',
    },

    grid: {
      paddingHorizontal: 0,
      paddingVertical: 10,
      alignItems: 'center',
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
      paddingVertical: 60,
    },
    
    emptyText: {
      fontSize: 18,
      color: isDarkMode ? DM_TEXT : '#4a148c',
      textAlign: 'center',
    },
  });
  