import pkg from 'hardhat';
const { ethers } = pkg;

async function main() {
    // ⚠️ CRITICAL: Replace this with the NEW contract address from your deploy script!
    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; 
    
    // Connect to your deployed contract
    const AssetGuard = await ethers.getContractAt("AssetGuard", contractAddress);
    
    // Get the default Hardhat wallets (Account 0 is Relayer/Owner, Account 1 is Buyer)
    const [owner, buyer] = await ethers.getSigners();

    console.log("Authorizing Backend Relayer...");
    const authTx = await AssetGuard.addRelayer(owner.address);
    await authTx.wait();
    console.log("✅ Relayer authorized!");

    console.log("Minting Token 0...");
    // Minting to the Owner with a serial number and a mock IPFS link
    const mintTx = await AssetGuard.manufacturerMint(
        owner.address, 
        "SN-12345", 
        "ipfs://QmMockGenesisHash12345"
    );
    await mintTx.wait();
    console.log("✅ Token 0 successfully minted to:", owner.address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});