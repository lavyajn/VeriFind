import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// 1. Make sure all your screens are imported!
import HomeScreen from './src/screens/HomeScreen';
import ScannerScreen from './src/screens/ScannerScreen';
import DeviceDetails from './src/screens/DeviceDetails';
import MintScreen from './src/screens/MintScreen';
import AuthScreen from './src/screens/AuthScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="AuthScreen">
        
        {/* 2. Make sure the 'name' prop exactly matches what we used in navigation.navigate() */}
        <Stack.Screen name="HomeScreen" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ScannerScreen" component={ScannerScreen} options={{ title: 'Scan Asset' }} />
        <Stack.Screen name="DeviceDetails" component={DeviceDetails} options={{ title: 'Asset Status' }} />
        <Stack.Screen name="MintScreen" component={MintScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AuthScreen" component={AuthScreen} options={{ headerShown: false }} />
        
      </Stack.Navigator>
    </NavigationContainer>
  );
}