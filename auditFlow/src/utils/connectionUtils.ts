// utils/connectionUtils.ts
import { ethers, type Eip1193Provider } from 'ethers';

// ============================
// TYPES AND DECLARATIONS
// ============================

/**
 * Extended Ethereum provider interface with all MetaMask/EIP-1193 methods
 */
export interface EthereumProvider extends Eip1193Provider {
  // Event methods
  on: (event: string, callback: (...args: any[]) => void) => void;
  removeListener: (event: string, callback: (...args: any[]) => void) => void;
  removeAllListeners?: (event?: string) => void;
  
  // Common properties
  selectedAddress?: string;
  isMetaMask?: boolean;
  isConnected?: () => boolean;
  networkVersion?: string;
  chainId?: string;
  
  // Request method with proper typing
  request: (args: { method: string; params?: any[] }) => Promise<any>;
}

/**
 * Declare window.ethereum with our extended interface
 */
declare global {
  interface Window {
    ethereum?: Eip1193Provider; // Keep the original type
  }
}

// Extend the Eip1193Provider interface to include additional properties
export interface EthereumProvider extends Eip1193Provider {
  // Event methods
  on: (event: string, callback: (...args: any[]) => void) => void;
  removeListener: (event: string, callback: (...args: any[]) => void) => void;
  removeAllListeners?: (event?: string) => void;

  // Common properties
  selectedAddress?: string;
  isMetaMask?: boolean;
  isConnected?: () => boolean;
  networkVersion?: string;
  chainId?: string;

  // Request method with proper typing
  request: (args: { method: string; params?: any[] }) => Promise<any>;
}

// ============================
// CORE WALLET FUNCTIONS
// ============================

/**
 * Get the typed ethereum provider or null if not available
 */
export const getEthereumProvider = (): EthereumProvider | null => {
  return (window.ethereum as EthereumProvider) || null;
};

/**
 * Check if a Web3 wallet is installed
 */
export const isWalletInstalled = (): boolean => {
  return !!window.ethereum;
};

/**
 * Check if MetaMask is specifically installed
 */
export const isMetaMaskInstalled = (): boolean => {
  return !!window.ethereum && (window.ethereum as EthereumProvider).isMetaMask === true;
};

/**
 * Check if wallet is currently connected (has active account)
 */
export const isWalletConnected = (): boolean => {
  const provider = getEthereumProvider();
  return !!(
    provider?.selectedAddress || 
    localStorage.getItem('lastConnectedAccount')
  );
};

/**
 * Get current connected account from wallet
 */
export const getCurrentAccount = async (): Promise<string | null> => {
  const provider = getEthereumProvider();
  if (!provider) return null;
  
  try {
    const accounts = await provider.request({ method: 'eth_accounts' });
    return accounts.length > 0 ? accounts[0] : null;
  } catch (error) {
    console.error("Error getting current account:", error);
    return localStorage.getItem('lastConnectedAccount');
  }
};

/**
 * Connect to wallet and request account access
 */
export const connectWallet = async (): Promise<string | null> => {
  const provider = getEthereumProvider();
  if (!provider) {
    alert("Please install MetaMask or another Web3 wallet!");
    return null;
  }

  try {
    const accounts = await provider.request({ 
      method: 'eth_requestAccounts' 
    });
    
    if (accounts.length > 0) {
      localStorage.setItem('lastConnectedAccount', accounts[0]);
      return accounts[0];
    }
    
    return null;
  } catch (error: any) {
    console.error("Error connecting wallet:", error);
    
    if (error.code === 4001) {
      alert("Please connect your wallet to continue");
    } else if (error.code === -32002) {
      alert("Please check your wallet - connection request already pending");
    } else {
      alert("Failed to connect wallet: " + (error.message || "Unknown error"));
    }
    
    return null;
  }
};

/**
 * Disconnect wallet (clear local state)
 */
export const disconnectWallet = (): void => {
  localStorage.removeItem('lastConnectedAccount');
  // Note: We cannot programmatically disconnect from MetaMask
  // The user must disconnect from the wallet extension
};

// ============================
// ETHERS.JS V6 UTILITIES
// ============================

/**
 * Create an ethers.js BrowserProvider instance
 */
export const getProvider = (): ethers.BrowserProvider | null => {
  const provider = getEthereumProvider();
  if (!provider) return null;
  return new ethers.BrowserProvider(provider);
};

/**
 * Get an ethers.js JsonRpcSigner instance
 */
export const getSigner = async (): Promise<ethers.JsonRpcSigner | null> => {
  const provider = getProvider();
  if (!provider) return null;
  
  try {
    return await provider.getSigner();
  } catch (error) {
    console.error("Error getting signer:", error);
    return null;
  }
};

/**
 * Get current network chain ID as bigint
 */
export const getChainId = async (): Promise<bigint | null> => {
  const provider = getProvider();
  if (!provider) return null;
  
  try {
    const network = await provider.getNetwork();
    return network.chainId;
  } catch (error) {
    console.error("Error getting chain ID:", error);
    return null;
  }
};

/**
 * Switch to a different network/chain
 */
export const switchNetwork = async (chainId: string): Promise<boolean> => {
  const provider = getEthereumProvider();
  if (!provider) return false;
  
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId }],
    });
    return true;
  } catch (error: any) {
    if (error.code === 4902) {
      console.log(`Chain ${chainId} not found in wallet`);
    }
    console.error("Error switching network:", error);
    return false;
  }
};

/**
 * Add a new network to the wallet
 */
export const addNetwork = async (networkParams: {
  chainId: string;
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls?: string[];
}): Promise<boolean> => {
  const provider = getEthereumProvider();
  if (!provider) return false;
  
  try {
    await provider.request({
      method: 'wallet_addEthereumChain',
      params: [networkParams],
    });
    return true;
  } catch (error) {
    console.error("Error adding network:", error);
    return false;
  }
};

/**
 * Get ETH balance for an address
 */
export const getBalance = async (address: string): Promise<string | null> => {
  const provider = getProvider();
  if (!provider) return null;
  
  try {
    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error("Error getting balance:", error);
    return null;
  }
};

/**
 * Get transaction count (nonce) for an address
 */
export const getTransactionCount = async (address: string): Promise<number | null> => {
  const provider = getProvider();
  if (!provider) return null;
  
  try {
    return await provider.getTransactionCount(address);
  } catch (error) {
    console.error("Error getting transaction count:", error);
    return null;
  }
};

/**
 * Send a transaction
 */
export const sendTransaction = async (
  transaction: ethers.TransactionRequest
): Promise<ethers.TransactionResponse | null> => {
  const signer = await getSigner();
  if (!signer) return null;
  
  try {
    return await signer.sendTransaction(transaction);
  } catch (error) {
    console.error("Error sending transaction:", error);
    return null;
  }
};

// ============================
// EVENT LISTENERS
// ============================

/**
 * Set up wallet event listeners with automatic cleanup
 */
export const setupWalletListeners = (
  onAccountsChanged: (accounts: string[]) => void,
  onChainChanged: (chainId: string) => void,
  onDisconnect?: () => void
): (() => void) => {
  const provider = getEthereumProvider();
  if (!provider) return () => {};
  
  const handleAccountsChanged = (accounts: string[]) => {
    onAccountsChanged(accounts);
  };
  
  const handleChainChanged = (chainId: string) => {
    onChainChanged(chainId);
  };
  
  const handleDisconnect = () => {
    onDisconnect?.();
  };
  
  provider.on('accountsChanged', handleAccountsChanged);
  provider.on('chainChanged', handleChainChanged);
  
  if (onDisconnect) {
    provider.on('disconnect', handleDisconnect);
  }
  
  // Return cleanup function
  return () => {
    provider.removeListener('accountsChanged', handleAccountsChanged);
    provider.removeListener('chainChanged', handleChainChanged);
    if (onDisconnect) {
      provider.removeListener('disconnect', handleDisconnect);
    }
  };
};

// ============================
// FORMATTING UTILITIES
// ============================

/**
 * Format Ethereum address with custom length
 */
export const formatAddress = (
  address: string | null, 
  prefixLength: number = 6, 
  suffixLength: number = 4
): string => {
  if (!address) return '';
  if (address.length <= prefixLength + suffixLength) return address;
  
  const start = address.substring(0, prefixLength);
  const end = address.substring(address.length - suffixLength);
  return `${start}...${end}`;
};

/**
 * Short address format (commonly used in UIs)
 */
export const shortAddress = (address: string | null): string => {
  return formatAddress(address, 6, 4);
};

/**
 * Convert wei to ETH with formatting
 */
export const formatEther = (wei: bigint | string): string => {
  return ethers.formatEther(wei);
};

/**
 * Convert ETH to wei
 */
export const parseEther = (ether: string): bigint => {
  return ethers.parseEther(ether);
};

// ============================
// HELPER FUNCTIONS
// ============================

/**
 * Get ENS name for an address
 */
export const getENSName = async (address: string): Promise<string | null> => {
  const provider = getProvider();
  if (!provider) return null;
  
  try {
    return await provider.lookupAddress(address);
  } catch (error) {
    console.error("Error getting ENS name:", error);
    return null;
  }
};

/**
 * Get avatar/ens image for an address
 */
export const getENSAvatar = async (address: string): Promise<string | null> => {
  const provider = getProvider();
  if (!provider) return null;
  
  try {
    const avatar = await provider.getAvatar(address);
    return avatar;
  } catch (error) {
    console.error("Error getting ENS avatar:", error);
    return null;
  }
};

/**
 * Sign a message with the connected wallet
 */
export const signMessage = async (message: string): Promise<string | null> => {
  const signer = await getSigner();
  if (!signer) return null;
  
  try {
    return await signer.signMessage(message);
  } catch (error) {
    console.error("Error signing message:", error);
    return null;
  }
};

/**
 * Verify a signed message
 */
export const verifyMessage = async (
  message: string, 
  signature: string
): Promise<string | null> => {
  try {
    return ethers.verifyMessage(message, signature);
  } catch (error) {
    console.error("Error verifying message:", error);
    return null;
  }
};

/**
 * Get block number
 */
export const getBlockNumber = async (): Promise<number | null> => {
  const provider = getProvider();
  if (!provider) return null;
  
  try {
    return await provider.getBlockNumber();
  } catch (error) {
    console.error("Error getting block number:", error);
    return null;
  }
};

// ============================
// NETWORK CONSTANTS
// ============================

/**
 * Common network chain IDs
 */
export const NETWORKS = {
  ETHEREUM_MAINNET: '0x1',
  ETHEREUM_SEPOLIA: '0xaa36a7',
  ETHEREUM_GOERLI: '0x5',
  POLYGON_MAINNET: '0x89',
  POLYGON_MUMBAI: '0x13881',
  BSC_MAINNET: '0x38',
  BSC_TESTNET: '0x61',
  ARBITRUM_MAINNET: '0xa4b1',
  ARBITRUM_SEPOLIA: '0x66eee',
  OPTIMISM_MAINNET: '0xa',
  AVALANCHE_MAINNET: '0xa86a',
  BASE_MAINNET: '0x2105',
} as const;

/**
 * Network names for display
 */
export const NETWORK_NAMES: Record<string, string> = {
  [NETWORKS.ETHEREUM_MAINNET]: 'Ethereum Mainnet',
  [NETWORKS.ETHEREUM_SEPOLIA]: 'Ethereum Sepolia',
  [NETWORKS.ETHEREUM_GOERLI]: 'Ethereum Goerli',
  [NETWORKS.POLYGON_MAINNET]: 'Polygon Mainnet',
  [NETWORKS.POLYGON_MUMBAI]: 'Polygon Mumbai',
  [NETWORKS.BSC_MAINNET]: 'BNB Smart Chain',
  [NETWORKS.BSC_TESTNET]: 'BNB Testnet',
  [NETWORKS.ARBITRUM_MAINNET]: 'Arbitrum One',
  [NETWORKS.ARBITRUM_SEPOLIA]: 'Arbitrum Sepolia',
  [NETWORKS.OPTIMISM_MAINNET]: 'Optimism',
  [NETWORKS.AVALANCHE_MAINNET]: 'Avalanche C-Chain',
  [NETWORKS.BASE_MAINNET]: 'Base',
};

// ============================
// EXPORT TYPES
// ============================

// Removed redundant export of EthereumProvider to avoid conflicts
export type NetworkChainId = keyof typeof NETWORKS;

// ============================
// DEFAULT EXPORT
// ============================

/**
 * Main wallet utility object with all functions
 */
const walletUtils = {
  // Core functions
  getEthereumProvider,
  isWalletInstalled,
  isMetaMaskInstalled,
  isWalletConnected,
  getCurrentAccount,
  connectWallet,
  disconnectWallet,
  
  // Ethers.js functions
  getProvider,
  getSigner,
  getChainId,
  switchNetwork,
  addNetwork,
  getBalance,
  getTransactionCount,
  sendTransaction,
  
  // Event management
  setupWalletListeners,
  
  // Formatting
  formatAddress,
  shortAddress,
  formatEther,
  parseEther,
  
  // Helpers
  getENSName,
  getENSAvatar,
  signMessage,
  verifyMessage,
  getBlockNumber,
  
  // Constants
  NETWORKS,
  NETWORK_NAMES,
};

export default walletUtils;