const express = require('express');
const router = express.Router();
const multer = require('multer');

// Import Controllers
const { uploadImageAndSave } = require('../controllers/ipfsController');
const { reportStolenGasless } = require('../controllers/relayerController'); // NEW

// Set up Multer
const upload = multer({ dest: 'uploads/' });

// Routes
router.post('/upload-item', upload.single('image'), uploadImageAndSave);
router.post('/report-stolen', reportStolenGasless); // NEW Gasless Route

// Add this new GET route near your other routes
const { checkStatus } = require('../controllers/relayerController');
router.get('/status/:id', checkStatus);

module.exports = router;