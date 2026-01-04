import React from 'react';
import { Image, StyleSheet } from 'react-native';

import happy from '../../assets/bat/bat_happy.gif';
import okay from '../../assets/bat/bat_okay.gif';
import grumpy from '../../assets/bat/bat_grumpy.gif';
import sad from '../../assets/bat/bat_sad.gif';
import anxious from '../../assets/bat/bat_anxious.gif';

const batByMood = {
  happy,
  okay,
  grumpy,
  sad,
  anxious,
};

export default function BatMascot({ mood = 'okay' }) {
  return (
    <Image
      source={batByMood[mood] || batByMood.okay}
      style={styles.mascot}
    />
  );
}

const styles = StyleSheet.create({
  mascot: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
});
