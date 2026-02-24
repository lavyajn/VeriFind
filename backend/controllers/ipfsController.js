const pinataSDK = require('@pinata/sdk');
const fs = require('fs');
const { ethers } = require('ethers');
const Item = require('../models/Item');
const contractABI = require('../../blockchain/config/contractABI.json'); 

// Initialize Pinata using your exact env variables
const pinata = new pinataSDK({
    pinataApiKey: process.env.PINATA_API_KEY,
    pinataSecretApiKey: process.env.PINATA_API_SECRET
});

exports.mintGenesisDevice = async (req, res) => {
    try {
        // 1. Validation
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'Device image is required' });
        }

        const { ownerAddress, serialNumber, make, model } = req.body;
        if (!ownerAddress || !serialNumber || !make || !model) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ success: false, error: 'Missing device details or owner address' });
        }

        console.log(`[1/4] Uploading ${make} ${model} image to IPFS...`);
        
        // 2. Upload Image to IPFS (Your original logic)
        const readableStreamForFile = fs.createReadStream(req.file.path);
        const imageResponse = await pinata.pinFileToIPFS(readableStreamForFile, {
            pinataMetadata: { name: `VeriFind_Img_${serialNumber}` }
        });
        const imageURI = `ipfs://${imageResponse.IpfsHash}`;

        console.log(`[2/4] Image Pinned! Creating Metadata JSON...`);

        // 3. Create & Upload standard ERC-721 Metadata JSON
        const metadata = {
            name: `${make} ${model}`,
            description: "VeriFind Authenticated Asset",
            image: imageURI, // Linking the image we just uploaded!
            attributes: [
                { trait_type: "Make", value: make },
                { trait_type: "Model", value: model },
                { trait_type: "SerialNumber", value: serialNumber }
            ]
        };

        const jsonResponse = await pinata.pinJSONToIPFS(metadata, {
            pinataMetadata: { name: `VeriFind_Meta_${serialNumber}.json` }
        });
        const tokenURI = `ipfs://${jsonResponse.IpfsHash}`;

        console.log(`[3/4] Metadata Pinned at ${tokenURI}. Minting on Blockchain...`);

        // 4. Trigger Smart Contract Minting via Relayer
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const wallet = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY, provider);
        const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI, wallet);

        const tx = await contract.manufacturerMint(ownerAddress, serialNumber, tokenURI);
        const receipt = await tx.wait();

        // 🔥 THE FIX: Ask the blockchain which Token ID it just assigned to this Serial Number!
        const mintedTokenId = await contract.serialToTokenId(serialNumber);

        console.log(`[4/4] Minted Token #${mintedTokenId}! Saving reference to MongoDB...`);

        // 5. Save reference to MongoDB
        const newItem = new Item({
            tokenId: Number(mintedTokenId), // <-- Now MongoDB is happy!
            serialNumber: serialNumber,
            ipfsImageHash: imageResponse.IpfsHash,
            make: make,
            model: model 
        });
        await newItem.save();

        // 6. Clean up temp server file
        fs.unlinkSync(req.file.path);

        // Send the mintedTokenId back to the frontend so we can generate the QR code!
        res.status(201).json({
            success: true,
            message: "Device successfully minted, pinned, and secured!",
            tokenURI: tokenURI,
            txHash: receipt.hash,
            tokenId: Number(mintedTokenId) 
        });

    } catch (error) {
        console.error("Genesis Mint Error:", error);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ success: false, error: error.reason || error.message || "Minting failed" });
    }
};