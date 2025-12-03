import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CalendarScreen from '../screens/CalendarScreen';
import CircleScreen from '../screens/CircleScreen';
import CircleDetailsScreen from '../screens/CircleDetailsScreen';
import VendingMachineMenu from '../screens/VendingMachineMenu';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import Vouchers from '../screens/Vouchers';
import SendVoucher from '../screens/SendVoucher';
import EventsPlaceholder from '../screens/EventsPlaceholder';
import StashPlaceholder from '../screens/StashPlaceholder';
import Alerts from '../screens/Alerts';
import SendAlert from '../screens/SendAlert';
import { useAuth } from '../context/AuthContext';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { isAuthenticated } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
            <Stack.Screen name="CalendarScreen" component={CalendarScreen} />
            <Stack.Screen name="CircleScreen" component={CircleScreen} />
            <Stack.Screen name="CircleDetails" component={CircleDetailsScreen} />
            <Stack.Screen name="VendingMachineMenu" component={VendingMachineMenu} />
            <Stack.Screen name="Vouchers" component={Vouchers} />
            <Stack.Screen name="SendVoucher" component={SendVoucher} />
            <Stack.Screen name="SendAlert" component={SendAlert} />
            <Stack.Screen name="Events" component={EventsPlaceholder} />
            <Stack.Screen name="Stash" component={StashPlaceholder} />
            <Stack.Screen name="Alerts" component={Alerts} />
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
