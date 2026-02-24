const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    walletAddress: { type: String, required: true, unique: true }, // The ultimate Web3 identifier
    registeredAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);