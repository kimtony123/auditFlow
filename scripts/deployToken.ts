import { ethers } from 'hardhat';

async function main() {
  const lskToken = await ethers.deployContract('LiskTestToken');

  await lskToken.waitForDeployment();

  console.log('LSK Token Contract Deployed at ' + lskToken.target);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

// 0xD2B7c81739F1E95be91dA584f20139BCA7E40aE5