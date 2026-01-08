import React, { useState } from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
import { Menu, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

export default function Header() {
  const [menuVisible, setMenuVisible] = useState(false);
  const navigation = useNavigation();
  const { colors } = useTheme();

  return (
    <View style={[styles.header, { backgroundColor: colors.cardBackground }]}>
      {/* LEFT SIDE: Logo + Subtitle */}
      <View style={styles.leftRow}>
        <Image 
          source={require('../../assets/Logo/logo_Main.png')}
          style={styles.logo}
        />
        <Text style={[styles.subtitle, { color: colors.text }]}>
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
            iconColor={colors.accent}
            size={24}
            onPress={() => setMenuVisible(true)}
          />
        }
      >
        <Menu.Item
          onPress={() => {
            setMenuVisible(false);
            navigation.navigate('SettingsScreen');
          }}
          title="Settings"
        />

        <Menu.Item
          onPress={() => {
            setMenuVisible(false);
            navigation.navigate('ProfileScreen');
          }}
          title="Profile"
        />
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
    flexShrink: 1,
    flexWrap: 'wrap',
    maxWidth: 200,
  },
});
