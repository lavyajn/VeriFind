const express = require('express');
const router = express.Router();
const multer = require('multer');

// Import Controllers
const { mintGenesisDevice } = require('../controllers/ipfsController'); // 🚀 V2 IPFS Controller
const { 
    reportStolenGasless, 
    markRecovered, 
    getActiveAlerts, 
    checkStatus, 
    transferAsset, 
    pingLocation,
    reportLostGasless
} = require('../controllers/relayerController');

// Set up Multer (Temporarily stores the image before Pinata grabs it)
const upload = multer({ dest: 'uploads/' });

// ==========================================
// 🏭 MANUFACTURER ROUTES (Genesis)
// ==========================================
// The new Genesis route (expects an image file + text fields)
router.post('/mint-device', upload.single('image'), mintGenesisDevice);


// ==========================================
// 📱 USER ASSET ROUTES (The Relayer)
// ==========================================
// Read true status from the blockchain
router.get('/status/:id', checkStatus);

// Lock / Unlock Asset
router.post('/report-stolen', reportStolenGasless); 
router.post('/recover/:id', markRecovered);

// Secondary Market Block
router.post('/transfer', transferAsset);


// ==========================================
// 🌐 MESH NETWORK ROUTES
// ==========================================
// Fetch active BOLO alerts for the Home Screen
router.get('/alerts', getActiveAlerts);

// Hardware GPS Ping from the Samaritan
router.post('/ping-location', pingLocation);

router.post('/report-lost', reportLostGasless);

module.exports = router;