import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './src/screens/HomeScreen';
import ScannerScreen from './src/screens/ScannerScreen';
import DeviceDetails from './src/screens/DeviceDetails';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ title: 'AssetGuard Dashboard' }}
        />
        <Stack.Screen 
          name="Scanner" 
          component={ScannerScreen} 
          options={{ title: 'Scan Device QR' }}
        />
        <Stack.Screen name="DeviceDetails" component={DeviceDetails} options={{ title: 'Asset Details' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}