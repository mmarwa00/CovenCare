import React, { useState } from 'react';
import { View, StyleSheet, ImageBackground, Image, ScrollView, Dimensions } from 'react-native';
import { Title, Button } from 'react-native-paper';
import Layout from './Layout';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

// Card size - scales with screen
const CARD_WIDTH = screenWidth * 0.5; // 50% of screen width
const CARD_HEIGHT = CARD_WIDTH * 1.4; // Tarot card aspect ratio

export default function SendItemScreen({ 
  navigation, 
  selectedItem, 
  itemType, // 'voucher' or 'alert'
  backgroundImage 
}) {
  const [selectedPeople, setSelectedPeople] = useState([]);

  const handleSend = () => {
    console.log(`Sending ${itemType} to:`, selectedPeople);
    // TODO: Backend API call here
    navigation.goBack();
  };

  // Content component
  const Content = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      {/* Selected Card - Top Center */}
      <View style={styles.cardContainer}>
        <Image 
          source={selectedItem.image} 
          style={[styles.selectedCard, { width: CARD_WIDTH, height: CARD_HEIGHT }]}
          resizeMode="contain"
        />
      </View>

      {/* People Selection Area - Reserved Space */}
      <View style={styles.selectionArea}>
        <Title style={styles.sectionTitle}>Select Recipients:</Title>
        
        {/* TODO: People list will go here */}
        <View style={styles.placeholder}>
          <Title style={styles.placeholderText}>
            People selection list will appear here
          </Title>
        </View>
      </View>

      {/* Send Button */}
      <Button
        mode="contained"
        onPress={handleSend}
        style={styles.sendButton}
        labelStyle={styles.sendButtonLabel}
        disabled={selectedPeople.length === 0}
      >
        Send to {selectedPeople.length || 0} {selectedPeople.length === 1 ? 'person' : 'people'}
      </Button>
    </ScrollView>
  );

  return (
    <Layout navigation={navigation} subtitle={`Send ${itemType}`}>
      <View style={styles.backgroundWrapper}>
        {backgroundImage ? (
          <ImageBackground
            source={backgroundImage}
            style={styles.background}
            resizeMode="cover"
            imageStyle={styles.backgroundImage}
          >
            <Content />
          </ImageBackground>
        ) : (
          <View style={styles.background}>
            <Content />
          </View>
        )}
      </View>
    </Layout>
  );
}

const styles = StyleSheet.create({
  backgroundWrapper: {
    flex: 1,
    backgroundColor: '#eaddf7ff', // Light lilac behind stars
  },
  background: {
    flex: 1,
    width: '100%',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  cardContainer: {
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  selectedCard: {
    borderRadius: 12,
  },
  selectionArea: {
    width: '90%',
    flex: 1,
    minHeight: screenHeight * 0.3,
    backgroundColor: 'rgba(255, 255, 255, 0.7)', // Semi-transparent to show background
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4a148c',
    marginBottom: 15,
    textAlign: 'center',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4a148c',
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 20,
  },
  placeholderText: {
    fontSize: 16,
    color: '#7b1fa2',
    textAlign: 'center',
  },
  sendButton: {
    width: '80%',
    paddingVertical: 8,
    backgroundColor: '#d4a5ff',
    borderWidth: 2,
    borderColor: '#4a148c',
    borderRadius: 25, // Pill shape
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8, // For Android shadow,
  },
  sendButtonLabel: {
    color: '#4a148c',
    fontWeight: 'bold',
  },
});