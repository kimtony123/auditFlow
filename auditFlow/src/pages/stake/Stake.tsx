// Stake.tsx - WITH DIVVI INTEGRATION (FIXED)
import React, { useState, useEffect } from "react";
import { useWallet } from "../../services/WalletProvider";
import { useUserData } from "../../context/UserDataContext";
import Layout from "../../layout/Layout";
import { 
  LiskTestToken__factory, 
  AuditFlowStaking__factory, 
  TOKEN_ADDRESS, 
  STAKING_ADDRESS 
} from "../../utils/contractHelpers";
import { ethers } from "ethers";
import { DivviService } from "../../services/Divvi";
import "./Stake.css";

type TierType = 1 | 2 | 3 | 4;
const Tier = {
  BASIC: 1 as TierType,
  PREMIUM: 2 as TierType,
  PRO: 3 as TierType,
  ENTERPRISE: 4 as TierType
} as const;

interface UserStakeInfo {
  hasActiveStake: boolean;
  tierId: number;
  amountStaked: bigint;
  stakedAt: bigint;
  unlocksAt: bigint;
  accruedYield: bigint;
  daysRemaining: number;
}

const Stake: React.FC = () => {
  const { account, isConnected, getSigner, isOnLisk, provider: walletProvider } = useWallet();
  const { 
    userTier: currentTier, 
    walletBalance, 
    tokenAllowance, 
    stakeInfo, 
    tierOptions,
    setWalletBalance,
    setTokenAllowance,
   
    updateAfterStakeAction,
    refreshUserDataWithProvider
  } = useUserData();
  
  const [selectedTier, setSelectedTier] = useState<TierType>(Tier.PREMIUM);
  const [stakingDuration, setStakingDuration] = useState<number>(30);
  const [requiredStake, setRequiredStake] = useState<string>("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showEmergencyWarning, setShowEmergencyWarning] = useState(false);
  const [emergencyLoading, setEmergencyLoading] = useState(false);
  const [allTiers, setAllTiers] = useState<any[]>([]);
  const [divviEnabled, setDivviEnabled] = useState(false);
  const [referralStatus, setReferralStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');

  useEffect(() => {
    setDivviEnabled(DivviService.isConfigured());
  }, []);

  useEffect(() => {
    const fetchAllTiers = async () => {
      if (!isConnected || !account || !isOnLisk) return;

      try {
        const signer = await getSigner();
        if (!signer) return;

        const stakingContract = AuditFlowStaking__factory.connect(STAKING_ADDRESS, signer);
        const tiers = await stakingContract.getAllTiers();
        setAllTiers(tiers);
        
      } catch (error) {
        console.error("Error fetching all tiers:", error);
      }
    };

    fetchAllTiers();
  }, [isConnected, account, isOnLisk]);

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
        
        const requiredWei = await stakingContract.calculateRequiredStakeByTierId(
          selectedTier,
          stakingDuration
        );
        
        const requiredTokens = ethers.formatUnits(requiredWei, 18);
        setRequiredStake(requiredTokens);
        
      } catch (error) {
        console.error("Error calculating stake:", error);
        setRequiredStake("0");
      }
    };

    calculateStake();
  }, [selectedTier, stakingDuration, isConnected, account]);

  const handleApproveTokens = async () => {
    if (!isConnected || !account) {
      setError("Please connect wallet");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setReferralStatus('idle');

    try {
      const signer = await getSigner();
      if (!signer) throw new Error("No signer available");

      const tokenContract = LiskTestToken__factory.connect(TOKEN_ADDRESS, signer);
      
      const infiniteApproval = ethers.MaxUint256;
      const tx = await tokenContract.approve(STAKING_ADDRESS, infiniteApproval);
      
      setSuccess("Approval transaction submitted...");
      await tx.wait();
      
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

  const handleStake = async () => {
    if (!isConnected || !account || !isOnLisk) {
      setError("Please connect wallet and switch to Lisk");
      return;
    }

    if (stakeInfo?.hasActiveStake) {
      setError("You already have an active stake");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setReferralStatus('idle');

    try {
      const signer = await getSigner();
      if (!signer) throw new Error("No signer available");

      const requiredWei = ethers.parseUnits(requiredStake, 18);
      const balance = ethers.parseUnits(walletBalance, 18);
      
      if (balance < requiredWei) {
        throw new Error(`Insufficient balance. Need ${requiredStake} LTT`);
      }

      if (tokenAllowance < requiredWei) {
        throw new Error("Please approve tokens first");
      }

      const stakingContract = AuditFlowStaking__factory.connect(STAKING_ADDRESS, signer);
      
      let referralTag = '';
      let hasDivviTag = false;
      
      if (divviEnabled) {
        try {
          referralTag = DivviService.generateReferralTagFromString(account);
          if (referralTag && referralTag.length > 0) {
            hasDivviTag = true;
            console.log("Divvi referral tag generated:", referralTag.substring(0, 20) + "...");
          }
        } catch (error) {
          console.warn("Divvi tag generation failed, proceeding without referral:", error);
        }
      }

      let tx;
      
      if (hasDivviTag) {
        // Get the function signature for stake
        const stakeTx = await stakingContract.stake.populateTransaction(selectedTier, stakingDuration);
        const stakeData = stakeTx.data;
        
        if (!stakeData) {
          throw new Error("Failed to get stake transaction data");
        }
        
        const dataWithReferral = stakeData + referralTag.slice(2);
        const gasEstimate = await signer.estimateGas({
          to: STAKING_ADDRESS,
          data: dataWithReferral,
        });
        const gasLimit = gasEstimate * 150n / 100n;
        
        tx = await signer.sendTransaction({
          to: STAKING_ADDRESS,
          data: dataWithReferral,
          gasLimit: gasLimit,
        });
        
        console.log("Stake transaction sent with Divvi referral tracking");
      } else {
        const gasEstimate = await stakingContract.stake.estimateGas(selectedTier, stakingDuration);
        const gasLimit = gasEstimate * 150n / 100n;
        
        tx = await stakingContract.stake(selectedTier, stakingDuration, {
          gasLimit: gasLimit,
        });
        
        console.log("Stake transaction sent without Divvi");
      }
      
      setSuccess("Staking transaction submitted...");
      
      const receipt = await tx.wait();
      if (receipt?.status === 1) {
        let successMessage = `✅ Successfully staked ${requiredStake} LTT for ${stakingDuration} days!`;
        
        if (hasDivviTag) {
          setReferralStatus('pending');
          try {
            const chainId = (await signer.provider?.getNetwork())?.chainId || 4202;
            const referralSubmitted = await DivviService.submitReferralFromStrings(
              tx.hash,
              Number(chainId),
              account
            );
           
            if (referralSubmitted) {
              setReferralStatus('success');
              successMessage += ` 🎯`;
            } else {
              setReferralStatus('error');
              successMessage += ` (Referral tracking failed)`;
            }
          } catch (error) {
            console.error("Error submitting to Divvi:", error);
            setReferralStatus('error');
            successMessage += ` (Referral submission error)`;
          }
        }
        
        setSuccess(successMessage);
        
        const tierInfo = await stakingContract.getMyTierInfo();
        
        if (tierInfo.hasActiveStake) {
          const newStakeInfo: UserStakeInfo = {
            hasActiveStake: true,
            tierId: Number(tierInfo.tierId),
            amountStaked: tierInfo.stakedAmount,
            stakedAt: tierInfo.stakeStartTime,
            unlocksAt: tierInfo.stakeEndTime,
            accruedYield: tierInfo.accruedYield,
            daysRemaining: Number(tierInfo.daysRemaining)
          };
          
          const tokenContract = LiskTestToken__factory.connect(TOKEN_ADDRESS, signer);
          const newBalance = await tokenContract.balanceOf(account);
          const newBalanceStr = ethers.formatUnits(newBalance, 18);
          
          updateAfterStakeAction(account, newStakeInfo, newBalanceStr);
        }
        
        if (walletProvider) {
          await refreshUserDataWithProvider(walletProvider);
        }
        
      } else {
        throw new Error("Transaction failed");
      }

    } catch (error: any) {
      console.error("Staking error:", error);
      setError(error.message || "Failed to stake tokens");
      setReferralStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleUnstake = async () => {
    if (!isConnected || !account || !stakeInfo?.hasActiveStake) {
      setError("No active stake found");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setReferralStatus('idle');

    try {
      const signer = await getSigner();
      if (!signer) throw new Error("No signer available");

      const stakingContract = AuditFlowStaking__factory.connect(STAKING_ADDRESS, signer);
      
      const currentTime = BigInt(Math.floor(Date.now() / 1000));
      const isMature = currentTime >= stakeInfo.unlocksAt;
      
      if (!isMature) {
        setError("Stake is not mature yet. Use emergency unstake (50% penalty)");
        setLoading(false);
        return;
      }

      let referralTag = '';
      let hasDivviTag = false;
      
      if (divviEnabled) {
        try {
          referralTag = DivviService.generateReferralTagFromString(account);
          if (referralTag && referralTag.length > 0) {
            hasDivviTag = true;
            console.log("Divvi referral tag generated:", referralTag.substring(0, 20) + "...");
          }
        } catch (error) {
          console.warn("Divvi tag generation failed, proceeding without referral:", error);
        }
      }

      let tx;
      
      if (hasDivviTag) {
        // Try to get the function data - use the actual contract call
        const unstakeTx = await stakingContract.unstake.populateTransaction();
        const unstakeData = unstakeTx.data;
        
        if (!unstakeData) {
          throw new Error("Failed to get unstake transaction data");
        }
        
        const dataWithReferral = unstakeData + referralTag.slice(2);
        const gasEstimate = await signer.estimateGas({
          to: STAKING_ADDRESS,
          data: dataWithReferral,
        });
        const gasLimit = gasEstimate * 150n / 100n;
        
        tx = await signer.sendTransaction({
          to: STAKING_ADDRESS,
          data: dataWithReferral,
          gasLimit: gasLimit,
        });
        
        console.log("Unstake transaction sent with Divvi referral tracking");
      } else {
        const gasEstimate = await stakingContract.unstake.estimateGas();
        const gasLimit = gasEstimate * 150n / 100n;
        
        tx = await stakingContract.unstake({
          gasLimit: gasLimit,
        });
        
        console.log("Unstake transaction sent without Divvi");
      }
      
      setSuccess("Unstaking transaction submitted...");
      
      const receipt = await tx.wait();
      if (receipt?.status === 1) {
        let successMessage = "✅ Successfully unstaked! Yield sent to DAO.";
        
        if (hasDivviTag) {
          setReferralStatus('pending');
          try {
            const chainId = (await signer.provider?.getNetwork())?.chainId || 4202;
            const referralSubmitted = await DivviService.submitReferralFromStrings(
              tx.hash,
              Number(chainId),
              account
            );
           
            if (referralSubmitted) {
              setReferralStatus('success');
              successMessage += ` 🎯`;
            } else {
              setReferralStatus('error');
              successMessage += ` (Referral tracking failed)`;
            }
          } catch (error) {
            console.error("Error submitting to Divvi:", error);
            setReferralStatus('error');
            successMessage += ` (Referral submission error)`;
          }
        }
        
        setSuccess(successMessage);
        
        updateAfterStakeAction(account, null);
        
        const tokenContract = LiskTestToken__factory.connect(TOKEN_ADDRESS, signer);
        const newBalance = await tokenContract.balanceOf(account);
        setWalletBalance(ethers.formatUnits(newBalance, 18));
        
        if (walletProvider) {
          await refreshUserDataWithProvider(walletProvider);
        }
        
      } else {
        throw new Error("Transaction failed");
      }

    } catch (error: any) {
      console.error("Unstake error:", error);
      setError(error.message || "Failed to unstake");
      setReferralStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyUnstake = async () => {
    if (!isConnected || !account || !stakeInfo?.hasActiveStake) {
      setError("No active stake found");
      return;
    }

    setEmergencyLoading(true);
    setError(null);
    setSuccess(null);
    setReferralStatus('idle');

    try {
      const signer = await getSigner();
      if (!signer) throw new Error("No signer available");

      const stakingContract = AuditFlowStaking__factory.connect(STAKING_ADDRESS, signer);
      
      let referralTag = '';
      let hasDivviTag = false;
      
      if (divviEnabled) {
        try {
          referralTag = DivviService.generateReferralTagFromString(account);
          if (referralTag && referralTag.length > 0) {
            hasDivviTag = true;
            console.log("Divvi referral tag generated:", referralTag.substring(0, 20) + "...");
          }
        } catch (error) {
          console.warn("Divvi tag generation failed, proceeding without referral:", error);
        }
      }

      let tx;
      
      if (hasDivviTag) {
        // Try different possible function names
        let emergencyData;
        
        try {
          // Try emergencyUnstake
          const emergencyTx = await stakingContract.emergencyUnstake.populateTransaction();
          emergencyData = emergencyTx.data;
        } catch (error: any) {
          console.log("emergencyUnstake not found, trying emergencyWithdraw...");
          try {
            // Try emergencyWithdraw
            const emergencyTx = await (stakingContract as any).emergencyWithdraw.populateTransaction();
            emergencyData = emergencyTx.data;
          } catch (error: any) {
            console.log("emergencyWithdraw not found, trying emergencyExit...");
            try {
              // Try emergencyExit
              const emergencyTx = await (stakingContract as any).emergencyExit.populateTransaction();
              emergencyData = emergencyTx.data;
            } catch (error: any) {
              throw new Error("Could not find emergency unstake function. Please check contract ABI.");
            }
          }
        }
        
        if (!emergencyData) {
          throw new Error("Failed to get emergency unstake transaction data");
        }
        
        const dataWithReferral = emergencyData + referralTag.slice(2);
        const gasEstimate = await signer.estimateGas({
          to: STAKING_ADDRESS,
          data: dataWithReferral,
        });
        const gasLimit = gasEstimate * 150n / 100n;
        
        tx = await signer.sendTransaction({
          to: STAKING_ADDRESS,
          data: dataWithReferral,
          gasLimit: gasLimit,
        });
        
        console.log("Emergency unstake transaction sent with Divvi referral tracking");
      } else {
        // Try to call the function directly
        let gasEstimate;
        try {
          gasEstimate = await stakingContract.emergencyUnstake.estimateGas();
        } catch (error: any) {
          try {
            gasEstimate = await (stakingContract as any).emergencyWithdraw.estimateGas();
          } catch (error: any) {
            try {
              gasEstimate = await (stakingContract as any).emergencyExit.estimateGas();
            } catch (error: any) {
              throw new Error("Could not find emergency unstake function. Please check contract ABI.");
            }
          }
        }
        
        const gasLimit = gasEstimate * 150n / 100n;
        
        try {
          tx = await stakingContract.emergencyUnstake({
            gasLimit: gasLimit,
          });
        } catch (error: any) {
          try {
            tx = await (stakingContract as any).emergencyWithdraw({
              gasLimit: gasLimit,
            });
          } catch (error: any) {
            try {
              tx = await (stakingContract as any).emergencyExit({
                gasLimit: gasLimit,
              });
            } catch (error: any) {
              throw new Error("Could not find emergency unstake function. Please check contract ABI.");
            }
          }
        }
        
        console.log("Emergency unstake transaction sent without Divvi");
      }
      
      setSuccess("Emergency unstake transaction submitted...");
      
      const receipt = await tx.wait();
      if (receipt?.status === 1) {
        let successMessage = "✅ Emergency unstake successful! 50% penalty applied.";
        
        if (hasDivviTag) {
          setReferralStatus('pending');
          try {
            const chainId = (await signer.provider?.getNetwork())?.chainId || 4202;
            const referralSubmitted = await DivviService.submitReferralFromStrings(
              tx.hash,
              Number(chainId),
              account
            );
           
            if (referralSubmitted) {
              setReferralStatus('success');
              successMessage += ` 🎯`;
            } else {
              setReferralStatus('error');
              successMessage += ` (Referral tracking failed)`;
            }
          } catch (error) {
            console.error("Error submitting to Divvi:", error);
            setReferralStatus('error');
            successMessage += ` (Referral submission error)`;
          }
        }
        
        setSuccess(successMessage);
        
        updateAfterStakeAction(account, null);
        
        const tokenContract = LiskTestToken__factory.connect(TOKEN_ADDRESS, signer);
        const newBalance = await tokenContract.balanceOf(account);
        setWalletBalance(ethers.formatUnits(newBalance, 18));
        
        if (walletProvider) {
          await refreshUserDataWithProvider(walletProvider);
        }
        
        setShowEmergencyWarning(false);
        
      } else {
        throw new Error("Transaction failed");
      }

    } catch (error: any) {
      console.error("Emergency unstake error:", error);
      setError(error.message || "Failed to emergency unstake");
      setReferralStatus('error');
    } finally {
      setEmergencyLoading(false);
    }
  };

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString();
  };

  const formatTimeRemaining = (days: number) => {
    if (days >= 30) {
      const months = Math.floor(days / 30);
      const remainingDays = days % 30;
      return `${months}m ${remainingDays}d`;
    }
    return `${days}d`;
  };

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
        setReferralStatus('idle');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  if (!isConnected) {
    return (
      <Layout showConnectPrompt={true}>
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

  if (!isOnLisk) {
    return (
      <Layout showConnectPrompt={true}>
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
    <Layout showConnectPrompt={true}>
      <div className="stake-page">
        <div className="stake-header">
          <h1>Staking Dashboard</h1>
          <p className="subtitle">Manage your LTT staking positions</p>
          
          <div className="current-tier-banner">
            <span className="tier-label">Current Tier:</span>
            <span className={`tier-badge tier-${currentTier}`}>
              {currentTier.toUpperCase()}
            </span>
          </div>
        </div>

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
          <div className="current-stake-section">
            <h2>Your Current Position</h2>
            
            {stakeInfo?.hasActiveStake ? (
              <div className="current-stake-card">
                <div className="stake-header-row">
                  <div className="tier-badge">
                    <span className={`tier-${currentTier}`}>
                      {tierOptions.find(t => t.id === stakeInfo.tierId)?.name || "Unknown"} Tier
                    </span>
                  </div>
                  <div className="stake-status active">Active</div>
                </div>
                
                <div className="stake-details">
                  <div className="detail-row">
                    <span className="label">Staked Amount:</span>
                    <span className="value">
                      {ethers.formatUnits(stakeInfo.amountStaked, 18)} LTT
                    </span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="label">Start Date:</span>
                    <span className="value">
                      {formatDate(stakeInfo.stakedAt)}
                    </span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="label">Maturity Date:</span>
                    <span className="value">
                      {formatDate(stakeInfo.unlocksAt)}
                    </span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="label">Time Remaining:</span>
                    <span className="value">
                      {formatTimeRemaining(stakeInfo.daysRemaining)}
                    </span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="label">Accrued Yield:</span>
                    <span className="value">
                      {ethers.formatUnits(stakeInfo.accruedYield, 18)} LTT
                    </span>
                  </div>
                </div>
                
                <div className="stake-actions">
                  <button 
                    onClick={handleUnstake}
                    className="btn btn-unstake"
                    disabled={loading || emergencyLoading}
                  >
                    {loading ? 'Processing...' : 'Unstake (No Penalty)'}
                  </button>
                  
                  <button 
                    onClick={() => setShowEmergencyWarning(true)}
                    className="btn btn-emergency"
                    disabled={loading || emergencyLoading}
                  >
                    {emergencyLoading ? 'Processing...' : 'Emergency Unstake'}
                  </button>
                </div>
                
                {showEmergencyWarning && (
                  <div className="emergency-warning-modal">
                    <div className="warning-content">
                      <h3>⚠️ Emergency Unstake Warning</h3>
                      <p>You will lose 50% of your staked amount as a penalty!</p>
                      <p>Staked amount: {ethers.formatUnits(stakeInfo.amountStaked, 18)} LTT</p>
                      <p>Penalty: {ethers.formatUnits(stakeInfo.amountStaked / 2n, 18)} LTT</p>
                      <p>You will receive: {ethers.formatUnits(stakeInfo.amountStaked / 2n, 18)} LTT</p>
                      
                      <div className="warning-actions">
                        <button 
                          onClick={handleEmergencyUnstake}
                          className="btn btn-confirm-emergency"
                          disabled={emergencyLoading}
                        >
                          {emergencyLoading ? 'Processing...' : 'Confirm Emergency Unstake'}
                        </button>
                        <button 
                          onClick={() => setShowEmergencyWarning(false)}
                          className="btn btn-cancel"
                          disabled={emergencyLoading}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
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
            
            <div className="wallet-info-card">
              <h3>Wallet Information</h3>
              <div className="wallet-details">
                <div className="detail-row">
                  <span className="label">Balance:</span>
                  <span className="value">{parseFloat(walletBalance).toFixed(2)} LTT</span>
                </div>
                <div className="detail-row">
                  <span className="label">Current Tier:</span>
                  <span className={`value tier-${currentTier}`}>
                    {currentTier.toUpperCase()}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">Status:</span>
                  <span className={`value ${stakeInfo?.hasActiveStake ? 'active' : 'inactive'}`}>
                    {stakeInfo?.hasActiveStake ? 'Active Stake' : 'No Active Stake'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="new-stake-section">
            <h2>Stake New Tokens</h2>
            
            <div className="stake-form">
              <div className="form-section">
                <label className="form-label">Select Tier</label>
                <div className="tier-selection">
                  {tierOptions.map(tier => (
                    <div
                      key={tier.id}
                      className={`tier-card ${selectedTier === tier.id ? 'selected' : ''}`}
                      onClick={() => !stakeInfo?.hasActiveStake && setSelectedTier(tier.id as TierType)}
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
                  disabled={stakeInfo?.hasActiveStake}
                />
                <div className="duration-presets">
                  {[7, 30, 90, 180, 365].map(days => (
                    <button
                      key={days}
                      className={`preset-btn ${stakingDuration === days ? 'active' : ''}`}
                      onClick={() => setStakingDuration(days)}
                      disabled={stakeInfo?.hasActiveStake}
                    >
                      {days === 365 ? '1 Year' : `${days} Days`}
                    </button>
                  ))}
                </div>
              </div>

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

              <div className="action-buttons">
                {tokenAllowance < ethers.parseUnits(requiredStake || "0", 18) && (
                  <button
                    onClick={handleApproveTokens}
                    className="btn btn-approve"
                    disabled={loading || stakeInfo?.hasActiveStake}
                  >
                    {loading ? 'Approving...' : 'Approve LTT Tokens'}
                  </button>
                )}
                
                <button
                  onClick={handleStake}
                  className="btn btn-stake"
                  disabled={
                    loading ||
                    stakeInfo?.hasActiveStake ||
                    parseFloat(walletBalance) < parseFloat(requiredStake) ||
                    tokenAllowance < ethers.parseUnits(requiredStake || "0", 18)
                  }
                >
                  {loading ? 'Processing...' : 
                   stakeInfo?.hasActiveStake ? 'Already Staked' :
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