const pinataSDK = require('@pinata/sdk');
const fs = require('fs');
const Item = require('../models/Item');

// Initialize Pinata here so the controller has access to it
const pinata = new pinataSDK({
    pinataApiKey: process.env.PINATA_API_KEY,
    pinataSecretApiKey: process.env.PINATA_API_SECRET
});

exports.uploadImageAndSave = async (req, res) => {
    try {
        // 1. Check if a file was actually uploaded
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file provided' });
        }

        const { tokenId, serialNumber } = req.body;
        if (!tokenId || !serialNumber) {
            // If they forgot the text data, delete the uploaded temp file and throw an error
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ success: false, error: 'Token ID and Serial Number are required' });
        }

        // 2. Read the file from the temporary uploads folder
        const readableStreamForFile = fs.createReadStream(req.file.path);
        
        const options = {
            pinataMetadata: {
                name: `AssetGuard_Item_${tokenId}`,
            },
            pinataOptions: {
                cidVersion: 0
            }
        };

        // 3. Send to IPFS via Pinata
        const pinataResponse = await pinata.pinFileToIPFS(readableStreamForFile, options);
        const ipfsHash = pinataResponse.IpfsHash;

        // 4. Save the reference in MongoDB
        const newItem = new Item({
            tokenId: parseInt(tokenId),
            serialNumber: serialNumber,
            ipfsImageHash: ipfsHash
        });

        const savedItem = await newItem.save();

        // 5. Clean up! Delete the file from our local server memory
        fs.unlinkSync(req.file.path);

        res.status(201).json({
            success: true,
            message: "File successfully pinned to IPFS and saved to DB!",
            ipfsUrl: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
            data: savedItem
        });

    } catch (error) {
        console.error("IPFS Upload Error:", error);
        // If it fails, try to clean up the temp file anyway
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ success: false, error: error.message });
    }
};