const User = require('../models/User');

exports.loginUser = async (req, res) => {
    try {
        const { name, email, walletAddress } = req.body;

        if (!walletAddress) {
            return res.status(400).json({ success: false, error: "Wallet Address is required." });
        }

        // Check if the user already exists based on their Web3 Wallet
        let user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });

        // If they don't exist, register them instantly
        if (!user) {
            console.log(`Registering new user: ${name}`);
            user = new User({ 
                name, 
                email, 
                walletAddress: walletAddress.toLowerCase() 
            });
            await user.save();
        } else {
            console.log(`Logging in existing user: ${user.name}`);
        }

        res.json({ success: true, user });
    } catch (error) {
        console.error("Auth Error:", error);
        res.status(500).json({ success: false, error: "Failed to authenticate user." });
    }
};