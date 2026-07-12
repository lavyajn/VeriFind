const Item = require('../models/Item');
const { ethers } = require('ethers');
const contractABI = require('../../blockchain/config/contractABI.json'); 

exports.reportStolenGasless = async (req, res) => {
    try {
        const { tokenId } = req.body;
        if (tokenId === undefined) return res.status(400).json({ success: false, error: 'Token ID is required' });

        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const wallet = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY, provider);
        const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI, wallet);

        const tx = await contract.reportStolen(tokenId);
        const receipt = await tx.wait();

        await Item.findOneAndUpdate({ tokenId: Number(tokenId) }, { status: 'STOLEN', statusUpdatedAt: new Date() });

        res.status(200).json({ success: true, txHash: receipt.hash });
    } catch (error) {
        res.status(500).json({ success: false, error: error.reason || error.message });
    }
};

exports.reportLostGasless = async (req, res) => {
    try {
        const { tokenId } = req.body;
        if (tokenId === undefined) return res.status(400).json({ success: false, error: 'Token ID is required' });

        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const wallet = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY, provider);
        const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI, wallet);

        const tx = await contract.reportLost(tokenId);
        const receipt = await tx.wait();

        await Item.findOneAndUpdate({ tokenId: Number(tokenId) }, { status: 'LOST', statusUpdatedAt: new Date() });

        res.status(200).json({ success: true, txHash: receipt.hash });
    } catch (error) {
        res.status(500).json({ success: false, error: error.reason || error.message });
    }
};

exports.markRecovered = async (req, res) => {
    try {
        const tokenId = req.params.id;
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const wallet = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY, provider);
        const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI, wallet);

        const tx = await contract.reportRecovered(tokenId);
        await tx.wait();

        // 🔥 Sync recovery to MongoDB (removes it from Mesh Network logic)
        await Item.findOneAndUpdate({ tokenId: Number(tokenId) }, { status: 'RECOVERED', lastLocation: null });

        res.json({ success: true, txHash: tx.hash });
    } catch (error) {
        res.status(500).json({ success: false, error: "Failed to unlock device." });
    }
};

exports.checkStatus = async (req, res) => {
    try {
        const tokenId = req.params.id;
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI, provider);

        const itemData = await contract.items(tokenId);

        // 🔥 THE SECRET SAUCE: Ask the blockchain exactly who owns this token!
        let ownerAddress = "Unknown";
        if (itemData[3] === true) { // If isMinted is true
            ownerAddress = await contract.ownerOf(tokenId);
        }

        const statusEnum = itemData[1].toString();
        let readableStatus = "SECURE";
        if (statusEnum === "1") readableStatus = "LOST";
        if (statusEnum === "2") readableStatus = "STOLEN";
        if (statusEnum === "3") readableStatus = "RECOVERED";

        res.json({ 
            success: true, 
            isMinted: itemData[3], 
            status: readableStatus,
            ownerAddress: ownerAddress.toLowerCase() // Send the owner to the frontend!
        });
    } catch (error) {
        res.status(500).json({ success: false, error: "Failed to read blockchain" });
    }
};

exports.transferAsset = async (req, res) => {
    try {
        const { tokenId, newOwner } = req.body;
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const wallet = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY, provider);
        const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI, wallet);

        const tx = await contract.transferAsset(newOwner, tokenId);
        await tx.wait();

        res.json({ success: true, txHash: tx.hash });
    } catch (error) {
        res.status(500).json({ success: false, error: error.reason || "Transfer blocked by smart contract." });
    }
};

exports.getActiveAlerts = async (req, res) => {
    try {
        const missingItems = await Item.find({ status: { $in: ['STOLEN', 'LOST'] } });
        
        const alerts = missingItems.map(dbItem => {
            //  THE FIX: Lock the time, and never use a live clock as a fallback!
            let exactTime = "Time Unknown";
            
            if (dbItem.statusUpdatedAt) {
                exactTime = new Date(dbItem.statusUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } else if (dbItem.updatedAt) {
                // Fallback to Mongoose's auto-updater if our custom field missed it
                exactTime = new Date(dbItem.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }

            const prefix = dbItem.status === 'STOLEN' ? '🚨 STOLEN:' : '⚠️ LOST:';
            const deviceName = (dbItem.make && dbItem.model) ? `${dbItem.make} ${dbItem.model}` : 'VeriFind Protected Asset';

            return {
                id: dbItem.tokenId.toString(),
                token: '#' + dbItem.tokenId,
                model: `${prefix} ${deviceName}`, 
                time: exactTime, // Locked perfectly in the past!
                distance: dbItem.lastLocation ? `📍 Pinged at: ${dbItem.lastLocation}` : 'Location Pending...'
            };
        });

        res.json({ success: true, alerts });
    } catch (error) {
        console.error("Alert Fetch Error:", error);
        res.status(500).json({ success: false, error: "Failed to fetch mesh alerts" });
    }
};

//  PING LOCATION (Save to MongoDB)
exports.pingLocation = async (req, res) => {
    try {
        const { tokenId, lat, lon } = req.body;
        const locationString = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
        
        // Permanently attach the GPS ping to the asset!
        await Item.findOneAndUpdate({ tokenId: Number(tokenId) }, { lastLocation: locationString });
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: "Failed to save location" });
    }
};