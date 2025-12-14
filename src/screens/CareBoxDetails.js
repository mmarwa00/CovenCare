import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Dimensions } from 'react-native';
import Layout from '../components/Layout';

const screenWidth = Dimensions.get('window').width;
const CARD_WIDTH = screenWidth * 0.5;
const CARD_HEIGHT = CARD_WIDTH * 1.4;

export default function CareBoxDetails({ route, navigation }) {
  const { itemImage, itemName, count, senders } = route.params;
  const [localSenders, setLocalSenders] = useState(senders);

  const handleRedeem = (senderId) => {
    setLocalSenders((prev) =>
      prev.map((s) =>
        s.senderId === senderId ? { ...s, redeemed: true } : s
      )
    );
  };

  const renderSender = ({ item }) => (
    <View style={styles.senderRow}>
      <View style={styles.senderInfo}>
        <Text style={styles.senderName}>Sent from: {item.senderName}</Text>
        <Text style={styles.senderDate}>Date: {item.sentAt}</Text>
        <Text style={styles.senderStatus}>
          {item.redeemed ? 'Redeemed' : 'Not redeemed'}
        </Text>
      </View>
      {!item.redeemed && (
        <TouchableOpacity
          style={styles.redeemButton}
          onPress={() => handleRedeem(item.senderId)}
        >
          <Text style={styles.redeemText}>Redeem</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <Layout navigation={navigation} subtitle="Voucher Details">
      <View style={styles.scrollContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backLink}>← Back to Care Box</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Image source={itemImage} style={styles.image} />
          <Text style={styles.count}>{count}x available</Text>
        </View>

        <Text style={styles.sectionTitle}>Senders</Text>
        <FlatList
          data={localSenders}
          keyExtractor={(s) => s.senderId.toString()}
          renderItem={renderSender}
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
  },
  senderStatus: {
    fontSize: 12,
    color: '#4a148c',
  },
  redeemButton: {
    backgroundColor: '#4a148c',
    borderRadius: 16,
    height: 36,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    marginRight: 10,
  },
  redeemText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
});

