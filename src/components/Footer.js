import React from 'react';
import { View, TouchableOpacity, Image, StyleSheet, Text } from 'react-native';

export default function FooterNav({ navigation }) {
    return (
        <View style={styles.footer}>
            
            {/* Circles */}
            <TouchableOpacity 
                style={styles.footerItem}
                onPress={() => navigation.navigate('CircleScreen')}
            >
                <Image 
                    source={require('../../assets/icons/circles.png')}
                    style={styles.icon}
                />
                <Text style={styles.label}>Circles</Text>
            </TouchableOpacity>

            {/* Log */}
            <TouchableOpacity 
                style={styles.footerItem}
                onPress={() => navigation.navigate('CalendarScreen')}
            >
                <Image 
                    source={require('../../assets/icons/Log.png')}
                    style={styles.icon}
                />
                <Text style={styles.label}>Log</Text>
            </TouchableOpacity>

            {/* Potions */}
            <TouchableOpacity 
                style={styles.footerItem}
                onPress={() => navigation.navigate('VendingMachineMenu')}
            >
                <Image 
                    source={require('../../assets/icons/Potions1.png')}
                    style={styles.icon}
                />
                <Text style={styles.label}>Potions</Text>
            </TouchableOpacity>

        </View>
    );
}

const styles = StyleSheet.create({
    footer: {
        width: '100%',
        height: 100,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        position: 'absolute',
        bottom: 0,
        left: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderTopWidth: 1,
        borderTopColor: '#d4a5ff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 10,
    },
    footerItem: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    icon: {
        width: 70,
        height: 70,
        resizeMode: 'contain',
        marginBottom: 4,
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#4a148c',
    },
});