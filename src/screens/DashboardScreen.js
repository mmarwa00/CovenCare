import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Button, ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { getActiveEmergencies } from '../services/emergencyService';
import { getReceivedVouchers } from '../services/voucherService';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function DashboardScreen({ navigation }) {
  const { signOutUser, user } = useAuth();
  const userId = user?.uid;

  const [activeCircle, setActiveCircle] = useState(null);
  const [loadingCircle, setLoadingCircle] = useState(true);
  const [alerts, setAlerts] = useState([]); // emergency alerts
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [vouchers, setVouchers] = useState([]); // received vouchers
  const [loadingVouchers, setLoadingVouchers] = useState(true);
  const [phaseName, setPhaseName] = useState('Follicular');

  // Fetch active circle
  useEffect(() => {
    const fetchActiveCircle = async () => {
      if (!userId) return;
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const activeId = userSnap.data().activeCircleId;
        const iconId = userSnap.data().activeCircleIcon || 1;

        if (activeId) {
          const circleRef = doc(db, "circles", activeId);
          const circleSnap = await getDoc(circleRef);

          if (circleSnap.exists()) {
            setActiveCircle({
              id: activeId,
              icon: iconId,
              ...circleSnap.data()
            });
          }
        }
      }
      setLoadingCircle(false);
    };

    fetchActiveCircle();
  }, [userId]);

  // Fetch emergency alerts
  useEffect(() => {
    const fetchAlerts = async () => {
      if (!userId) return;
      
      setLoadingAlerts(true);
      const result = await getActiveEmergencies(userId);
      
      if (result.success) {
        setAlerts(result.emergencies);
      } else {
        console.error('Error fetching alerts:', result.error);
      }
      setLoadingAlerts(false);
    };

    fetchAlerts();
  }, [userId]);

  // Fetch received vouchers (unredeemed only)
  useEffect(() => {
    const fetchVouchers = async () => {
      if (!userId) return;
      
      setLoadingVouchers(true);
      const result = await getReceivedVouchers(userId, 'unredeemed');
      
      if (result.success) {
        setVouchers(result.vouchers);
      } else {
        console.error('Error fetching vouchers:', result.error);
      }
      setLoadingVouchers(false);
    };

    fetchVouchers();
  }, [userId]);

  const getCircleIcon = (iconId) => {
    switch (iconId) {
      case 1:
        return require('../../assets/icons/circle_small1.png');
      case 2:
        return require('../../assets/icons/circle_small2.png');
      case 3:
        return require('../../assets/icons/circle_small3.png');
      default:
        return require('../../assets/icons/circle_small2.png');
    }
  };

  const getPhaseIcon = (phaseName) => {
    switch (phaseName) {
      case 'Period':
        return require('../../assets/phases/period.png');
      case 'Ovulation':
        return require('../../assets/phases/ovulation.png');
      case 'Luteal':
        return require('../../assets/phases/luteal.png');
      case 'Follicular':
        return require('../../assets/phases/follicular.png');
      default:
        return require('../../assets/icons/Log.png');
    }
  };

  // Get emergency type display
  const getEmergencyTypeDisplay = (type) => {
    const types = {
      tampon: '🩸 Tampon/Pads Emergency',
      chocolate: '🍫 Chocolate Craving',
      ibuprofen: '💊 Need Ibuprofen',
      emotional: '💗 Emotional Support',
      selfcare: '🛁 Self-Care Emergency'
    };
    return types[type] || type;
  };

  // Get voucher type display
  const getVoucherTypeDisplay = (type) => {
    const types = {
      chocolate: '🍫 Chocolate',
      period_products: '🩸 Period Products',
      face_mask: '🧖 Face Mask',
      movie: '🎬 Movie Night',
      crying: '😭 Crying Session',
      food: '🍕 Food Delivery'
    };
    return types[type] || type;
  };

  // Format time ago
  const getTimeAgo = (date) => {
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return 'Just now';
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Header navigation={navigation} />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* --- Active Circle Box --- */}
        <View style={styles.dashboardBox}>
          {loadingCircle ? (
            <ActivityIndicator animating={true} color="#4a148c" />
          ) : activeCircle ? (
            <View>
              <View style={styles.circleRow}>
                <Image
                  source={getCircleIcon(activeCircle.icon)}
                  style={styles.circleIcon}
                />
                <Text style={styles.boxTitle}>Active Circle</Text>
              </View>
              <Text style={styles.circleName}>
                {activeCircle.name} ({activeCircle.members?.length || 0} members)
              </Text>
            </View>
          ) : (
            <Text style={styles.boxTitle}>No active circle selected.</Text>
          )}
        </View>

        {/* --- Menstrual Phase Box --- */}
        <View style={styles.dashboardBox}>
          <View style={styles.circleRow}>
            <Image source={getPhaseIcon(phaseName)} style={styles.phaseIcon} />
            <Text style={styles.boxTitle}>Current Phase: {phaseName}</Text>
          </View>
        </View>

        {/* --- Emergency Alerts Box --- */}
        <TouchableOpacity 
          style={styles.dashboardBox}
          onPress={() => navigation.navigate('EmergencyAlerts')}
          activeOpacity={0.7}
        >
          <View style={styles.circleRow}>
            <Image
              source={require('../../assets/Alerts/alert.png')}
              style={styles.emergencyIcon}
            />
            <Text style={styles.boxTitle}>Emergency Alerts: {alerts.length}</Text>
          </View>

          {loadingAlerts ? (
            <ActivityIndicator animating={true} color="#4a148c" size="small" style={{ marginTop: 10 }} />
          ) : alerts.length === 0 ? (
            <Text style={styles.boxSubtitle}>No active alerts.</Text>
          ) : (
            alerts.slice(0, 3).map(alert => (
              <View key={alert.id} style={styles.alertItem}>
                <Text style={styles.alertType}>
                  {getEmergencyTypeDisplay(alert.type)}
                </Text>
                <Text style={styles.boxSubtitle}>
                  From: {alert.senderName} • {getTimeAgo(alert.createdAt)}
                </Text>
                {alert.message && (
                  <Text style={styles.alertMessage}>"{alert.message}"</Text>
                )}
              </View>
            ))
          )}
          
          {alerts.length > 3 && (
            <Text style={styles.viewMore}>Tap to view all alerts →</Text>
          )}
        </TouchableOpacity>

        {/* --- Received Vouchers Box --- */}
        <TouchableOpacity 
          style={styles.dashboardBox}
          onPress={() => navigation.navigate('CareBox')}
          activeOpacity={0.7}
        >
          <View style={styles.circleRow}>
            <Image
              source={require('../../assets/Vouchers/voucher.png')}
              style={styles.voucherIcon}
            />
            <Text style={styles.boxTitle}>Received Vouchers: {vouchers.length}</Text>
          </View>

          {loadingVouchers ? (
            <ActivityIndicator animating={true} color="#4a148c" size="small" style={{ marginTop: 10 }} />
          ) : vouchers.length === 0 ? (
            <Text style={styles.boxSubtitle}>No vouchers received yet.</Text>
          ) : (
            vouchers.slice(0, 3).map(voucher => (
              <View key={voucher.id} style={styles.voucherItem}>
                <Text style={styles.voucherType}>
                  {getVoucherTypeDisplay(voucher.type)}
                </Text>
                <Text style={styles.boxSubtitle}>
                  From: {voucher.senderName} • {getTimeAgo(voucher.sentAt)}
                </Text>
                <Text style={styles.voucherCode}>Code: {voucher.code}</Text>
              </View>
            ))
          )}
          
          {vouchers.length > 3 && (
            <Text style={styles.viewMore}>Tap to view all vouchers →</Text>
          )}
        </TouchableOpacity>

        {/* --- Log Out Button --- */}
        <Button
          mode="outlined"
          onPress={signOutUser}
          icon="logout"
          style={styles.logoutButton}
          labelStyle={styles.logoutLabel}
        >
          Log Out
        </Button>
      </ScrollView>

      <Footer navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 10,
    paddingBottom: 30,
  },

  dashboardBox: {
    backgroundColor: '#d4a5ff',
    padding: 15,
    borderRadius: 18,
    marginVertical: 10,
    width: '90%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
    elevation: 6,
  },

  boxTitle: {
    color: '#4a148c',
    fontSize: 16,
    fontWeight: 'bold',
  },

  boxSubtitle: {
    color: '#4a148c',
    fontSize: 12,
    marginTop: 4,
  },

  circleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  circleName: {
    color: '#4a148c',
    fontSize: 14,
    marginTop: 8,
    fontWeight: '600',
  },

  circleIcon: {
    width: 30,
    height: 30,
    marginRight: 10,
    resizeMode: 'contain',
  },

  phaseIcon: {
    width: 30,
    height: 30,
    marginRight: 10,
    resizeMode: 'contain',
  },

  emergencyIcon: {
    width: 30,
    height: 30,
    marginRight: 10,
    resizeMode: 'contain',
  },

  voucherIcon: {
    width: 40,
    height: 40,
    marginRight: 10,
    resizeMode: 'contain',
  },

  // Emergency alert styles
  alertItem: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#8b5cb8',
  },

  alertType: {
    color: '#4a148c',
    fontSize: 14,
    fontWeight: 'bold',
  },

  alertMessage: {
    color: '#4a148c',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },

  // Voucher styles
  voucherItem: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#8b5cb8',
  },

  voucherType: {
    color: '#4a148c',
    fontSize: 14,
    fontWeight: 'bold',
  },

  voucherCode: {
    color: '#4a148c',
    fontSize: 11,
    marginTop: 4,
    fontFamily: 'monospace',
    backgroundColor: '#f0e6ff',
    padding: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },

  viewMore: {
    color: '#4a148c',
    fontSize: 12,
    marginTop: 10,
    fontStyle: 'italic',
    textAlign: 'right',
  },

  logoutButton: {
    marginTop: 20,
    backgroundColor: '#f8f8ff',
    borderColor: '#4a148c',
    borderWidth: 2,
    width: 200,
    alignSelf: 'center',
    borderRadius: 50,
    height: 45,
    justifyContent: 'center',
  },

  logoutLabel: {
    fontSize: 14,
    color: '#4a148c',
    fontWeight: 'bold',
  },
});