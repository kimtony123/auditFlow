// services/WalletProvider.tsx
import { createContext, type ReactNode, useEffect, useState, useContext } from 'react';
import { ethers } from 'ethers';
import {
  getProvider,
  getCurrentAccount,
  isWalletInstalled,
  connectWallet,
  disconnectWallet,
  switchToLiskSepolia,
  isOnLiskSepolia,
  setupWalletListeners,
  formatAddress
} from '../utils/connectionUtils';

interface WalletContextProps {
  provider: ethers.BrowserProvider | null;
  account: string | null;
  formattedAddress: string;
  isConnected: boolean;
  isOnLisk: boolean;
  loading: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  getSigner: () => Promise<ethers.JsonRpcSigner | null>;
  switchToLisk: () => Promise<boolean>;
  error: string | null;
}

export const WalletContext = createContext<WalletContextProps>({
  provider: null,
  account: null,
  formattedAddress: '',
  isConnected: false,
  isOnLisk: false,
  loading: false,
  connect: async () => {},
  disconnect: () => {},
  getSigner: async () => null,
  switchToLisk: async () => false,
  error: null,
});

interface WalletProviderProps {
  children: ReactNode;
}

const WalletProvider = ({ children }: WalletProviderProps) => {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [isOnLisk, setIsOnLisk] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Create provider instance
  const createEthersProvider = () => {
    if (window.ethereum) {
      return new ethers.BrowserProvider(window.ethereum);
    }
    return null;
  };

  // Update account and provider
  const updateAccount = async (newAccount: string | null) => {
    setAccount(newAccount);
    
    if (newAccount) {
      localStorage.setItem('lastConnectedAccount', newAccount);
      
      // Create provider if not exists
      if (!provider) {
        const ethersProvider = createEthersProvider();
        setProvider(ethersProvider);
      }
      
      // Check if on Lisk
      const onLisk = await isOnLiskSepolia();
      setIsOnLisk(onLisk);
    } else {
      localStorage.removeItem('lastConnectedAccount');
    }
  };

  // Initialize wallet connection
  useEffect(() => {
    const initializeWallet = async () => {
      if (!isWalletInstalled()) {
        setIsInitializing(false);
        return;
      }

      try {
        // Check for existing connection
        const existingAccount = await getCurrentAccount();
        if (existingAccount) {
          await updateAccount(existingAccount);
          console.log('Reconnected to wallet:', existingAccount);
        }
        
        // Set up listeners
        const cleanup = setupWalletListeners(
          async (accounts) => {
            if (accounts.length === 0) {
              await updateAccount(null);
            } else {
              await updateAccount(accounts[0]);
            }
          },
          async (chainId) => {
            setIsOnLisk(chainId === '0x106A');
          }
        );
        
        return cleanup;
      } catch (err) {
        console.error('Error initializing wallet:', err);
      } finally {
        setIsInitializing(false);
      }
    };

    const cleanupPromise = initializeWallet();
    
    return () => {
      cleanupPromise.then(cleanup => cleanup && cleanup());
    };
  }, []);

  // Handle wallet connection
  const handleConnect = async () => {
    setLoading(true);
    setError(null);

    try {
      // Connect wallet
      const connectedAccount = await connectWallet();
      
      if (!connectedAccount) {
        throw new Error('Failed to connect wallet');
      }
      
      await updateAccount(connectedAccount);
      
      // Switch to Lisk Sepolia
      const switched = await switchToLiskSepolia();
      if (switched) {
        setIsOnLisk(true);
      }
      
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Handle wallet disconnection
  const handleDisconnect = () => {
    disconnectWallet();
    setAccount(null);
    setProvider(null);
    setIsOnLisk(false);
  };

  // Get signer instance
  const handleGetSigner = async (): Promise<ethers.JsonRpcSigner | null> => {
    if (!window.ethereum || !account) return null;
    
    try {
      const ethersProvider = new ethers.BrowserProvider(window.ethereum);
      return await ethersProvider.getSigner();
    } catch (error) {
      console.error('Error getting signer:', error);
      return null;
    }
  };

  // Switch to Lisk Sepolia
  const handleSwitchToLisk = async (): Promise<boolean> => {
    try {
      const switched = await switchToLiskSepolia();
      if (switched) {
        setIsOnLisk(true);
      }
      return switched;
    } catch (error) {
      console.error('Error switching to Lisk:', error);
      return false;
    }
  };

  // Loading state
  if (isInitializing) {
    return (
      <div className="wallet-loading">
        <div className="spinner"></div>
        <p>Initializing wallet...</p>
      </div>
    );
  }

  return (
    <WalletContext.Provider value={{
      provider,
      account,
      formattedAddress: formatAddress(account),
      isConnected: !!account,
      isOnLisk,
      loading,
      connect: handleConnect,
      disconnect: handleDisconnect,
      getSigner: handleGetSigner,
      switchToLisk: handleSwitchToLisk,
      error,
    }}>
      {children}
    </WalletContext.Provider>
  );
};

// Custom hook
export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export default WalletProvider;

// CSS styles for the loading state
const styles = `
.wallet-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  gap: 16px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e0e0e0;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
`;