const { ethers } = require('ethers');
const Item = require('../models/Item');

// Load the ABI. Adjust the path if you saved it somewhere else!
const contractABI = require('../../blockchain/config/contractABI.json'); 

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
        
        // In Solidity Enum: 0 = REGISTERED (Secure), 1 = STOLEN
        const isStolen = itemData[1].toString() === "1";

        res.json({
            success: true,
            isMinted: itemData[3], // The armor boolean we added!
            status: isStolen ? "STOLEN" : "SECURE"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Failed to read blockchain" });
    }
};