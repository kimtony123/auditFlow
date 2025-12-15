// components/UserDataFetcher.tsx
import React, { useEffect } from 'react';
import { useWallet } from '../../services/WalletProvider';
import { useUserData } from '../../context/UserDataContext';

interface UserDataFetcherProps {
  children: React.ReactNode;
}

const UserDataFetcher: React.FC<UserDataFetcherProps> = ({ children }) => {
  const { account, isConnected, provider } = useWallet();
  const { refreshUserDataWithProvider, lastFetched, isRefreshing } = useUserData();

  // Cache duration: 5 minutes in milliseconds
  const CACHE_DURATION = 5 * 60 * 1000;

  useEffect(() => {
    const fetchIfNeeded = async () => {
      if (!isConnected || !account || !provider) return;

      // Check if we need to fetch (based on last fetch time)
      const now = Date.now();
      const lastFetchTime = lastFetched ? lastFetched.getTime() : 0;
      
      if (now - lastFetchTime > CACHE_DURATION) {
        console.log('Fetching fresh user data');
        await refreshUserDataWithProvider(provider);
      } else {
        console.log('Using cached user data');
      }
    };

    fetchIfNeeded();
  }, [isConnected, account, provider, lastFetched]);

  // Show loading indicator if refreshing
  if (isRefreshing) {
    return (
      <div className="data-refreshing">
        <div className="spinner"></div>
        <p>Updating user data...</p>
      </div>
    );
  }

  return <>{children}</>;
};

export default UserDataFetcher;