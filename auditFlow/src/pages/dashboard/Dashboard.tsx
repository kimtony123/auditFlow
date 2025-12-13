import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { useWallet } from "../../services/WalletProvider";
import { useUserType } from "../../context/UserTypeContext";
import DashboardLayout from "../../layout/Layout";
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
  const { account, isConnected, provider } = useWallet();
  const { userTier, checkUserTierFromBlockchain } = useUserType();
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
        }
      }
    };

    checkTier();
  }, [account, provider]);

  // Show loading state
  if (loading && isConnected) {
    return (
      <DashboardLayout>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading your data...</p>
        </div>
      </DashboardLayout>
    );
  }

  const mappedUserTier = userTier === "guest" ? undefined : userTier;

  return (
    <DashboardLayout 
      showConnectPrompt={true}
      userTier={mappedUserTier}
      userUsage={userUsage || undefined}
    >
      <Routes>
        <Route path="/" element={<DashboardHome userTier={userTier} userUsage={userUsage} />} />
        <Route path="/history" element={<AnalysisHistory />} />
        <Route path="/settings" element={<UserSettings />} />
      </Routes>
    </DashboardLayout>
  );
};

export default Dashboard;