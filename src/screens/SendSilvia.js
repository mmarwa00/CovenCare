import React from 'react';
import SendItemScreen from '../components/SendItemScreen';
import { useTheme } from '../context/ThemeContext';

export default function SendSilvia({ route, navigation }) {
  const { isDarkMode } = useTheme();
  const DM_TEXT = '#e3d2f0ff';

  const itemData = route.params || {};

  return (
    <SendItemScreen
      navigation={navigation}
      selectedItem={itemData}
      itemType="silvia"
      backgroundImage={require('../../assets/icons/BackgroundStars.png')}
      titleColor={isDarkMode ? DM_TEXT : '#4a148c'}
      textColor={isDarkMode ? DM_TEXT : '#4a148c'}
      forceRecipient={true} 
    />
  );
}
