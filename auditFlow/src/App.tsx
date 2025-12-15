// App.tsx - UPDATED
import React from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/landing/Home";
import Dashboard from "./pages/dashboard/Dashboard";
import Analyze from "./pages/analyze/Analyze";
import Stake from "./pages/stake/Stake";
import Notifications from "./pages/notifications/Notifications";
import Settings from "./pages/settings/Settings";
import AiAnalysis from "./pages/dashboard/newAnalysis/NewAnalysis";
import WalletProvider from './services/WalletProvider';
import { ThemeProvider } from './services/ThemeProvider';
import { UserDataProvider } from './context/UserDataContext'; // CHANGED IMPORT
import UserDataFetcher from './components/userdata/UserDataFetcher';
import AnalysisResults from "./pages/dashboard/analysisResults/AnalysisResults";

const App: React.FC = () => {
  return (
    <Router>
      <ThemeProvider>
        <WalletProvider>
          <UserDataProvider> {/* CHANGED TO UserDataProvider */}
            <UserDataFetcher>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/dashboard/*" element={<Dashboard />} />
                <Route path="/analyze" element={<Analyze />} />
                <Route path="/aianalysis" element={<AiAnalysis />} />
                <Route path="/results" element={<AnalysisResults />} />

                <Route path="/stake" element={<Stake />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </UserDataFetcher>
          </UserDataProvider>
        </WalletProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App;