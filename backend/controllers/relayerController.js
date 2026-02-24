const { ethers } = require('ethers');
const Item = require('../models/Item');

// Load the ABI. Adjust the path if you saved it somewhere else!
const contractABI = require('../../blockchain/config/contractABI.json'); 
// In-memory database for live Mesh Network alerts
let activeMeshAlerts = [];

exports.reportStolenGasless = async (req, res) => {
    try {
        const { tokenId } = req.body;

        if (tokenId === undefined) {
            return res.status(400).json({ success: false, error: 'Token ID is required' });
        }

        // 1. Set up the connection to Polygon Amoy
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        
        // 2. Boot up the Server's Wallet using the Private Key
        const relayerWallet = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY, provider);
        
        // 3. Connect to the Smart Contract
        const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI, relayerWallet);

        console.log(`Relayer preparing to flag Token ID: ${tokenId} as stolen...`);

        // 4. Send the Transaction to the Blockchain
        // Because we are using the relayerWallet, the server pays the gas!
        const tx = await contract.reportStolen(tokenId);
        
        console.log(`Transaction sent! Waiting for confirmation... Hash: ${tx.hash}`);
        
        // Wait for the blockchain to officially mine the block
        const receipt = await tx.wait();
        // NEW: Broadcast to Mesh Network
        const exists = activeMeshAlerts.find(a => a.id === tokenId.toString());
        if (!exists) {
            // Get the current local time (e.g., "1:01 PM")
            const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            activeMeshAlerts.unshift({
                id: tokenId.toString(),
                token: '#' + tokenId,
                model: 'VeriFind Protected Asset', 
                time: currentTime,
                distance: '0.2 miles away'
            });
        }

        res.status(200).json({
            success: true,
            message: "Item successfully flagged as STOLEN on the blockchain!",
            txHash: receipt.hash
        });

    } catch (error) {
        console.error("Relayer Transaction Failed:", error);
        
        // Catch common smart contract errors (like "Not authorized")
        let errorMessage = error.reason || error.message;
        res.status(500).json({ success: false, error: errorMessage });
    }
};

// NEW: Check the true status of a device on the blockchain
exports.checkStatus = async (req, res) => {
    try {
        const tokenId = req.params.id;
        
        // We only need a provider to read data (no wallet/gas required)
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI, provider);

        // Fetch the struct from the blockchain
        const itemData = await contract.items(tokenId);
        
        // Translate the Solidity Enum (0 = SECURE, 1 = STOLEN, 2 = RECOVERED)
        const statusEnum = itemData[1].toString();
        let readableStatus = "SECURE";
        if (statusEnum === "1") readableStatus = "STOLEN";
        if (statusEnum === "2") readableStatus = "RECOVERED";

        res.json({
            success: true,
            isMinted: itemData[3], 
            status: readableStatus
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Failed to read blockchain" });
    }
};

// NEW: Unlock a recovered device
exports.markRecovered = async (req, res) => {
    try {
        const tokenId = req.params.id;
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const wallet = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY, provider);
        const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI, wallet);

        console.log(`Relayer preparing to UNLOCK Token ID: ${tokenId}...`);
        const tx = await contract.reportRecovered(tokenId);
        await tx.wait();
        // NEW: Remove from Mesh Network
     activeMeshAlerts = activeMeshAlerts.filter(a => a.id !== tokenId.toString());

        res.json({ success: true, txHash: tx.hash });
    } catch (error) {
        console.error("Recovery Error:", error);
        res.status(500).json({ success: false, error: "Failed to unlock device." });
    }
};

// NEW: Get all active BOLO alerts
exports.getActiveAlerts = (req, res) => {
    res.json({ success: true, alerts: activeMeshAlerts });
};

// NEW: Transfer Ownership (Secondary Market)
exports.transferAsset = async (req, res) => {
    try {
        const { tokenId, newOwner } = req.body;
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const wallet = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY, provider);
        const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI, wallet);

        console.log(`Attempting to transfer Token ID ${tokenId} to ${newOwner}...`);
        const tx = await contract.transferAsset(newOwner, tokenId);
        await tx.wait();

        res.json({ success: true, txHash: tx.hash });
    } catch (error) {
        console.error("Transfer Error:", error);
        // We want to pass the exact blockchain rejection message to the frontend!
        res.status(500).json({ success: false, error: error.reason || "Transfer blocked by smart contract." });
    }
};

// NEW: Live GPS Geotagging for Mesh Network
exports.pingLocation = (req, res) => {
    const { tokenId, lat, lon } = req.body;
    
    // Find the alert in our live memory and update its GPS location
    const alert = activeMeshAlerts.find(a => a.id === tokenId.toString());
    if (alert) {
        alert.distance = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    }
    res.json({ success: true });
};