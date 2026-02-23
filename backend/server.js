require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const pinataSDK = require('@pinata/sdk');

const app = express();
app.use(cors());
app.use(express.json());

// 1. Ensure the temporary uploads directory exists so Multer doesn't crash
const dir = './uploads';
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

// 2. Import our central API routes
const apiRoutes = require('./routes/api');
// Tell the app to prefix all our routes with '/api'
app.use('/api', apiRoutes);

// --- STARTUP DIAGNOSTICS ---
console.log("Starting up the AssetGuard engine...");

// 3. Database connection check
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// 4. Pinata IPFS connection check
const pinata = new pinataSDK({
    pinataApiKey: process.env.PINATA_API_KEY,
    pinataSecretApiKey: process.env.PINATA_API_SECRET
});
pinata.testAuthentication()
    .then(() => console.log('✅ Pinata IPFS Connected'))
    .catch(err => console.error('❌ Pinata Connection Error:', err));
// ----------------------------

const PORT = process.env.PORT || 5000;
// Adding '0.0.0.0' forces the server to listen on ALL network interfaces, not just localhost
app.get('/api/health', (req, res) => {
    res.json({ status: "Backend is running securely." });
});
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT} (Listening on all interfaces)`);
});