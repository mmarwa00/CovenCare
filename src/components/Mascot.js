import React from 'react';
import { useTheme } from '../context/ThemeContext';
import BatMascot from './BatMascot';
import MothMascot from './MothMascot';

export default function Mascot({ mood }) {
  const { isDarkMode } = useTheme();

  if (isDarkMode) {
    return <BatMascot mood={mood} />;
  }

  return <MothMascot mood={mood} />;
}