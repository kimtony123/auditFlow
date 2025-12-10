import React, { useState, useEffect } from 'react';
import { useAIAnalysis } from '../../hooks/useAIAnalysis';
import { useSubscription } from '../../hooks/useSubscription';
import { useNavigation } from '../../hooks/useNavigation';
import './AIAnalysis.css';

const AIAnalysis: React.FC = () => {
  const handleClick = useNavigation();
  const { hasPremium, isLoading: subscriptionLoading } = useSubscription('budget-tracker');
  const { analysis, analyzeTransactions, isLoading, error, resetAnalysis } = useAIAnalysis();
  
  const [days, setDays] = useState(30);
  const [showResults, setShowResults] = useState(false);

  // Redirect non-premium users
  useEffect(() => {
    if (!subscriptionLoading && !hasPremium) {
      handleClick("/getAIAnalysis")(); // Redirect to premium gate
    }
  }, [hasPremium, subscriptionLoading, handleClick]);

  const handleAnalyze = async () => {
    if (days < 1 || days > 365) {
      alert('Please enter a valid number of days (1-365)');
      return;
    }

    try {
      await analyzeTransactions(days);
      setShowResults(true);
    } catch (err) {
      console.error('Analysis failed:', err);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getRiskBadgeClass = (level: string) => {
    switch (level) {
      case 'low': return 'risk-badge risk-low';
      case 'medium': return 'risk-badge risk-medium';
      case 'high': return 'risk-badge risk-high';
      default: return 'risk-badge risk-medium';
    }
  };

  if (subscriptionLoading) {
    return (
      <div className="ai-analysis-page">
        <div className="loading-container">
          <div className="loader"></div>
          <h3>Checking subscription status...</h3>
        </div>
      </div>
    );
  }

  if (!hasPremium) {
    return (
      <div className="ai-analysis-page">
        <div className="loading-container">
          <h3>Redirecting to premium page...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-analysis-page">
      {/* Navigation for Premium Users */}
      <nav className="ai-analysis-nav">
        <div className="container">
          <span className="nav-title">🤖 AI Analysis</span>
          <div className="nav-links">
            <span className="premium-badge">⭐ Premium</span>
            <button className="nav-link" onClick={handleClick("/trackerdashboard")}>
              ← Back to Budget
            </button>
            <button className="nav-link" onClick={handleClick("/")}>
              Home
            </button>
          </div>
        </div>
      </nav>

      <div className="container">
        {/* Premium User Banner */}
        <div className="premium-banner">
          <h3>⭐ Premium Member Access</h3>
          <p>You have full access to AI Financial Analysis features!</p>
        </div>

        {/* Header Section */}
        <div className="card">
          <h1 className="page-title">🤖 AI Financial Analysis</h1>
          <p className="page-subtitle">
            Get intelligent insights and recommendations based on your transaction history
          </p>
        </div>

        {/* Information Message */}
        <div className="message message-info">
          <h3>How AI Analysis Works</h3>
          <p>Our AI analyzes your spending patterns, income sources, and financial habits to provide personalized advice. This analysis runs securely on the AO network.</p>
        </div>

        {/* Analysis Controls */}
        {!showResults && (
          <div className="card">
            <h3>🔍 Select Analysis Period</h3>
            <div className="form-group">
              <label className="form-label" htmlFor="daysInput">
                Number of days to analyze (1-365)
              </label>
              <input
                type="number"
                id="daysInput"
                className="form-input"
                min="1"
                max="365"
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value) || 30)}
                placeholder="Enter days to analyze"
              />
            </div>
            
            <button 
              className="btn analyze-btn" 
              onClick={handleAnalyze}
              disabled={isLoading}
            >
              {isLoading ? '⏳ Analyzing...' : '🤖 Analyze Transactions'}
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="message message-error">
            <h3>Error</h3>
            <p>{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="card loading-state">
            <div className="loading-container">
              <div className="loader"></div>
              <h3 id="loadingText">Fetching your transactions...</h3>
              <p id="loadingSubtext">Retrieving your financial data from the AO network</p>
              
              <div className="analysis-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '45%' }}></div>
                </div>
                <p>Processing with AI Agent</p>
              </div>
            </div>
          </div>
        )}

        {/* Analysis Results */}
        {analysis && showResults && (
          <div className="analysis-results">
            <div className="card">
              <h2>📊 Financial Analysis Report</h2>
              <p>
                Generated on {new Date().toLocaleDateString()} • 
                Analysis period: {days} days
              </p>
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowResults(false)}
                style={{ marginTop: '1rem' }}
              >
                ← New Analysis
              </button>
            </div>

            {/* Risk Assessment */}
            <div className="card">
              <h3 className="section-divider">🛡️ Risk Assessment</h3>
              <div className="risk-assessment">
                <div className={getRiskBadgeClass(analysis.riskAssessment.level)}>
                  Financial Health: {analysis.riskAssessment.level.toUpperCase()}
                </div>
                
                {analysis.riskAssessment.concerns.length > 0 && (
                  <div className="concerns-section">
                    <h4>Areas of Concern:</h4>
                    <ul>
                      {analysis.riskAssessment.concerns.map((concern: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined, index: React.Key | null | undefined) => (
                        <li key={index}>{concern}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {analysis.riskAssessment.positiveSigns.length > 0 && (
                  <div className="positives-section">
                    <h4>Positive Indicators:</h4>
                    <ul>
                      {analysis.riskAssessment.positiveSigns.map((positive: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined, index: React.Key | null | undefined) => (
                        <li key={index}>{positive}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="card">
              <h3 className="section-divider">📈 Financial Summary</h3>
              <div className="analysis-grid">
                <div className="stat-card income-stat">
                  <div>Total Income</div>
                  <div className="stat-value">{formatCurrency(analysis.summary.totalIncome)}</div>
                </div>
                <div className="stat-card expense-stat">
                  <div>Total Expenses</div>
                  <div className="stat-value">{formatCurrency(analysis.summary.totalExpenses)}</div>
                </div>
                <div className="stat-card balance-stat">
                  <div>Net Cash Flow</div>
                  <div className="stat-value">{formatCurrency(analysis.summary.netCashFlow)}</div>
                </div>
              </div>
              
              {/* Savings Rate */}
              <div className="savings-rate-section">
                <h4>Savings Rate</h4>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${Math.round(analysis.summary.savingsRate * 100)}%`,
                      backgroundColor: analysis.summary.savingsRate >= 0.2 ? '#10B981' : 
                                      analysis.summary.savingsRate >= 0.1 ? '#F59E0B' : '#EF4444'
                    }}
                  ></div>
                </div>
                <p>{Math.round(analysis.summary.savingsRate * 100)}% Savings Rate</p>
              </div>
              
              {/* Spending Categories */}
              {analysis.summary.topSpendingCategories.length > 0 && (
                <div className="spending-categories">
                  <h4>Top Spending Categories</h4>
                  <ul>
                    {analysis.summary.topSpendingCategories.map((category: { category: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; amount: number; percentage: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; }, index: React.Key | null | undefined) => (
                      <li key={index} className="spending-category">
                        <strong>{category.category}</strong>: {formatCurrency(category.amount)} ({category.percentage}% of expenses)
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Insights */}
            <div className="card">
              <h3 className="section-divider">💡 Key Insights</h3>
              <ul className="insights-list">
                {analysis.insights.map((insight: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined, index: React.Key | null | undefined) => (
                  <li key={index}>{insight}</li>
                ))}
              </ul>
            </div>

            {/* Recommendations */}
            <div className="card">
              <h3 className="section-divider">🚀 Actionable Recommendations</h3>
              <ul className="recommendations-list">
                {analysis.recommendations.map((recommendation: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined, index: React.Key | null | undefined) => (
                  <li key={index}>{recommendation}</li>
                ))}
              </ul>
            </div>

            {/* Trends */}
            <div className="card">
              <h3 className="section-divider">📊 Trends & Patterns</h3>
              <ul className="trends-list">
                {analysis.trends.map((trend: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined, index: React.Key | null | undefined) => (
                  <li key={index}>{trend}</li>
                ))}
              </ul>
            </div>

            {/* AO Computer Notice */}
            <div className="message message-info">
              <h3>Powered by AO Computer</h3>
              <p>This analysis was generated by our AI agent running on the decentralized AO computer network.</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!showResults && !isLoading && (
          <div className="card empty-state">
            <div className="empty-state-content">
              <div className="empty-icon">🚀</div>
              <h3>No Analysis Yet</h3>
              <p>Enter the number of days and click "Analyze Transactions" to get started with our AI financial analysis.</p>
            </div>
          </div>
        )}

        {/* Wallet Notice */}
        <div className="message message-warning">
          <h3>Data Integration Notice</h3>
          <p>In a production environment, this would connect to your Budget Process to analyze your actual transaction data. For this demo, we're showing sample analysis results.</p>
        </div>
      </div>

      {/* No Ads for Premium Users */}

      <footer className="ai-analysis-footer">
        <div className="container">
          <p>&copy; 2025 aoBudgetAI. AI Financial Analysis.</p>
        </div>
      </footer>
    </div>
  );
};

export default AIAnalysis;