// src/components/TierUsageChecker.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import type { UserTier } from '../context/UserTypeContext';
import { canPerformAnalysis, getTierLimits } from '../utils/tierUsageHelpers';

interface TierUsageCheckerProps {
  userTier: UserTier;
  userUsage: {
    totalAnalyses: number;
    analysesThisMonth: number;
    analysesRemaining: number;
    lastAnalysisDate: string | null;
  };
  actionType?: 'analysis' | 'summary' | 'report';
  children: React.ReactNode;
  showUpgradePrompt?: boolean;
}

const TierUsageChecker: React.FC<TierUsageCheckerProps> = ({
  userTier,
  userUsage,
  children,
  showUpgradePrompt = true
}) => {
  const checkResult = canPerformAnalysis(userTier, {
    analysesThisMonth: userUsage.analysesThisMonth,
    analysesRemaining: userUsage.analysesRemaining
  });

  const tierLimits = getTierLimits(userTier);

  if (checkResult.canPerformAction) {
    return <>{children}</>;
  }

  return (
    <div className="tier-checker">
      <div className="tier-checker-content">
        <div className="tier-checker-header">
          <div className="tier-checker-icon">⚠️</div>
          <h3>Usage Limit Reached</h3>
        </div>
        
        <div className="tier-checker-body">
          <p>{checkResult.reason}</p>
          
          <div className="tier-checker-stats">
            <div className="stat">
              <span className="stat-label">Current Tier:</span>
              <span className={`stat-value tier-${userTier}`}>
                {userTier.charAt(0).toUpperCase() + userTier.slice(1)}
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Monthly Limit:</span>
              <span className="stat-value">
                {tierLimits.reports === 'Unlimited' ? 'Unlimited' : `${tierLimits.reports} analyses`}
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Used This Month:</span>
              <span className="stat-value">{userUsage.analysesThisMonth}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Remaining:</span>
              <span className="stat-value">{userUsage.analysesRemaining}</span>
            </div>
          </div>
          
          {showUpgradePrompt && (
            <div className="tier-checker-upgrade">
              <h4>Upgrade Your Tier</h4>
              <p>Stake more tokens to unlock higher usage limits:</p>
              
              <div className="upgrade-options">
                <div className="upgrade-option">
                  <div className="option-tier">Premium</div>
                  <div className="option-limit">15 analyses/month</div>
                  <div className="option-stake">Requires 100 LTT stake</div>
                  <Link to="/stake" className="option-button">
                    Upgrade to Premium
                  </Link>
                </div>
                
                <div className="upgrade-option">
                  <div className="option-tier">Pro</div>
                  <div className="option-limit">40 analyses/month</div>
                  <div className="option-stake">Requires 500 LTT stake</div>
                  <Link to="/stake" className="option-button">
                    Upgrade to Pro
                  </Link>
                </div>
                
                <div className="upgrade-option">
                  <div className="option-tier">Enterprise</div>
                  <div className="option-limit">Unlimited analyses</div>
                  <div className="option-stake">Requires 1000 LTT stake</div>
                  <Link to="/stake" className="option-button">
                    Upgrade to Enterprise
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TierUsageChecker;