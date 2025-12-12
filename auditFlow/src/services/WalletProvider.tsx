import { createContext, type ReactNode, useEffect, useState, useContext } from 'react';
import { ethers } from 'ethers';
import { 
  getEthereumProvider, 
  getCurrentAccount,
  setupWalletListeners 
} from '../utils/connectionUtils';

interface WalletContextProps {
  provider: ethers.BrowserProvider | null;
  account: string | null;
  chainId: bigint | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  isConnected: boolean;
  error: string | null;
  loading: boolean;
}

export const WalletContext = createContext<WalletContextProps>({
  provider: null,
  account: null,
  chainId: null,
  connectWallet: async () => {},
  disconnectWallet: () => {},
  isConnected: false,
  error: null,
  loading: false,
});

interface WalletProviderProps {
  children: ReactNode;
}

// Create a custom hook that safely tries to use UserTypeContext
const useUserTypeSafe = () => {
  try {
    // Dynamic import to avoid circular dependency
    const { useUserType } = require('../context/UserTypeContext');
    return useUserType();
  } catch (error) {
    // Return fallback functions if UserTypeContext is not available
    console.warn('UserTypeContext not available, using fallback functions');
    return {
      checkUserTierFromBlockchain: async () => {},
      resetUser: () => {},
      userTier: 'guest' as const,
      setUserTier: () => {},
      stakedAmount: 0,
      setStakedAmount: () => {},
      stakingEndDate: null,
      setStakingEndDate: () => {},
      isStakingActive: false,
      hasFeatureAccess: () => false
    };
  }
};

const WalletProvider = ({ children }: WalletProviderProps) => {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<bigint | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Use the safe hook
  const { checkUserTierFromBlockchain, resetUser } = useUserTypeSafe();

  const connectWallet = async () => {
    try {
      setLoading(true);
      setError(null);

      const ethereum = getEthereumProvider();
      if (!ethereum) {
        throw new Error('Please install MetaMask or another Web3 wallet!');
      }

      const browserProvider = new ethers.BrowserProvider(ethereum);
      const accounts = await ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      const network = await browserProvider.getNetwork();

      setProvider(browserProvider);
      setAccount(accounts[0]);
      setChainId(network.chainId);

      // Only check tier if the function exists
      if (checkUserTierFromBlockchain && typeof checkUserTierFromBlockchain === 'function') {
        await checkUserTierFromBlockchain(accounts[0], browserProvider);
      }

      localStorage.setItem('lastConnectedAccount', accounts[0]);

    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
      console.error('Wallet connection error:', err);
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    setProvider(null);
    setAccount(null);
    setChainId(null);
    
    // Only call resetUser if it exists
    if (resetUser && typeof resetUser === 'function') {
      resetUser();
    }
    
    localStorage.removeItem('lastConnectedAccount');
  };

  // ... rest of your useEffect and other functions remain the same

  return (
    <WalletContext.Provider value={{
      provider,
      account,
      chainId,
      connectWallet,
      disconnectWallet,
      isConnected: !!account,
      error,
      loading,
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export default WalletProvider;