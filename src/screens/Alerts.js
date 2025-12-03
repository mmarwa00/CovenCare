import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Button, ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import Header from '../components/Header';
import Footer from '../components/Footer';