import React from 'react';
import SendItemScreen from '../components/SendItemScreen';

export default function SendVoucher({ route, navigation }) {
  // 🌟 KORREKTUR: Flexible Suche nach dem Datenobjekt (REVISED)
  // The data object IS the route.params itself if the previous screen passes it directly.
  const itemData = route.params || {}; 

  return (
    <SendItemScreen
      navigation={navigation}
      // Pass the entire parameter object.
      selectedItem={itemData} 
      itemType="voucher"
      backgroundImage={require('../../assets/icons/BackgroundStars.png')}
    />
  );
}