import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginUser } from '../utils/api';

export default function AuthScreen({ navigation }) {
    const [name, setName] = useState('Lavya');
    const [email, setEmail] = useState('lavya@verifind.network');
    // Defaulting to Hardhat Account #0 for instant hackathon login
    const [walletAddress, setWalletAddress] = useState('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'); 
    const [loading, setLoading] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);

    // Auto-login if they already have a session!
    useEffect(() => {
        const checkSession = async () => {
            const savedWallet = await AsyncStorage.getItem('userWallet');
            if (savedWallet) {
                navigation.replace('HomeScreen'); 
            } else {
                setCheckingSession(false);
            }
        };
        checkSession();
    }, []);

    const handleLogin = async () => {
        if (!name || !email || !walletAddress) {
            Alert.alert("Missing Data", "Please fill out all fields.");
            return;
        }

        setLoading(true);
        const result = await loginUser(name, email, walletAddress);
        setLoading(false);

        if (result.success) {
            // Save session to local storage
            await AsyncStorage.setItem('userWallet', walletAddress.toLowerCase());
            await AsyncStorage.setItem('userName', name);
            navigation.replace('HomeScreen'); // Go to the main app!
        } else {
            Alert.alert("❌ Auth Failed", result.error);
        }
    };

    if (checkingSession) {
        return <View style={styles.container}><ActivityIndicator size="large" color="#007AFF" /></View>;
    }

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.logoText}>Veri<Text style={styles.logoHighlight}>Find</Text></Text>
                    <Text style={styles.subtitle}>Web3 Identity Portal</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.label}>Full Name</Text>
                    <TextInput style={styles.input} value={name} onChangeText={setName} placeholderTextColor="#8E8E93" />

                    <Text style={styles.label}>Email Address</Text>
                    <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#8E8E93" />

                    <Text style={styles.label}>Web3 Wallet Address (Public Key)</Text>
                    <TextInput style={styles.input} value={walletAddress} onChangeText={setWalletAddress} autoCapitalize="none" placeholderTextColor="#8E8E93" />

                    <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading} activeOpacity={0.8}>
                        {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.loginText}>AUTHENTICATE & ENTER</Text>}
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F2F2F7', justifyContent: 'center', padding: 24 },
    header: { alignItems: 'center', marginBottom: 40 },
    logoText: { fontSize: 48, fontWeight: '900', color: '#1C1C1E', letterSpacing: -1 },
    logoHighlight: { color: '#007AFF' },
    subtitle: { fontSize: 16, color: '#8E8E93', marginTop: 5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5 },
    card: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 5 },
    label: { fontSize: 14, color: '#8E8E93', fontWeight: '700', marginBottom: 8, marginLeft: 4, textTransform: 'uppercase' },
    input: { backgroundColor: '#F2F2F7', padding: 16, borderRadius: 12, fontSize: 16, color: '#1C1C1E', fontWeight: '500', marginBottom: 20 },
    loginButton: { backgroundColor: '#007AFF', paddingVertical: 20, borderRadius: 16, alignItems: 'center', shadowColor: '#007AFF', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5, marginTop: 10 },
    loginText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
});