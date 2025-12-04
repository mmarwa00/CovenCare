import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Button, ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function DashboardScreen({ navigation }) {
  const { signOutUser, user } = useAuth();
  const userId = user?.uid;

  const [activeCircle, setActiveCircle] = useState(null);
  const [loadingCircle, setLoadingCircle] = useState(true);
  const [alerts, setAlerts] = useState([]); // emergency alerts
  const [vouchers, setVouchers] = useState([]); // vouchers sent
  const [phaseName, setPhaseName] = useState('Follicular');

  useEffect(() => {
    const fetchActiveCircle = async () => {
      if (!userId) return;
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const activeId = userSnap.data().activeCircleId;
        const iconId = userSnap.data().activeCircleIcon || 1; // fallback

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
                return require('../../assets/icons/Log.png')
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
                          {/* First row: icon + label */}
                          <View style={styles.circleRow}>
                              <Image
                                  source={getCircleIcon(activeCircle.icon)}
                                  style={styles.circleIcon}
                              />
                              <Text style={styles.boxTitle}>Active Circle</Text>
                          </View>

                          {/* Second row: circle name + members */}
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
        <View style={styles.dashboardBox}>
          <View style={styles.circleRow}>
            <Image
              source={require('../../assets/Alerts/alert.png')}
              style={styles.emergencyIcon}
            />
            <Text style={styles.boxTitle}>Emergency Alerts: {alerts.length}</Text>
          </View>

          {alerts.length === 0 ? (
            <Text style={styles.boxSubtitle}>No alert received.</Text>
          ) : (
            alerts.map(alert => (
              <View key={alert.id} style={styles.alertItem}>
                <Text style={styles.boxSubtitle}>{alert.tarotCard} – {alert.message}</Text>
                <Text style={styles.boxSubtitle}>From: {alert.sender}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.dashboardBox}>
          <View style={styles.circleRow}>
            <Image
              source={require('../../assets/Vouchers/voucher.png')}
              style={styles.voucherIcon}
            />
            <Text style={styles.boxTitle}>Sent Vouchers</Text>
          </View>

          {vouchers.length === 0 ? (
            <Text style={styles.boxSubtitle}>No voucher sent yet.</Text>
          ) : (
            vouchers.map(voucher => (
              <View key={voucher.id} style={styles.voucherItem}>
                <Text style={styles.boxSubtitle}>
                  {voucher.name} → {voucher.recipient}
                </Text>
              </View>
            ))
          )}
        </View>


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
  },

  dashboardBox: {
    backgroundColor: '#d4a5ff',
    padding: 15,
    borderRadius: 18,
    marginVertical: 10,
    width: '90%',
    alignSelf: 'center',
    // shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
    // elevation for Android
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
  },

  circleRow: {
    flexDirection: 'row',
    alignItems: 'center',
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

  alertItem: {
    marginTop: 8,
  },

  voucherItem: {
    marginTop: 6,
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
