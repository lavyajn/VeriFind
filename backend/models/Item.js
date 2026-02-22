const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    tokenId: { 
        type: Number, 
        required: true, 
        unique: true 
    }, // This links exactly to the Smart Contract NFT ID
    serialNumber: { 
        type: String, 
        required: true 
    },
    ipfsImageHash: { 
        type: String, 
        default: null 
    }, // The Pinata CID for the image
    ipfsInvoiceHash: { 
        type: String, 
        default: null 
    }, // The Pinata CID for the receipt
    registeredAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('Item', itemSchema);