import pkg from 'hardhat';
const { ethers } = pkg;

async function main() {
  console.log("Deploying AssetGuard to local blockchain...");

  const AssetGuard = await ethers.getContractFactory("AssetGuard");
  const assetGuard = await AssetGuard.deploy();
  await assetGuard.waitForDeployment();
  
  const contractAddress = await assetGuard.getAddress();
  console.log(`✅ AssetGuard deployed successfully to: ${contractAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});