const express = require('express');
const router = express.Router();
const multer = require('multer');

// Import Controllers
const { uploadImageAndSave } = require('../controllers/ipfsController');
const { reportStolenGasless, markRecovered, getActiveAlerts, checkStatus, transferAsset, pingLocation } = require('../controllers/relayerController');

// Set up Multer
const upload = multer({ dest: 'uploads/' });

// Routes
router.post('/upload-item', upload.single('image'), uploadImageAndSave);
router.post('/report-stolen', reportStolenGasless); // NEW Gasless Route

router.get('/status/:id', checkStatus);

router.post('/recover/:id', markRecovered);

// Add this line with your other routes:
router.get('/alerts', getActiveAlerts);

// Add these to your route list:
router.post('/transfer', transferAsset);
router.post('/ping-location', pingLocation);

module.exports = router;