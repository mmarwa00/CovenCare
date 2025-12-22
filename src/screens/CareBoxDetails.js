import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Dimensions, Alert } from 'react-native';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { redeemVoucher } from '../services/voucherService';

const screenWidth = Dimensions.get('window').width;
const CARD_WIDTH = screenWidth * 0.5;
const CARD_HEIGHT = CARD_WIDTH * 1.4;

export default function CareBoxDetails({ route, navigation }) {
  const { user } = useAuth();
  const userId = user?.uid;
  const { itemImage, itemName, count, senders } = route.params;

  // localSenders: array of { voucherId, senderId, senderName, sentAt, code, redeemed }
  const [localSenders, setLocalSenders] = useState(senders || []);
  const [processingMap, setProcessingMap] = useState({}); // { [voucherId]: boolean }

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
                // If already redeemed, show friendly message
                if (result.error && result.error.toLowerCase().includes('already been redeemed')) {
                  Alert.alert('Already redeemed', 'This voucher was already redeemed.');
                } else {
                  Alert.alert('Error', result.error || 'Failed to redeem voucher. Please try again.');
                }
                console.error('Redeem error:', result.error);
                setProcessing(sender.voucherId, false);
                return;
              }

              // Build new senders array with redeemed flag updated
              const newSenders = localSenders.map(s =>
                s.voucherId === sender.voucherId ? { ...s, redeemed: true, redeemedAt: result.voucher?.redeemedAt || new Date() } : s
              );

              setLocalSenders(newSenders);

              Alert.alert('Redeemed', 'Voucher redeemed successfully');

              // If all vouchers are redeemed, go back to CareBox
              const allRedeemed = newSenders.every(s => s.redeemed);
              if (allRedeemed) {
                setTimeout(() => navigation.goBack(), 500);
              } else {
                // keep user on details so they can redeem others
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

  return (
    <Layout navigation={navigation} subtitle="Voucher Details">
      <View style={styles.scrollContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backLink}>← Back to Care Box</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Image source={itemImage} style={styles.image} />
          <Text style={styles.count}>{unredeemedCount}x available</Text>
        </View>

        <Text style={styles.sectionTitle}>Senders</Text>
        <FlatList
          data={localSenders}
          keyExtractor={(s) => s.voucherId.toString()}
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
                  <View style={styles.redeemedBadge}><Text style={styles.redeemedText}>Redeemed</Text></View>
                )}
              </View>
            );
          }}
        />
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
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  backLink: {
    color: '#4a148c',
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
    color: '#4a148c',
    marginTop: 8,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#4a148c',
  },
  senderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingLeft: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#d4a5ff',
    borderRadius: 8,
    marginBottom: 8,
  },
  senderInfo: {
    flex: 1,
  },
  senderName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a148c',
  },
  senderDate: {
    fontSize: 12,
    color: '#4a148c',
    marginTop: 2,
  },
  senderCode: {
    fontSize: 11,
    color: '#4a148c',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  senderStatus: {
    fontSize: 12,
    color: '#4a148c',
    marginTop: 2,
    fontStyle: 'italic',
  },
  redeemButton: {
    backgroundColor: '#4a148c',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  redeemText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});