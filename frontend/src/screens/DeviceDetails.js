import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { reportItemStolen } from '../utils/api';

export default function DeviceDetails({ route, navigation }) {
  const { scannedData } = route.params; 
  const [loading, setLoading] = useState(false);

  // Clean the data to ensure it's a number
  const cleanString = String(scannedData).replace(/[^0-9]/g, '');
  const tokenId = cleanString !== '' ? parseInt(cleanString) : 0;

  const handleReportStolen = async () => {
    Alert.alert(
      "Confirm Action",
      "Are you sure you want to flag this asset as STOLEN on the blockchain?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Yes, Flag it", 
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              const result = await reportItemStolen(tokenId);
              if (result.success) {
                Alert.alert("Success", "Asset locked! Transaction Hash: " + result.txHash);
                navigation.navigate('Home'); 
              } else {
                 Alert.alert("Error", result.error || "Transaction failed.");
              }
            } catch (error) {
              Alert.alert("Error", "Failed to contact the backend.");
              console.log(error);
            }
            setLoading(false);
          }
        }
      ]
    );
  }; // <-- This bracket was likely missing!

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Asset Dashboard</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Token ID:</Text>
        <Text style={styles.value}>{tokenId}</Text>
        <Text style={styles.label}>Status:</Text>
        <Text style={[styles.value, { color: 'green' }]}>SECURE</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="red" style={{ marginTop: 20 }}/>
      ) : (
        <TouchableOpacity style={styles.panicButton} onPress={handleReportStolen}>
          <Text style={styles.panicText}>REPORT STOLEN</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  card: { backgroundColor: 'white', padding: 20, borderRadius: 10, width: '100%', elevation: 3, marginBottom: 30 },
  label: { fontSize: 14, color: '#666', marginTop: 10 },
  value: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  panicButton: { backgroundColor: '#ff3b30', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30, elevation: 5 },
  panicText: { color: 'white', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 }
});