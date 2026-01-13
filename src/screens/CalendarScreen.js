import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { 
  Title, 
  Button, 
  Card, 
  TextInput, 
  HelperText, 
  ActivityIndicator, 
  Paragraph,
  Portal,
  Modal,
  Provider as PaperProvider 
} from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { logPreviousPeriods, getUserPeriods, predictNextPeriod } from '../services/periodService';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Calendar } from 'react-native-calendars';
import { db } from '../config/firebaseConfig';
import { useTheme } from '../context/ThemeContext';
import { logDailySymptoms } from '../services/periodService';
import { deleteDoc, doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';

// Format Firestore Timestamp or JS Date
const formatDate = (date) => {
  if (!date) return 'N/A';
  const d = date.toDate ? date.toDate() : new Date(date);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

// JS Date → YYYY-MM-DD
const toDateString = (date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export default function CalendarScreen({ navigation }) {
  const { colors, isDarkMode } = useTheme();
  const DM_TEXT = '#e3d2f0ff';

  const styles = createStyles(colors, isDarkMode, DM_TEXT);

  const { user } = useAuth();
  const userId = user?.uid;
  const [memberInfo, setMemberInfo] = useState({});
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [periods, setPeriods] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCirclePeriods, setShowCirclePeriods] = useState(false);
  const [circlePeriods, setCirclePeriods] = useState([]);
  const [memberColorMap, setMemberColorMap] = useState({});

  const [symptomModalVisible, setSymptomModalVisible] = useState(false);
  const [selectedLogDate, setSelectedLogDate] = useState(null);
  const [tempSymptoms, setTempSymptoms] = useState({ cramps: null, mood: null });

  const fetchData = async () => {
    if (!userId) return;
    setLoading(true);
    setError('');

    const historyResult = await getUserPeriods(userId);
    if (historyResult.success) {
      setPeriods(historyResult.periods);
    } else {
      setError(historyResult.error);
    }

    const predictionResult = await predictNextPeriod(userId);
    if (predictionResult.success) {
      setPrediction(predictionResult);
    } else {
      setPrediction({ prediction: null, error: predictionResult.error });
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    fetchCirclePeriods();
  }, [userId]);

  const handleDayPress = (day) => {
    const dateStr = day.dateString;
    const today = new Date();
    const clicked = new Date(dateStr);
    const existing = findPeriodByDay(dateStr);

    // ❗️ ONLY react to other users' periods if shared mode is ON
    if (showCirclePeriods) {
      const c = new Date(dateStr);

      
      const allSharedPeriods = [
        ...circlePeriods,
        ...periods.map(p => ({ ...p, userId }))
      ];

      const hits = allSharedPeriods.filter(p => {
        const s = p.startDate.toDate();
        const e = p.endDate.toDate();
        return c >= s && c <= e;
      });

      if (hits.length > 0) {
        // build names list
        const names = hits
        .map(h =>
          h.userId === userId
            ? "You"
            : memberInfo[h.userId]?.name || "User"
        )
        .join(", ");

        Alert.alert(
          "Shared Calendar",
          hits.length === 1
            ? `${names} has period these days 💜`
            : `These members have period now: ${names} 💜`
        );
        return;
      }
    }


    if (existing) {
      Alert.alert(
        "Period Day",
        `${formatDate(existing.startDate)} - ${formatDate(existing.endDate)}`,
        [
          { 
            text: "Log Symptoms", 
            onPress: () => handleLogSymptoms(clicked) 
          },
          { 
            text: "Delete Period", 
            style: "destructive", 
            onPress: () => deletePeriod(existing) 
          },
          { text: "Cancel", style: "cancel" }
        ]
      );
      return;
    }

    if (!startDate) {
      if (clicked > today) {
        Alert.alert("Not allowed", "Start date cannot be in the future 😊");
        return;
      }
      setStartDate(dateStr);
      setEndDate('');
      return;
    }

    if (!endDate) {
      if (clicked < new Date(startDate)) {
        setStartDate(dateStr);
        return;
      }
      setEndDate(dateStr);
      return;
    }

    setStartDate(dateStr);
    setEndDate('');
  };
  
  const handleLogSymptoms = (date) => {
    setSelectedLogDate(date);
    setTempSymptoms({ cramps: null, mood: null }); // Reset to fresh draft
    setSymptomModalVisible(true); // Open the One-List Modal!
  };

  const saveAllSymptoms = async () => {
    setLoading(true);
    // Physically convert the date to the string format our DB expects
    const dateStr = selectedLogDate instanceof Date ? toDateString(selectedLogDate) : selectedLogDate;
    
    const result = await logDailySymptoms(userId, dateStr, tempSymptoms);
    
    if (result.success) {
      setSuccess("Daily log updated! 💜");
      setSymptomModalVisible(false); // Close modal
      fetchData(); // Refresh UI
      setTimeout(() => setSuccess(''), 3000);
    } else {
      Alert.alert("Error", result.error);
    }
    setLoading(false);
  };

  const getPeriodMarkedDates = () => {
    const marks = {};

    periods.forEach(p => {
      const start = p.startDate.toDate ? p.startDate.toDate() : new Date(p.startDate);
      const end = p.endDate.toDate ? p.endDate.toDate() : new Date(p.endDate);

      let current = new Date(start);

      while (current <= end) {
        const key = toDateString(current);

        marks[key] = {
          customStyles: {
            container: {
              backgroundColor: '#c162d8ff',
              borderRadius: 20,
            },
            text: {
              color: DM_TEXT,
              fontWeight: 'bold',
            }
          }
        };
        current.setDate(current.getDate() + 1);
      }
    });

    return marks;
  };

  const getSelectedRangeMarks = () => {
    const marks = {};
    if (!startDate) return marks;

    marks[startDate] = {
      customStyles: {
        container: {
          backgroundColor: '#3b1a2b', // deep burgundy
          borderRadius: 20,
        },
        text: {
          color: '#ffffff',
          fontWeight: 'bold',
        }
      }
    };

    if (endDate) {
      marks[endDate] = {
        customStyles: {
          container: {
            backgroundColor: '#3b1a2b',
            borderRadius: 20,
          },
          text: {
            color: '#ffffff',
            fontWeight: 'bold',
          }
        }
      };
    }

    return marks;
  };

  const fetchCirclePeriods = async () => {
    try {
      if (!userId) return;

      //Get user's active circle
      const userDoc = await getDoc(doc(db, "users", userId));
      const activeCircleId = userDoc.data()?.activeCircleId;

      if (!activeCircleId) {
        console.log("No active circle");
        return;
      }

      //Get the circle itself
      const circleDoc = await getDoc(doc(db, "circles", activeCircleId));
      const circleData = circleDoc.data();

      if (!circleData || !circleData.members) return;

      const members = circleData.members;
      let infoMap = {};
      for (let m of members) {
        try {
          const userSnap = await getDoc(doc(db, "users", m.userId));
          if (userSnap.exists()) {
            const data = userSnap.data();
            infoMap[m.userId] = {
              name: data.displayName || "Unknown user",
              photo: data.profilePhoto || null
            };
          }
        } catch (e) {
          infoMap[m.userId] = { name: "User", photo: null };
        }
      }

      setMemberInfo(infoMap);

      const colors = [
        "#8eff7fff", 
        "#f39e28ff", 
        "#2cf0ddff", 
        "#5cb0ffff",
        //"#e990ffff"
      ];

      const newColorMap = { ...memberColorMap }; // keep existing colors
      let colorIndex = 0;

      members.forEach(member => {
        if (member.userId === userId) return;

        // already has color → keep it
        if (newColorMap[member.userId]) return;

        // assign new color
        newColorMap[member.userId] = colors[colorIndex % colors.length];
        colorIndex++;
      });

      setMemberColorMap(newColorMap);

      // Collect periods of all members
      let result = [];

      for (let member of members) {
        // Skip the current user
        if (member.userId === userId) continue;

        const periodsQuery = query(
          collection(db, "periods"),
          where("userId", "==", member.userId)
        );

        const periodsSnap = await getDocs(periodsQuery);

        periodsSnap.forEach(docSnap => {
          result.push({
            id: docSnap.id,
            userId: member.userId,
            ...docSnap.data()
          });
        });
      }

      setCirclePeriods(result);
      } catch (error) {
        console.log("Error loading circle periods:", error);
      }
    };


    const getCircleMarkedDates = () => {
      if (!showCirclePeriods) return {};

      const marks = {};
      const dayUsers = {}; // day -> Set(userId)

      const allPeriods = [
        ...circlePeriods,
        ...periods.map(p => ({ ...p, userId }))
      ];

      allPeriods.forEach(p => {
        const start = p.startDate.toDate();
        const end = p.endDate.toDate();
        let current = new Date(start);

        while (current <= end) {
          const key = toDateString(current);

          if (!dayUsers[key]) dayUsers[key] = new Set();
          dayUsers[key].add(p.userId);

          // default color
          marks[key] = {
            customStyles: {
              container: {
                backgroundColor:
                  p.userId === userId
                    ? "#c162d8ff"
                    : memberColorMap[p.userId] || "#888",
                borderRadius: 20,
              },
              text: {
                color: "white",
                fontWeight: "bold"
              }
            }
          };

          current.setDate(current.getDate() + 1);
        }
      });

      // gold style if 2+ users overlap same day
      Object.keys(dayUsers).forEach(day => {
        if (dayUsers[day].size > 1) {
          marks[day] = {
            customStyles: {
              container: {
                backgroundColor: "#ffdc15ff",
                borderRadius: 20,
              },
              text: {
                color: "black",
                fontWeight: "bold"
              }
            }
          };
        }
      });

      return marks;
    };

  const todayString = new Date().toISOString().split("T")[0];

  const getFutureDisabledDates = (existingMarks) => {
    const marks = { ...existingMarks };
    const today = new Date();

    for (let i = 1; i <= 365; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);

      const key = toDateString(d);
      if (!marks[key]) {
        marks[key] = {
          customStyles: {
            container: { backgroundColor: 'transparent' },
            text: { color: '#7a6a8f' } // dim lilac
          }
        };
      }
    }
    return marks;
  };

  const getAllMarkedDates = () => {
    let baseMarks = {
      ...getPeriodMarkedDates(),      // ← My periods
      ...getCircleMarkedDates(),      // ← other users's
      ...getSelectedRangeMarks(),
      [todayString]: {
        customStyles: {
          container: {
            backgroundColor: '#7b1fa2',
            borderRadius: 20,
          },
          text: {
            color: '#ffffff',
            fontWeight: 'bold',
          },
        },
      },
    };

    baseMarks = getFutureDisabledDates(baseMarks);
    return baseMarks;
  };


  const handleLogPeriod = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    const result = await logPreviousPeriods(userId, startDate, endDate);

    if (result.success) {
      setSuccess('Period successfully logged!');
      setStartDate('');
      setEndDate('');
      fetchData();
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const findPeriodByDay = (dateStr) => {
    const clicked = new Date(dateStr);

    return periods.find(p => {
      const start = p.startDate.toDate ? p.startDate.toDate() : new Date(p.startDate);
      const end = p.endDate.toDate ? p.endDate.toDate() : new Date(p.endDate);
      return clicked >= start && clicked <= end;
    });
  };

  const deletePeriod = async (period) => {
    try {
      await deleteDoc(doc(db, 'periods', period.id));
      setSuccess('Period deleted');
      setStartDate('');
      setEndDate('');
      fetchData();
    } catch (e) {
      setError('Failed to delete period');
    }
  };

  const renderPrediction = () => {
    if (prediction?.error) {
      return (
        <Paragraph style={[styles.tipText, isDarkMode && { color: DM_TEXT }]}>
          Tip: {prediction.error}. Log more periods to get a precise prediction!
        </Paragraph>
      );
    }
    if (prediction?.prediction) {
      return (
        <View style={styles.predictionBox}>
          <Text style={styles.predictionText}>
            Next Period Predicted:
            <Text style={styles.predictionDate}> {formatDate(prediction.prediction)}</Text>
          </Text>
          <Text style={styles.detailText}>
            Avg Cycle: {prediction.averageCycle} days (Confidence: {prediction.confidence})
          </Text>
        </View>
      );
    }
    return <Paragraph style={[styles.tipText, isDarkMode && { color: DM_TEXT }]}>Awaiting data for prediction...</Paragraph>;
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header navigation={navigation} />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Button
          mode="text"
          onPress={() => navigation.navigate('Dashboard')}
          style={styles.backButton}
          labelStyle={isDarkMode ? { color: DM_TEXT } : {}}
        >
          ← Back to Dashboard
        </Button>

        <Title style={[styles.title, isDarkMode && { color: DM_TEXT }]}>
          Cycle Calendar 🗓️
        </Title>

        <Paragraph style={[styles.subtitle, isDarkMode && { color: DM_TEXT }]}>
          Log your flow and predict your future.
        </Paragraph>

        {loading && (
          <ActivityIndicator animating={true} color={isDarkMode ? DM_TEXT : "#4a148c"} size="small" />
        )}

        {error && (
          <HelperText type="error" visible={!!error} style={{ textAlign: 'center' }}>
            {error}
          </HelperText>
        )}

        {success && (
          <HelperText type="info" visible={!!success} style={styles.successText}>
            {success}
          </HelperText>
        )}

        {/* Log Period */}
              <Card style={styles.card}>
                  <Card.Content>
                      <Title style={[styles.cardTitle, isDarkMode && { color: DM_TEXT }]}>
              Log New Period
            </Title>

            <Button
              mode="contained"
              onPress={() => setShowCirclePeriods(!showCirclePeriods)}
              style={{
                marginBottom: 10,
                backgroundColor: isDarkMode ? '#4a001f' : '#4a148c',
                borderWidth: 3,
                borderColor: isDarkMode ? '#4a001f' : '#4a148c',
              }}
              textColor={DM_TEXT}
            >
              {showCirclePeriods ? "Hide Circle Periods" : "Show Circle Periods"}
            </Button>

            {showCirclePeriods && (
              <View style={styles.legendContainer}>
                <Text style={styles.legendTitle}>
                  Period color legend:
                </Text>

                {Object.keys(memberColorMap).map((uid) => (
                  <View key={uid} style={styles.legendRow}>
                    <View
                      style={[
                        styles.legendColor,
                        { backgroundColor: memberColorMap[uid] }
                      ]}
                    />
                    <Text style={styles.legendText}>
                      {memberInfo[uid]?.name || 'Circle member'}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <Calendar
              firstDay={1}
              disableAllTouchEventsForDisabledDays={false}
              onDayPress={handleDayPress}
              markedDates={getAllMarkedDates()}
              markingType="custom"
              theme={{
                backgroundColor: isDarkMode ? '#3c2c4bff' : '#ffffff',
                calendarBackground: isDarkMode ? '#1a1a24' : '#ffffff',
                textSectionTitleColor: isDarkMode ? DM_TEXT : '#4a148c',
                monthTextColor: isDarkMode ? DM_TEXT : '#4a148c',
                dayTextColor: isDarkMode ? DM_TEXT : '#4a148c',
                todayTextColor: isDarkMode ? '#ffffff' : '#4a148c',
                todayBackgroundColor: isDarkMode ? '#7b1fa2' : '#d4a5ff',
                arrowColor: isDarkMode ? DM_TEXT : '#4a148c',
                textDisabledColor: isDarkMode ? '#7a6a8f' : '#aaaaaa',
              }}
            />

            <Paragraph style={[{ marginTop: 10 }, isDarkMode && { color: DM_TEXT }]}>
              Start: {startDate || '-'}   |   End: {endDate || '-'}
            </Paragraph>

            <Button
              mode="outlined"
              onPress={handleLogPeriod}
              disabled={!startDate || !endDate}
              style={[
                styles.logFlowButton,
                isDarkMode && {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.border,
                }
              ]}
              labelStyle={[
                styles.logFlowLabel,
                isDarkMode && { color: DM_TEXT }
              ]}
              icon="water"
            >
              Log Flow
            </Button>

            <Button
              mode="outlined"
              onPress={() => handleLogSymptoms(new Date())}
              style={[
                styles.symptomButton,
                isDarkMode && {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.border,
                }
              ]}
              labelStyle={[
                styles.logFlowLabel,
                isDarkMode && { color: DM_TEXT }
              ]}
              icon="emoticon"
            >
              Log Today's Symptoms
            </Button>
          </Card.Content>
        </Card>
        {/* Prediction Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={[styles.cardTitle, isDarkMode && { color: DM_TEXT }]}>
              Next Cycle Prediction
            </Title>
            {renderPrediction()}
          </Card.Content>
        </Card>
        {/* History */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={[styles.cardTitle, isDarkMode && { color: DM_TEXT }]}>
              History ({periods.length} Logged)
            </Title>

            {periods.length === 0 ? (
              <Paragraph style={[{ color: '#555' }, isDarkMode && { color: DM_TEXT }]}>
                No past periods logged yet.
              </Paragraph>
            ) : (
              periods.map((p, index) => (
                <View key={index} style={styles.historyItem}>
                  <Text style={[styles.historyText, isDarkMode && { color: DM_TEXT }]}>
                    Flow: {formatDate(p.startDate)} - {formatDate(p.endDate)}
                  </Text>
                  <Text style={[styles.detailText, isDarkMode && { color: DM_TEXT }]}>
                    Cycle Length: {p.cycleLength || 'N/A'} days
                  </Text>
                </View>
              ))
            )}
          </Card.Content>
        </Card>
      </ScrollView>


      {/* --- SYMPTOM SELECTION MODAL --- */}
      <Portal>
        <Modal 
          visible={symptomModalVisible} 
          onDismiss={() => setSymptomModalVisible(false)}
          contentContainerStyle={{
            backgroundColor: isDarkMode ? '#1a1a24' : '#f8f8ff', 
            padding: 20, margin: 20, borderRadius: 25, borderWidth: 3, borderColor: '#4a148c'
          }}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <Title style={{ color: '#4a148c', textAlign: 'center', fontWeight: 'bold' }}>Daily Log</Title>
            <Paragraph style={{ textAlign: 'center', marginBottom: 15 }}>{formatDate(selectedLogDate)}</Paragraph>

            {/* --- CRAMPS SECTION --- */}
            <Text style={styles.modalSectionTitle}>Physical Symptoms</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
              {['none', 'mild', 'moderate', 'severe'].map((level) => (
                <TouchableOpacity 
                  key={level}
                  onPress={() => setTempSymptoms({ ...tempSymptoms, cramps: level })}
                  style={{
                    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 15, borderWidth: 1, 
                    borderColor: '#4a148c', margin: 4,
                    backgroundColor: tempSymptoms.cramps === level ? '#4a148c' : 'white'
                  }}
                >
                  <Text style={{ fontSize: 12, color: tempSymptoms.cramps === level ? 'white' : '#4a148c', textTransform: 'uppercase' }}>
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* --- MOOD SECTION --- */}
            <Text style={styles.modalSectionTitle}>How are you feeling?</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
              {[
                { l: '😊', v: 'happy' }, { l: '😐', v: 'okay' }, { l: '😠', v: 'grumpy' }, 
                { l: '😢', v: 'sad' }, { l: '😰', v: 'anxious' }
              ].map((item) => (
                <TouchableOpacity 
                  key={item.v}
                  onPress={() => setTempSymptoms({ ...tempSymptoms, mood: item.v })}
                  style={{
                    padding: 10, borderRadius: 15, margin: 5, backgroundColor: 'white', 
                    borderWidth: 2, borderColor: tempSymptoms.mood === item.v ? '#4a148c' : '#ccc',
                    backgroundColor: tempSymptoms.mood === item.v ? '#d4a5ff' : 'white'
                  }}
                >
                  <Text style={{ fontSize: 24 }}>{item.l}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* --- ACTION BUTTONS --- */}
            <Button 
              mode="contained" 
              onPress={saveAllSymptoms}
              style={{ marginTop: 20, backgroundColor: '#4a148c', borderRadius: 50 }}
              labelStyle={{ fontWeight: 'bold', color: 'white' }}
              disabled={!tempSymptoms.cramps && !tempSymptoms.mood}
            >
              Save All Logs
            </Button>
            
            <Button 
              onPress={() => setSymptomModalVisible(false)} 
              textColor="red" 
              style={{ marginTop: 5 }}
            >
              Cancel
            </Button>
          </ScrollView>
        </Modal>
      </Portal>

      <Footer navigation={navigation} />
    </View>
  );
}

const createStyles = (colors, isDarkMode, DM_TEXT) =>
  StyleSheet.create({
    scrollContainer: {
      flexGrow: 1,
      paddingTop: 10,
      paddingBottom: 120,
      backgroundColor: isDarkMode ? colors.background : '#e3d2f0ff',
    },

    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#4a148c',
      marginBottom: 3,
      textAlign: 'center',
    },

    subtitle: {
      fontSize: 14,
      color: '#5d1264ff',
      textAlign: 'center',
      marginBottom: 20,
    },

    card: {
      width: '90%',
      alignSelf: 'center',
      marginBottom: 20,
      borderRadius: 12,
      backgroundColor: isDarkMode ? colors.cardBackground : '#d4a5ff',
      borderColor: isDarkMode ? colors.border : 'transparent',
      borderWidth: isDarkMode ? 1 : 0,
      shadowColor: isDarkMode ? colors.shadowColor : '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? colors.shadowOpacity : 0.2,
      shadowRadius: isDarkMode ? 15 : 3,
      elevation: isDarkMode ? 8 : 3,
    },

    cardTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#4a148c',
      marginBottom: 10,
    },

    logFlowButton: {
      marginTop: 10,
      backgroundColor: '#e3d2f0ff',
      borderColor: '#4a148c',
      borderWidth: 2,
      width: 150,
      alignSelf: 'center',
      borderRadius: 50,
      height: 45,
      justifyContent: 'center',
    },

    logFlowLabel: {
      fontSize: 14,
      color: '#4a148c',
      fontWeight: 'bold',
    },

    successText: {
      backgroundColor: '#c6add9ff',
      color: '#4a148c',
      borderRadius: 4,
      padding: 5,
      marginBottom: 10,
    },

    historyItem: {
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? colors.border : '#eee',
    },

    historyText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#4a148c',
    },

    detailText: {
      fontSize: 12,
      color: isDarkMode ? DM_TEXT : '#4a148c',
    },

    symptomButton: {
      marginTop: 10,
      backgroundColor: '#e3d2f0ff',
      borderColor: '#4a148c',
      borderWidth: 2,
      width: 200,
      alignSelf: 'center',
      borderRadius: 50,
      height: 45,
      justifyContent: 'center',
    },

    predictionBox: {
      padding: 10,
      backgroundColor: isDarkMode ? colors.cardBackground : '#d4a5ff',
      borderRadius: 8,
      borderLeftWidth: 4,
      borderLeftColor: isDarkMode ? colors.primary : '#4a148c',
    },

    predictionText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: isDarkMode ? DM_TEXT : '#4a148c',
    },

    predictionDate: {
      color: isDarkMode ? DM_TEXT : '#4a148c',
    },

     legendContainer: {
      marginHorizontal: 20,
      marginBottom: 10,
    },

    legendTitle: {
      fontWeight: 'bold',
      marginBottom: 6,
      color: isDarkMode ? DM_TEXT : '#000',
    },

    legendRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },

    legendColor: {
      width: 14,
      height: 14,
      borderRadius: 7,
      marginRight: 8,
    },

    legendText: {
      color: isDarkMode ? DM_TEXT : '#000',
    },

    tipText: {
      color: isDarkMode ? DM_TEXT : '#4a148c',
      fontSize: 14,
    },

    backButton: {
      alignSelf: 'flex-start',
      marginBottom: 10,
    },

    modalSectionTitle: { 
    fontWeight: 'bold', 
    color: '#4a148c', 
    marginTop: 15, 
    marginBottom: 10, 
    fontSize: 16, 
    textAlign: 'center' 
  },

  });