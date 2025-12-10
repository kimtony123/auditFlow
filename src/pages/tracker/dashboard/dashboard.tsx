import React, { useEffect, useState } from 'react';
import { useDashboard } from '../../../hooks/useDashboard';
import { useNavigation } from '../../../hooks/useNavigation';
import { AdComponent } from '../../../components/ads/adsComponent';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const handleClick = useNavigation();
  const { 
    dashboardData, 
    fetchDashboardData, 
    refreshData, 
    setTimeFilter,
    isLoading, 
    error 
  } = useDashboard();

  const [walletConnected, setWalletConnected] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleConnectWallet = () => {
    setWalletConnected(true);
    fetchDashboardData();
  };

  const handleTimeFilterChange = (filter: string) => {
    setTimeFilter(filter);
    fetchDashboardData(filter);
  };

  if (!walletConnected && !dashboardData) {
    return (
      <div className="dashboard-page">
        <nav className="dashboard-nav">
          <div className="container">
            <a href="#home" onClick={handleClick("/")}>aoBudgetAI</a>
            <div className="nav-links">
              <span className="user-badge">Free</span>
              <a href="#dashboard" className="active">Dashboard</a>
              <a href="#transactions" onClick={handleClick("/transactions")}>Transactions</a>
              <a href="#categories" onClick={handleClick("/manage")}>Categories</a>
              <a href="#upgrade" className="premium-link" onClick={handleClick("/upgrade")}>✨ Upgrade to Premium</a>
            </div>
          </div>
        </nav>

        <div className="container">
          <div className="wallet-connect-section">
            <h2>Connect Your Wallet</h2>
            <p>Connect your wallet to view your financial dashboard.</p>
            <button className="btn btn-primary" onClick={handleConnectWallet}>
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <nav className="dashboard-nav">
        <div className="container">
          <a href="#home" onClick={handleClick("/")}>aoBudgetAI</a>
          <div className="nav-links">
            <span className="user-badge">Free</span>
            <a href="#dashboard" className="active">Dashboard</a>
            <a href="#transactions" onClick={handleClick("/transactions")}>Transactions</a>
            <a href="#categories" onClick={handleClick("/manage")}>Categories</a>
            <a href="#upgrade" className="premium-link" onClick={handleClick("/upgrade")}>✨ Upgrade to Premium</a>
          </div>
        </div>
      </nav>

      <div className="container">
        {/* Upgrade Banner */}
        <div className="upgrade-banner">
          <h3>✨ Upgrade to Premium</h3>
          <p>Unlock AI-powered financial insights and remove ads!</p>
          <button className="btn btn-premium" onClick={handleClick("/upgrade")}>Upgrade Now</button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="loading-section">
            <h3>Loading Financial Data</h3>
            <p>Please wait while we fetch your financial data...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="error-section">
            <h3>Error Loading Data</h3>
            <p>{error}</p>
            <button className="btn btn-secondary" onClick={refreshData}>Try Again</button>
          </div>
        )}

        {/* Dashboard Content */}
        {dashboardData && !isLoading && (
          <div className="dashboard-content">
            {/* Financial Overview */}
            <div className="dashboard-section">
              <div className="section-header">
                <h2>Financial Overview</h2>
                <select 
                  value={dashboardData ? undefined : 'last35days'}
                  onChange={(e) => handleTimeFilterChange(e.target.value)}
                  className="time-filter"
                >
                  <option value="last7days">Last 7 days</option>
                  <option value="last30days">Last 30 days</option>
                  <option value="last35days">Last 35 days</option>
                  <option value="last90days">Last 90 days</option>
                </select>
              </div>
              
              <div className="stats-grid">
                <div className="stat-card income">
                  <div className="stat-label">💰 Income</div>
                  <div className="stat-value">${dashboardData.overview.total_income}</div>
                  <div className="stat-currency">{dashboardData.overview.currency}</div>
                </div>
                
                <div className="stat-card expense">
                  <div className="stat-label">💳 Expenses</div>
                  <div className="stat-value">${dashboardData.overview.total_expenses}</div>
                  <div className="stat-currency">{dashboardData.overview.currency}</div>
                </div>
                
                <div className="stat-card balance">
                  <div className="stat-label">⚖️ Balance</div>
                  <div className="stat-value">${dashboardData.overview.balance}</div>
                  <div className="stat-currency">{dashboardData.overview.currency}</div>
                </div>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="dashboard-section">
              <h2>Category Breakdown</h2>
              <div className="category-breakdown">
                <div className="breakdown-column">
                  <h3 className="income-color">Income Categories</h3>
                  {dashboardData.income_breakdown.map((item: { category: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; amount: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; percentage: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; }, index: React.Key | null | undefined) => (
                    <div key={index} className="breakdown-item">
                      <div className="breakdown-header">
                        <span>{item.category}</span>
                        <span>${item.amount}</span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill income" 
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                      <div className="breakdown-percentage">{item.percentage}%</div>
                    </div>
                  ))}
                </div>
                
                <div className="breakdown-column">
                  <h3 className="expense-color">Expense Categories</h3>
                  {dashboardData.expense_breakdown.map((item: { category: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; amount: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; percentage: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; }, index: React.Key | null | undefined) => (
                    <div key={index} className="breakdown-item">
                      <div className="breakdown-header">
                        <span>{item.category}</span>
                        <span>${item.amount}</span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill expense" 
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                      <div className="breakdown-percentage">{item.percentage}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="dashboard-section">
              <div className="action-buttons">
                <button className="btn btn-success" onClick={handleClick("/addIncomeTransaction")}>
                  💰 Add Income
                </button>
                <button className="btn btn-danger" onClick={handleClick("/addExpenseTransaction")}>
                  💳 Add Expense
                </button>
                <button className="btn btn-primary" onClick={refreshData} disabled={isLoading}>
                  🔄 Refresh Data
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ad Component */}
      <AdComponent 
        appId="budget-tracker" 
        publisherId="aobudgetai" 
        placement="banner" 
      />

      <footer className="dashboard-footer">
        <div className="container">
          <p>&copy; 2025 aoBudgetAI. Budget Management.</p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;