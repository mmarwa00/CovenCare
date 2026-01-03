import React from 'react';
import { useColorScheme } from 'react-native';
import BatMascot from './BatMascot';
import MothMascot from './MothMascot';

export default function Mascot({ mood }) {
  const theme = useColorScheme();

  if (theme === 'dark') {
    return <BatMascot mood={mood} />;
  }

  return <MothMascot mood={mood} />;
}
