import React from "react";
import { Routes, Route } from "react-router-dom";
import { useWallet } from "../../services/WalletProvider";
import { useUserData } from "../../context/UserDataContext";
import DashboardLayout from "../../layout/Layout";
import DashboardHome from "./DashboardHome";
import UserSettings from "../settings/Settings";

const Dashboard: React.FC = () => {
  const { isConnected } = useWallet();
  const { isLoading } = useUserData(); // Use isLoading from UserDataContext

  // Show loading state
  if (isLoading && isConnected) {
    return (
      <DashboardLayout>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading your data...</p>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout showConnectPrompt={true}>
      <Routes>
        <Route path="/" element={<DashboardHome />} />
        <Route path="/settings" element={<UserSettings />} />
      </Routes>
    </DashboardLayout>
  );
};

export default Dashboard;