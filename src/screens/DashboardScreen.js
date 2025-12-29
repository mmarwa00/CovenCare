import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Button, ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { db } from '../config/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { getActiveEmergencies } from '../services/emergencyService';
import { getSentVouchers } from '../services/voucherService';
import { getCircleMembersMoods } from '../services/circleService';
import { getCurrentPhase } from '../services/periodService';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function DashboardScreen({ navigation }) {
  const { signOutUser, user } = useAuth();
  const { colors } = useTheme();
  const userId = user?.uid;

  const [activeCircle, setActiveCircle] = useState(null);
  const [loadingCircle, setLoadingCircle] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [vouchers, setVouchers] = useState([]);
  const [loadingVouchers, setLoadingVouchers] = useState(true);
  const [memberMoods, setMemberMoods] = useState([]);
  const [phaseData, setPhaseData] = useState(null);

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
            const circleData = circleSnap.data();
            setActiveCircle({
              id: activeId,
              ...circleData,
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

  useEffect(() => {
    const fetchMemberMoods = async () => {
      if (!activeCircle?.id) return;
      
      const result = await getCircleMembersMoods(activeCircle.id);
      if (result.success) {
        setMemberMoods(result.memberMoods);
      }
    };
    
    fetchMemberMoods();
  }, [activeCircle]);

  useEffect(() => {
    const fetchVouchers = async () => {
      if (!userId) return;
      setLoadingVouchers(true);
      const result = await getSentVouchers(userId);
      if (result.success) {
        setVouchers(result.vouchers);
      } else {
        console.error('Error fetching sent vouchers:', result.error);
      }
      setLoadingVouchers(false);
    };
    fetchVouchers();
  }, [userId]);

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

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header navigation={navigation} />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Active Circle Box */}
        <View style={styles.dashboardBox}>
          {loadingCircle ? (
            <ActivityIndicator animating={true} color={colors.accent} />
          ) : activeCircle ? (
            <View>
              <View style={styles.circleRow}>
                <Image
                  source={getCircleIcon(activeCircle.iconId)}
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

        {/* Current Phase Box */}
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

        {/* Circle Moods Box */}
        <View style={styles.dashboardBox}>
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

        {/* Emergency Alerts Box */}
        <TouchableOpacity
          style={styles.dashboardBox}
          onPress={() => navigation.navigate('AlertBox')}
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
            <ActivityIndicator animating={true} color={colors.accent} size="small" style={{ marginTop: 10 }} />
          ) : alerts.length === 0 ? (
            <Text style={styles.boxSubtitle}>No active alerts.</Text>
          ) : (
            alerts.slice(0, 3).map(alert => (
              <View key={alert.id} style={styles.alertItem}>
                <Text style={styles.alertType}>{getEmergencyTypeDisplay(alert.type)}</Text>
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

        {/* Sent Vouchers Box */}
        <TouchableOpacity
          style={styles.dashboardBox}
          onPress={() => navigation.navigate('SentVouchers')}
          activeOpacity={0.7}
        >
          <View style={styles.circleRow}>
            <Image
              source={require('../../assets/Vouchers/voucher.png')}
              style={styles.voucherIcon}
            />
            <Text style={styles.boxTitle}>Sent Vouchers: {vouchers.length}</Text>
          </View>
        </TouchableOpacity>

        {/* Logout Button */}
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
    width: 200,
    alignSelf: 'center',
    borderRadius: 50,
    height: 45,
    justifyContent: 'center',
  },

  logoutLabel: {
    fontSize: 14,
    color: colors.text,
    fontWeight: 'bold',
  },
});