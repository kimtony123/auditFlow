import React from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/landing/Home";
import Dashboard from "./pages/dashboard/Dashboard";
import Analyze from "./pages/analyze/Analyze";
import Stake from "./pages/stake/Stake";
import Notifications from "./pages/notifications/Notifications";
import Settings from "./pages/settings/Settings";
import WalletProvider from './services/WalletProvider';
import { ThemeProvider } from './services/ThemeProvider';
import { UserTypeProvider } from './context/UserTypeContext';

const App: React.FC = () => {
  return (
    <Router>
      <ThemeProvider>
        <UserTypeProvider>
          <WalletProvider>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/analyze" element={<Analyze />} />
              <Route path="/stake" element={<Stake />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </WalletProvider>
        </UserTypeProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App;