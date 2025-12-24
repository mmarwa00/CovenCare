import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, Animated, PanResponder } from 'react-native';
import Layout from '../components/Layout';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const CARD_WIDTH = SCREEN_WIDTH * 0.75;
const CARD_HEIGHT = CARD_WIDTH * 1.4;

const SPELLS = [
  {
    id: 1,
    title: 'Crystal Healing',
    image: require('../../assets/spells/crystal.png'),
    description: 'Harness the power of earth\'s gems',
    details: 'Place moonstone on your lower abdomen for 15 minutes. Carnelian to ease cramps. Rose quartz to bring comfort and self-love. Let the crystal\'s energy flow through you.',
  },
  {
    id: 2,
    title: 'Moon Tea Ritual',
    image: require('../../assets/spells/moontea.png'),
    description: 'Sacred herbs to soothe your body',
    details: 'Brew chamomile, ginger, and raspberry leaf tea. Sip slowly while setting intentions for comfort and ease. Feel the warmth spread through your body.',
  },
  {
    id: 3,
    title: 'Cleansing Smoke',
    image: require('../../assets/spells/sage.png'),
    description: 'Clear negative energy and pain',
    details: 'Light sage and let the smoke swirl around you. Breathe deeply and visualize cramps melting away with each exhale. Release what no longer serves you.',
  },
  {
    id: 4,
    title: 'Flame Meditation',
    image: require('../../assets/spells/candle.png'),
    description: 'Find peace in the flickering light',
    details: 'Light a purple candle. Focus on the flame for 5 minutes. Breathe: 4 counts in, hold for 4, 4 counts out. Feel calm wash over you like gentle waves.',
  },
  {
    id: 5,
    title: 'Lunar Bath Spell',
    image: require('../../assets/spells/bath.png'),
    description: 'Soak in healing waters',
    details: 'Add Epsom salt, lavender oil, and rose petals to warm water. Soak for 20 minutes under candlelight. Visualize pain dissolving into the water.',
  },
];
export default function SpellsScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [expandedCard, setExpandedCard] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false);
  
  const position = useRef(new Animated.ValueXY()).current;
  const flipAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => expandedCard === null,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: 0 });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > 120) {
          // Swipe right - go to previous
          swipeCard('right');
        } else if (gesture.dx < -120) {
          // Swipe left - go to next
          swipeCard('left');
        } else {
          // Return to center
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const swipeCard = (direction) => {
    const x = direction === 'right' ? SCREEN_WIDTH : -SCREEN_WIDTH;
    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      if (direction === 'left' && currentIndex < SPELLS.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else if (direction === 'right' && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
      position.setValue({ x: 0, y: 0 });
    });
  };

  const handleCardTap = () => {
    if (expandedCard !== null) {
      // Card is expanded - flip it
      flipCard();
    } else {
      // Card is not expanded - expand it
      setExpandedCard(currentIndex);
      Animated.spring(scaleAnim, {
        toValue: 1.3,
        useNativeDriver: true,
      }).start();
    }
  };

  const flipCard = () => {
    Animated.timing(flipAnim, {
      toValue: isFlipped ? 0 : 180,
      duration: 600,
      useNativeDriver: true,
    }).start();
    setIsFlipped(!isFlipped);
  };

  const closeCard = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(flipAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
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
    <Layout navigation={navigation} subtitle="Healing Spells">
      <View style={styles.container}>
        <Text style={styles.title}>Healing Spells</Text>
        <Text style={styles.subtitle}>Swipe to browse • Tap to reveal</Text>

        <View style={styles.cardContainer}>
          {/* Stack of cards in background */}
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

          {/* Current card */}
          <Animated.View
            {...panResponder.panHandlers}
            style={[
              styles.card,
              {
                transform: [
                  { translateX: position.x },
                  { scale: expandedCard !== null ? scaleAnim : 1 },
                ],
              },
            ]}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={handleCardTap}
              style={styles.cardTouchable}
            >
              {/* Front of card */}
              <Animated.View
                style={[
                  styles.cardFace,
                  styles.cardFront,
                  {
                    transform: [{ rotateY: frontInterpolate }],
                  },
                ]}
              >
                <Image source={currentSpell.image} style={styles.cardImage} />
                <Text style={styles.cardTitle}>{currentSpell.title}</Text>
              </Animated.View>

              {/* Back of card */}
              <Animated.View
                style={[
                  styles.cardFace,
                  styles.cardBack,
                  {
                    transform: [{ rotateY: backInterpolate }],
                  },
                ]}
              >
                <Text style={styles.backTitle}>{currentSpell.title}</Text>
                <Text style={styles.backDescription}>{currentSpell.description}</Text>
                <Text style={styles.backDetails}>{currentSpell.details}</Text>
              </Animated.View>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Close button when expanded */}
        {expandedCard !== null && (
          <TouchableOpacity style={styles.closeButton} onPress={closeCard}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        )}

        {/* Indicator dots */}
        <View style={styles.dotsContainer}>
          {SPELLS.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>
      </View>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e3d2f0ff',
    alignItems: 'center',
    paddingTop: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#4a148c',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#8b5cb8',
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
