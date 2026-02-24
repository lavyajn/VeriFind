import axios from 'axios';

// REPLACE THIS WITH YOUR LAPTOP'S ACTUAL IP ADDRESS
const BACKEND_URL = 'http://10.215.180.158:5000/api'; 

export const reportItemStolen = async (tokenId) => {
    try {
        const response = await axios.post(`${BACKEND_URL}/report-stolen`, {
            tokenId: tokenId
        });
        return response.data;
    } catch (error) {
        console.error("API Error:", error.response ? error.response.data : error.message);
        throw error;
    }
};

export const checkDeviceStatus = async (tokenId) => {
    try {
        const response = await axios.get(`${BACKEND_URL}/status/${tokenId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching status:", error);
        return { success: false, error: "Network error" };
    }
};

export const reportItemRecovered = async (tokenId) => {
    try {
        const response = await axios.post(`${BACKEND_URL}/recover/${tokenId}`);
        return response.data;
    } catch (error) {
        console.error("Error reporting recovered:", error);
        return { success: false, error: "Network error" };
    }
};

export const fetchMeshAlerts = async () => {
    try {
        const response = await axios.get(`${BACKEND_URL}/alerts`);
        return response.data;
    } catch (error) {
        console.error("Error fetching alerts:", error);
        return { success: false, alerts: [] };
    }
};

export const transferAssetOwner = async (tokenId, newOwner) => {
    try {
        const response = await axios.post(`${BACKEND_URL}/transfer`, { tokenId, newOwner });
        return response.data;
    } catch (error) {
        // We want the exact Smart Contract rejection message!
        return { success: false, error: error.response?.data?.error || "Transfer failed" };
    }
};

export const pingDeviceLocation = async (tokenId, lat, lon) => {
    try {
        await axios.post(`${BACKEND_URL}/ping-location`, { tokenId, lat, lon });
    } catch (error) {
        console.error("Failed to ping location");
    }
};