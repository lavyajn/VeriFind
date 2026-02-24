const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    tokenId: { type: Number, required: true, unique: true },
    serialNumber: { type: String, required: true, unique: true },
    ipfsImageHash: { type: String, required: true },
    make: { type: String },    
    model: { type: String },   
    status: { type: String, default: 'REGISTERED' }, 
    registeredAt: { type: Date, default: Date.now }, 
    lastLocation: { type: String },
    statusUpdatedAt: { type: Date } // 🔥 EXPLICITLY TRACK THE INCIDENT TIME
});

module.exports = mongoose.model('Item', itemSchema);