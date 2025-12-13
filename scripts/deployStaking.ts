// scripts/deploy.ts
import { ethers, run } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying contract with the account:", deployer.address);

  // Contract addresses from your comment
  const liskTokenAddress = "0xD2B7c81739F1E95be91dA584f20139BCA7E40aE5";
  const daoWalletAddress = "0xc436ebb132fb4e39f25a044ded4b8052ab26cd6f";
  const initialOwnerAddress = "0xc436ebb132fb4e39f25a044ded4b8052ab26cd6f";

  // Get the contract factory
  const AuditFlowStaking = await ethers.getContractFactory("AuditFlowStaking");

  // Deploy the contract with constructor arguments
  const stakingContract = await AuditFlowStaking.deploy(
    liskTokenAddress,
    daoWalletAddress,
    initialOwnerAddress
  );

  // Wait for deployment to complete
  await stakingContract.waitForDeployment();

  console.log("LSK Staking Contract deployed to:", stakingContract.target);
  console.log("Constructor arguments:");
  console.log("  - Lisk Token Address:", liskTokenAddress);
  console.log("  - DAO Wallet Address:", daoWalletAddress);
  console.log("  - Initial Owner Address:", initialOwnerAddress);



}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

  //0x5152fB7A0385e5AF47EfA6eBAb5Eb3B4A6ff188f