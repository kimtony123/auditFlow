// services/WalletProvider.tsx
import { createContext, type ReactNode, useEffect, useState, useContext, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import {
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
  const isManuallyDisconnected = useRef(false);

  // Helper to normalize chain ID
  const normalizeChainId = useCallback((chainId: string): string => {
    return chainId.toLowerCase().replace('0x', '');
  }, []);

  // Create provider instance
  const createEthersProvider = useCallback(() => {
    if (window.ethereum) {
      return new ethers.BrowserProvider(window.ethereum);
    }
    return null;
  }, []);

  // Update account and provider
  const updateAccount = useCallback(async (newAccount: string | null, skipAutoReconnect = false) => {
    setAccount(newAccount);
    
    if (newAccount) {
      localStorage.setItem('lastConnectedAccount', newAccount);
      isManuallyDisconnected.current = false;
      
      // Create provider if not exists
      if (!provider) {
        const ethersProvider = createEthersProvider();
        setProvider(ethersProvider);
      }
      
      // Check if on Lisk
      try {
        const onLisk = await isOnLiskSepolia();
        console.log('Network check on updateAccount:', { onLisk });
        setIsOnLisk(onLisk);
      } catch (err) {
        console.error('Error checking network:', err);
        setIsOnLisk(false);
      }
    } else {
      localStorage.removeItem('lastConnectedAccount');
    }
  }, [provider, createEthersProvider]);

  // Initialize wallet connection
  useEffect(() => {
    const initializeWallet = async () => {
      if (!isWalletInstalled()) {
        console.log('Wallet not installed');
        setIsInitializing(false);
        return;
      }

      // Skip auto-reconnect if user manually disconnected
      if (isManuallyDisconnected.current) {
        console.log('Skipping auto-reconnect (manual disconnect)');
        setIsInitializing(false);
        return;
      }

      try {
        console.log('Initializing wallet...');
        
        // Check for existing connection
        const existingAccount = await getCurrentAccount();
        console.log('Existing account:', existingAccount);
        
        if (existingAccount) {
          await updateAccount(existingAccount);
          console.log('Reconnected to wallet:', existingAccount);
        }
        
        // Set up listeners
        const cleanup = setupWalletListeners(
          async (accounts) => {
            console.log('Accounts changed event:', accounts);
            
            // Skip if manually disconnected
            if (isManuallyDisconnected.current) {
              console.log('Ignoring accountsChanged (manual disconnect)');
              return;
            }
            
            if (accounts.length === 0) {
              await updateAccount(null);
            } else {
              await updateAccount(accounts[0]);
            }
          },
          async (chainId) => {
            console.log('Chain changed event received:', chainId);
            
            // Skip if manually disconnected
            if (isManuallyDisconnected.current) {
              console.log('Ignoring chainChanged (manual disconnect)');
              return;
            }
            
            // Normalize and compare the chain ID
            const normalizedChainId = normalizeChainId(chainId);
            const onLisk = normalizedChainId === '106a';
            console.log('Network detection from chainChanged:', { chainId, normalizedChainId, onLisk });
            
            setIsOnLisk(onLisk);
            
            // Update provider to reflect new chain
            if (account) {
              const currentProvider = createEthersProvider();
              setProvider(currentProvider);
            }
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
  }, [account, updateAccount, normalizeChainId, createEthersProvider]);

  // Handle wallet connection
  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    isManuallyDisconnected.current = false; // Reset disconnect flag

    try {
      console.log('Connecting wallet...');
      
      // Connect wallet
      const connectedAccount = await connectWallet();
      
      if (!connectedAccount) {
        throw new Error('Failed to connect wallet');
      }
      
      console.log('Connected account:', connectedAccount);
      await updateAccount(connectedAccount);
      
      // Check current network immediately after connection
      try {
        const onLisk = await isOnLiskSepolia();
        console.log('Network check after connection:', { onLisk });
        setIsOnLisk(onLisk);
        
        // If not on Lisk, show option to switch
        if (!onLisk) {
          console.log('Not on Lisk network after connection');
        }
      } catch (networkErr) {
        console.error('Error checking network after connection:', networkErr);
      }
      
    } catch (err: any) {
      console.error('Connection error:', err);
      setError(err.message || 'Failed to connect wallet');
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Handle wallet disconnection
  const handleDisconnect = () => {
    console.log('Disconnecting wallet');
    
    // Set the manual disconnect flag FIRST
    isManuallyDisconnected.current = true;
    
    // Clear all wallet state
    disconnectWallet();
    setAccount(null);
    setProvider(null);
    setIsOnLisk(false);
    
    console.log('Wallet disconnected successfully (manual flag set)');
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
    setLoading(true);
    try {
      console.log('Switching to Lisk Sepolia...');
      const switched = await switchToLiskSepolia();
      console.log('Switch result:', switched);
      
      if (switched) {
        // Give a moment for the network switch to complete
        setTimeout(async () => {
          const onLisk = await isOnLiskSepolia();
          console.log('Network check after switch:', { onLisk });
          setIsOnLisk(onLisk);
        }, 1000);
      }
      
      return switched;
    } catch (error) {
      console.error('Error switching to Lisk:', error);
      return false;
    } finally {
      setLoading(false);
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