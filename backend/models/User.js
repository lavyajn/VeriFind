const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    walletAddress: { 
        type: String, 
        required: true, 
        unique: true,
        lowercase: true 
    },
    email: { 
        type: String, 
        unique: true, 
        sparse: true // Allows email to be optional, but unique if provided
    },
    role: {
        type: String,
        enum: ['USER', 'MANUFACTURER', 'RELAYER'],
        default: 'USER'
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('User', userSchema);