import React, { useState } from "react";
import NavBar from "../components/navbar/NavBar";
import Sidebar from "../components/sidebar/Sidebar";
import { useWallet } from "../services/WalletProvider";
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="dashboard-layout">
      <NavBar variant="dashboard" showConnectButton={true} />
      
      <div className="dashboard-content-wrapper">
        <Sidebar 
          collapsed={sidebarCollapsed}
          userTier={userTier}
          userUsage={userUsage}
        />
        
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