import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

import "dotenv/config"; // Add this line

const config: HardhatUserConfig = {
  solidity: "0.8.28",
   typechain: {
    outDir: "/home/tony/audit_flow/auditFlow/src/types", // Output directory for generated types
    target: "ethers-v6", // or "ethers-v6" if using ethers v6
  },
  networks: {
    // for testnet
    'lisk-sepolia': {
      url: 'https://rpc.sepolia-api.lisk.com',
      accounts: [process.env.WALLET_KEY as string],
      gasPrice: 1000000000,
    },
  },
};

export default config;
