import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Title, Paragraph, ActivityIndicator, Button } from 'react-native-paper';
import { db } from '../config/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { auth } from '../config/firebaseConfig';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { leaveCircle } from '../services/circleService';
import { useTheme } from '../context/ThemeContext';

export default function CircleDetailsScreen({ route, navigation }) {
    const { colors, isDarkMode } = useTheme();
    const { circle } = route.params || {};

    const DM_TEXT = '#e3d2f0ff'; // FINAL DARK MODE TEXT COLOR

    if (!circle || !circle.id) {
        return (
            <View style={[styles.container, isDarkMode && { backgroundColor: colors.background }]}>
                <Text style={[styles.errorTextTitle, isDarkMode && { color: DM_TEXT }]}>
                    Error: Circle data missing.
                </Text>
                <Button onPress={() => navigation.goBack()}>Go Back</Button>
            </View>
        );
    }

    const [memberDetails, setMemberDetails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [leaveLoading, setLeaveLoading] = useState(false);

    const photoMap = {
        witch1: require('../../assets/Profile_pics/witch1.png'),
        witch2: require('../../assets/Profile_pics/witch2.png'),
        witch3: require('../../assets/Profile_pics/witch3.png'),
        witch4: require('../../assets/Profile_pics/witch4.png'),
        witch5: require('../../assets/Profile_pics/witch5.png'),
        wizz1: require('../../assets/Profile_pics/wizz1.png'),
        wizz2: require('../../assets/Profile_pics/wizz2.png'),
        wizz3: require('../../assets/Profile_pics/wizz3.png'),
    };

    const fetchMemberDetails = async () => {
        const details = [];
        const memberPromises = circle.members.map(async (memberObject) => {
            const uid = memberObject.userId;
            try {
                const userRef = doc(db, 'users', uid);
                const snap = await getDoc(userRef);

                if (snap.exists()) {
                    const userData = snap.data();
                    details.push({
                        id: uid,
                        displayName: userData.displayName || 'Unknown User',
                        email: userData.email,
                        privacyLevel: memberObject.privacyLevel,
                        role: memberObject.role || 'member',
                        profilePhoto: userData.profilePhoto || null,
                    });
                } else {
                    details.push({ id: uid, displayName: 'User Deleted' });
                }
            } catch (e) {
                details.push({ id: uid, displayName: 'Fetch Error' });
            }
        });

        await Promise.all(memberPromises);
        setMemberDetails(details);
        setLoading(false);
    };

    useEffect(() => {
        fetchMemberDetails();
    }, [circle.members]);

    const renderMemberAvatar = (member) => {
        if (member.profilePhoto && photoMap[member.profilePhoto]) {
            return (
                <Image
                    source={photoMap[member.profilePhoto]}
                    style={[
                        styles.memberAvatar,
                        isDarkMode && { borderColor: DM_TEXT }
                    ]}
                />
            );
        }

        return (
            <View
                style={[
                    styles.avatarPlaceholder,
                    isDarkMode && { backgroundColor: colors.primary }
                ]}
            >
                <Text style={[styles.avatarText, isDarkMode && { color: DM_TEXT }]}>
                    {member.displayName?.charAt(0).toUpperCase() || '?'}
                </Text>
            </View>
        );
    };

    const handleLeaveCircle = async () => {
        try {
            setLeaveLoading(true);
            const currentUserId = auth.currentUser?.uid;

            if (!currentUserId) {
                setLeaveLoading(false);
                return;
            }

            await leaveCircle(currentUserId, circle.id);
            navigation.navigate('Dashboard');
        } catch (e) {
            setLeaveLoading(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
        <View style={{ flex: 1, backgroundColor: isDarkMode ? colors.background : '#fff' }}>
            <Header />

            <ScrollView
                contentContainerStyle={[
                    styles.scrollContainer,
                    isDarkMode && { backgroundColor: colors.background }
                ]}
            >
                <Button
                    mode="text"
                    onPress={() => navigation.navigate('Dashboard')}
                    style={styles.backButton}
                    labelStyle={isDarkMode ? { color: DM_TEXT } : {}}
                >
                    ← Back to Dashboard
                </Button>

                <Title style={[styles.title, isDarkMode && { color: DM_TEXT }]}>
                    {circle.name}
                </Title>

                <Paragraph style={[styles.subtitle, isDarkMode && { color: DM_TEXT }]}>
                    Invite Code: {circle.inviteCode}
                </Paragraph>

                <Card
                    style={[
                        styles.card,
                        isDarkMode && {
                            backgroundColor: colors.cardBackground,
                            borderColor: colors.border,
                            borderWidth: 1,
                            shadowColor: colors.shadowColor,
                            shadowOpacity: colors.shadowOpacity,
                            shadowRadius: 15,
                            elevation: 8,
                        }
                    ]}
                >
                    <Card.Content>
                        <Title style={[styles.sectionTitle, isDarkMode && { color: DM_TEXT }]}>
                            Participants ({memberDetails.length})
                        </Title>

                        {loading ? (
                            <ActivityIndicator
                                animating={true}
                                color={isDarkMode ? DM_TEXT : "#4a148c"}
                            />
                        ) : (
                            memberDetails.map((member) => (
                                <View
                                    key={member.id}
                                    style={[
                                        styles.memberItem,
                                        isDarkMode && { borderBottomColor: colors.border }
                                    ]}
                                >
                                    <View style={styles.memberRow}>
                                        {renderMemberAvatar(member)}
                                        <View style={styles.memberTextWrap}>
                                            <Text style={[styles.memberText, isDarkMode && { color: DM_TEXT }]}>
                                                {member.displayName}{' '}
                                            </Text>

                                            <Text style={[styles.memberDetail, isDarkMode && { color: DM_TEXT }]}>
                                                Privacy: {member.privacyLevel}
                                            </Text>

                                            {member.email ? (
                                                <Text style={[styles.memberSmall, isDarkMode && { color: DM_TEXT }]}>
                                                    Email: {member.email}
                                                </Text>
                                            ) : null}
                                        </View>
                                    </View>
                                </View>
                            ))
                        )}
                    </Card.Content>
                </Card>

                <Button
                    mode="outlined"
                    onPress={handleLeaveCircle}
                    style={[
                        styles.leaveButton,
                        isDarkMode && {
                            backgroundColor: colors.cardBackground,
                            borderColor: colors.border,
                            borderWidth: 2,
                            shadowColor: colors.shadowColor,
                            shadowOpacity: colors.shadowOpacity,
                            shadowRadius: 15,
                            elevation: 8,
                        }
                    ]}
                    labelStyle={[
                        styles.leaveLabel,
                        isDarkMode && { color: DM_TEXT }
                    ]}
                    icon="exit-to-app"
                    disabled={leaveLoading}
                    loading={leaveLoading}
                >
                    {leaveLoading ? 'Leaving...' : 'Leave Circle'}
                </Button>
            </ScrollView>

            <Footer navigation={navigation} />
        </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 120,
        backgroundColor: '#e3d2f0ff',
    },
    backButton: {
        alignSelf: 'flex-start',
        marginBottom: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#4a148c',
        textAlign: 'center',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 14,
        color: '#6a1b9a',
        textAlign: 'center',
        marginBottom: 5,
    },
    card: {
        marginTop: 20,
        padding: 10,
        borderRadius: 12,
        backgroundColor: '#d4a5ff',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#4a148c',
        marginBottom: 10,
    },
    memberItem: {
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    memberText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4a148c',
    },
    memberDetail: {
        fontSize: 12,
        color: '#6a1b9a',
    },
    memberSmall: {
        fontSize: 12,
        color: '#6a1b9a',
    },
    memberAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
        borderWidth: 2,
        borderColor: '#7b1fa2',
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#7b1fa2',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    leaveButton: {
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
    leaveLabel: {
        fontSize: 14,
        color: '#4a148c',
        fontWeight: 'bold',
    },
});
