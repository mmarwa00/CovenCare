import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
  PanResponder,
} from 'react-native';
import Layout from '../components/Layout';
import { useTheme } from '../context/ThemeContext';
import { Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';


const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = SCREEN_WIDTH * 0.75;
const CARD_HEIGHT = CARD_WIDTH * 1.4;

const SPELLS = [
  {
    id: 1,
    title: 'Crystal Healing',
    image: require('../../assets/spells/crystal.png'),
    description: "Harness the power of earth's gems",
    details:
      'Place moonstone on your lower abdomen for 15 minutes. Carnelian to ease cramps. Rose quartz to bring comfort and self-love. Let the crystal\'s energy flow through you.',
  },
  {
    id: 2,
    title: 'Moon Tea Ritual',
    image: require('../../assets/spells/moontea.png'),
    description: 'Sacred herbs to soothe your body',
    details:
      'Brew chamomile, ginger, and raspberry leaf tea. Sip slowly while setting intentions for comfort and ease. Feel the warmth spread through your body.',
  },
  {
    id: 3,
    title: 'Cleansing Smoke',
    image: require('../../assets/spells/sage.png'),
    description: 'Clear negative energy and pain',
    details:
      'Light sage and let the smoke swirl around you. Breathe deeply and visualize cramps melting away with each exhale. Release what no longer serves you.',
  },
  {
    id: 4,
    title: 'Flame Meditation',
    image: require('../../assets/spells/candle.png'),
    description: 'Find peace in the flickering light',
    details:
      'Light a purple candle. Focus on the flame for 5 minutes. Breathe: 4 counts in, hold for 4, 4 counts out. Feel calm wash over you like gentle waves.',
  },
  {
    id: 5,
    title: 'Lunar Bath Spell',
    image: require('../../assets/spells/bath.png'),
    description: 'Soak in healing waters',
    details:
      'Add Epsom salt, lavender oil, and rose petals to warm water. Soak for 20 minutes under candlelight. Visualize pain dissolving into the water.',
  },
];

export default function SpellsScreen({ navigation }) {
  const { colors, isDarkMode } = useTheme();
  const DM_TEXT = '#e3d2f0ff';

  const [currentIndex, setCurrentIndex] = useState(0);
  const [expandedCard, setExpandedCard] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false);

  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const flipAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const expandTranslateY = useRef(new Animated.Value(0)).current; // Add this new animation

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => expandedCard === null,
      onPanResponderMove: (_, gesture) => {
        translateX.setValue(gesture.dx);
        translateY.setValue(gesture.dy * 0.1);
      },
      onPanResponderRelease: (_, gesture) => {
        const swipeThreshold = 120;
        if (gesture.dx > swipeThreshold) swipeCard('right');
        else if (gesture.dx < -swipeThreshold) swipeCard('left');
        else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: false }).start();
          Animated.spring(translateY, { toValue: 0, useNativeDriver: false }).start();
        }
      },
    })
  ).current;

  const swipeCard = (direction) => {
    const x = direction === 'right' ? SCREEN_WIDTH : -SCREEN_WIDTH;
    Animated.timing(translateX, {
      toValue: x,
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      if (direction === 'left') {
        setCurrentIndex((prev) => (prev === SPELLS.length - 1 ? 0 : prev + 1));
      } else {
        setCurrentIndex((prev) => (prev === 0 ? SPELLS.length - 1 : prev - 1));
      }
      translateX.setValue(0);
      translateY.setValue(0);
    });
  };

  const handleCardTap = () => {
    if (expandedCard !== null) flipCard();
    else {
      setExpandedCard(currentIndex);
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1.3, useNativeDriver: false }),
        Animated.spring(expandTranslateY, { toValue: -40, useNativeDriver: false }),
      ]).start();
    }
  };

  const flipCard = () => {
    Animated.timing(flipAnim, {
      toValue: isFlipped ? 0 : 180,
      duration: 600,
      useNativeDriver: false,
    }).start();
    setIsFlipped(!isFlipped);
  };

  const closeCard = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: false }),
      Animated.timing(flipAnim, { toValue: 0, duration: 300, useNativeDriver: false }),
      Animated.spring(expandTranslateY, { toValue: 0, useNativeDriver: false }),
    ]).start(() => {
      setExpandedCard(null);
      setIsFlipped(false);
    });
  };

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const currentSpell = SPELLS[currentIndex];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
      <Layout navigation={navigation} subtitle="Healing Spells">
        <Button
          mode="text"
          onPress={() => navigation.navigate('Dashboard')}
          style={styles.backButton}
          labelStyle={isDarkMode ? { color: DM_TEXT } : {}}
        >
          ← Back to Dashboard
        </Button>
        <View
          style={[
            styles.container,
            isDarkMode && { backgroundColor: colors.background },
          ]}
        >
          <Text style={[styles.subtitle, isDarkMode && { color: DM_TEXT }]}>
            Swipe to browse • Tap to reveal
          </Text>

          <View style={styles.cardContainer}>
            {SPELLS.map((spell, index) => {
              if (index === currentIndex) return null;
              const offset = (index - currentIndex) * 10;
              const opacity = Math.abs(index - currentIndex) === 1 ? 0.5 : 0.2;

              return (
                <View
                  key={spell.id}
                  style={[
                    styles.card,
                    {
                      opacity,
                      transform: [
                        { translateX: offset },
                        { translateY: Math.abs(offset) },
                        { scale: 0.95 },
                      ],
                    },
                  ]}
                >
                  <Image source={spell.image} style={styles.cardImage} />
                </View>
              );
            })}

            <Animated.View
              {...panResponder.panHandlers}
              style={[
                styles.card,
                { transform: [{ translateX }, { translateY }] },
              ]}
            >
              <Animated.View
                style={{
                  flex: 1,
                  transform: [
                    { scale: expandedCard !== null ? scaleAnim : 1 },
                    { translateY: expandTranslateY },
                  ],
                }}
              >
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={handleCardTap}
                  style={styles.cardTouchable}
                >
                  <Animated.View
                    style={[
                      styles.cardFace,
                      styles.cardFront,
                      isDarkMode && { backgroundColor: colors.cardBackground },
                      { transform: [{ rotateY: frontInterpolate }] },
                    ]}
                  >
                    <Image source={currentSpell.image} style={styles.cardImage} />
                    <Text
                      style={[
                        styles.cardTitle,
                        isDarkMode && { color: DM_TEXT },
                      ]}
                    >
                      {currentSpell.title}
                    </Text>
                  </Animated.View>

                  <Animated.View
                    style={[
                      styles.cardFace,
                      styles.cardBack,
                      isDarkMode && { backgroundColor: 'rgba(93, 8, 36, 1)' },

                      { transform: [{ rotateY: backInterpolate }] },
                    ]}
                  >
                    <Text
                      style={[
                        styles.backTitle,
                        isDarkMode && { color: DM_TEXT },
                      ]}
                    >
                      {currentSpell.title}
                    </Text>

                    <Text
                      style={[
                        styles.backDescription,
                        isDarkMode && { color: DM_TEXT },
                      ]}
                    >
                      {currentSpell.description}
                    </Text>

                    <Text
                      style={[
                        styles.backDetails,
                        isDarkMode && { color: DM_TEXT },
                      ]}
                    >
                      {currentSpell.details}
                    </Text>
                  </Animated.View>
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
          </View>

          {expandedCard !== null && (
            <TouchableOpacity
              style={[
                styles.closeButton,
                isDarkMode && { backgroundColor: colors.cardBackground },
              ]}
              onPress={closeCard}
            >
              <Text
                style={[
                  styles.closeButtonText,
                  isDarkMode && { color: DM_TEXT },
                ]}
              >
                ✕
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.dotsContainer}>
            {SPELLS.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === currentIndex && styles.dotActive,
                  isDarkMode && {
                    backgroundColor:
                      index === currentIndex ? DM_TEXT : colors.cardBackground,
                  },
                ]}
              />
            ))}
          </View>
        </View>
      </Layout>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e3d2f0ff',
    alignItems: 'center',
    paddingTop: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 10,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4a148c',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#8707a3',
    marginBottom: 30,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    position: 'absolute',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  cardTouchable: {
    width: '100%',
    height: '100%',
  },
  cardFace: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    backfaceVisibility: 'hidden',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardFront: {
    backgroundColor: '#fff',
  },
  cardBack: {
    backgroundColor: '#4a148c',
    justifyContent: 'flex-start',
    paddingTop: 40,
  },
  cardImage: {
    width: CARD_WIDTH * 0.8,
    height: CARD_HEIGHT * 0.7,
    resizeMode: 'contain',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4a148c',
    marginTop: 15,
    textAlign: 'center',
  },
  backTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  backDescription: {
    fontSize: 16,
    color: '#d4a5ff',
    fontStyle: 'italic',
    marginBottom: 20,
    textAlign: 'center',
  },
  backDetails: {
    fontSize: 15,
    color: '#fff',
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4a148c',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  dotsContainer: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d4a5ff',
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#4a148c',
    width: 24,
  },
});


