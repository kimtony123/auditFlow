// DashboardHome.tsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ethers } from "ethers";
import { LiskTestToken__factory, TOKEN_ADDRESS } from "../../utils/contractHelpers";
import { useWallet } from "../../services/WalletProvider";
import type { UserTier } from "../../context/UserTypeContext";
import { DivviService } from "../../services/Divvi";
import "./dash.css"

interface DashboardHomeProps {
  userTier: UserTier;
  userUsage: {
    totalAnalyses: number;
    analysesThisMonth: number;
    analysesRemaining: number;
    lastAnalysisDate: string | null;
  } | null;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ userTier, userUsage }) => {
  const { account, isConnected, isOnLisk, getSigner } = useWallet();
  const [mintLoading, setMintLoading] = useState(false);
  const [mintSuccess, setMintSuccess] = useState<string | null>(null);
  const [mintError, setMintError] = useState<string | null>(null);
  const [remainingMints, setRemainingMints] = useState<number>(10);
  const [tokenBalance, setTokenBalance] = useState<string>("0");
  const [mintedCount, setMintedCount] = useState<number>(0);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [referralStatus, setReferralStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [divviEnabled, setDivviEnabled] = useState(false);

  // Check if Divvi is configured
  useEffect(() => {
    setDivviEnabled(DivviService.isConfigured());
  }, []);

  // Fetch user's token info when connected
  useEffect(() => {
    const fetchTokenInfo = async () => {
      if (!isConnected || !account) {
        resetTokenState();
        return;
      }

      // Check if on Lisk network
      if (!isOnLisk) {
        setNetworkError("Please switch to Lisk Sepolia network to mint tokens");
        return;
      }
      
      setNetworkError(null);

      try {
        const signer = await getSigner();
        if (!signer) return;

        // Use LiskTestToken__factory (not Token__factory)
        const tokenContract = LiskTestToken__factory.connect(TOKEN_ADDRESS, signer);
        
        // Get remaining mintable tokens (in whole tokens)
        const remaining = await tokenContract.remainingMintable(account);
        const remainingNumber = Number(remaining);
        
        // Calculate how many mint transactions they have left (each mint is 1000 tokens)
        const mintsLeft = Math.floor(remainingNumber / 1000);
        setRemainingMints(mintsLeft);
        
        // Get how many tokens they've already minted
        const minted = await tokenContract.mintedBy(account);
        const mintedTokens = Number(minted);
        setMintedCount(Math.floor(mintedTokens / 1000));
        
        // Get token balance
        const balance = await tokenContract.balanceOf(account);
        const balanceInTokens = ethers.formatUnits(balance, 18);
        setTokenBalance(parseFloat(balanceInTokens).toFixed(2));
        
      } catch (error: any) {
        console.error("Error fetching token info:", error);
        if (error.code === -32603) {
          setNetworkError("Network error - please check your wallet connection");
        }
      }
    };

    fetchTokenInfo();
    
    // Reset mint status after 5 seconds
    if (mintSuccess || mintError) {
      const timer = setTimeout(() => {
        setMintSuccess(null);
        setMintError(null);
        setReferralStatus('idle');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isConnected, account, isOnLisk, mintSuccess, mintError]);

  const resetTokenState = () => {
    setRemainingMints(10);
    setTokenBalance("0");
    setMintedCount(0);
    setNetworkError(null);
  };

  const handleMintTokens = async () => {
    if (!isConnected || !account) {
      setMintError("Please connect your wallet first");
      return;
    }

    if (!isOnLisk) {
      setMintError("Please switch to Lisk Sepolia network to mint tokens");
      return;
    }

    if (remainingMints <= 0) {
      setMintError("You've reached your mint limit (10,000 tokens max per address)");
      return;
    }

    setMintLoading(true);
    setMintError(null);
    setMintSuccess(null);
    setNetworkError(null);
    setReferralStatus('idle');

    try {
      const signer = await getSigner();
      if (!signer) throw new Error("No signer available");

      const tokenContract = LiskTestToken__factory.connect(TOKEN_ADDRESS, signer);
      
      // Mint 1000 tokens (the contract handles whole tokens)
      const mintAmount = 1000; // 1000 whole tokens
      
      // Check remaining mints again before proceeding
      const remaining = await tokenContract.remainingMintable(account);
      const remainingNumber = Number(remaining);
      const currentMintsLeft = Math.floor(remainingNumber / 1000);
      
      if (currentMintsLeft <= 0) {
        throw new Error("No mints remaining");
      }

      // Step 1: Generate Divvi referral tag if configured
      let referralTag = '';
      let hasDivviTag = false;
      
      if (divviEnabled) {
        try {
          referralTag = DivviService.generateReferralTagFromString(account);
;
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
        // Method 1: Mint with Divvi referral tag appended to calldata
        const mintFunction = tokenContract.interface.encodeFunctionData("mint", [mintAmount]);
        
        // Append Divvi tag (remove 0x prefix from tag before appending)
        const dataWithReferral = mintFunction + referralTag.slice(2);
        
        // Estimate gas for modified transaction
        const gasEstimate = await signer.estimateGas({
          to: TOKEN_ADDRESS,
          data: dataWithReferral,
        });
        
        const gasLimit = gasEstimate * 150n / 100n; // Add 50% buffer
        
        // Send transaction with Divvi referral data
        tx = await signer.sendTransaction({
          to: TOKEN_ADDRESS,
          data: dataWithReferral,
          gasLimit: gasLimit,
        });
        
        console.log("Mint transaction sent with Divvi referral tracking");
      } else {
        // Method 2: Standard mint without Divvi (fallback)
        const gasEstimate = await tokenContract.mint.estimateGas(mintAmount);
        const gasLimit = gasEstimate * 150n / 100n;
        
        // Send mint transaction
        tx = await tokenContract.mint(mintAmount, {
          gasLimit: gasLimit,
        });
        
        console.log("Mint transaction sent without Divvi");
      }
      
      setMintSuccess(`Transaction sent! Hash: ${tx.hash.substring(0, 10)}...`);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      if (receipt && receipt.status === 1) {
        let successMessage = `Successfully minted 1,000 LTT tokens!`;
        
        // Step 2: Submit referral to Divvi if we used a referral tag
        if (hasDivviTag) {
          setReferralStatus('pending');
          
          try {
            // Get chain ID
            const chainId = (await signer.provider?.getNetwork())?.chainId || 4202;
            
            // Submit to Divvi
            const referralSubmitted = await DivviService.submitReferralFromStrings(
          tx.hash,
          Number(chainId),
          account); 
           
            if (referralSubmitted) {
              setReferralStatus('success');
              successMessage += ` Referral tracking enabled! 🎯`;
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
        
        setMintSuccess(successMessage);
        
        // Update remaining mints
        const newRemainingMints = currentMintsLeft - 1;
        setRemainingMints(newRemainingMints);
        
        // Update minted count
        const minted = await tokenContract.mintedBy(account);
        const mintedTokens = Number(minted);
        setMintedCount(Math.floor(mintedTokens / 1000));
        
        // Update token balance
        const newBalance = await tokenContract.balanceOf(account);
        const balanceInTokens = ethers.formatUnits(newBalance, 18);
        setTokenBalance(parseFloat(balanceInTokens).toFixed(2));
      } else {
        setMintError("Transaction failed");
        setReferralStatus('error');
      }
    } catch (error: any) {
      console.error("Mint error:", error);
      
      // User-friendly error messages
      if (error.code === 4001 || error.message?.includes("user rejected")) {
        setMintError("Transaction was cancelled");
      } else if (error.message?.includes("Exceeds maximum mint per address")) {
        setMintError("You've reached your mint limit (10,000 tokens max)");
      } else if (error.message?.includes("Exceeds maximum supply")) {
        setMintError("Maximum token supply has been reached");
      } else if (error.message?.includes("No mints remaining")) {
        setMintError("No mints remaining");
      } else if (error.code === -32603) {
        setMintError("Network error - please try again");
      } else {
        setMintError(error.message || "Failed to mint tokens");
      }
      
      setReferralStatus('error');
    } finally {
      setMintLoading(false);
    }
  };

  // Get tier limits
  const getTierLimits = () => {
    switch (userTier) {
      case 'basic': return { summaries: 5, reports: 1 };
      case 'premium': return { summaries: 15, reports: 10 };
      case 'pro': return { summaries: 100, reports: 40 };
      case 'enterprise': return { summaries: 'Unlimited', reports: 'Unlimited' };
      default: return { summaries: 0, reports: 0 };
    }
  };

  const tierLimits = getTierLimits();

  return (
    <div className="dashboard-home">
      <div className="nav-center">
        <div className="search-bar">
          <input 
            type="text" 
            placeholder="Search analyses, contracts..." 
            className="search-input"
          />
          <button className="search-button">🔍</button>
        </div>
      </div>

      <div className="welcome-section">
        <h1>Welcome to AuditFlow</h1>
        <p className="welcome-subtitle">Smart contract audit preparation made simple</p>
        
        <div className="quick-stats">
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <div className="stat-value">{tokenBalance}</div>
              <div className="stat-label">LTT Balance</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">✨</div>
            <div className="stat-content">
              <div className="stat-value">{remainingMints}</div>
              <div className="stat-label">Mints Remaining</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-value">{userUsage?.totalAnalyses || 0}</div>
              <div className="stat-label">Total Analyses</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <div className="stat-value">{userUsage?.analysesThisMonth || 0}</div>
              <div className="stat-label">This Month</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">⚡</div>
            <div className="stat-content">
              <div className="stat-value">{userUsage?.analysesRemaining || 0}</div>
              <div className="stat-label">Analyses Remaining</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">🛡️</div>
            <div className="stat-content">
              <div className="stat-value" style={{ textTransform: 'capitalize' }}>{userTier}</div>
              <div className="stat-label">Current Tier</div>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Token Minting Card */}
        <div className="dashboard-card mint-section">
          <div className="mint-header">
            <h2>Get Test Tokens</h2>
            {!isOnLisk && isConnected && (
              <span className="network-warning">⚠️ Wrong Network</span>
            )}
            {divviEnabled && (
              <span className="referral-badge" title="Divvi referral tracking is enabled">
                🎯 Divvi Enabled
              </span>
            )}
          </div>
          
          <div className="mint-info">
            <p className="mint-description">
              Mint test tokens to use for staking and accessing premium features. 
              Each mint gives you 1,000 LTT tokens.
            </p>
            
            <div className="mint-stats">
              <div className="mint-stat">
                <span className="mint-stat-label">Total Mints Used:</span>
                <span className="mint-stat-value">{mintedCount}/10</span>
              </div>
              <div className="mint-stat">
                <span className="mint-stat-label">Mints Remaining:</span>
                <span className="mint-stat-value">{remainingMints}</span>
              </div>
              <div className="mint-stat">
                <span className="mint-stat-label">Your Balance:</span>
                <span className="mint-stat-value">{tokenBalance} LTT</span>
              </div>
            </div>
            
            {networkError && (
              <div className="alert alert-warning">
                ⚠️ {networkError}
              </div>
            )}
            
            {/* Divvi referral status */}
            {referralStatus === 'pending' && (
              <div className="alert alert-info">
                ⏳ Submitting referral tracking to Divvi...
              </div>
            )}
            
            {referralStatus === 'success' && (
              <div className="alert alert-success">
                ✅ Referral tracking submitted to Divvi!
              </div>
            )}
            
            {referralStatus === 'error' && divviEnabled && (
              <div className="alert alert-warning">
                ⚠️ Divvi referral tracking failed, but mint was successful
              </div>
            )}
            
            {mintSuccess && (
              <div className="alert alert-success">
                ✅ {mintSuccess}
              </div>
            )}
            
            {mintError && (
              <div className="alert alert-error">
                ❌ {mintError}
              </div>
            )}

            
            <button 
              className={`mint-button ${!isConnected || !isOnLisk || remainingMints <= 0 ? 'disabled' : ''}`}
              onClick={handleMintTokens}
              disabled={!isConnected || !isOnLisk || remainingMints <= 0 || mintLoading}
            >
              {mintLoading ? (
                <>
                  <span className="spinner"></span>
                  Minting...
                </>
              ) : !isConnected ? (
                "Connect Wallet to Mint"
              ) : !isOnLisk ? (
                "Switch to Lisk Network"
              ) : remainingMints <= 0 ? (
                "Mint Limit Reached"
              ) : (
                <>
                  {divviEnabled ? "🎯 Mint 1,000 LTT + Track" : "Mint 1,000 LTT Tokens"}
                </>
              )}
            </button>
            
            <div className="mint-footer">
              <p className="mint-note">
                <strong>Note:</strong> You can mint up to 10,000 tokens total (10 mints of 1,000 tokens each).
                Minting requires a small amount of gas on the Lisk network.
                {divviEnabled && " Referral tracking via Divvi is enabled."}
              </p>
              <div className="mint-requirements">
                <span className="requirement">✅ Wallet Connected</span>
                <span className={`requirement ${isOnLisk ? 'valid' : 'invalid'}`}>
                  {isOnLisk ? '✅ Lisk Network' : '❌ Lisk Network'}
                </span>
                <span className={`requirement ${remainingMints > 0 ? 'valid' : 'invalid'}`}>
                  {remainingMints > 0 ? '✅ Mints Available' : '❌ Mints Available'}
                </span>
                <span className={`requirement ${divviEnabled ? 'valid' : 'warning'}`}>
                  {divviEnabled ? '✅ Divvi Enabled' : '⚠️ Divvi Not Configured'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-card">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <Link to="/analyze" className="action-button primary">
              <span className="action-icon">✨</span>
              <span className="action-text">New Analysis</span>
            </Link>
            <Link to="/stake" className="action-button">
              <span className="action-icon">💰</span>
              <span className="action-text">Stake Tokens</span>
            </Link>
            <Link to="/dashboard/settings" className="action-button">
              <span className="action-icon">⚙️</span>
              <span className="action-text">Settings</span>
            </Link>
          </div>
        </div>

        {/* Tier Information */}
        <div className="dashboard-card">
          <h2>Your Plan</h2>
          <div className="plan-details">
            <div className="plan-tier">
              <span className="tier-label">Current Tier:</span>
              <span className={`tier-value tier-${userTier}`}>
                {userTier.charAt(0).toUpperCase() + userTier.slice(1)}
              </span>
            </div>
            <div className="plan-limits">
              <div className="limit">
                <span className="limit-label">Code Summaries:</span>
                <span className="limit-value">{tierLimits.summaries}/month</span>
              </div>
              <div className="limit">
                <span className="limit-label">AI Reports:</span>
                <span className="limit-value">{tierLimits.reports}/month</span>
              </div>
              <div className="limit">
                <span className="limit-label">Remaining:</span>
                <span className="limit-value">{userUsage?.analysesRemaining || 0}</span>
              </div>
            </div>
            <Link to="/stake" className="upgrade-link">
              {userTier === 'enterprise' ? 'Manage Plan' : 'Upgrade Tier'}
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="dashboard-card">
          <h2>Recent Activity</h2>
          {userUsage?.lastAnalysisDate ? (
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-icon">📄</div>
                <div className="activity-content">
                  <div className="activity-title">Analysis Completed</div>
                  <div className="activity-date">{userUsage.lastAnalysisDate}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="no-activity">
              <span className="no-activity-icon">📭</span>
              <p className="no-activity-text">No recent activity</p>
              <Link to="/analyze" className="start-analysis-btn">
                Start Your First Analysis
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;