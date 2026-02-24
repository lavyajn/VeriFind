import React, { useState, useEffect} from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import QRCode from 'react-native-qrcode-svg';
import { mintGenesisDevice } from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function MintScreen({ navigation }) {
    const [make, setMake] = useState('');
    const [model, setModel] = useState('');
    const [serialNumber, setSerialNumber] = useState('');
    
    // 1. Change this to start completely blank!
    const [ownerAddress, setOwnerAddress] = useState(''); 
    
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [mintedTokenId, setMintedTokenId] = useState(null);

    useEffect(() => {
        const fetchWallet = async () => {
            const savedWallet = await AsyncStorage.getItem('userWallet');
            if (savedWallet) {
                // Instantly fills the text box with YOUR actual wallet
                setOwnerAddress(savedWallet); 
            }
        };
        fetchWallet();
    }, []);

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
        });

        if (!result.canceled) {
            setImage(result.assets[0]);
        }
    };

    const handleMint = async () => {
        if (!make || !model || !serialNumber || !ownerAddress || !image) {
            Alert.alert("Missing Data", "Please fill out all fields and attach an image.");
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('make', make);
        formData.append('model', model);
        formData.append('serialNumber', serialNumber);
        formData.append('ownerAddress', ownerAddress);
        formData.append('image', {
            uri: Platform.OS === 'ios' ? image.uri.replace('file://', '') : image.uri,
            type: 'image/jpeg', 
            name: `device_${serialNumber}.jpg`
        });

        const result = await mintGenesisDevice(formData);
        setLoading(false);

        if (result.success) {
            // Success! Trigger the QR Code UI
            setMintedTokenId(result.tokenId);
        } else {
            Alert.alert("❌ Minting Failed", result.error);
        }
    };

    // If successfully minted, show the QR Code Screen instead of the form!
    if (mintedTokenId !== null) {
        return (
            <View style={styles.successContainer}>
                <View style={styles.qrCard}>
                    <Text style={styles.successTitle}>ASSET SECURED</Text>
                    <Text style={styles.successSub}>Token #{mintedTokenId} minted to blockchain.</Text>
                    
                    <View style={styles.qrWrapper}>
                        <QRCode
                            value={mintedTokenId.toString()} // The scanner reads this number!
                            size={220}
                            color="black"
                            backgroundColor="white"
                        />
                    </View>
                    
                    <Text style={styles.instructionText}>Print this QR code and attach it to the physical asset packaging.</Text>
                </View>

                <TouchableOpacity style={styles.doneButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.doneButtonText}>RETURN TO DASHBOARD</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#F2F2F7' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
                <View style={styles.header}>
                    <Text style={styles.title}>Manufacturer Portal</Text>
                    <Text style={styles.subtitle}>Genesis Asset Minting</Text>
                </View>

                <View style={styles.card}>
                    <TouchableOpacity style={styles.imagePicker} onPress={pickImage} activeOpacity={0.8}>
                        {image ? (
                            <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                        ) : (
                            <View style={styles.placeholder}>
                                <Text style={styles.placeholderText}>📸 TAP TO ATTACH ASSET PHOTO</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <Text style={styles.label}>Make (e.g., Apple, Sony)</Text>
                    <TextInput style={styles.input} value={make} onChangeText={setMake} placeholder="Enter Make" placeholderTextColor="#8E8E93" />

                    <Text style={styles.label}>Model (e.g., MacBook Pro 16")</Text>
                    <TextInput style={styles.input} value={model} onChangeText={setModel} placeholder="Enter Model" placeholderTextColor="#8E8E93" />

                    <Text style={styles.label}>Hardware Serial Number</Text>
                    <TextInput style={styles.input} value={serialNumber} onChangeText={setSerialNumber} placeholder="SN-XXXXX" placeholderTextColor="#8E8E93" autoCapitalize="characters" />

                    <Text style={styles.label}>Initial Owner Wallet Address</Text>
                    <TextInput style={styles.input} value={ownerAddress} onChangeText={setOwnerAddress} placeholder="0x..." placeholderTextColor="#8E8E93" autoCapitalize="none" />
                </View>

                {loading ? (
                    <View style={styles.loadingBox}>
                        <ActivityIndicator size="large" color="#007AFF" />
                        <Text style={styles.loadingText}>Uploading to IPFS & Minting on-chain...</Text>
                    </View>
                ) : (
                    <TouchableOpacity style={styles.mintButton} onPress={handleMint} activeOpacity={0.8}>
                        <Text style={styles.mintText}>💎 MINT ASSET TO BLOCKCHAIN</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    scrollContainer: { flexGrow: 1, padding: 20, paddingBottom: 40 },
    header: { marginTop: 40, marginBottom: 20, alignItems: 'center' },
    title: { fontSize: 26, fontWeight: '800', color: '#1C1C1E' },
    subtitle: { fontSize: 13, color: '#007AFF', marginTop: 5, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700' },
    card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5, marginBottom: 20 },
    imagePicker: { height: 180, backgroundColor: '#F2F2F7', borderRadius: 15, overflow: 'hidden', marginBottom: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#D1D1D6', borderStyle: 'dashed' },
    imagePreview: { width: '100%', height: '100%' },
    placeholderText: { color: '#8E8E93', fontWeight: '700', fontSize: 14 },
    label: { fontSize: 14, color: '#8E8E93', fontWeight: '600', marginBottom: 8, marginLeft: 4 },
    input: { backgroundColor: '#F2F2F7', padding: 15, borderRadius: 12, fontSize: 16, color: '#1C1C1E', fontWeight: '500', marginBottom: 20 },
    
    // UPGRADED MINT BUTTON
    mintButton: { backgroundColor: '#000', paddingVertical: 20, borderRadius: 16, alignItems: 'center', shadowColor: '#007AFF', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5, marginTop: 10 },
    mintText: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
    
    loadingBox: { alignItems: 'center', padding: 20 },
    loadingText: { marginTop: 15, color: '#007AFF', fontSize: 16, fontWeight: '700' },

    // QR CODE SUCCESS UI
    successContainer: { flex: 1, backgroundColor: '#F2F2F7', padding: 20, justifyContent: 'center', alignItems: 'center' },
    qrCard: { backgroundColor: '#FFF', padding: 30, borderRadius: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 5, width: '100%' },
    successTitle: { fontSize: 24, fontWeight: '900', color: '#34C759', marginBottom: 8, letterSpacing: 1 },
    successSub: { fontSize: 16, color: '#8E8E93', fontWeight: '600', marginBottom: 30 },
    qrWrapper: { padding: 20, backgroundColor: '#FFF', borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, borderWidth: 1, borderColor: '#F2F2F7' },
    instructionText: { textAlign: 'center', color: '#8E8E93', marginTop: 30, fontSize: 14, fontWeight: '500', paddingHorizontal: 20 },
    doneButton: { backgroundColor: '#1C1C1E', width: '100%', paddingVertical: 20, borderRadius: 16, alignItems: 'center', marginTop: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
    doneButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
});