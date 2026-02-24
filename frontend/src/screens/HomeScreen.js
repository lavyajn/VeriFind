import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions, FlatList, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { fetchMeshAlerts } from '../utils/api'; 
import AsyncStorage from '@react-native-async-storage/async-storage';


const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // useFocusEffect triggers every time this screen becomes active
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadAlerts = async () => {
        setLoading(true);
        const data = await fetchMeshAlerts();
        if (isActive && data.success) {
          setAlerts(data.alerts);
        }
        if (isActive) setLoading(false);
      };

      loadAlerts();

      return () => { isActive = false; };
    }, [])
  );

  const renderAlert = ({ item }) => (
    <View style={styles.alertCard}>
      <View style={styles.alertHeader}>
        <View style={styles.alertPulse} />
        <Text style={styles.alertTitle}>BOLO ALERT</Text>
        <Text style={styles.alertTime}>{item.time}</Text>
      </View>
      <Text style={styles.alertDevice}>{item.model} <Text style={styles.alertToken}>({item.token})</Text></Text>
      <Text style={styles.alertDistance}>📍 Last pinged: {item.distance}</Text>
    </View>
  );

  const handleLogout = async () => {
  await AsyncStorage.removeItem('userWallet');
  await AsyncStorage.removeItem('userName');
  navigation.replace('AuthScreen');
};

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
{/* Header Section */}
{/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.logoText}>Veri<Text style={styles.logoHighlight}>Find</Text></Text>
          <Text style={styles.tagline}>Decentralized Asset Protection</Text>
          
          {/* 🔥 SLEEK TOP-RIGHT LOGOUT ARROW */}
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton} activeOpacity={0.7}>
            <Text style={styles.logoutArrow}>➔</Text>
          </TouchableOpacity>
        </View>

        {/* Network Stats Card */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Network Status</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <View style={styles.pulseDot} />
              <Text style={styles.statLabel}>Nodes Active</Text>
              <Text style={styles.statValue}>124</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Assets Secured</Text>
              <Text style={styles.statValue}>8,492</Text>
            </View>
          </View>
        </View>

        {/* MESH NETWORK FEED */}
        <View style={styles.feedContainer}>
          <Text style={styles.feedTitle}>⚠️ ACTIVE MESH ALERTS</Text>
          {loading ? (
             <ActivityIndicator size="small" color="#FF3B30" style={{ marginTop: 20 }} />
          ) : alerts.length === 0 ? (
             <Text style={styles.emptyFeedText}>No active alerts in your area. All assets secure.</Text>
          ) : (
            <FlatList 
              data={alerts}
              keyExtractor={item => item.id}
              renderItem={renderAlert}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          )}
        </View>
        {/* The Primary Action - UPGRADED UI */}
        {/* The Primary Action - MATCHING RECTANGLES */}
        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={[styles.actionButton, { marginRight: 10, backgroundColor: '#007AFF', shadowColor: '#007AFF' }]} 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('ScannerScreen')} 
          >
            <Text style={styles.actionButtonText}>📷 SCAN</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#000', shadowColor: '#000' }]} 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('MintScreen')} 
          >
            <Text style={styles.actionButtonText}>⚙️ MINT</Text>
          </TouchableOpacity>
        </View>
    
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F2F2F7' },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 20, justifyContent: 'space-between' },
  
  header: { marginTop: 20, alignItems: 'center', position: 'relative', width: '100%' },
  logoText: { fontSize: 42, fontWeight: '900', color: '#1C1C1E', letterSpacing: -1 },
  logoHighlight: { color: '#007AFF' },
  tagline: { fontSize: 14, color: '#8E8E93', marginTop: 5, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.5 },
  
  // NEW LOGOUT STYLES
  logoutButton: { position: 'absolute', right: 0, top: 5, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#fcfcfc', borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 15, elevation: 5 },
  logoutArrow: { color: '#007AFF', fontSize: 20, fontWeight: '900' },
  
  statsCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 15, elevation: 5, marginTop: 30 },
  statsTitle: { fontSize: 14, color: '#8E8E93', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 20 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statBox: { flex: 1 },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#34C759', position: 'absolute', right: 10, top: 6 },
  statLabel: { fontSize: 13, color: '#8E8E93', fontWeight: '500', marginBottom: 4 },
  statValue: { fontSize: 28, fontWeight: '800', color: '#1C1C1E' },
  divider: { width: 1, height: 40, backgroundColor: '#E5E5EA', marginHorizontal: 15 },
  
  feedContainer: { flex: 1, marginTop: 30 },
  feedTitle: { fontSize: 14, color: '#8E8E93', fontWeight: '700', letterSpacing: 1, marginBottom: 15 },
  emptyFeedText: { color: '#8E8E93', textAlign: 'center', marginTop: 20, fontWeight: '500' },
  alertCard: { backgroundColor: '#FFEBEA', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#FFD1CE' },
  alertHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  alertPulse: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF3B30', marginRight: 8 },
  alertTitle: { fontSize: 14, fontWeight: '800', color: '#FF3B30', flex: 1, letterSpacing: 0.5 },
  alertTime: { fontSize: 12, color: '#FF3B30', fontWeight: '600', opacity: 0.8 },
  alertDevice: { fontSize: 16, fontWeight: '700', color: '#1C1C1E', marginBottom: 4 },
  alertToken: { color: '#8E8E93', fontWeight: '500' },
  alertDistance: { fontSize: 13, color: '#1C1C1E', fontWeight: '500', opacity: 0.7 },
  
  actionSection: { paddingVertical: 20, alignItems: 'center' },
  scanButton: { backgroundColor: '#007AFF', width: width - 48, paddingVertical: 20, borderRadius: 20, alignItems: 'center', shadowColor: '#007AFF', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  scanButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', letterSpacing: 1 },
 actionRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15 },
  actionButton: { flex: 1, paddingVertical: 18, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  actionButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
});