import React, { useState, useEffect } from "react";
import { Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import { useWallet } from "../../services/WalletProvider";
import { useUserType } from "../../context/UserTypeContext";
import { useTheme } from "../../services/ThemeProvider";
import { ethers } from "ethers";
import "./Dashboard.css";

// Sub-components
import DashboardHome from "./DashboardHome";
import AnalysisHistory from "./analysisHistory/AnalysisHistory";
import UserSettings from "../settings/Settings";

interface UserUsage {
  totalAnalyses: number;
  analysesThisMonth: number;
  analysesRemaining: number;
  lastAnalysisDate: string | null;
}

const Dashboard: React.FC = () => {
  const { account, connectWallet, disconnectWallet, isConnected, provider } = useWallet();
  const { userTier, stakedAmount, isStakingActive, setUserTier, checkUserTierFromBlockchain } = useUserType();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userUsage, setUserUsage] = useState<UserUsage | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user data when wallet connects
  useEffect(() => {
    const fetchUserData = async () => {
      if (!isConnected || !account) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // 1. Fetch user usage from database
        try {
          const usageResponse = await fetch(`/api/user/${account}/usage`);
          if (usageResponse.ok) {
            const usageData = await usageResponse.json();
            setUserUsage(usageData);
          }
        } catch (error) {
          console.warn("Could not fetch usage data:", error);
          // Set default usage
          setUserUsage({
            totalAnalyses: 0,
            analysesThisMonth: 0,
            analysesRemaining: userTier === 'basic' ? 5 : userTier === 'premium' ? 15 : userTier === 'pro' ? 100 : Infinity,
            lastAnalysisDate: null
          });
        }

        // 2. Check user tier from blockchain if provider is available
        if (provider) {
          await checkUserTierFromBlockchain(account, provider);
        }

      } catch (error) {
        console.error("Error fetching user data:", error);
        // Set default values on error
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

    fetchUserData();
  }, [isConnected, account, provider, userTier]);

  // Check tier when wallet connects or account changes
  useEffect(() => {
    const checkTier = async () => {
      if (account && provider) {
        try {
          await checkUserTierFromBlockchain(account, provider);
        } catch (error) {
          console.warn("Could not check tier from blockchain:", error);
          // Fallback to guest or previously saved tier
        }
      }
    };

    checkTier();
  }, [account, provider]);

  // Render empty layout when not connected
  if (!isConnected) {
    return (
      <div className="dashboard">
        <nav className="dashboard-nav">
          <div className="nav-left">
            <div className="nav-brand">
              <span className="brand-icon">🛡️</span>
              <span className="brand-text">AuditFlow</span>
            </div>
          </div>
          <div className="nav-right">
            <button onClick={connectWallet} className="connect-wallet-btn">
              Connect Wallet
            </button>
            <button onClick={() => navigate("/")} className="back-to-home">
              Back to Home
            </button>
          </div>
        </nav>
        
        <div className="dashboard-content empty">
          <div className="empty-state">
            <div className="empty-icon">🔒</div>
            <h2>Wallet Not Connected</h2>
            <p>Please connect your wallet to access the dashboard</p>
            <button onClick={connectWallet} className="primary-button">
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="dashboard">
        <nav className="dashboard-nav">
          <div className="nav-left">
            <div className="nav-brand">
              <span className="brand-icon">🛡️</span>
              <span className="brand-text">AuditFlow</span>
            </div>
          </div>
          <div className="nav-right">
            <div className="wallet-info">
              <span className="wallet-address">
                {account?.slice(0, 6)}...{account?.slice(-4)}
              </span>
            </div>
          </div>
        </nav>
        <div className="dashboard-content loading">
          <div className="loading-spinner"></div>
          <p>Loading your data...</p>
        </div>
      </div>
    );
  }

  // Full dashboard when connected with data
  return (
    <div className={`dashboard ${theme} ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Top Navigation Bar */}
      <nav className="dashboard-nav">
        <div className="nav-left">
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>
          <div className="nav-brand">
            <span className="brand-icon">🛡️</span>
            <span className="brand-text">AuditFlow</span>
          </div>
        </div>
        
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
        
        <div className="nav-right">
          <div className="user-tier">
            <span className={`tier-badge tier-${userTier}`}>
              {userTier.charAt(0).toUpperCase() + userTier.slice(1)}
            </span>
            {isStakingActive && (
              <span className="staking-badge">Active</span>
            )}
          </div>
          
          <div className="wallet-info">
            <span className="wallet-address">
              {account?.slice(0, 6)}...{account?.slice(-4)}
            </span>
            {stakedAmount > 0 && (
              <span className="stake-amount">
                {stakedAmount.toFixed(2)} LSK
              </span>
            )}
          </div>
          
          <div className="usage-info">
            <span className="usage-label">
              {userUsage?.analysesRemaining || 0} remaining
            </span>
          </div>
          
          <button onClick={toggleTheme} className="theme-toggle">
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          
          <button onClick={disconnectWallet} className="logout-button">
            Logout
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        {/* Sidebar */}
        <aside className="dashboard-sidebar">
          <div className="sidebar-header">
            <h3>Menu</h3>
          </div>
          
          <nav className="sidebar-nav">
            <Link 
              to="/dashboard" 
              className={`sidebar-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
            >
              <span className="sidebar-icon">📊</span>
              <span className="sidebar-text">Dashboard</span>
            </Link>
            
            <Link 
              to="/analyze" 
              className={`sidebar-link ${location.pathname === '/analyze' ? 'active' : ''}`}
            >
              <span className="sidebar-icon">✨</span>
              <span className="sidebar-text">New Analysis</span>
            </Link>
            
            <Link 
              to="/dashboard/history" 
              className={`sidebar-link ${location.pathname.includes('/history') ? 'active' : ''}`}
            >
              <span className="sidebar-icon">📚</span>
              <span className="sidebar-text">Analysis History</span>
            </Link>
            
            <Link 
              to="/stake" 
              className={`sidebar-link ${location.pathname === '/stake' ? 'active' : ''}`}
            >
              <span className="sidebar-icon">💰</span>
              <span className="sidebar-text">Stake Tokens</span>
            </Link>
            
            <Link 
              to="/dashboard/settings" 
              className={`sidebar-link ${location.pathname.includes('/settings') ? 'active' : ''}`}
            >
              <span className="sidebar-icon">⚙️</span>
              <span className="sidebar-text">Settings</span>
            </Link>
          </nav>
          
          <div className="sidebar-divider"></div>
          
          <div className="sidebar-section">
            <h4>Recent Analyses</h4>
            <div className="recent-list">
              {userUsage?.totalAnalyses ? (
                <>
                  <Link to="/dashboard/analysis/1" className="recent-item">
                    <span className="recent-icon">📄</span>
                    <span className="recent-text">Sample Audit</span>
                    <span className="recent-date">2 days ago</span>
                  </Link>
                  <Link to="/dashboard/analysis/2" className="recent-item">
                    <span className="recent-icon">📄</span>
                    <span className="recent-text">Contract Review</span>
                    <span className="recent-date">1 week ago</span>
                  </Link>
                </>
              ) : (
                <div className="no-recent">
                  <span className="no-recent-icon">📭</span>
                  <span className="no-recent-text">No analyses yet</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="sidebar-footer">
            <div className="user-stats">
              <div className="stat">
                <div className="stat-label">Analyses This Month</div>
                <div className="stat-value">{userUsage?.analysesThisMonth || 0}</div>
              </div>
              <div className="stat">
                <div className="stat-label">Total Analyses</div>
                <div className="stat-value">{userUsage?.totalAnalyses || 0}</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="dashboard-main">
          <Routes>
            <Route path="/" element={<DashboardHome userTier={userTier} userUsage={userUsage} />} />
            <Route path="/history" element={<AnalysisHistory />} />
            <Route path="/settings" element={<UserSettings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;