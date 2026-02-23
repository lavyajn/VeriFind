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