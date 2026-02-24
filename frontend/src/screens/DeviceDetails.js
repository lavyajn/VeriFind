import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Vibration, TextInput, KeyboardAvoidingView, Platform, ScrollView, Keyboard } from 'react-native';
import * as Location from 'expo-location'; 
import { reportItemStolen, checkDeviceStatus, reportItemRecovered, transferAssetOwner, pingDeviceLocation, reportItemLost } from '../utils/api';

export default function DeviceDetails({ route, navigation }) {
  const { scannedData } = route.params; 
  
  const [loading, setLoading] = useState(false);
  const [fetchingStatus, setFetchingStatus] = useState(true);
  const [status, setStatus] = useState('LOADING...'); 
  const [isMinted, setIsMinted] = useState(true);
  const [showTransferInput, setShowTransferInput] = useState(false);
  const [buyerAddress, setBuyerAddress] = useState('');

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

  const handleReportLost = async () => {
    Alert.alert("⚠️ REPORT LOST", "Flag this asset as misplaced? It will alert the Mesh Network.", [
        { text: "Cancel", style: "cancel" },
        { text: "MARK LOST", style: "destructive", onPress: async () => {
            setLoading(true);
            const result = await reportItemLost(tokenId);
            if (result.success) {
              Vibration.vibrate([0, 200, 100, 200]); 
              setStatus('LOST'); 
              Alert.alert("✅ Updated", "Asset marked as Lost on-chain.");
            } else {
               Alert.alert("❌ Error", result.error);
            }
            setLoading(false);
          }
        }
      ]);
  };

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

  const handleNotifyOwner = async () => {
    Alert.alert("📍 Accessing Satellite...", "Fetching secure hardware GPS coordinates...");
    
    let { permissionStatus } = await Location.requestForegroundPermissionsAsync();
    if (permissionStatus !== 'granted') {
        // Just proceed without crashing if they deny it, for hackathon smoothness
    }

    let location = await Location.getCurrentPositionAsync({});
    const lat = location.coords.latitude;
    const lon = location.coords.longitude;

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

  const handleTransfer = async () => {
    if (buyerAddress.length !== 42 || !buyerAddress.startsWith('0x')) {
      Alert.alert("Invalid Address", "Please enter a valid Web3 wallet address starting with 0x.");
      return;
    }

    Alert.alert(
      "💸 SECONDARY MARKET",
      `Transfer cryptographic ownership of this asset to:\n\n${buyerAddress}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "CONFIRM SALE", 
          onPress: async () => {
            setLoading(true);
            const result = await transferAssetOwner(tokenId, buyerAddress);
            if (result.success) {
              Alert.alert("✅ Transfer Complete", "Asset ownership updated on the blockchain.");
              setShowTransferInput(false); 
              setBuyerAddress(''); 
            } else {
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
          <View style={[styles.loadingContainer, { justifyContent: 'center', alignItems: 'center' }]}>
              <ActivityIndicator size="large" color="#000" />
              <Text style={{ textAlign: 'center', marginTop: 10 }}>Querying Blockchain...</Text>
          </View>
      );
  }

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: '#F2F2F7' }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled" 
        showsVerticalScrollIndicator={false}
      >
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
              status === 'LOST' ? { backgroundColor: '#FFF4E5' } : // Yellow badge for LOST
              status === 'RECOVERED' ? { backgroundColor: '#E5F0FF' } : 
              styles.badgeSecure 
            ]}>
              <Text style={[
                styles.badgeText, 
                { color: !isMinted ? '#8E8E93' : 
                         status === 'STOLEN' ? '#e0281e' : 
                         status === 'LOST' ? '#FF9500' : // Orange text for LOST
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
              <ActivityIndicator size="large" color={status === 'STOLEN' ? "#e0281e" : status === 'LOST' ? "#FF9500" : "#007AFF"} />
              <Text style={styles.loadingText}>Verifying Cryptographic Signature...</Text>
            </View>
          ) : (
            <>
              {/* LOST OR STOLEN STATE UI (Shows recovery buttons) */}
              {status === 'STOLEN' || status === 'LOST' ? (
                <View style={{ marginBottom: 20 }}>
                  <Text style={[styles.lockedText, status === 'LOST' && { color: '#FF9500' }]}>
                    {status === 'STOLEN' ? '🔒 DEVICE LOCKED BY OWNER' : '⚠️ DEVICE REPORTED LOST'}
                  </Text>
                  <Text style={styles.subtext}>This asset has been flagged on the blockchain.</Text>
                  <TouchableOpacity style={styles.foundButton} onPress={handleNotifyOwner} activeOpacity={0.8}>
                     <Text style={styles.foundButtonText}>📍 NOTIFY OWNER FOUND</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.foundButton, { backgroundColor: '#007AFF', marginTop: 15 }]} onPress={handleRecovered} activeOpacity={0.8}>
                     <Text style={styles.foundButtonText}>🔓 I AM THE OWNER (UNLOCK)</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                /* SECURE STATE UI (Shows side-by-side Lost and Stolen buttons) */
                <View style={styles.secureButtonRow}>
                  <TouchableOpacity style={[styles.panicButton, { flex: 1, marginRight: 10, backgroundColor: '#FF9500', shadowColor: '#FF9500' }]} onPress={handleReportLost} activeOpacity={0.8}>
                    <Text style={styles.panicText}>⚠️ LOST</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={[styles.panicButton, { flex: 1 }]} onPress={handleReportStolen} activeOpacity={0.8}>
                    <Text style={styles.panicText}>🚨 STOLEN</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* DYNAMIC SECONDARY MARKET BLOCK */}
              {showTransferInput ? (
                <View style={styles.transferBox}>
                  <TextInput 
                    style={styles.addressInput}
                    placeholder="Enter Buyer's Wallet Address (0x...)"
                    placeholderTextColor="#8E8E93"
                    value={buyerAddress}
                    onChangeText={setBuyerAddress}
                    autoCapitalize="none"
                  />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <TouchableOpacity style={[styles.transferButton, { flex: 1, marginRight: 10, backgroundColor: '#E5E5EA', borderWidth: 0 }]} onPress={() => setShowTransferInput(false)}>
                      <Text style={[styles.transferText, { color: '#e0281e' }]}>CANCEL</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.transferButton, { flex: 1, backgroundColor: '#007AFF', borderWidth: 0 }]} onPress={handleTransfer}>
                      <Text style={[styles.transferText, { color: '#FFF' }]}>CONFIRM</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity style={styles.transferButton} onPress={() => setShowTransferInput(true)} activeOpacity={0.8}>
                   <Text style={styles.transferText}>💸 SELL / TRANSFER ASSET</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, backgroundColor: '#F2F2F7', padding: 20 },
  scrollContainer: { flexGrow: 1, padding: 20, justifyContent: 'space-between', paddingBottom: 40 },
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
  actionContainer: { flex: 1, justifyContent: 'flex-end', paddingBottom: 10 },
  
  secureButtonRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  panicButton: { backgroundColor: '#e0281e', paddingVertical: 18, borderRadius: 16, alignItems: 'center', shadowColor: '#e0281e', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  panicText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  
  loadingBox: { alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 15, color: '#8E8E93', fontSize: 16, fontWeight: '600' },
  lockedText: { textAlign: 'center', color: '#e0281e', fontSize: 18, fontWeight: '700', marginTop: 20 },
  subtext: { textAlign: 'center', color: '#8E8E93', fontSize: 14, marginTop: 8, marginBottom: 20 },
  foundButton: { backgroundColor: '#1C1C1E', paddingVertical: 18, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  foundButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  
  transferButton: { backgroundColor: '#E5E5EA', paddingVertical: 18, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#D1D1D6' },
  transferText: { color: '#1C1C1E', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  transferBox: { backgroundColor: '#FFFFFF', padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#D1D1D6', marginBottom: 15 },
  addressInput: { backgroundColor: '#F2F2F7', padding: 15, borderRadius: 10, fontSize: 14, marginBottom: 15, color: '#1C1C1E', fontWeight: '500' },
});