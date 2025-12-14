import React from 'react';
import SendItemScreen from '../components/SendItemScreen';

export default function SendVoucher({ route, navigation }) {
  const { voucher } = route.params;

  return (
    <SendItemScreen
      navigation={navigation}
      selectedItem={voucher}
      itemType="voucher"
      backgroundImage={require('../../assets/icons/BackgroundStars.png')}
    />
  );
}