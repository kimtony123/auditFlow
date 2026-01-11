// context/UserDataContext.tsx - FIXED VERSION
import { createContext, useContext, type ReactNode, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { LiskTestToken__factory, AuditFlowStaking__factory, TOKEN_ADDRESS, STAKING_ADDRESS } from '../utils/contractHelpers';

export type UserTier = 'guest' | 'basic' | 'premium' | 'pro' | 'enterprise';

interface StakeInfo {
  hasActiveStake: boolean;
  tierId: number;
  amountStaked: bigint;
  stakedAt: bigint;
  unlocksAt: bigint;
  accruedYield: bigint;
  daysRemaining: number;
}

interface TierOption {
  id: number;
  name: string;
  description: string;
  minStake: number;
  maxStake: number;
}

export type FeatureType = 
  | 'code_summaries' 
  | 'ai_reports' 
  | 'team_members' 
  | 'priority_support'
  | 'white_label'
  | 'api_access'
  | 'custom_integrations'
  | 'dedicated_support'
  | 'sla'
  | 'unlimited_summaries'
  | 'unlimited_reports';

interface Feature {
  id: number;
  name: string;
  description: string;
  type: FeatureType;
  limit?: number;
}

interface TierFeatures {
  id: number;
  name: string;
  description: string;
  minStake: number;
  maxStake: number;
  minDuration: number;
  maxDuration: number;
  apy: number;
  features: Feature[];
}

interface UserFeatureUsage {
  featureId: number;
  type: FeatureType;
  used: number;
  limit: number;
  remaining: number;
  resetDate: string;
}

interface UserDataContextType {
  userTier: UserTier;
  walletBalance: string;
  tokenAllowance: bigint;
  stakeInfo: StakeInfo | null;
  usageInfo: {
    totalAnalyses: number;
    analysesThisMonth: number;
    analysesRemaining: number;
    lastAnalysisDate: string | null;
  } | null;
  tierOptions: TierOption[];
  tierFeatures: TierFeatures | null;
  userFeatureUsage: UserFeatureUsage[];
  availableFeatures: Feature[];
  isLoading: boolean;
  isRefreshing: boolean;
  lastFetched: Date | null;
  refreshUserData: () => Promise<void>;
  refreshUserDataWithProvider: (provider: ethers.BrowserProvider) => Promise<void>;
  clearUserData: () => void;
  updateAfterStakeAction: (account: string, stakeInfo: StakeInfo | null, newBalance?: string) => void;
  hasFeatureAccess: (featureType: FeatureType) => boolean;
  getFeatureRemaining: (featureType: FeatureType) => number;
  canUseFeature: (featureType: FeatureType, quantity?: number) => boolean;
  recordFeatureUsage: (account: string, featureType: FeatureType, quantity?: number) => Promise<boolean>;
  setWalletBalance: (balance: string) => void;
  setTokenAllowance: (allowance: bigint) => void;
  setStakeInfo: (stakeInfo: StakeInfo | null) => void;
  getUsageInfo: () => {
    totalAnalyses: number;
    analysesThisMonth: number;
    analysesRemaining: number;
    lastAnalysisDate: string | null;
  };
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

interface UserDataProviderProps {
  children: ReactNode;
}

const DEFAULT_TIER_OPTIONS: TierOption[] = [
  {
    id: 2,
    name: "Premium",
    description: "Access 5 premium features",
    minStake: 100,
    maxStake: 200
  },
  {
    id: 3,
    name: "Pro",
    description: "Access 8 professional features",
    minStake: 500,
    maxStake: 1000
  },
  {
    id: 4,
    name: "Enterprise",
    description: "Access all 10 features",
    minStake: 800,
    maxStake: 1600
  }
];

const ALL_FEATURES: Record<number, Feature> = {
  1: { id: 1, name: 'Code Summaries', description: 'Generate code summaries', type: 'code_summaries', limit: 5 },
  2: { id: 2, name: 'AI Reports', description: 'Generate AI audit reports', type: 'ai_reports', limit: 1 },
  3: { id: 3, name: 'Team Members', description: 'Add team members', type: 'team_members', limit: 1 },
  4: { id: 4, name: 'Priority Support', description: 'Priority email support', type: 'priority_support' },
  5: { id: 5, name: 'White Label', description: 'White label reports', type: 'white_label' },
  6: { id: 6, name: 'API Access', description: 'Access to API', type: 'api_access' },
  7: { id: 7, name: 'Custom Integrations', description: 'Custom integrations', type: 'custom_integrations' },
  8: { id: 8, name: 'Dedicated Support', description: 'Dedicated support channel', type: 'dedicated_support' },
  9: { id: 9, name: 'SLA', description: 'Service Level Agreement', type: 'sla' },
  10: { id: 10, name: 'Unlimited Summaries', description: 'Unlimited code summaries', type: 'unlimited_summaries' },
  11: { id: 11, name: 'Unlimited Reports', description: 'Unlimited AI reports', type: 'unlimited_reports' },
};

const TIER_DEFINITIONS: Record<number, TierFeatures> = {
  1: {
    id: 1,
    name: 'Basic',
    description: 'Free tier with basic features - No staking required',
    minStake: 0,
    maxStake: 0,
    minDuration: 0,
    maxDuration: 0,
    apy: 0,
    features: [
      ALL_FEATURES[1],
      ALL_FEATURES[2],
      ALL_FEATURES[3],
    ]
  },
  2: {
    id: 2,
    name: 'Premium',
    description: 'Premium tier with advanced features - 5% APY',
    minStake: 100,
    maxStake: 200,
    minDuration: 1,
    maxDuration: 365,
    apy: 5,
    features: [
      { ...ALL_FEATURES[1], limit: 15 },
      { ...ALL_FEATURES[2], limit: 10 },
      ALL_FEATURES[3],
      ALL_FEATURES[4],
      ALL_FEATURES[5],
    ]
  },
  3: {
    id: 3,
    name: 'Pro',
    description: 'Professional tier with pro features - 5% APY',
    minStake: 500,
    maxStake: 1000,
    minDuration: 1,
    maxDuration: 365,
    apy: 5,
    features: [
      { ...ALL_FEATURES[1], limit: 100 },
      { ...ALL_FEATURES[2], limit: 40 },
      { ...ALL_FEATURES[3], limit: 5 },
      ALL_FEATURES[4],
      ALL_FEATURES[5],
      ALL_FEATURES[6],
      ALL_FEATURES[8],
    ]
  },
  4: {
    id: 4,
    name: 'Enterprise',
    description: 'Enterprise tier with all features - 5% APY',
    minStake: 800,
    maxStake: 1600,
    minDuration: 1,
    maxDuration: 365,
    apy: 5,
    features: [
      ALL_FEATURES[10],
      ALL_FEATURES[11],
      { ...ALL_FEATURES[3], limit: 10 },
      ALL_FEATURES[4],
      ALL_FEATURES[5],
      ALL_FEATURES[6],
      ALL_FEATURES[7],
      ALL_FEATURES[8],
      ALL_FEATURES[9],
    ]
  }
};

const calculateUsageInfo = (userFeatureUsage: UserFeatureUsage[]) => {
  const analysisFeatures = userFeatureUsage.filter(u => 
    u.type === 'code_summaries' || u.type === 'ai_reports'
  );
  
  const totalAnalyses = analysisFeatures.reduce((sum, usage) => sum + usage.used, 0);
  const analysesRemaining = analysisFeatures.reduce((sum, usage) => sum + usage.remaining, 0);
  const analysesThisMonth = totalAnalyses;
  const lastAnalysisDate = null;
  
  return {
    totalAnalyses,
    analysesThisMonth,
    analysesRemaining,
    lastAnalysisDate
  };
};

const getCacheKey = (account: string) => `userDataCache_${account}`;

export const UserDataProvider = ({ children }: UserDataProviderProps) => {
  const [userTier, setUserTier] = useState<UserTier>('guest');
  const [walletBalance, setWalletBalance] = useState<string>("0");
  const [tokenAllowance, setTokenAllowance] = useState<bigint>(0n);
  const [stakeInfo, setStakeInfo] = useState<StakeInfo | null>(null);
  const [usageInfo, setUsageInfo] = useState<{
    totalAnalyses: number;
    analysesThisMonth: number;
    analysesRemaining: number;
    lastAnalysisDate: string | null;
  } | null>(null);
  const [tierOptions] = useState<TierOption[]>(DEFAULT_TIER_OPTIONS);
  const [tierFeatures, setTierFeatures] = useState<TierFeatures | null>(null);
  const [userFeatureUsage, setUserFeatureUsage] = useState<UserFeatureUsage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const CACHE_DURATION = 24 * 60 * 60 * 1000;

  useEffect(() => {
    const loadInitialData = () => {
      try {
        const savedTier = localStorage.getItem('userTier') as UserTier;
        if (savedTier && ['guest', 'basic', 'premium', 'pro', 'enterprise'].includes(savedTier)) {
          setUserTier(savedTier);
        }
      } catch (error) {
        console.error('Error loading initial user data:', error);
      }
    };

    loadInitialData();
  }, []);

  const fetchUserFeatureUsage = useCallback(async (account: string): Promise<UserFeatureUsage[]> => {
    if (!account) return [];

    try {
      const response = await fetch(`/user/${account}/features/usage`);
      
      if (response.ok) {
        const usageData = await response.json();
        return usageData as UserFeatureUsage[];
      } else {
        const tierId = userTier === 'basic' ? 1 : 
                       userTier === 'premium' ? 2 : 
                       userTier === 'pro' ? 3 : 
                       userTier === 'enterprise' ? 4 : 1;
        
        const features = TIER_DEFINITIONS[tierId]?.features || [];
        
        return features.map(feature => ({
          featureId: feature.id,
          type: feature.type,
          used: 0,
          limit: feature.limit || 0,
          remaining: feature.limit || 0,
          resetDate: getNextResetDate()
        }));
      }
    } catch (error) {
      console.error('Error fetching feature usage:', error);
      return [];
    }
  }, [userTier]);

  const getNextResetDate = () => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return nextMonth.toISOString();
  };

  const updateTierFromStake = useCallback((stake: StakeInfo | null) => {
    if (!stake) {
      setUserTier('basic');
      setTierFeatures(TIER_DEFINITIONS[1]);
      return;
    }

    const tierMap: Record<number, UserTier> = {
      1: 'basic',
      2: 'premium',
      3: 'pro',
      4: 'enterprise'
    };

    const newTier = tierMap[stake.tierId] || 'basic';
    setUserTier(newTier);
    setTierFeatures(TIER_DEFINITIONS[stake.tierId]);
  }, []);

  const fetchUserData = useCallback(async (account: string, provider: ethers.BrowserProvider, signer?: ethers.Signer) => {
    if (!account || !provider) return;

    setIsLoading(true);
    const cacheKey = getCacheKey(account);

    try {
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        const { timestamp, data } = JSON.parse(cachedData);
        const now = Date.now();
        
        if (now - timestamp < CACHE_DURATION) {
          console.log('Using cached user data');
          setUserTier(data.userTier);
          setWalletBalance(data.walletBalance);
          setTokenAllowance(BigInt(data.tokenAllowance));
          setStakeInfo(data.stakeInfo);
          
          if (data.userFeatureUsage) {
            setUserFeatureUsage(data.userFeatureUsage);
            setTierFeatures(data.tierFeatures);
            setUsageInfo(calculateUsageInfo(data.userFeatureUsage));
          } else {
            setUsageInfo(data.usageInfo);
          }
          
          setLastFetched(new Date(timestamp));
          setIsLoading(false);
          return;
        }
      }

      console.log('Fetching fresh user data from blockchain');
      
      let currentSigner = signer;
      if (!currentSigner) {
        currentSigner = await provider.getSigner();
      }

      const tokenContract = LiskTestToken__factory.connect(TOKEN_ADDRESS, currentSigner);
      
      const [balance, allowance] = await Promise.all([
        tokenContract.balanceOf(account),
        tokenContract.allowance(account, STAKING_ADDRESS)
      ]);
      
      setWalletBalance(ethers.formatUnits(balance, 18));
      setTokenAllowance(allowance);

      const stakingContract = AuditFlowStaking__factory.connect(STAKING_ADDRESS, currentSigner);
      
      try {
        const tierInfo = await stakingContract.getMyTierInfo();
        
        const tierMap: Record<number, UserTier> = {
          1: "basic",
          2: "premium", 
          3: "pro",
          4: "enterprise"
        };
        const tierId = Number(tierInfo.tierId);
        const newUserTier = tierMap[tierId] || "basic";
        
        setUserTier(newUserTier);
        
        if (tierInfo.hasActiveStake) {
          const newStakeInfo: StakeInfo = {
            hasActiveStake: true,
            tierId: tierId,
            amountStaked: tierInfo.stakedAmount,
            stakedAt: tierInfo.stakeStartTime,
            unlocksAt: tierInfo.stakeEndTime,
            accruedYield: tierInfo.accruedYield,
            daysRemaining: Number(tierInfo.daysRemaining)
          };
          
          setStakeInfo(newStakeInfo);
          updateTierFromStake(newStakeInfo);
        } else {
          setStakeInfo(null);
          updateTierFromStake(null);
        }
        
        const featureUsage = await fetchUserFeatureUsage(account);
        setUserFeatureUsage(featureUsage);
        
        const calculatedUsageInfo = calculateUsageInfo(featureUsage);
        setUsageInfo(calculatedUsageInfo);
        
        setLastFetched(new Date());
        
        const cacheData = {
          timestamp: Date.now(),
          data: {
            userTier: newUserTier,
            walletBalance: ethers.formatUnits(balance, 18),
            tokenAllowance: allowance.toString(),
            stakeInfo: tierInfo.hasActiveStake ? {
              hasActiveStake: true,
              tierId: tierId,
              amountStaked: tierInfo.stakedAmount.toString(),
              stakedAt: tierInfo.stakeStartTime.toString(),
              unlocksAt: tierInfo.stakeEndTime.toString(),
              accruedYield: tierInfo.accruedYield.toString(),
              daysRemaining: Number(tierInfo.daysRemaining)
            } : null,
            tierFeatures: TIER_DEFINITIONS[tierId] || null,
            userFeatureUsage: featureUsage,
            usageInfo: calculatedUsageInfo
          }
        };
        
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        localStorage.setItem('userTier', newUserTier);
        
      } catch (error) {
        console.error('Error fetching staking data:', error);
        setUserTier('basic');
        setStakeInfo(null);
        updateTierFromStake(null);
      }

    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchUserFeatureUsage, updateTierFromStake]);

  const refreshUserDataWithProvider = useCallback(async (provider: ethers.BrowserProvider) => {
    try {
      setIsRefreshing(true);
      const signer = await provider.getSigner();
      const account = await signer.getAddress();
      
      localStorage.removeItem(getCacheKey(account));
      await fetchUserData(account, provider, signer);
      
      console.log('User data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing user data:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchUserData]);

  const refreshUserData = useCallback(async () => {
    console.warn('refreshUserData called without provider - use refreshUserDataWithProvider instead');
  }, []);

  const clearUserData = useCallback(() => {
    setUserTier('guest');
    setWalletBalance("0");
    setTokenAllowance(0n);
    setStakeInfo(null);
    setUsageInfo(null);
    setTierFeatures(null);
    setUserFeatureUsage([]);
    setLastFetched(null);
    localStorage.removeItem('userTier');
  }, []);

  const updateAfterStakeAction = useCallback((account: string, newStakeInfo: StakeInfo | null, newBalance?: string) => {
    if (newStakeInfo) {
      setStakeInfo(newStakeInfo);
      updateTierFromStake(newStakeInfo);
    } else {
      setStakeInfo(null);
      updateTierFromStake(null);
    }
    
    if (newBalance) {
      setWalletBalance(newBalance);
    }
    
    localStorage.removeItem(getCacheKey(account));
  }, [updateTierFromStake]);

  const availableFeatures = tierFeatures?.features || [];

  const hasFeatureAccess = useCallback((featureType: FeatureType): boolean => {
    return availableFeatures.some(f => f.type === featureType);
  }, [availableFeatures]);

  const getFeatureRemaining = useCallback((featureType: FeatureType): number => {
    const usage = userFeatureUsage.find(u => u.type === featureType);
    if (!usage) return 0;
    
    if (new Date(usage.resetDate) < new Date()) {
      return usage.limit;
    }
    
    return Math.max(0, usage.remaining);
  }, [userFeatureUsage]);

  const canUseFeature = useCallback((featureType: FeatureType, quantity: number = 1): boolean => {
    if (!hasFeatureAccess(featureType)) return false;
    
    const usage = userFeatureUsage.find(u => u.type === featureType);
    if (!usage) return false;
    
    if (!usage.limit) return true;
    
    if (new Date(usage.resetDate) < new Date()) {
      return quantity <= usage.limit;
    }
    
    return quantity <= usage.remaining;
  }, [hasFeatureAccess, userFeatureUsage]);

  const recordFeatureUsage = useCallback(async (account: string, featureType: FeatureType, quantity: number = 1): Promise<boolean> => {
    try {
      const response = await fetch('/api/user/features/usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userAddress: account,
          featureType, 
          quantity 
        })
      });
      
      if (response.ok) {
        const provider = window.ethereum ? new ethers.BrowserProvider(window.ethereum) : null;
        if (provider) {
          await refreshUserDataWithProvider(provider);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error recording feature usage:', error);
      return false;
    }
  }, [refreshUserDataWithProvider]);

  const getUsageInfo = useCallback(() => {
    if (usageInfo) return usageInfo;
    
    return calculateUsageInfo(userFeatureUsage);
  }, [usageInfo, userFeatureUsage]);

  const value = {
    userTier,
    walletBalance,
    tokenAllowance,
    stakeInfo,
    usageInfo,
    tierOptions,
    tierFeatures,
    userFeatureUsage,
    availableFeatures,
    isLoading,
    isRefreshing,
    lastFetched,
    refreshUserData,
    refreshUserDataWithProvider,
    clearUserData,
    updateAfterStakeAction,
    hasFeatureAccess,
    getFeatureRemaining,
    canUseFeature,
    recordFeatureUsage,
    setWalletBalance,
    setTokenAllowance,
    setStakeInfo,
    getUsageInfo
  };

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  );
};

export const useUserData = () => {
  const context = useContext(UserDataContext);
  if (!context) {
    throw new Error('useUserData must be used within a UserDataProvider');
  }
  return context;
};