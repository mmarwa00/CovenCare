import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { db } from '../config/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getActiveEmergencies } from '../services/emergencyService';
import { getSentVouchers } from '../services/voucherService';
import { getCircleMembersMoods } from '../services/circleService';
import { getCurrentPhase } from '../services/periodService';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Mascot from '../components/Mascot';
import { useColorScheme } from 'react-native';
import { collection, query, where, getDocs, limit, Timestamp } from 'firebase/firestore';

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

  const [vouchers, setVouchers] = useState([]);
  const [loadingVouchers, setLoadingVouchers] = useState(true);

  const [memberMoods, setMemberMoods] = useState([]);
  const [phaseData, setPhaseData] = useState(null);

  const [userMood, setUserMood] = useState("okay");


useEffect(() => {
  const loadMoodFromFirebase = async () => {
    if (!userId) return;
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTimestamp = Timestamp.fromDate(today); // ✅ Convert to Timestamp!
      
      const symptomsRef = collection(db, "dailySymptoms");
      const q = query(
        symptomsRef,
        where("userId", "==", userId),
        where("date", "==", todayTimestamp), // ✅ Use Timestamp for comparison
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const moodData = snapshot.docs[0].data();
        console.log("🦇 Found mood data:", moodData);
        if (moodData.mood) {
          setUserMood(moodData.mood);
          console.log("🦇 Set mood to:", moodData.mood);
        }
      } else {
        console.log("🦇 No mood logged for today yet");
      }
    } catch (e) {
      console.log("Error loading mood:", e);
    }
  };
  
  loadMoodFromFirebase();
}, [userId]);

// Refresh when screen focuses
useEffect(() => {
  const unsubscribe = navigation.addListener('focus', () => {
    const loadMoodFromFirebase = async () => {
      if (!userId) return;
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTimestamp = Timestamp.fromDate(today);
        
        const symptomsRef = collection(db, "dailySymptoms");
        const q = query(
          symptomsRef,
          where("userId", "==", userId),
          where("date", "==", todayTimestamp),
          limit(1)
        );
        
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const moodData = snapshot.docs[0].data();
          if (moodData.mood) {
            setUserMood(moodData.mood);
            console.log("🦇 Refreshed mood:", moodData.mood);
          }
        }
      } catch (e) {
        console.log("Error loading mood:", e);
      }
    };
    loadMoodFromFirebase();
  });

  return unsubscribe;
}, [navigation, userId]);

  // -------------------------------
  // LOAD ACTIVE CIRCLE
  // -------------------------------
  useEffect(() => {
    const fetchActiveCircle = async () => {
      if (!userId) return;
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const activeId = userSnap.data().activeCircleId;
        if (activeId) {
          const circleRef = doc(db, "circles", activeId);
          const circleSnap = await getDoc(circleRef);

          if (circleSnap.exists()) {
            setActiveCircle({
              id: activeId,
              ...circleSnap.data(),
            });
          } else {
            setActiveCircle(null);
          }
        } else {
          setActiveCircle(null);
        }
      } else {
        setActiveCircle(null);
      }
      setLoadingCircle(false);
    };

    fetchActiveCircle();
  }, [userId]);

  // -------------------------------
  // LOAD ALERTS
  // -------------------------------
  useEffect(() => {
    const fetchAlerts = async () => {
      if (!userId) return;
      setLoadingAlerts(true);
      const result = await getActiveEmergencies(userId);
      if (result.success) {
        setAlerts(result.emergencies);
      }
      setLoadingAlerts(false);
    };
    fetchAlerts();
  }, [userId]);

  // -------------------------------
  // LOAD CIRCLE MEMBER MOODS
  // -------------------------------
  useEffect(() => {
    const fetchMemberMoods = async () => {
      if (!activeCircle?.id || !userId) return;
      const result = await getCircleMembersMoods(activeCircle.id);
      if (result.success) {
        setMemberMoods(result.memberMoods);
      } else {
        if(userId){
          console.error('Error fetching member moods:', result.error);
        }
      }
    };
    fetchMemberMoods();
  }, [activeCircle]);

  // -------------------------------
  // LOAD VOUCHERS
  // -------------------------------
  useEffect(() => {
    const fetchVouchers = async () => {
      if (!userId) return;
      setLoadingVouchers(true);
      const result = await getSentVouchers(userId);
      if (result.success) {
        // Filter to only show unredeemed vouchers
        const unredeemed = result.vouchers.filter(v => v.status !== 'redeemed');
        setVouchers(unredeemed);
      }
      setLoadingVouchers(false);
    };
    fetchVouchers();
  }, [userId]);

  // -------------------------------
  // LOAD PHASE
  // -------------------------------
  useEffect(() => {
    const fetchPhase = async () => {
      if (!userId) return;
      const result = await getCurrentPhase(userId);
      if (result.success) {
        setPhaseData(result);
      }
    };
    fetchPhase();
  }, [userId]);

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

  const getEmergencyTypeDisplay = (type) => {
    const types = {
      tampon: '🩸 Tampon Emergency',
      pads: '🩸 Pad Emergency',
      painkiller: '💊 Need Painkiller',
      heating_pad: '♨️ Heating Pad Emergency',
      the_ear: '👂 Need a Listening Ear',
      the_pms: '👹 PMS Emergency'
    };
    return types[type] || type;
  };

  const getVoucherTypeDisplay = (type) => {
    const types = {
      chocolate: '🍫 Chocolate',
      coffee: '☕️ Coffee',
      face_mask: '🧖 Face Mask',
      tea: '🍵 Hot tea',
      chips: '🍟 Chips',
      love: '🫶🏻 Love'
    };
    return types[type] || type;
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
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
            <Text style={styles.boxTitle}>Sent Vouchers: {vouchers.length}</Text>
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

  alertItem: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  alertType: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
  },

  alertMessage: {
    color: colors.textSecondary,
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
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

  viewMore: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 10,
    fontStyle: 'italic',
    textAlign: 'right',
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
    marginTop: 4,
  },

  logoutLabel: {
    fontSize: 14,
    color: colors.text,
    fontWeight: 'bold',
  },
});
