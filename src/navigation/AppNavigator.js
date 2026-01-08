import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import AlertBox from '../screens/AlertBox';
import ProfileScreen from '../screens/ProfileScreen';
import CalendarScreen from '../screens/CalendarScreen';
import CircleScreen from '../screens/CircleScreen';
import CircleDetailsScreen from '../screens/CircleDetailsScreen';
import VendingMachineMenu from '../screens/VendingMachineMenu';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import Vouchers from '../screens/Vouchers';
import SendVoucher from '../screens/SendVoucher';
import SentVouchersScreen from '../screens/SentVouchersScreen';
import EventsScreen from '../screens/EventsScreen';
import CareBoxScreen from '../screens/CareBoxScreen';
import CareBoxDetails from '../screens/CareBoxDetails';
import SpellsScreen from '../screens/SpellsScreen';
import Alerts from '../screens/Alerts';
import SendAlert from '../screens/SendAlert';
import { useAuth } from '../context/AuthContext';
import SettingsScreen from '../screens/SettingsScreen';
import SilviaBirthdayScreen from '../screens/SilviaBirthdayScreen';
import SendSilvia from '../screens/SendSilvia';
import SilviaConfettiScreen from '../screens/SilviaConfettiScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import TermsOfServiceScreen from '../screens/TermsOfServiceScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { isAuthenticated } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>

            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="AlertBox" component={AlertBox} />
            <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
            <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
            <Stack.Screen name="SilviaBirthdayScreen" component={SilviaBirthdayScreen} />
            <Stack.Screen name="SendSilvia" component={SendSilvia} />
            <Stack.Screen name="CalendarScreen" component={CalendarScreen} />
            <Stack.Screen name="CircleScreen" component={CircleScreen} />
            <Stack.Screen name="CircleDetails" component={CircleDetailsScreen} />
            <Stack.Screen name="VendingMachineMenu" component={VendingMachineMenu} />
            <Stack.Screen name="Vouchers" component={Vouchers} />
            <Stack.Screen name="SendVoucher" component={SendVoucher} />
            <Stack.Screen name="SentVouchers" component={SentVouchersScreen} />
            <Stack.Screen name="SendAlert" component={SendAlert} />
            <Stack.Screen name="Spells" component={SpellsScreen} />
            <Stack.Screen name="Events" component={EventsScreen} />
            <Stack.Screen name="CareBox" component={CareBoxScreen} />
            <Stack.Screen name="Alerts" component={Alerts} />
            <Stack.Screen name="CareBoxDetails" component={CareBoxDetails} />
            <Stack.Screen
              name="SilviaConfetti"
              component={SilviaConfettiScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ title: 'Privacy Policy' }} />
            <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} options={{ title: 'Terms of Service' }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="Reset" component={ResetPasswordScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
