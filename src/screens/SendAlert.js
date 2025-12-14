import React from 'react';
import SendItemScreen from '../components/SendItemScreen';

export default function SendAlert({ route, navigation }) {
  const { alert } = route.params;

  return (
    <SendItemScreen
      navigation={navigation}
      selectedItem={alert}
      itemType="alert"
      backgroundImage={require('../../assets/icons/BackgroundStars.png')}
    />
  );
}