// DashboardHome.tsx - WITH FEATURES
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ethers } from "ethers";
import { LiskTestToken__factory, TOKEN_ADDRESS } from "../../utils/contractHelpers";
import { useWallet } from "../../services/WalletProvider";
import { useUserData } from "../../context/UserDataContext";
import { DivviService } from "../../services/Divvi";
import "./dash.css";

const DashboardHome: React.FC = () => {
  const { account, isConnected, isOnLisk, getSigner } = useWallet();
  const { 
    userTier, 
    walletBalance, 
    availableFeatures,
    userFeatureUsage,
    getFeatureRemaining,
    canUseFeature,
    setWalletBalance,
    refreshUserDataWithProvider
  } = useUserData();
  
  const [mintLoading, setMintLoading] = useState(false);
  const [mintSuccess, setMintSuccess] = useState<string | null>(null);
  const [mintError, setMintError] = useState<string | null>(null);
  const [remainingMints, setRemainingMints] = useState<number>(10);
  const [mintedCount, setMintedCount] = useState<number>(0);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [referralStatus, setReferralStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [divviEnabled, setDivviEnabled] = useState(false);

  useEffect(() => {
    setDivviEnabled(DivviService.isConfigured());
  }, []);

  useEffect(() => {
    const fetchMintInfo = async () => {
      if (!isConnected || !account) {
        resetMintState();
        return;
      }

      if (!isOnLisk) {
        setNetworkError("Please switch to Lisk Sepolia network to mint tokens");
        return;
      }
      
      setNetworkError(null);

      try {
        const signer = await getSigner();
        if (!signer) return;

        const tokenContract = LiskTestToken__factory.connect(TOKEN_ADDRESS, signer);
        
        const remaining = await tokenContract.remainingMintable(account);
        const remainingNumber = Number(remaining);
        const mintsLeft = Math.floor(remainingNumber / 1000);
        setRemainingMints(mintsLeft);
        
        const minted = await tokenContract.mintedBy(account);
        const mintedTokens = Number(minted);
        setMintedCount(Math.floor(mintedTokens / 1000));
        
      } catch (error: any) {
        console.error("Error fetching mint info:", error);
        if (error.code === -32603) {
          setNetworkError("Network error - please check your wallet connection");
        }
      }
    };

    fetchMintInfo();
    
    if (mintSuccess || mintError) {
      const timer = setTimeout(() => {
        setMintSuccess(null);
        setMintError(null);
        setReferralStatus('idle');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isConnected, account, isOnLisk, mintSuccess, mintError]);

  const resetMintState = () => {
    setRemainingMints(10);
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
      const mintAmount = 1000;
      
      const remaining = await tokenContract.remainingMintable(account);
      const remainingNumber = Number(remaining);
      const currentMintsLeft = Math.floor(remainingNumber / 1000);
      
      if (currentMintsLeft <= 0) {
        throw new Error("No mints remaining");
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
        const mintFunction = tokenContract.interface.encodeFunctionData("mint", [mintAmount]);
        const dataWithReferral = mintFunction + referralTag.slice(2);
        const gasEstimate = await signer.estimateGas({
          to: TOKEN_ADDRESS,
          data: dataWithReferral,
        });
        const gasLimit = gasEstimate * 150n / 100n;
        
        tx = await signer.sendTransaction({
          to: TOKEN_ADDRESS,
          data: dataWithReferral,
          gasLimit: gasLimit,
        });
        
        console.log("Mint transaction sent with Divvi referral tracking");
      } else {
        const gasEstimate = await tokenContract.mint.estimateGas(mintAmount);
        const gasLimit = gasEstimate * 150n / 100n;
        
        tx = await tokenContract.mint(mintAmount, {
          gasLimit: gasLimit,
        });
        
        console.log("Mint transaction sent without Divvi");
      }
      
      setMintSuccess(`Transaction sent! Hash: ${tx.hash.substring(0, 10)}...`);
      
      const receipt = await tx.wait();
      
      if (receipt && receipt.status === 1) {
        let successMessage = `Successfully minted 1,000 LTT tokens!`;
        
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
        
        const newRemainingMints = currentMintsLeft - 1;
        setRemainingMints(newRemainingMints);
        
        const newBalance = await tokenContract.balanceOf(account);
        const balanceInTokens = ethers.formatUnits(newBalance, 18);
        setWalletBalance(parseFloat(balanceInTokens).toFixed(2));
        
        const minted = await tokenContract.mintedBy(account);
        const mintedTokens = Number(minted);
        setMintedCount(Math.floor(mintedTokens / 1000));
        
        if (signer.provider) {
          await refreshUserDataWithProvider(signer.provider as ethers.BrowserProvider);
        }
        
      } else {
        setMintError("Transaction failed");
        setReferralStatus('error');
      }
    } catch (error: any) {
      console.error("Mint error:", error);
      
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

  const getKeyFeatures = () => {
    return availableFeatures.filter(feature => 
      feature.type === 'code_summaries' || 
      feature.type === 'ai_reports' ||
      feature.type === 'team_members'
    );
  };

  const keyFeatures = getKeyFeatures();

  const totalAnalyses = userFeatureUsage
    .filter(u => u.type === 'code_summaries' || u.type === 'ai_reports')
    .reduce((sum, usage) => sum + usage.used, 0);

  const analysesThisMonth = totalAnalyses;

  

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
              <div className="stat-value">{parseFloat(walletBalance).toFixed(2)}</div>
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
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <div className="stat-value">{analysesThisMonth}</div>
              <div className="stat-label">This Month</div>
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
          <h2>Mint Test Tokens</h2>
          <div className="mint-info">
            <p>Mint 1,000 LTT tokens per transaction</p>
            <div className="mint-stats">
              <div className="mint-stat">
                <span className="stat-label">Minted:</span>
                <span className="stat-value">{mintedCount * 1000} LTT</span>
              </div>
              <div className="mint-stat">
                <span className="stat-label">Remaining:</span>
                <span className="stat-value">{remainingMints * 1000} LTT</span>
              </div>
            </div>
          </div>
          
          <div className="mint-actions">
            <button 
              onClick={handleMintTokens}
              className="mint-button"
              disabled={mintLoading || remainingMints <= 0 || !isConnected || !isOnLisk}
            >
              {mintLoading ? 'Minting...' : 'Mint 1,000 LTT'}
            </button>
          </div>
          
          <div className="mint-messages">
            {networkError && <div className="error-message">{networkError}</div>}
            {mintError && <div className="error-message">{mintError}</div>}
            {mintSuccess && <div className="success-message">{mintSuccess}</div>}
            {referralStatus === 'pending' && (
              <div className="info-message">Processing referral...</div>
            )}
            {referralStatus === 'success' && (
              <div className="success-message">Referral tracked successfully!</div>
            )}
            {referralStatus === 'error' && (
              <div className="error-message">Referral tracking failed</div>
            )}
          </div>
          
          <div className="mint-note">
            <p>Max 10,000 LTT per address • Lisk Sepolia only • Test tokens only</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-card">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <Link 
              to="/aianalysis" 
              className={`action-button primary ${!canUseFeature('code_summaries') ? 'disabled' : ''}`}
              title={!canUseFeature('code_summaries') ? "No analyses remaining this month" : ""}
            >
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

        {/* Tier & Features Information */}
        <div className="dashboard-card">
          <h2>Your Plan & Features</h2>
          <div className="plan-details">
            <div className="plan-tier">
              <span className="tier-label">Current Tier:</span>
              <span className={`tier-value tier-${userTier}`}>
                {userTier.charAt(0).toUpperCase() + userTier.slice(1)}
              </span>
            </div>
            
            <div className="feature-limits">
              <h4>Monthly Limits</h4>
              {keyFeatures.map(feature => {
                const usage = userFeatureUsage.find(u => u.type === feature.type);
                const remaining = getFeatureRemaining(feature.type);
                const limit = feature.limit || usage?.limit || 0;
                
                return (
                  <div key={feature.type} className="limit">
                    <span className="limit-label">{feature.name}:</span>
                    <div className="limit-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ 
                            width: `${limit > 0 ? ((limit - remaining) / limit) * 100 : 0}%` 
                          }}
                        ></div>
                      </div>
                      <span className="limit-value">
                        {limit > 0 ? `${limit - remaining}/${limit}` : 'Unlimited'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <Link to="/stake" className="upgrade-link">
              {userTier === 'enterprise' ? 'Manage Plan' : 'Upgrade Tier'}
            </Link>
          </div>
        </div>

        {/* Available Features */}
        <div className="dashboard-card">
          <h2>Available Features</h2>
          <div className="feature-list">
            {availableFeatures.map(feature => (
              <div key={feature.id} className="feature-item">
                <div className="feature-icon">
                  {feature.type.includes('summary') ? '📄' : 
                   feature.type.includes('report') ? '📋' : 
                   feature.type.includes('team') ? '👥' : 
                   feature.type.includes('support') ? '🆘' : 
                   feature.type.includes('api') ? '🔌' : '✨'}
                </div>
                <div className="feature-content">
                  <div className="feature-name">{feature.name}</div>
                  <div className="feature-description">{feature.description}</div>
                  {feature.limit && (
                    <div className="feature-remaining">
                      Remaining: {getFeatureRemaining(feature.type)}/{feature.limit}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="dashboard-card">
          <h2>Recent Activity</h2>
          <div className="no-activity">
            <span className="no-activity-icon">📭</span>
            <p className="no-activity-text">No recent activity</p>
            <Link to="/aianalysis" className="start-analysis-btn">
              Start Your First Analysis
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;