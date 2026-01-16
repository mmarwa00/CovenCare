import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import Header from './Header';
import Footer from './Footer';
import { useTheme } from '../context/ThemeContext';

export default function Layout({ children, subtitle, navigation, hideFooter }) {
    const { colors } = useTheme();

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.cardBackground }]}>
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <Header subtitle={subtitle} />

                <View style={[styles.content, { backgroundColor: colors.background }]}>
                    {children}
                </View>

                {!hideFooter && (
                    <Footer navigation={navigation} />
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingBottom: 80, // space for footer
    },
});
