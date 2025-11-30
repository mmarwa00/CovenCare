import React, { useState } from 'react';
import { View, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Menu, IconButton } from 'react-native-paper';

export default function Header({ navigation }) {
    const [menuVisible, setMenuVisible] = useState(false);

    return (
        <View style={styles.header}>
            <Image 
                source={require('../../assets/Logo/logo_Main.png')}
                style={styles.logo}
            />
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
                }>
                <Menu.Item onPress={() => {}} title="Settings" />
                <Menu.Item onPress={() => {}} title="Privacy Policy" />
                <Menu.Item onPress={() => {}} title="Terms of Service" />
            </Menu>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        width: '100%',
        height: 80,
        backgroundColor: '#d4a5ff',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between', // Space between logo and menu
        paddingLeft: 15,
        paddingRight: 5,
    },
    logo: {
        width: 120,
        height: 40,
        resizeMode: 'contain',
    },
});