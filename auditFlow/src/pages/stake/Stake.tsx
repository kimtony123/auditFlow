// pages/stake/Stake.tsx
import React, { useState, useEffect } from "react";
import { useWallet } from "../../services/WalletProvider";
import Layout from "../../layout/Layout";
import { 
  LiskTestToken__factory, 
  AuditFlowStaking__factory, 
  TOKEN_ADDRESS, 
  STAKING_ADDRESS 
} from "../../utils/contractHelpers";
import { ethers } from "ethers";
import "./Stake.css";

// Tier enum matching contract
enum Tier {
  NONE = 0,
  BASIC = 1,
  PREMIUM = 2,
  PRO = 3,
  ENTERPRISE = 4
}

interface TierInfo {
  tierId: number;
  name: string;
  description: string;
  baseTokens: bigint;
  maxTokens: bigint;
  featureAccess: number[];
  minStakeDays: number;
  maxStakeDays: number;
  yieldRate: number;
}

interface UserStakeInfo {
  hasActiveStake: boolean;
  tierId: number;
  amountStaked: bigint;
  stakedAt: bigint;
  unlocksAt: bigint;
  accruedYield: bigint;
  daysRemaining: number;
}

interface TierOption {
  id: Tier;
  name: string;
  description: string;
  minStake: number;
  maxStake: number;
}

const Stake: React.FC = () => {
  const { account, isConnected, getSigner, isOnLisk } = useWallet();
  
  // State for user's current stake
  const [userStake, setUserStake] = useState<UserStakeInfo | null>(null);
  const [currentTier, setCurrentTier] = useState<string>("basic");
  
  // State for new stake
  const [selectedTier, setSelectedTier] = useState<Tier>(Tier.PREMIUM);
  const [stakingDuration, setStakingDuration] = useState<number>(30);
  const [requiredStake, setRequiredStake] = useState<string>("0");
  
  // Token info
  const [walletBalance, setWalletBalance] = useState<string>("0");
  const [tokenAllowance, setTokenAllowance] = useState<bigint>(0n);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tierOptions, setTierOptions] = useState<TierOption[]>([]);
  
  // Tier options for UI
  const tierOptionsData: TierOption[] = [
    {
      id: Tier.PREMIUM,
      name: "Premium",
      description: "Access 5 premium features",
      minStake: 100,
      maxStake: 200
    },
    {
      id: Tier.PRO,
      name: "Pro",
      description: "Access 8 professional features",
      minStake: 500,
      maxStake: 1000
    },
    {
      id: Tier.ENTERPRISE,
      name: "Enterprise",
      description: "Access all 10 features",
      minStake: 800,
      maxStake: 1600
    }
  ];

  // Fetch all user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!isConnected || !account || !isOnLisk) return;

      try {
        const signer = await getSigner();
        if (!signer) return;

        // Get token balance
        const tokenContract = LiskTestToken__factory.connect(TOKEN_ADDRESS, signer);
        const balance = await tokenContract.balanceOf(account);
        setWalletBalance(ethers.formatUnits(balance, 18));

        // Get allowance
        const allowance = await tokenContract.allowance(account, STAKING_ADDRESS);
        setTokenAllowance(allowance);

        // Get staking contract
        const stakingContract = AuditFlowStaking__factory.connect(STAKING_ADDRESS, signer);
        
        try {
          // Get user's tier info
          const tierInfo = await stakingContract.getMyTierInfo();
          
          // Update current tier for UI
          const tierMap: { [key: number]: string } = {
            1: "basic",
            2: "premium", 
            3: "pro",
            4: "enterprise"
          };
          setCurrentTier(tierMap[Number(tierInfo.tierId)] || "basic");
          
          // Set user stake info
          if (tierInfo.hasActiveStake) {
            setUserStake({
              hasActiveStake: true,
              tierId: Number(tierInfo.tierId),
              amountStaked: tierInfo.stakedAmount,
              stakedAt: tierInfo.stakeStartTime,
              unlocksAt: tierInfo.stakeEndTime,
              accruedYield: tierInfo.accruedYield,
              daysRemaining: Number(tierInfo.daysRemaining)
            });
          } else {
            setUserStake(null);
          }
          
        } catch (error) {
          console.warn("Error fetching tier info:", error);
        }

        // Get all tiers for display
        const allTiers = await stakingContract.getAllTiers();
        console.log("All tiers:", allTiers);
        
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
    setTierOptions(tierOptionsData);
  }, [isConnected, account, isOnLisk, success]);

  // Calculate required stake when tier or duration changes
  useEffect(() => {
    const calculateStake = async () => {
      if (!isConnected || !account || selectedTier === Tier.BASIC) {
        setRequiredStake("0");
        return;
      }

      try {
        const signer = await getSigner();
        if (!signer) return;

        const stakingContract = AuditFlowStaking__factory.connect(STAKING_ADDRESS, signer);
        
        // Calculate required stake in wei
        const requiredWei = await stakingContract.calculateRequiredStakeByTierId(
          selectedTier,
          stakingDuration
        );
        
        // Convert to whole tokens for display
        const requiredTokens = ethers.formatUnits(requiredWei, 18);
        setRequiredStake(requiredTokens);
        
      } catch (error) {
        console.error("Error calculating stake:", error);
        setRequiredStake("0");
      }
    };

    calculateStake();
  }, [selectedTier, stakingDuration, isConnected, account]);

  // Handle token approval
  const handleApproveTokens = async () => {
    if (!isConnected || !account) {
      setError("Please connect wallet");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const signer = await getSigner();
      if (!signer) throw new Error("No signer available");

      const tokenContract = LiskTestToken__factory.connect(TOKEN_ADDRESS, signer);
      
      // Use infinite approval for better UX
      const infiniteApproval = ethers.MaxUint256;
      const tx = await tokenContract.approve(STAKING_ADDRESS, infiniteApproval);
      
      setSuccess("Approval transaction submitted...");
      await tx.wait();
      
      // Update allowance
      const newAllowance = await tokenContract.allowance(account, STAKING_ADDRESS);
      setTokenAllowance(newAllowance);
      
      setSuccess("✅ Tokens approved successfully!");
      
    } catch (error: any) {
      console.error("Approval error:", error);
      setError(error.message || "Failed to approve tokens");
    } finally {
      setLoading(false);
    }
  };

  // Handle staking
  const handleStake = async () => {
    if (!isConnected || !account || !isOnLisk) {
      setError("Please connect wallet and switch to Lisk");
      return;
    }

    if (userStake?.hasActiveStake) {
      setError("You already have an active stake");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const signer = await getSigner();
      if (!signer) throw new Error("No signer available");

      const requiredWei = ethers.parseUnits(requiredStake, 18);

      // Check balance
      const tokenContract = LiskTestToken__factory.connect(TOKEN_ADDRESS, signer);
      const balance = await tokenContract.balanceOf(account);
      
      if (balance < requiredWei) {
        throw new Error(`Insufficient balance. Need ${requiredStake} LTT`);
      }

      // Check allowance
      if (tokenAllowance < requiredWei) {
        throw new Error("Please approve tokens first");
      }

      // Call stake function
      const stakingContract = AuditFlowStaking__factory.connect(STAKING_ADDRESS, signer);
      const tx = await stakingContract.stake(selectedTier, stakingDuration);
      
      setSuccess("Staking transaction submitted...");
      
      const receipt = await tx.wait();
      if (receipt?.status === 1) {
        setSuccess(`✅ Successfully staked ${requiredStake} LTT for ${stakingDuration} days!`);
        
        // Refresh data after 3 seconds
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        throw new Error("Transaction failed");
      }

    } catch (error: any) {
      console.error("Staking error:", error);
      setError(error.message || "Failed to stake tokens");
    } finally {
      setLoading(false);
    }
  };

  // Handle normal unstake
  const handleUnstake = async () => {
    if (!isConnected || !account || !userStake?.hasActiveStake) {
      setError("No active stake found");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const signer = await getSigner();
      if (!signer) throw new Error("No signer available");

      const stakingContract = AuditFlowStaking__factory.connect(STAKING_ADDRESS, signer);
      
      // Check if stake is mature
      const currentTime = BigInt(Math.floor(Date.now() / 1000));
      const isMature = currentTime >= userStake.unlocksAt;
      
      if (!isMature) {
        setError("Stake is not mature yet. Use emergency unstake (50% penalty)");
        setLoading(false);
        return;
      }

      const tx = await stakingContract.unstake();
      setSuccess("Unstaking transaction submitted...");
      
      const receipt = await tx.wait();
      if (receipt?.status === 1) {
        setSuccess("✅ Successfully unstaked! Yield sent to DAO.");
        setTimeout(() => window.location.reload(), 3000);
      } else {
        throw new Error("Transaction failed");
      }

    } catch (error: any) {
      console.error("Unstake error:", error);
      setError(error.message || "Failed to unstake");
    } finally {
      setLoading(false);
    }
  };

  // Handle emergency unstake
  const handleEmergencyUnstake = async () => {
    if (!isConnected || !account || !userStake?.hasActiveStake) {
      setError("No active stake found");
      return;
    }

    // Confirm penalty
    const penaltyAmount = Number(ethers.formatUnits(userStake.amountStaked, 18)) * 0.5;
    const confirmed = window.confirm(
      `⚠️ EMERGENCY UNSTAKE WARNING\n\n` +
      `You will lose 50% of your staked amount as penalty.\n` +
      `Penalty: ${penaltyAmount.toFixed(2)} LTT\n` +
      `You will receive: ${(penaltyAmount).toFixed(2)} LTT\n\n` +
      `Click OK to confirm emergency unstake.`
    );
    
    if (!confirmed) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const signer = await getSigner();
      if (!signer) throw new Error("No signer available");

      const stakingContract = AuditFlowStaking__factory.connect(STAKING_ADDRESS, signer);
      const tx = await stakingContract.emergencyUnstake();
      
      setSuccess("Emergency unstake transaction submitted...");
      
      const receipt = await tx.wait();
      if (receipt?.status === 1) {
        setSuccess("✅ Emergency unstake completed (50% penalty applied)");
        setTimeout(() => window.location.reload(), 3000);
      } else {
        throw new Error("Transaction failed");
      }

    } catch (error: any) {
      console.error("Emergency unstake error:", error);
      setError(error.message || "Failed to emergency unstake");
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString();
  };

  // Format time remaining
  const formatTimeRemaining = (days: number) => {
    if (days >= 30) {
      const months = Math.floor(days / 30);
      const remainingDays = days % 30;
      return `${months}m ${remainingDays}d`;
    }
    return `${days}d`;
  };

  // Reset messages
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // Not connected view
  if (!isConnected) {
    return (
      <Layout showConnectPrompt={true} userTier={currentTier}>
        <div className="stake-page">
          <div className="stake-hero">
            <h1>Stake LTT Tokens</h1>
            <p className="subtitle">Stake LTT to unlock premium features and earn rewards</p>
            <div className="connect-prompt">
              <p>Connect your wallet to start staking</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Wrong network
  if (!isOnLisk) {
    return (
      <Layout showConnectPrompt={true} userTier={currentTier}>
        <div className="stake-page">
          <div className="network-warning">
            <h2>⚠️ Wrong Network</h2>
            <p>Please switch to Lisk network to use staking features</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showConnectPrompt={true} userTier={currentTier}>
      <div className="stake-page">
        {/* Header */}
        <div className="stake-header">
          <h1>Staking Dashboard</h1>
          <p className="subtitle">Manage your LTT staking positions</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">❌</span>
            <span className="alert-text">{error}</span>
          </div>
        )}
        
        {success && (
          <div className="alert alert-success">
            <span className="alert-icon">✅</span>
            <span className="alert-text">{success}</span>
          </div>
        )}

        <div className="stake-container">
          {/* Current Stake Section */}
          <div className="current-stake-section">
            <h2>Your Current Position</h2>
            
            {userStake?.hasActiveStake ? (
              <div className="current-stake-card">
                <div className="stake-header-row">
                  <div className="tier-badge">
                    <span className={`tier-${currentTier}`}>
                      {tierOptions.find(t => t.id === userStake.tierId)?.name || "Unknown"} Tier
                    </span>
                  </div>
                  <div className="stake-status active">Active</div>
                </div>
                
                <div className="stake-details">
                  <div className="detail-row">
                    <span className="label">Staked Amount:</span>
                    <span className="value">
                      {ethers.formatUnits(userStake.amountStaked, 18)} LTT
                    </span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="label">Start Date:</span>
                    <span className="value">
                      {formatDate(userStake.stakedAt)}
                    </span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="label">Maturity Date:</span>
                    <span className="value">
                      {formatDate(userStake.unlocksAt)}
                    </span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="label">Time Remaining:</span>
                    <span className="value">
                      {formatTimeRemaining(userStake.daysRemaining)}
                    </span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="label">Accrued Yield:</span>
                    <span className="value">
                      {ethers.formatUnits(userStake.accruedYield, 18)} LTT
                    </span>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="stake-actions">
                  <button 
                    onClick={handleUnstake}
                    className="btn btn-unstake"
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : 'Unstake'}
                  </button>
                  
                  <button 
                    onClick={handleEmergencyUnstake}
                    className="btn btn-emergency"
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : 'Emergency Unstake'}
                  </button>
                </div>
                
                <div className="penalty-warning">
                  ⚠️ Emergency unstake incurs 50% penalty
                </div>
              </div>
            ) : (
              <div className="no-stake-card">
                <div className="no-stake-icon">📊</div>
                <h3>No Active Stake</h3>
                <p>You're not currently staking any LTT tokens</p>
                <p className="current-tier">
                  Current Tier: <span className={`tier-${currentTier}`}>{currentTier.toUpperCase()}</span>
                </p>
              </div>
            )}
            
            {/* Wallet Info */}
            <div className="wallet-info-card">
              <h3>Wallet Information</h3>
              <div className="wallet-details">
                <div className="detail-row">
                  <span className="label">Balance:</span>
                  <span className="value">{parseFloat(walletBalance).toFixed(2)} LTT</span>
                </div>
      
              </div>
            </div>
          </div>

          {/* New Stake Section */}
          <div className="new-stake-section">
            <h2>Stake New Tokens</h2>
            
            <div className="stake-form">
              {/* Tier Selection */}
              <div className="form-section">
                <label className="form-label">Select Tier</label>
                <div className="tier-selection">
                  {tierOptions.map(tier => (
                    <div
                      key={tier.id}
                      className={`tier-card ${selectedTier === tier.id ? 'selected' : ''}`}
                      onClick={() => !userStake?.hasActiveStake && setSelectedTier(tier.id)}
                    >
                      <div className="tier-card-header">
                        <h3>{tier.name}</h3>
                        <div className="tier-price-range">
                          {tier.minStake} - {tier.maxStake} LTT
                        </div>
                      </div>
                      <p className="tier-description">{tier.description}</p>
                      <div className="tier-features">
                        <span className="feature-count">
                          {tier.id === Tier.PREMIUM ? '5' : tier.id === Tier.PRO ? '8' : '10'} Features
                        </span>
                        <span className="yield-rate">5% APY</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Duration Selection */}
              <div className="form-section">
                <label className="form-label">
                  Staking Duration: <span className="duration-value">{stakingDuration} days</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="365"
                  value={stakingDuration}
                  onChange={(e) => setStakingDuration(parseInt(e.target.value))}
                  className="duration-slider"
                  disabled={userStake?.hasActiveStake}
                />
                <div className="duration-presets">
                  {[7, 30, 90, 180, 365].map(days => (
                    <button
                      key={days}
                      className={`preset-btn ${stakingDuration === days ? 'active' : ''}`}
                      onClick={() => setStakingDuration(days)}
                      disabled={userStake?.hasActiveStake}
                    >
                      {days === 365 ? '1 Year' : `${days} Days`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stake Summary */}
              <div className="stake-summary">
                <div className="summary-header">Stake Summary</div>
                <div className="summary-row">
                  <span>Required Stake:</span>
                  <span className="amount">{parseFloat(requiredStake).toFixed(2)} LTT</span>
                </div>
                <div className="summary-row">
                  <span>Your Balance:</span>
                  <span className={`amount ${parseFloat(walletBalance) >= parseFloat(requiredStake) ? 'sufficient' : 'insufficient'}`}>
                    {parseFloat(walletBalance).toFixed(2)} LTT
                  </span>
                </div>
                
                {parseFloat(walletBalance) < parseFloat(requiredStake) && (
                  <div className="balance-warning">
                    ⚠️ Insufficient balance. Need {(parseFloat(requiredStake) - parseFloat(walletBalance)).toFixed(2)} more LTT
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="action-buttons">
                {tokenAllowance < ethers.parseUnits(requiredStake || "0", 18) && (
                  <button
                    onClick={handleApproveTokens}
                    className="btn btn-approve"
                    disabled={loading || userStake?.hasActiveStake}
                  >
                    {loading ? 'Approving...' : 'Approve LTT Tokens'}
                  </button>
                )}
                
                <button
                  onClick={handleStake}
                  className="btn btn-stake"
                  disabled={
                    loading ||
                    userStake?.hasActiveStake ||
                    parseFloat(walletBalance) < parseFloat(requiredStake) ||
                    tokenAllowance < ethers.parseUnits(requiredStake || "0", 18)
                  }
                >
                  {loading ? 'Processing...' : 
                   userStake?.hasActiveStake ? 'Already Staked' :
                   parseFloat(walletBalance) < parseFloat(requiredStake) ? 'Insufficient Balance' :
                   tokenAllowance < ethers.parseUnits(requiredStake || "0", 18) ? 'Approve Tokens First' :
                   'Stake Now'}
                </button>
              </div>
              
              <div className="stake-info">
                <p>ℹ️ Staking provides access to premium features and earns 5% APY yield</p>
                <p>⚠️ Early unstaking incurs 50% penalty</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Stake;