import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Dimensions, Alert } from 'react-native';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { redeemVoucher } from '../services/voucherService';
import { useTheme } from '../context/ThemeContext'; 

const screenWidth = Dimensions.get('window').width;
const CARD_WIDTH = screenWidth * 0.5;
const CARD_HEIGHT = CARD_WIDTH * 1.4;

export default function CareBoxDetails({ route, navigation }) {
  const { colors, isDarkMode } = useTheme(); 
  const styles = createStyles(colors, isDarkMode);
  const { user } = useAuth();
  const userId = user?.uid;
  const { itemImage, itemName, count, senders } = route.params;

  const [localSenders, setLocalSenders] = useState(senders || []);
  const [processingMap, setProcessingMap] = useState({});

  const setProcessing = (voucherId, val) => {
    setProcessingMap(prev => ({ ...prev, [voucherId]: val }));
  };

  const handleRedeem = (sender) => {
    if (!userId) return;

    Alert.alert(
      'Redeem Voucher',
      `Redeem this ${itemName} from ${sender.senderName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeem',
          onPress: async () => {
            setProcessing(sender.voucherId, true);

            try {
              const result = await redeemVoucher(sender.voucherId, userId);

              if (!result.success) {
                if (result.error && result.error.toLowerCase().includes('already been redeemed')) {
                  Alert.alert('Already redeemed', 'This voucher was already redeemed.');
                } else {
                  Alert.alert('Error', result.error || 'Failed to redeem voucher. Please try again.');
                }
                console.error('Redeem error:', result.error);
                setProcessing(sender.voucherId, false);
                return;
              }

              const newSenders = localSenders.map(s =>
                s.voucherId === sender.voucherId ? { ...s, redeemed: true, redeemedAt: result.voucher?.redeemedAt || new Date() } : s
              );

              setLocalSenders(newSenders);
              Alert.alert('Redeemed', 'Voucher redeemed successfully');

              const allRedeemed = newSenders.every(s => s.redeemed);
              if (allRedeemed) {
                setTimeout(() => navigation.goBack(), 500);
              }

            } catch (err) {
              console.error('handleRedeem error:', err);
              Alert.alert('Error', 'Network error while redeeming');
            } finally {
              setProcessing(sender.voucherId, false);
            }
          }
        }
      ]
    );
  };

  const unredeemedCount = localSenders.filter(s => !s.redeemed).length;

  const ListHeaderComponent = () => (
    <>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backLink}>← Back to Care Box</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Image source={itemImage} style={styles.image} />
        <Text style={styles.count}>{unredeemedCount}x available</Text>
      </View>

      <Text style={styles.sectionTitle}>Senders</Text>
    </>
  );

  return (
    <Layout navigation={navigation} subtitle="Voucher Details">
      <FlatList
        style={styles.flatList}
        contentContainerStyle={styles.contentContainer}
        data={localSenders}
        keyExtractor={(s) => s.voucherId.toString()}
        ListHeaderComponent={ListHeaderComponent}
        renderItem={({ item }) => {
          const processing = !!processingMap[item.voucherId];
          return (
            <View style={styles.senderRow}>
              <View style={styles.senderInfo}>
                <Text style={styles.senderName}>Sent from: {item.senderName}</Text>
                <Text style={styles.senderDate}>Date: {item.sentAt}</Text>
                <Text style={styles.senderCode}>Code: {item.code}</Text>
                <Text style={styles.senderStatus}>
                  {item.redeemed ? '✓ Redeemed' : 'Not redeemed'}
                </Text>
              </View>
              {!item.redeemed ? (
                <TouchableOpacity
                  style={[styles.redeemButton, processing && styles.buttonDisabled]}
                  onPress={() => handleRedeem(item)}
                  disabled={processing}
                >
                  <Text style={styles.redeemText}>{processing ? 'Redeeming...' : 'Redeem'}</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.redeemedBadge}>
                  <Text style={styles.redeemedText}>Redeemed</Text>
                </View>
              )}
            </View>
          );
        }}
      />
    </Layout>
  );
}

const createStyles = (colors, isDarkMode) => StyleSheet.create({
  flatList: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  backLink: {
    color: isDarkMode ? colors.accent : colors.text,
    fontWeight: 'bold',
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  image: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    resizeMode: 'contain',
  },
  count: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 8,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: colors.text,
  },
  senderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingLeft: 10,
    borderBottomWidth: 1,
    borderBottomColor: isDarkMode ? colors.border : '#eee',
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    marginBottom: 8,
  },
  senderInfo: {
    flex: 1,
  },
  senderName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  senderDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  senderCode: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  senderStatus: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    fontStyle: 'italic',
  },
  redeemButton: {
    backgroundColor: colors.buttonBg,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginRight: 10,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: colors.shadowOpacity,
    shadowRadius: 3,
    elevation: 4,
  },
  redeemText: {
    color: colors.buttonText,
    fontWeight: 'bold',
    fontSize: 14,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  redeemedBadge: {
    backgroundColor: isDarkMode ? '#1a4d2e' : '#4caf50',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginRight: 10,
  },
  redeemedText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});