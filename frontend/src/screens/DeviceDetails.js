import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Vibration } from 'react-native';
import * as Location from 'expo-location'; // NEW GPS IMPORT
import { reportItemStolen, checkDeviceStatus, reportItemRecovered, transferAssetOwner, pingDeviceLocation } from '../utils/api';

export default function DeviceDetails({ route, navigation }) {
  const { scannedData } = route.params; 
  
  const [loading, setLoading] = useState(false);
  const [fetchingStatus, setFetchingStatus] = useState(true);
  const [status, setStatus] = useState('LOADING...'); 
  const [isMinted, setIsMinted] = useState(true);

  const cleanString = String(scannedData).replace(/[^0-9]/g, '');
  const tokenId = cleanString !== '' ? parseInt(cleanString) : 0; 

  useEffect(() => {
    const fetchStatus = async () => {
      const data = await checkDeviceStatus(tokenId);
      if (data.success) {
        setStatus(data.status);
        setIsMinted(data.isMinted);
      } else {
        setStatus('UNKNOWN');
      }
      setFetchingStatus(false);
    };
    fetchStatus();
  }, [tokenId]);

  const handleReportStolen = async () => {
    Alert.alert(
      "🚨 SECURE LOCKDOWN",
      "Flag this asset as STOLEN on the blockchain? This action is irreversible.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "LOCK DEVICE", 
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            const result = await reportItemStolen(tokenId);
            if (result.success) {
              Vibration.vibrate([0, 500, 200, 500]); 
              setStatus('STOLEN'); 
              Alert.alert("✅ Transaction Confirmed", "Asset locked on-chain.");
            } else {
               Alert.alert("❌ Error", result.error || "Transaction failed.");
            }
            setLoading(false);
          }
        }
      ]
    );
  };

  // NEW: Hardware GPS Integration
  const handleNotifyOwner = async () => {
    Alert.alert("📍 Accessing Satellite...", "Fetching secure hardware GPS coordinates...");
    
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission Denied", "Cannot access hardware location.");
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    const lat = location.coords.latitude;
    const lon = location.coords.longitude;

    // Ping the backend Mesh Network with live coordinates!
    await pingDeviceLocation(tokenId, lat, lon);

    Alert.alert(
      "📍 Location Secured & Shared", 
      `The owner has been notified via the Mesh Network.\n\nCoordinates: ${lat.toFixed(4)}, ${lon.toFixed(4)}`,
      [{ text: "Done", style: "default" }]
    );
  };

  const handleRecovered = async () => {
    Alert.alert(
      "🔓 UNLOCK ASSET",
      "Are you the owner? Restore the asset to a SECURE state.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "CONFIRM RECOVERY", 
          onPress: async () => {
            setLoading(true);
            const result = await reportItemRecovered(tokenId);
            if (result.success) {
              Vibration.vibrate([0, 250, 250, 250]);
              setStatus('RECOVERED'); 
              Alert.alert("✅ Asset Unlocked", "The blockchain has been updated.");
            } else {
               Alert.alert("❌ Error", result.error || "Transaction failed.");
            }
            setLoading(false);
          }
        }
      ]
    );
  };

  // NEW: The Black Market Block
  const handleTransfer = async () => {
    // Hardcoded Hardhat Account #1 for the hackathon demo
    const dummyBuyer = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; 
    
    Alert.alert(
      "💸 SECONDARY MARKET",
      `Transfer cryptographic ownership of this asset to Buyer Wallet:\n\n${dummyBuyer.substring(0,8)}...${dummyBuyer.slice(-6)}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "CONFIRM SALE", 
          onPress: async () => {
            setLoading(true);
            const result = await transferAssetOwner(tokenId, dummyBuyer);
            if (result.success) {
              Alert.alert("✅ Transfer Complete", "Asset ownership updated on the blockchain.");
            } else {
              // THIS IS THE MONEY SHOT: The smart contract violently rejects the transaction!
              Alert.alert("❌ BLOCKCHAIN REJECTED", result.error);
            }
            setLoading(false);
          }
        }
      ]
    );
  };

  if (fetchingStatus) {
      return (
          <View style={[styles.container, { justifyContent: 'center' }]}>
              <ActivityIndicator size="large" color="#000" />
              <Text style={{ textAlign: 'center', marginTop: 10 }}>Querying Blockchain...</Text>
          </View>
      );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Asset Dashboard</Text>
        <Text style={styles.subtitle}>Decentralized Verification</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Token ID</Text>
          <Text style={styles.value}>#{tokenId}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.label}>Network Status</Text>
          <View style={[
            styles.badge, 
            !isMinted ? { backgroundColor: '#E5E5EA' } : 
            status === 'STOLEN' ? styles.badgeStolen : 
            status === 'RECOVERED' ? { backgroundColor: '#E5F0FF' } : 
            styles.badgeSecure 
          ]}>
            <Text style={[
              styles.badgeText, 
              { color: !isMinted ? '#8E8E93' : 
                       status === 'STOLEN' ? '#FF3B30' : 
                       status === 'RECOVERED' ? '#007AFF' : 
                       '#34C759' }
            ]}>
              {!isMinted ? 'INVALID' : status}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.actionContainer}>
        {!isMinted ? (
           <Text style={styles.lockedText}>⚠️ UNREGISTERED DEVICE</Text>
        ) : loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={status === 'STOLEN' ? "#007AFF" : "#ff3b30"} />
            <Text style={styles.loadingText}>Verifying Cryptographic Signature...</Text>
          </View>
        ) : (
          <>
            {/* STOLEN STATE UI */}
            {status === 'STOLEN' ? (
              <View style={{ marginBottom: 20 }}>
                <Text style={styles.lockedText}>🔒 DEVICE LOCKED BY OWNER</Text>
                <Text style={styles.subtext}>This asset has been reported stolen on the blockchain.</Text>
                <TouchableOpacity style={styles.foundButton} onPress={handleNotifyOwner} activeOpacity={0.8}>
                   <Text style={styles.foundButtonText}>📍 NOTIFY OWNER FOUND</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.foundButton, { backgroundColor: '#007AFF', marginTop: 15 }]} onPress={handleRecovered} activeOpacity={0.8}>
                   <Text style={styles.foundButtonText}>🔓 I AM THE OWNER (UNLOCK)</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* SECURE STATE UI */
              <TouchableOpacity style={styles.panicButton} onPress={handleReportStolen} activeOpacity={0.8}>
                <Text style={styles.panicText}>🚨 REPORT STOLEN</Text>
              </TouchableOpacity>
            )}

            {/* THE BLACK MARKET BLOCK BUTTON (Always visible for demo purposes) */}
            <TouchableOpacity style={styles.transferButton} onPress={handleTransfer} activeOpacity={0.8}>
               <Text style={styles.transferText}>💸 SELL / TRANSFER ASSET</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7', padding: 20 },
  header: { marginTop: 40, marginBottom: 30, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: '#1C1C1E', letterSpacing: 0.5 },
  subtitle: { fontSize: 14, color: '#8E8E93', marginTop: 5, textTransform: 'uppercase', letterSpacing: 1 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5, marginBottom: 40 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 10 },
  divider: { height: 1, backgroundColor: '#E5E5EA', marginVertical: 15 },
  label: { fontSize: 16, color: '#8E8E93', fontWeight: '500' },
  value: { fontSize: 20, fontWeight: '700', color: '#1C1C1E' },
  badge: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12 },
  badgeSecure: { backgroundColor: '#E3F8E5' },
  badgeStolen: { backgroundColor: '#FFEBEA' },
  badgeText: { fontWeight: '800', fontSize: 14 },
  actionContainer: { flex: 1, justifyContent: 'flex-end', paddingBottom: 30 },
  panicButton: { backgroundColor: '#FF3B30', paddingVertical: 18, borderRadius: 16, alignItems: 'center', shadowColor: '#FF3B30', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5, marginBottom: 15 },
  panicText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', letterSpacing: 1 },
  loadingBox: { alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 15, color: '#8E8E93', fontSize: 16, fontWeight: '600' },
  lockedText: { textAlign: 'center', color: '#FF3B30', fontSize: 18, fontWeight: '700', marginTop: 20 },
  subtext: { textAlign: 'center', color: '#8E8E93', fontSize: 14, marginTop: 8, marginBottom: 20 },
  foundButton: { backgroundColor: '#1C1C1E', paddingVertical: 18, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  foundButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  
  // NEW TRANSFER BUTTON STYLES
  transferButton: { backgroundColor: '#E5E5EA', paddingVertical: 18, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#D1D1D6' },
  transferText: { color: '#1C1C1E', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
});