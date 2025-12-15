// components/UserUsageFetcher.tsx
import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useWallet } from '../../services/WalletProvider';

interface UserUsage {
  totalAnalyses: number;
  analysesThisMonth: number;
  analysesRemaining: number;
  lastAnalysisDate: string | null;
}

interface UserUsageContextType {
  userUsage: UserUsage | null;
  loading: boolean;
  error: string | null;
  refreshUserUsage: () => Promise<void>;
}

const UserUsageContext = createContext<UserUsageContextType | undefined>(undefined);

export const useUserUsage = () => {
  const context = useContext(UserUsageContext);
  if (!context) {
    throw new Error('useUserUsage must be used within a UserUsageProvider');
  }
  return context;
};

interface UserUsageFetcherProps {
  children: ReactNode;
}

export const UserUsageFetcher: React.FC<UserUsageFetcherProps> = ({ children }) => {
  const { account, isConnected } = useWallet();
  const [userUsage, setUserUsage] = useState<UserUsage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserUsage = async () => {
    if (!isConnected || !account) {
      setUserUsage(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:3001/api/user/${account}/usage`);
      
      if (response.ok) {
        const data = await response.json();
        setUserUsage(data);
      } else {
        throw new Error('Failed to fetch user usage');
      }
    } catch (err: any) {
      console.error('Error fetching user usage:', err);
      setError(err.message);
      
      // Set default values based on basic tier
      setUserUsage({
        totalAnalyses: 0,
        analysesThisMonth: 0,
        analysesRemaining: 5,
        lastAnalysisDate: null
      });
    } finally {
      setLoading(false);
    }
  };

  // Cache user usage data
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  const CACHE_KEY = `userUsageCache_${account}`;

  const fetchWithCache = async () => {
    if (!isConnected || !account) return;

    // Check cache
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
      const { timestamp, data } = JSON.parse(cachedData);
      const now = Date.now();
      
      if (now - timestamp < CACHE_DURATION) {
        setUserUsage(data);
        return;
      }
    }

    // Fetch fresh data
    await fetchUserUsage();
    
    // Update cache
    if (userUsage) {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        timestamp: Date.now(),
        data: userUsage
      }));
    }
  };

  // Fetch on mount and when account changes
  useEffect(() => {
    fetchWithCache();
  }, [isConnected, account]);

  // Clear cache when component unmounts
  useEffect(() => {
    return () => {
      // Optional: Clear cache if needed
    };
  }, []);

  const refreshUserUsage = async () => {
    localStorage.removeItem(CACHE_KEY);
    await fetchUserUsage();
  };

  const value = {
    userUsage,
    loading,
    error,
    refreshUserUsage
  };

  return (
    <UserUsageContext.Provider value={value}>
      {children}
    </UserUsageContext.Provider>
  );
};