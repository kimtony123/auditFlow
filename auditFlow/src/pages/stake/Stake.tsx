import React, { useState, useEffect } from "react";
import { useWallet } from "../../services/WalletProvider";
import { useUserType } from "../../context/UserTypeContext";
import "./Stake.css";

interface StakingStats {
  totalStakers: number;
  totalStaked: number;
  avgStakingDuration: number;
  stakersHistory: Array<{
    date: string;
    count: number;
    amount: number;
  }>;
}

const Stake: React.FC = () => {
  const { account, isConnected, connectWallet } = useWallet();
  const { userTier, stakedAmount, isStakingActive } = useUserType();
  
  const [stakingStats, setStakingStats] = useState<StakingStats | null>(null);
  const [selectedTier, setSelectedTier] = useState<'premium' | 'pro' | 'enterprise'>('premium');
  const [stakingDuration, setStakingDuration] = useState(30);
  const [loading, setLoading] = useState(false);

  // Fetch public staking stats
  useEffect(() => {
    const fetchStakingStats = async () => {
      try {
        const response = await fetch('/api/staking/stats');
        if (response.ok) {
          const data = await response.json();
          setStakingStats(data);
        }
      } catch (error) {
        console.error("Error fetching staking stats:", error);
      }
    };

    fetchStakingStats();
  }, []);

  const handleStake = async () => {
    if (!isConnected) {
      connectWallet();
      return;
    }

    // TODO: Implement actual staking logic
    console.log("Staking...");
  };

  const handleUnstake = async () => {
    if (!isConnected || !isStakingActive) return;
    
    // TODO: Implement unstaking logic
    console.log("Unstaking...");
  };

  // Public view (not connected)
  if (!isConnected) {
    return (
      <div className="stake-public">
        <div className="stake-header">
          <h1>AuditFlow Staking</h1>
          <p className="subtitle">Stake LSK tokens to access premium audit features</p>
        </div>

        {/* Public Stats Dashboard */}
        <div className="stats-dashboard">
          <h2>Public Staking Statistics</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-value">
                {stakingStats?.totalStakers.toLocaleString() || "1,234"}
              </div>
              <div className="stat-label">Total Stakers</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-value">
                {stakingStats?.totalStaked.toLocaleString() || "45,678"}
              </div>
              <div className="stat-label">Total LSK Staked</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">📈</div>
              <div className="stat-value">
                {stakingStats?.avgStakingDuration || 45}
              </div>
              <div className="stat-label">Avg. Staking Days</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">🛡️</div>
              <div className="stat-value">100%</div>
              <div className="stat-label">Token Return Rate</div>
            </div>
          </div>

          {/* Connect to Stake CTA */}
          <div className="connect-cta">
            <h3>Ready to Stake?</h3>
            <p>Connect your wallet to start staking and access premium features</p>
            <button onClick={connectWallet} className="connect-button">
              Connect Wallet to Stake
            </button>
          </div>
        </div>

        {/* How It Works */}
        <div className="how-it-works">
          <h2>How Staking Works</h2>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Choose Tier & Duration</h3>
              <p>Select your desired tier and staking duration (1-365 days)</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>Stake LSK Tokens</h3>
              <p>Stake the required LSK amount for your selected duration</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>Access Features</h3>
              <p>Immediately access premium audit features based on your tier</p>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <h3>Tokens Returned</h3>
              <p>Withdraw 100% of your staked tokens after the lock period</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Connected user view
  return (
    <div className="stake-connected">
      <div className="stake-header">
        <h1>Your Staking Dashboard</h1>
        <p className="subtitle">Manage your LSK staking and access levels</p>
      </div>

      <div className="stake-layout">
        {/* Left Column: User's Current Stake */}
        <div className="current-stake">
          <h2>Your Current Stake</h2>
          <div className="stake-info-card">
            <div className="stake-amount">
              <span className="amount">{stakedAmount.toFixed(2)}</span>
              <span className="currency">LSK</span>
            </div>
            <div className="stake-details">
              <div className="detail">
                <span className="label">Tier:</span>
                <span className={`value tier-${userTier}`}>
                  {userTier.charAt(0).toUpperCase() + userTier.slice(1)}
                </span>
              </div>
              <div className="detail">
                <span className="label">Status:</span>
                <span className={`value ${isStakingActive ? 'active' : 'inactive'}`}>
                  {isStakingActive ? 'Active' : 'Not Staked'}
                </span>
              </div>
              <div className="detail">
                <span className="label">Features:</span>
                <span className="value">
                  {userTier === 'premium' ? '15 analyses/month' : 
                   userTier === 'pro' ? '40+ analyses/month' : 
                   userTier === 'enterprise' ? 'Unlimited' : 'Basic'}
                </span>
              </div>
            </div>
            
            {isStakingActive ? (
              <button 
                onClick={handleUnstake}
                className="unstake-button warning"
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Emergency Unstake (50% penalty)'}
              </button>
            ) : (
              <div className="not-staked">
                <p>You're not currently staking. Stake LSK to access premium features.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: New Stake Form */}
        <div className="new-stake">
          <h2>Stake More Tokens</h2>
          <div className="stake-form">
            <div className="form-group">
              <label>Select Tier</label>
              <div className="tier-selector">
                {(['premium', 'pro', 'enterprise'] as const).map(tier => (
                  <button
                    key={tier}
                    className={`tier-option ${selectedTier === tier ? 'selected' : ''}`}
                    onClick={() => setSelectedTier(tier)}
                  >
                    <div className="tier-name">{tier.charAt(0).toUpperCase() + tier.slice(1)}</div>
                    <div className="tier-price">
                      {tier === 'premium' ? '100-200 LSK' : 
                       tier === 'pro' ? '500-1000 LSK' : '800-1600 LSK'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Staking Duration: {stakingDuration} days</label>
              <input
                type="range"
                min="1"
                max="365"
                value={stakingDuration}
                onChange={(e) => setStakingDuration(parseInt(e.target.value))}
                className="duration-slider"
              />
              <div className="duration-presets">
                {[1, 7, 30, 90, 180, 365].map(days => (
                  <button
                    key={days}
                    className={`preset-btn ${stakingDuration === days ? 'active' : ''}`}
                    onClick={() => setStakingDuration(days)}
                  >
                    {days === 1 ? '24h' : days === 365 ? '1y' : `${days}d`}
                  </button>
                ))}
              </div>
            </div>

            <div className="stake-summary">
              <div className="summary-item">
                <span>Required Stake:</span>
                <span className="amount">{
                  selectedTier === 'premium' ? (100 + (100 * (365 - stakingDuration) / 365)).toFixed(2) :
                  selectedTier === 'pro' ? (500 + (500 * (365 - stakingDuration) / 365)).toFixed(2) :
                  (800 + (800 * (365 - stakingDuration) / 365)).toFixed(2)
                } LSK</span>
              </div>
              <div className="summary-item">
                <span>Daily Rate:</span>
                <span className="amount">{
                  (selectedTier === 'premium' ? (100 + (100 * (365 - stakingDuration) / 365)) / stakingDuration :
                   selectedTier === 'pro' ? (500 + (500 * (365 - stakingDuration) / 365)) / stakingDuration :
                   (800 + (800 * (365 - stakingDuration) / 365)) / stakingDuration).toFixed(4)
                } LSK/day</span>
              </div>
              <div className="summary-item">
                <span>Tokens Returned:</span>
                <span className="amount success">{
                  selectedTier === 'premium' ? (100 + (100 * (365 - stakingDuration) / 365)).toFixed(2) :
                  selectedTier === 'pro' ? (500 + (500 * (365 - stakingDuration) / 365)).toFixed(2) :
                  (800 + (800 * (365 - stakingDuration) / 365)).toFixed(2)
                } LSK</span>
              </div>
            </div>

            <button 
              onClick={handleStake}
              className="stake-button primary"
              disabled={loading || isStakingActive}
            >
              {loading ? 'Processing...' : 
               isStakingActive ? 'Already Staked' : 'Stake Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stake;