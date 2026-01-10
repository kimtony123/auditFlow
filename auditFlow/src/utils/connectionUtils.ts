// utils/connectionUtils.ts
import { ethers } from 'ethers';

// ============================
// CONSTANTS
// ============================

export const LISK_SEPOLIA = {
  chainId: '0x106A', // 4202 in hex
  chainName: 'Lisk Sepolia',
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18
  },
  rpcUrls: ['https://rpc.sepolia-api.lisk.com'],
  blockExplorerUrls: ['https://sepolia-blockscout.lisk.com']
} as const;

export const TOKEN_ADDRESS = '0xD2B7c81739F1E95be91dA584f20139BCA7E40aE5';
export const STAKING_ADDRESS = '0xD2B7c81739F1E95be91dA584f20139BCA7E40aE5';

// ============================
// TYPES
// ============================

export interface EthereumProvider {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, callback: (...args: any[]) => void) => void;
  removeListener: (event: string, callback: (...args: any[]) => void) => void;
  selectedAddress?: string;
  isMetaMask?: boolean;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

// ============================
// HELPER FUNCTIONS
// ============================

const normalizeChainId = (chainId: string): string => {
  return chainId.toLowerCase().replace('0x', '');
};

// ============================
// CORE FUNCTIONS
// ============================

export const getProvider = (): EthereumProvider | null => {
  return window.ethereum || null;
};

export const isWalletInstalled = (): boolean => {
  return !!window.ethereum;
};

export const getCurrentAccount = async (): Promise<string | null> => {
  if (!window.ethereum) return localStorage.getItem('lastConnectedAccount');
  
  try {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    if (accounts.length > 0) {
      localStorage.setItem('lastConnectedAccount', accounts[0]);
      return accounts[0];
    }
    
    const lastAccount = localStorage.getItem('lastConnectedAccount');
    return lastAccount;
  } catch (error) {
    console.error('Error getting current account:', error);
    return localStorage.getItem('lastConnectedAccount');
  }
};

export const connectWallet = async (): Promise<string | null> => {
  if (!window.ethereum) {
    throw new Error('Please install MetaMask to connect');
  }

  try {
    const accounts = await window.ethereum.request({ 
      method: 'eth_requestAccounts' 
    });
    
    if (accounts.length > 0) {
      localStorage.setItem('lastConnectedAccount', accounts[0]);
      return accounts[0];
    }
    
    return null;
  } catch (error: any) {
    console.error('Wallet connection error:', error);
    
    if (error.code === 4001) {
      throw new Error('Connection rejected by user');
    } else if (error.code === -32002) {
      throw new Error('Connection request already pending');
    } else {
      throw new Error(error.message || 'Failed to connect wallet');
    }
  }
};

// Update in utils/connectionUtils.ts
export const disconnectWallet = (): void => {
  // Clear all wallet-related storage
  localStorage.removeItem('lastConnectedAccount');
  console.log('Wallet disconnected - all storage cleared');
};


export const switchToLiskSepolia = async (): Promise<boolean> => {
  if (!window.ethereum) return false;

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: LISK_SEPOLIA.chainId }],
    });
    return true;
  } catch (error: any) {
    if (error.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [LISK_SEPOLIA],
        });
        return true;
      } catch (addError) {
        console.error('Error adding Lisk Sepolia:', addError);
        return false;
      }
    }
    console.error('Error switching to Lisk Sepolia:', error);
    return false;
  }
};

export const getChainId = async (): Promise<string | null> => {
  if (!window.ethereum) return null;

  try {
    return await window.ethereum.request({ method: 'eth_chainId' });
  } catch (error) {
    console.error('Error getting chain ID:', error);
    return null;
  }
};

export const isOnLiskSepolia = async (): Promise<boolean> => {
  const chainId = await getChainId();
  if (!chainId) return false;
  
  // Case-insensitive comparison to handle both "0x106A" and "0x106a"
  const normalizedChainId = normalizeChainId(chainId);
  return normalizedChainId === '106a'; // 4202 in hex
};

export const getSigner = async (): Promise<ethers.JsonRpcSigner | null> => {
  if (!window.ethereum) return null;

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    return await provider.getSigner();
  } catch (error) {
    console.error('Error getting signer:', error);
    return null;
  }
};

// ============================
// EVENT LISTENERS
// ============================

export const setupWalletListeners = (
  onAccountsChanged: (accounts: string[]) => void,
  onChainChanged: (chainId: string) => void
): (() => void) => {
  if (!window.ethereum) return () => {};

  const handleAccountsChanged = (accounts: string[]) => {
    console.log('Accounts changed:', accounts);
    onAccountsChanged(accounts);
  };
  
  const handleChainChanged = (chainId: string) => {
    console.log('Chain changed to:', chainId);
    onChainChanged(chainId);
  };
  
  window.ethereum.on('accountsChanged', handleAccountsChanged);
  window.ethereum.on('chainChanged', handleChainChanged);
  
  return () => {
    window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
    window.ethereum?.removeListener('chainChanged', handleChainChanged);
  };
};

// ============================
// HELPER FUNCTIONS
// ============================

export const formatAddress = (address: string | null): string => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const getBalance = async (address: string): Promise<string> => {
  if (!window.ethereum) return '0';
  
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error('Error getting balance:', error);
    return '0';
  }
};

// Add this to utils/connectionUtils.ts
export const clearWalletSession = (): void => {
  // Clear all wallet-related localStorage items
  localStorage.removeItem('lastConnectedAccount');
  // You could add more if needed
  console.log('Wallet session cleared');
};

export const createContractInstance = async <T>(address: string, abi: any): Promise<T | null> => {
  const signer = await getSigner();
  if (!signer) return null;
  
  return new ethers.Contract(address, abi, signer) as T;
};