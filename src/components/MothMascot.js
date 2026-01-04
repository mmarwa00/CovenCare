import React from 'react';
import { Image, StyleSheet } from 'react-native';

import happy from '../../assets/moth/moth_happy.gif';
import okay from '../../assets/moth/moth_okay.gif';
import grumpy from '../../assets/moth/moth_grumpy.gif';
import sad from '../../assets/moth/moth_sad.gif';
import anxious from '../../assets/moth/moth_anxious.gif';

const mothByMood = {
  happy,
  okay,
  grumpy,
  sad,
  anxious,
};

export default function MothMascot({ mood = 'okay' }) {
  return (
    <Image
      source={mothByMood[mood] || mothByMood.okay}
      style={styles.mascot}
    />
  );
}

const styles = StyleSheet.create({
  mascot: {
    width: 90,
    height: 90,
    resizeMode: 'contain',
  },
});
