import { createContext, useContext, type ReactNode, useState, useEffect } from 'react';
import { ethers } from 'ethers';

export type UserTier = 'guest' | 'basic' | 'premium' | 'pro' | 'enterprise';

interface UserTypeContextType {
  userTier: UserTier;
  setUserTier: (tier: UserTier) => void;
  stakedAmount: number;
  setStakedAmount: (amount: number) => void;
  stakingEndDate: Date | null;
  setStakingEndDate: (date: Date | null) => void;
  isStakingActive: boolean;
  checkUserTierFromBlockchain: (account: string, provider: ethers.BrowserProvider) => Promise<void>;
  hasFeatureAccess: (feature: string) => boolean;
  resetUser: () => void;
}

const UserTypeContext = createContext<UserTypeContextType | undefined>(undefined);

interface UserTypeProviderProps {
  children: ReactNode;
}

// Mock contract ABI for staking
const STAKING_CONTRACT_ABI = [
  "function getUserStake(address user) view returns (uint256 amount, uint256 endTime)",
  "function getTierForStake(uint256 amount) view returns (uint8 tier)"
];

// Feature access matrix
const TIER_FEATURES: Record<UserTier, string[]> = {
  'guest': ['view_landing', 'connect_wallet'],
  'basic': ['view_landing', 'connect_wallet', '5_summaries_month', '1_report_month', 'github_integration'],
  'premium': ['view_landing', 'connect_wallet', '15_summaries_month', '10_reports_month', 'priority_github', 'advanced_ai', 'email_support'],
  'pro': ['view_landing', 'connect_wallet', '100_summaries_month', '40_reports_month', 'team_members_5', 'white_label', 'api_access', 'priority_support'],
  'enterprise': ['view_landing', 'connect_wallet', 'unlimited_summaries', 'unlimited_reports', 'team_members_10', 'custom_integrations', 'dedicated_support', 'sla']
};

export const UserTypeProvider = ({ children }: UserTypeProviderProps) => {
  const [userTier, setUserTier] = useState<UserTier>('guest');
  const [stakedAmount, setStakedAmount] = useState<number>(0);
  const [stakingEndDate, setStakingEndDate] = useState<Date | null>(null);
  const [isStakingActive, setIsStakingActive] = useState<boolean>(false);

  // Load user data from localStorage on mount
  useEffect(() => {
    const savedTier = localStorage.getItem('userTier') as UserTier;
    const savedAmount = localStorage.getItem('stakedAmount');
    const savedEndDate = localStorage.getItem('stakingEndDate');
    
    if (savedTier && ['guest', 'basic', 'premium', 'pro', 'enterprise'].includes(savedTier)) {
      setUserTier(savedTier);
    }
    
    if (savedAmount) {
      setStakedAmount(parseFloat(savedAmount));
    }
    
    if (savedEndDate) {
      const date = new Date(savedEndDate);
      if (date > new Date()) {
        setStakingEndDate(date);
        setIsStakingActive(true);
      }
    }
  }, []);

  // Save user data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('userTier', userTier);
    localStorage.setItem('stakedAmount', stakedAmount.toString());
    if (stakingEndDate) {
      localStorage.setItem('stakingEndDate', stakingEndDate.toISOString());
    }
  }, [userTier, stakedAmount, stakingEndDate]);

  // Check staking status periodically
  useEffect(() => {
    const checkStakingStatus = () => {
      if (stakingEndDate && new Date() > stakingEndDate) {
        // Staking period ended
        setIsStakingActive(false);
        // Reset to basic tier if not guest
        if (userTier !== 'guest') {
          setUserTier('basic');
          setStakedAmount(0);
        }
      }
    };

    const interval = setInterval(checkStakingStatus, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [stakingEndDate, userTier]);

  const checkUserTierFromBlockchain = async (account: string, provider: ethers.BrowserProvider) => {
    try {
      // Replace with your actual contract address
      const contractAddress = '0xYOUR_CONTRACT_ADDRESS';
      
      // Create contract instance with provider (ethers v6)
      const contract = new ethers.Contract(contractAddress, STAKING_CONTRACT_ABI, provider);
      
      // Get user's stake
      const [amount, endTime] = await contract.getUserStake(account);
      const tier = await contract.getTierForStake(amount);
      
      // Convert tier number to string
      const tierMap = ['basic', 'premium', 'pro', 'enterprise'];
      const userTier = tierMap[Number(tier)] || 'guest';
      
      // Convert from wei (ethers v6 formatEther returns string)
      const formattedAmount = parseFloat(ethers.formatEther(amount));
      
      // Convert endTime (bigint) to Date
      const endTimeMs = Number(endTime) * 1000;
      
      setStakedAmount(formattedAmount);
      setStakingEndDate(new Date(endTimeMs));
      setUserTier(userTier as UserTier);
      setIsStakingActive(endTimeMs > Date.now());
      
    } catch (error) {
      console.error('Error checking user tier from blockchain:', error);
      // Fallback for demo purposes
      if (account) {
        // Mock: assign tier based on account hash
        const hash = account.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const mockTiers: UserTier[] = ['basic', 'premium', 'pro', 'enterprise'];
        const mockTier = mockTiers[hash % 4];
        setUserTier(mockTier);
        setStakedAmount([0, 150, 750, 1200][hash % 4]);
      }
    }
  };

  const hasFeatureAccess = (feature: string): boolean => {
    return TIER_FEATURES[userTier]?.includes(feature) || false;
  };

  const resetUser = () => {
    setUserTier('guest');
    setStakedAmount(0);
    setStakingEndDate(null);
    setIsStakingActive(false);
    localStorage.removeItem('userTier');
    localStorage.removeItem('stakedAmount');
    localStorage.removeItem('stakingEndDate');
  };

  return (
    <UserTypeContext.Provider value={{
      userTier,
      setUserTier,
      stakedAmount,
      setStakedAmount,
      stakingEndDate,
      setStakingEndDate,
      isStakingActive,
      checkUserTierFromBlockchain,
      hasFeatureAccess,
      resetUser
    }}>
      {children}
    </UserTypeContext.Provider>
  );
};

export const useUserType = () => {
  const context = useContext(UserTypeContext);
  if (!context) {
    throw new Error('useUserType must be used within a UserTypeProvider');
  }
  return context;
};