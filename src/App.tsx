import React from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/landing/home";

//import TrackerDashboard from "./pages/tracker/dashboard/dashboard";
//import Transactions from "./pages/tracker/transactions/transactions";
//import Catergories from "./pages/tracker/catergories/catergory";
//import Agents from "./pages/agent/myAgent/agents";
//import AddIncomeTransaction from "./pages/tracker/transactions/income/addIncomeTransactions";
//import AddExpenseTransaction from "./pages/tracker/transactions/expense/addExpenseTransactions";
//import AiAnalysis from "./pages/agent/myAgent/aiAnalysis";
//import AddCategory from "./pages/tracker/catergories/addCatergory";
//import SubscriptionInfoPage from "../src/pages/tracker/subscriptions/subscriptionsInfo/subscriptionsInfoPage";
//import SubscriptionInfoReferralPage from "../src/pages/tracker/subscriptions/subscriptionsInfo/susbscriptionsInfoPageRefferal";


const App: React.FC = () => {
  return (
    <Router>
      <div className="flex h-screen w-screen">
        <div className="nav-content flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
    
            
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;