import pkg from 'hardhat';
const { ethers } = pkg;

async function main() {
    const contractAddress = "0x610178dA211FEF7D417bC0e6FeD39F05609AD788";
    
    // Connect to your deployed contract
    const AssetGuard = await ethers.getContractAt("AssetGuard", contractAddress);
    
    // Get the default Hardhat wallet
    const [owner] = await ethers.getSigners();

    console.log("Minting Token 0...");
    const mintTx = await AssetGuard.manufacturerMint(owner.address, "SN-123", "ipfs://test");
    await mintTx.wait();
    console.log("✅ Token 0 successfully minted to:", owner.address);

    console.log("Authorizing Backend Relayer...");
    const authTx = await AssetGuard.addRelayer(owner.address);
    await authTx.wait();
    console.log("✅ Relayer authorized!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});