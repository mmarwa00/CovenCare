import React, { useState } from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
import { Menu, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

export default function Header() {
  const [menuVisible, setMenuVisible] = useState(false);
  const navigation = useNavigation();

  return (
    <View style={styles.header}>
      {/* LEFT SIDE: Logo + Subtitle */}
      <View style={styles.leftRow}>
        <Image 
          source={require('../../assets/Logo/logo_Main.png')}
          style={styles.logo}
        />
        <Text style={styles.subtitle}>
          Your home base for tracking, support, and magic care.
        </Text>
      </View>

      {/* RIGHT SIDE: Menu */}
      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={
          <IconButton
            icon="dots-vertical"
            iconColor="#4a148c"
            size={24}
            onPress={() => setMenuVisible(true)}
          />
        }
      >
        <Menu.Item onPress={() => {}} title="Settings" />
        <Menu.Item
          onPress={() => {
            setMenuVisible(false);
            navigation.navigate('ProfileScreen');
          }}
          title="Profile"
        />
        <Menu.Item onPress={() => {}} title="Privacy Policy" />
        <Menu.Item onPress={() => {}} title="Terms of Service" />
      </Menu>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    paddingHorizontal: 5,
    paddingTop: 5,
    paddingBottom: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#d4a5ff',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  logo: {
    width: 120,
    height: 40,
    resizeMode: 'contain',
    marginRight: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#4a148c',
    flexShrink: 1,
    flexWrap: 'wrap',
    maxWidth: 200,
  },
});
