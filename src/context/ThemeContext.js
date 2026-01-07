import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load saved theme on app start
  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const saved = await AsyncStorage.getItem('theme');
      if (saved !== null) {
        setIsDarkMode(saved === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const toggleTheme = async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    try {
      await AsyncStorage.setItem('theme', newMode ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const theme = {
    isDarkMode,
    colors: isDarkMode ? darkColors : lightColors,
  };

  return (
    <ThemeContext.Provider value={{ ...theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

// LIGHT MODE COLORS (current)
const lightColors = {
  background: '#e3d2f0ff',
  cardBackground: '#d4a5ff',
  text: '#4a148c',
  textSecondary: '#5c3185ff',
  border: '#8b5cb8',
  accent: '#4a148c',
  buttonBg: '#4a148c',
  buttonText: '#ffffff',
  
  // Shadows
  shadowColor: '#000',
  shadowOpacity: 0.2,
};

// VAMPIRE MODE COLORS 🦇
const darkColors = {
  background: '#1a0a1f', // almost black with purple tint
  cardBackground: '#2d1b3d', // dark purple
  text: '#e0d4f0', // light purple/white
  textSecondary: '#a888c7',
  border: '#8b0a50',
  accent: '#8b0a50', 
  buttonBg: '#8b0a50', // BLOOD RED buttons
  buttonText: '#ffffff',
  
  // BLOOD RED GLOW
  shadowColor: '#8b0a50',
  shadowOpacity: 0.8,
};