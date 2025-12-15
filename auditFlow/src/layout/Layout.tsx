import React, { useState } from "react";
import NavBar from "../components/navbar/NavBar";
import Sidebar from "../components/sidebar/Sidebar";
import { useWallet } from "../services/WalletProvider";
import { useUserData } from "../context/UserDataContext"; // UPDATED IMPORT
import "./Layout.css";
import WalletButton from "../components/WalletButton";

interface DashboardLayoutProps {
  children: React.ReactNode;
  showConnectPrompt?: boolean;
  userTier?: 'basic' | 'premium' | 'pro' | 'enterprise';
  userUsage?: {
    totalAnalyses: number;
    analysesThisMonth: number;
    analysesRemaining: number;
    lastAnalysisDate: string | null;
  };
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children, 
  showConnectPrompt = false,
  userTier = 'basic',
  userUsage 
}) => {
  const { isConnected } = useWallet();
  const { userTier: contextUserTier, usageInfo: contextUsageInfo } = useUserData(); // UPDATED: using usageInfo instead of userUsage
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Use props if provided, otherwise use context values
  // Note: props take precedence over context (for flexibility)
  const displayUserTier = userTier !== 'basic' ? userTier : contextUserTier;
  const displayUserUsage = userUsage || contextUsageInfo;

  return (
    <div className="dashboard-layout">
      <NavBar variant="dashboard" showConnectButton={true} />
      
      <div className="dashboard-content-wrapper">
        <Sidebar 
          collapsed={sidebarCollapsed}/>
        
        <main className="dashboard-main-content">
          <div className="main-content-header">
            <button 
              className="sidebar-toggle"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? '→' : '←'}
            </button>
          </div>
          
          <div className="main-content-inner">
            {showConnectPrompt && !isConnected ? (
              <div className="connect-prompt">
                <div className="connect-prompt-icon">🔒</div>
                <h2>Connect Your Wallet</h2>
                <p>Please connect your wallet to access this page</p>
                <WalletButton />
              </div>
            ) : (
              children
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;