import React from 'react';
import { View, StyleSheet } from 'react-native';
import Header from './Header';
import FooterNav from './FooterNav';

export default function Layout({ children, subtitle, navigation, hideFooter }) {
    return (
        <View style={styles.container}>
            <Header subtitle={subtitle} />

            <View style={styles.content}>
                {children}
            </View>

            {!hideFooter && (
                <FooterNav navigation={navigation} />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f8ff',
    },
    content: {
        flex: 1,
        paddingBottom: 80, // space for footer
    },
});
