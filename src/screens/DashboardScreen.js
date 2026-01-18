import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ActivityIndicator } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { db } from '../config/firebaseConfig';
import { doc, getDoc, collection, query, where, getDocs, limit, Timestamp, onSnapshot } from 'firebase/firestore';

import { getActiveEmergencies } from '../services/emergencyService';
import { getSentVouchers } from '../services/voucherService';
import { getCircleMembersMoods } from '../services/circleService';
import { getCurrentPhase } from '../services/periodService';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Mascot from '../components/Mascot';
import { useColorScheme } from 'react-native';

export default function DashboardScreen({ navigation }) {
  const { signOutUser, user } = useAuth();
  const { colors } = useTheme();
  const userId = user?.uid;
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const [activeCircle, setActiveCircle] = useState(null);
  const [loadingCircle, setLoadingCircle] = useState(true);

  const [alerts, setAlerts] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);

  const [voucherCount, setVoucherCount] = useState(0);
  const [loadingVouchers, setLoadingVouchers] = useState(true);

  const [memberMoods, setMemberMoods] = useState([]);
  const [phaseData, setPhaseData] = useState(null);

  const [userMood, setUserMood] = useState("okay");

  // -------------------------------
  // FETCH ALL DATA AT ONCE
  // -------------------------------
  const fetchAllData = useCallback(async () => {
    if (!userId) {
      console.log('No userId, skipping fetch');
      return;
    }

    console.log('Starting dashboard data fetch...');

    try {
      // Load user mood
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTimestamp = Timestamp.fromDate(today);
      
      const symptomsRef = collection(db, "dailySymptoms");
      const moodQuery = query(
        symptomsRef,
        where("userId", "==", userId),
        where("date", "==", todayTimestamp),
        limit(1)
      );
      
      const moodSnapshot = await getDocs(moodQuery);
      
      if (!moodSnapshot.empty) {
        const moodData = moodSnapshot.docs[0].data();
        if (moodData.mood) {
          setUserMood(moodData.mood);
        }
      }

      // Load active circle
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const activeId = userSnap.data().activeCircleId;
        if (activeId) {
          const circleRef = doc(db, "circles", activeId);
          const circleSnap = await getDoc(circleRef);

          if (circleSnap.exists()) {
            const circleData = {
              id: activeId,
              ...circleSnap.data(),
            };
            setActiveCircle(circleData);

            // Load circle member moods
            const moodsResult = await getCircleMembersMoods(activeId);
            if (moodsResult.success) {
              setMemberMoods(moodsResult.memberMoods);
            }
          } else {
            setActiveCircle(null);
          }
        } else {
          setActiveCircle(null);
        }
      }
      setLoadingCircle(false);

      // Load alerts - initial load only, real-time listener handles updates
      const alertsResult = await getActiveEmergencies(userId);
      if (alertsResult.success) {
        setAlerts(alertsResult.emergencies);
      }
      setLoadingAlerts(false);

      // Load vouchers - initial load only, real-time listener handles updates
      const vouchersResult = await getSentVouchers(userId);
      if (vouchersResult.success) {
        const activeVouchers = vouchersResult.vouchers.filter(v => v.status !== 'redeemed');
        setVoucherCount(activeVouchers.length);
        console.log('Active vouchers count:', activeVouchers.length);
      }
      setLoadingVouchers(false);

      // Load phase
      const phaseResult = await getCurrentPhase(userId);
      if (phaseResult.success) {
        setPhaseData(phaseResult);
      }

      console.log('Dashboard data fetch complete');
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoadingCircle(false);
      setLoadingAlerts(false);
      setLoadingVouchers(false);
    }
  }, [userId]);

  // -------------------------------
  // USE FOCUS EFFECT - Refresh on screen focus
  // -------------------------------
  useFocusEffect(
    useCallback(() => {
      console.log('Dashboard focused, fetching data...');
      fetchAllData();
    }, [fetchAllData])
  );

  // -------------------------------
  // REAL-TIME LISTENER FOR ALERTS
  // -------------------------------
  useEffect(() => {
    if (!userId) return;

    console.log('Setting up real-time alert listener...');

    // Subscribe to active emergencies in real-time
    const emergenciesRef = collection(db, 'emergencies');
    const q = query(
      emergenciesRef,
      where('recipients', 'array-contains', userId),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const emergencies = [];
      snapshot.forEach((doc) => {
        emergencies.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log('Real-time alert update:', emergencies.length, 'active alerts');
      setAlerts(emergencies);
      setLoadingAlerts(false);
    }, (error) => {
      console.error('Error in real-time alert listener:', error);
    });

    // Cleanup listener when component unmounts
    return () => {
      console.log('Cleaning up real-time alert listener');
      unsubscribe();
    };
  }, [userId]);

  // -------------------------------
  // REAL-TIME LISTENER FOR VOUCHERS
  // -------------------------------
  useEffect(() => {
    if (!userId) return;

    console.log('Setting up real-time voucher listener...');

    // Subscribe to sent vouchers in real-time
    const vouchersRef = collection(db, 'vouchers');
    const q = query(
      vouchersRef,
      where('senderId', '==', userId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const vouchers = [];
      snapshot.forEach((doc) => {
        vouchers.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Only count active (unredeemed) vouchers
      const activeVouchers = vouchers.filter(v => v.status !== 'redeemed');
      console.log('Real-time voucher update:', activeVouchers.length, 'active vouchers');
      setVoucherCount(activeVouchers.length);
      setLoadingVouchers(false);
    }, (error) => {
      console.error('Error in real-time voucher listener:', error);
    });

    // Cleanup listener when component unmounts
    return () => {
      console.log('Cleaning up real-time voucher listener');
      unsubscribe();
    };
  }, [userId]);

  // Early return if no user
  if (!userId) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
        <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator animating={true} color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  // -------------------------------
  // HELPERS
  // -------------------------------
  const getCircleIcon = (iconId) => {
    switch (iconId) {
      case 1: return require('../../assets/icons/circle_small1.png');
      case 2: return require('../../assets/icons/circle_small2.png');
      case 3: return require('../../assets/icons/circle_small3.png');
      default: return require('../../assets/icons/circle_small2.png');
    }
  };

  const getPhaseIcon = (phaseName) => {
    switch (phaseName) {
      case 'Period': return require('../../assets/phases/period.png');
      case 'Ovulation': return require('../../assets/phases/ovulation.png');
      case 'Luteal': return require('../../assets/phases/luteal.png');
      case 'Follicular': return require('../../assets/phases/follicular.png');
      default: return require('../../assets/icons/Log.png');
    }
  };

  const getPhaseDisplayName = (phase) => {
    const names = {
      menstrual: 'Period',
      follicular: 'Follicular',
      ovulation: 'Ovulation',
      luteal: 'Luteal'
    };
    return names[phase] || 'Unknown';
  };

  const styles = createStyles(colors);

  // -------------------------------
  // RENDER
  // -------------------------------
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Header navigation={navigation} />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >

          {/* ACTIVE CIRCLE */}
          <View style={styles.dashboardBox}>
            {loadingCircle ? (
              <ActivityIndicator animating={true} color={colors.accent} />
            ) : activeCircle ? (
              <View>
                <View style={styles.circleRow}>
                  <Image source={getCircleIcon(activeCircle.iconId)} style={styles.circleIcon} />
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

          {/* CURRENT PHASE */}
          <View style={styles.dashboardBox}>
            <View style={styles.circleRow}>
              <Image
                source={getPhaseIcon(phaseData ? getPhaseDisplayName(phaseData.phase) : 'Follicular')}
                style={styles.phaseIcon}
              />
              <Text style={styles.boxTitle}>
                Current Phase: {phaseData ? getPhaseDisplayName(phaseData.phase) : 'Loading...'}
              </Text>
            </View>
            {phaseData && (
              <Text style={styles.boxSubtitle}>
                Day {phaseData.phaseDay} of {phaseData.phase} phase
              </Text>
            )}
          </View>

          {/* CIRCLE MOODS + mascot */}
          <View style={styles.dashboardBox}>

            {/* Floating Mascot */}
            <View style={styles.mascotContainer}>
              <Mascot mood={userMood} />
            </View>

            <Text style={styles.boxTitle}>Circle Moods Today</Text>

            {memberMoods.length === 0 ? (
              <Text style={styles.boxSubtitle}>No moods logged today</Text>
            ) : (
              memberMoods.map(member => (
                <View key={member.userId} style={styles.moodItem}>
                  <Text style={styles.memberName}>{member.displayName}</Text>
                  <Text style={styles.moodEmoji}>
                    {member.mood === 'happy' ? '😊' :
                      member.mood === 'okay' ? '😐' :
                        member.mood === 'grumpy' ? '😠' :
                          member.mood === 'sad' ? '😢' :
                            member.mood === 'anxious' ? '😰' : '—'}
                  </Text>
                </View>
              ))
            )}
          </View>

          {/* EMERGENCY ALERTS */}
          <TouchableOpacity
            style={styles.dashboardBox}
            onPress={() => navigation.navigate('AlertBox')}
            activeOpacity={0.7}
          >
            <View style={styles.circleRow}>
              <Image source={require('../../assets/Alerts/alert.png')} style={styles.emergencyIcon} />
              <Text style={styles.boxTitle}>Emergency Alerts: {loadingAlerts ? '...' : alerts.length}</Text>
            </View>
          </TouchableOpacity>

          {/* SENT VOUCHERS */}
          <TouchableOpacity
            style={styles.dashboardBox}
            onPress={() => navigation.navigate('SentVouchers')}
            activeOpacity={0.7}
          >
            <View style={styles.circleRow}>
              <Image source={require('../../assets/Vouchers/voucher.png')} style={styles.voucherIcon} />
              <Text style={styles.boxTitle}>Sent Vouchers: {loadingVouchers ? '...' : voucherCount}</Text>
            </View>
          </TouchableOpacity>

          {/* LOGOUT */}
          <Button
            mode="outlined"
            onPress={signOutUser}
            icon="logout"
            style={styles.logoutButton}
            labelStyle={styles.logoutLabel}
          >
            Log Out
          </Button>

          <View style={{ height: 120 }} />
        </ScrollView>

        <Footer navigation={navigation} />
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  scrollContainer: {
    padding: 10,
    paddingBottom: 30,
    backgroundColor: colors.background,
  },

  dashboardBox: {
    backgroundColor: colors.cardBackground,
    padding: 15,
    borderRadius: 18,
    marginVertical: 10,
    width: '90%',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: colors.shadowOpacity,
    shadowRadius: 15,
    elevation: 8,
    position: 'relative',
  },

  mascotContainer: {
    position: 'absolute',
    top: -30,
    right: 25,
    width: 50,
    height: 50,
    zIndex: 20,
  },

  boxTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },

  boxSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },

  circleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  circleName: {
    color: colors.text,
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

  moodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  memberName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },

  moodEmoji: {
    fontSize: 24,
  },

  logoutButton: {
    marginTop: 20,
    backgroundColor: colors.cardBackground,
    borderColor: colors.border,
    borderWidth: 2,
    width: 150,
    alignSelf: 'center',
    borderRadius: 40,
    height: 45,
    justifyContent: 'center',
  },

  logoutLabel: {
    fontSize: 14,
    color: colors.text,
    fontWeight: 'bold',
  },
});
