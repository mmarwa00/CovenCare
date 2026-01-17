import React, { useState } from 'react';
import { View, Image, StyleSheet, Text, TouchableOpacity, Modal } from 'react-native';
import { IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

export default function Header() {
  const [menuVisible, setMenuVisible] = useState(false);
  const navigation = useNavigation();
  const { colors, isDarkMode, toggleTheme } = useTheme();

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

      {/* RIGHT SIDE: Menu Button */}
      <View>
        <IconButton
          icon="dots-vertical"
          iconColor={colors.accent}
          size={24}
          onPress={() => setMenuVisible(true)}
        />

        {/* Dropdown Menu */}
        {menuVisible && (
          <TouchableOpacity 
            style={styles.overlay} 
            activeOpacity={1} 
            onPress={() => setMenuVisible(false)}
          >
            <View style={[styles.menuDropdown, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  navigation.navigate('SettingsScreen');
                }}
              >
                <Text style={[styles.menuItemText, { color: colors.text }]}>Settings</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  navigation.navigate('ProfileScreen');
                }}
              >
                <Text style={[styles.menuItemText, { color: colors.text }]}>Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  toggleTheme();
                  setMenuVisible(false);
                }}
              >
                <Text style={[styles.menuItemText, { color: colors.text }]}>
                  {isDarkMode ? "☀️ Light Mode" : "🦇 Vampire Mode"}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      </View>
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
    fontSize: 12,
    flexShrink: 1,
    flexWrap: 'wrap',
    maxWidth: 200,
  },
  overlay: {
    position: 'absolute',
    top: 40,
    right: 0,
    zIndex: 9999,
  },
  menuDropdown: {
    minWidth: 180,
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuItemText: {
    fontSize: 16,
  },
});
