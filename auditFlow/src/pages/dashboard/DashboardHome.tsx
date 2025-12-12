// DashboardHome.tsx
import React from "react";
import { Link } from "react-router-dom";
import type { UserTier } from "../../context/UserTypeContext";

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
      <div className="welcome-section">
        <h1>Welcome to AuditFlow</h1>
        <p className="welcome-subtitle">Smart contract audit preparation made simple</p>
        
        <div className="quick-stats">
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
              <div className="stat-label">Remaining</div>
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

        {/* Getting Started */}
        <div className="dashboard-card">
          <h2>Getting Started</h2>
          <div className="guide-steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Connect Your Repository</h3>
                <p>Link your GitHub to analyze smart contracts</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Run Your First Analysis</h3>
                <p>Upload or select a contract to audit</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>View Results</h3>
                <p>Get detailed audit preparation reports</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;