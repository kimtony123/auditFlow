// src/utils/contractHelpers.ts
import { ethers } from 'ethers'; 
import { LiskTestToken__factory } from '../types/factories/contracts/testToken.sol';
import { AuditFlowStaking__factory } from '../types/factories/contracts/staking.sol';


// Contract addresses
export const TOKEN_ADDRESS = "0xD2B7c81739F1E95be91dA584f20139BCA7E40aE5";


// staking addresses
export const STAKING_ADDRESS = "0xAd29c444B7C39F4f9e6975f924c647C3b90a9010";


// Re-export the factory
export { LiskTestToken__factory };

export { AuditFlowStaking__factory };

// Helper function to create contract instance
export const getStakingContract = async (signer: ethers.Signer) => {
  return AuditFlowStaking__factory.connect(STAKING_ADDRESS, signer);
};

// Helper function to create contract instance
export const getTokenContract = async (signer: ethers.Signer) => {
  return LiskTestToken__factory.connect(TOKEN_ADDRESS, signer);
};