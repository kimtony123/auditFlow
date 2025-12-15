// components/Analyze.tsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { useUserData } from '../../context/UserDataContext';
import { useWallet } from '../../services/WalletProvider';
import Layout from '../../layout/Layout';
import './Analyze.css';

interface AnalysisResult {
  analysisId: string;
  summary: {
    totalLines: number;
    totalFiles: number;
    totalBlank: number;
    totalComment: number;
  };
  languages: [string, any][];
  repository: {
    name: string;
    owner: string;
    description: string;
    stars: number;
    forks: number;
  };
  timestamp: string;
  usage: {
    analysesRemaining: number;
    totalAnalyses: number;
  };
}

const Analyze: React.FC = () => {
  const { 
    userTier,
    tierFeatures,
    availableFeatures,
    userFeatureUsage,
    recordFeatureUsage,
    isLoading: userDataLoading
  } = useUserData();
  
  const { account, isConnected, provider } = useWallet();
  
  const [githubUrl, setGithubUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string>('');
  const [codeSummariesRemaining, setCodeSummariesRemaining] = useState<number>(0);
  const [hasCodeSummaryAccess, setHasCodeSummaryAccess] = useState<boolean>(false);

  // Custom function to calculate remaining summaries
  const calculateRemainingSummaries = () => {
    // Find the code_summaries feature definition
    const codeSummaryFeature = availableFeatures.find(f => f.type === 'code_summaries');
    if (!codeSummaryFeature) {
      console.log('No code_summaries feature found in availableFeatures');
      return 0;
    }
    
    // Find usage record
    const usageRecord = userFeatureUsage.find(u => u.type === 'code_summaries');
    
    if (!usageRecord) {
      // No usage record means user hasn't used any summaries yet
      console.log('No usage record found, returning full limit:', codeSummaryFeature.limit);
      return codeSummaryFeature.limit || 0;
    }
    
    // Check if reset date has passed
    const resetDate = new Date(usageRecord.resetDate);
    const now = new Date();
    
    if (resetDate < now) {
      console.log('Reset date passed, returning full limit:', codeSummaryFeature.limit);
      return codeSummaryFeature.limit || 0;
    }
    
    console.log('Using remaining from usage record:', usageRecord.remaining);
    return usageRecord.remaining;
  };

  // Custom function to check if user can use feature
  const canUseCodeSummaries = () => {
    if (!hasCodeSummaryAccess) return false;
    
    const remaining = calculateRemainingSummaries();
    console.log('canUseCodeSummaries - remaining:', remaining);
    return remaining > 0;
  };

  // Check feature access - with better debugging
  useEffect(() => {
    console.log('=== Analyze Component Debug ===');
    console.log('userTier:', userTier);
    console.log('tierFeatures:', tierFeatures);
    console.log('availableFeatures:', availableFeatures);
    console.log('userFeatureUsage:', userFeatureUsage);
    console.log('availableFeatures includes code_summaries?', availableFeatures.some(f => f.type === 'code_summaries'));
    
    if (!userDataLoading && tierFeatures && availableFeatures.length > 0) {
      // Check if user has access to code summaries
      const hasAccess = availableFeatures.some(f => f.type === 'code_summaries');
      console.log('User has access to code summaries:', hasAccess);
      setHasCodeSummaryAccess(hasAccess);
      
      if (hasAccess) {
        const remaining = calculateRemainingSummaries();
        console.log('Calculated remaining code summaries:', remaining);
        setCodeSummariesRemaining(remaining);
      } else {
        console.log('User does NOT have access to code summaries');
      }
    } else if (userDataLoading) {
      console.log('User data is still loading...');
    } else if (!tierFeatures) {
      console.log('tierFeatures is null');
    } else if (availableFeatures.length === 0) {
      console.log('availableFeatures array is empty');
    }
  }, [userDataLoading, tierFeatures, availableFeatures, userTier, userFeatureUsage]);

  // Try to refresh data if it seems incomplete
  useEffect(() => {
    const refreshDataIfNeeded = async () => {
      if (isConnected && account && provider && !userDataLoading && 
          (!tierFeatures || availableFeatures.length === 0)) {
        console.log('Data seems incomplete, trying to refresh...');
        try {
          const { refreshUserDataWithProvider } = useUserData();
          await refreshUserDataWithProvider(provider);
        } catch (error) {
          console.error('Failed to refresh data:', error);
        }
      }
    };
    
    refreshDataIfNeeded();
  }, [isConnected, account, provider, userDataLoading, tierFeatures, availableFeatures]);

  const handleAnalyze = async () => {
    if (!isConnected || !account) {
      setError('Please connect your wallet first');
      return;
    }

    // Check feature access
    if (!hasCodeSummaryAccess) {
      setError('Code summaries feature is not available for your current tier');
      return;
    }

    // Check if user can use the feature
    if (!canUseCodeSummaries()) {
      setError('You have used all your available code summaries for this month');
      return;
    }

    if (!githubUrl.includes('github.com/')) {
      setError('Please enter a valid GitHub repository URL');
      return;
    }

    // Extract repo info from URL
    const repoMatch = githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!repoMatch) {
      setError('Invalid GitHub repository URL format. Use: https://github.com/username/repo');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Submit analysis request
      const response = await fetch('/api/analyze/repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          githubUrl, 
          userTier,
          walletAddress: account 
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }
      
      // Update analysis state
      setAnalysis(data);
      
      // Record feature usage
      const usageRecorded = await recordFeatureUsage(account, 'code_summaries', 1);
      
      if (!usageRecorded) {
        console.warn('Failed to record feature usage, but analysis completed');
      }
      
      // Update local remaining count
      const newRemaining = Math.max(0, codeSummariesRemaining - 1);
      setCodeSummariesRemaining(newRemaining);
      
    } catch (err: any) {
      setError(err.message);
      console.error('Analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTierDisplay = () => {
    switch(userTier) {
      case 'basic': return 'Basic';
      case 'premium': return 'Premium';
      case 'pro': return 'Pro';
      case 'enterprise': return 'Enterprise';
      default: return 'Guest';
    }
  };

  // Show loading state while user data is loading
  if (userDataLoading) {
    return (
      <Layout showConnectPrompt={true}>
        <div className="analyze-page">
          <div className="analyze-container">
            <h1>Code Repository Analysis</h1>
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading your feature data...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showConnectPrompt={true}>
      <div className="analyze-page">
        <div className="analyze-container">
          <h1>Code Repository Analysis</h1>
          <p className="subtitle">Analyze GitHub repositories to get detailed code summaries</p>
          
          {/* Debug info - remove in production */}
          <div style={{ display: 'none' }} className="debug-info">
            <p>Debug: userTier = {userTier}</p>
            <p>Debug: tierFeatures = {tierFeatures ? 'Loaded' : 'Not loaded'}</p>
            <p>Debug: availableFeatures count = {availableFeatures.length}</p>
            <p>Debug: hasCodeSummaryAccess = {hasCodeSummaryAccess.toString()}</p>
            <p>Debug: codeSummariesRemaining = {codeSummariesRemaining}</p>
          </div>
          
          {isConnected ? (
            hasCodeSummaryAccess ? (
              <>
                <div className="feature-status">
                  <div className="tier-badge">
                    Current Tier: <span className="tier-name">{getTierDisplay()}</span>
                  </div>
                  
                  <div className="usage-info">
                    <div className="usage-stat">
                      <span className="stat-label">Code Summaries Remaining:</span>
                      <span className={`stat-value ${codeSummariesRemaining > 0 ? 'available' : 'exhausted'}`}>
                        {codeSummariesRemaining}
                      </span>
                    </div>
                    <div className="usage-stat">
                      <span className="stat-label">Status:</span>
                      <span className={`stat-value ${canUseCodeSummaries() ? 'enabled' : 'disabled'}`}>
                        {canUseCodeSummaries() ? 'Available' : 'Limit Reached'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="input-section">
                  <div className="input-group">
                    <label htmlFor="github-url" className="input-label">
                      GitHub Repository URL
                    </label>
                    <input
                      id="github-url"
                      type="text"
                      placeholder="https://github.com/username/repository"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      className="github-input"
                      disabled={loading || !canUseCodeSummaries()}
                    />
                    <p className="input-hint">
                      Enter a public GitHub repository URL to analyze
                    </p>
                  </div>
                  
                  <button 
                    onClick={handleAnalyze}
                    disabled={loading || !githubUrl || !canUseCodeSummaries()}
                    className={`analyze-btn ${!canUseCodeSummaries() ? 'disabled' : ''}`}
                  >
                    {loading ? (
                      <>
                        <span className="spinner"></span>
                        Analyzing...
                      </>
                    ) : !canUseCodeSummaries() ? (
                      'Monthly Limit Reached'
                    ) : githubUrl ? (
                      'Analyze Repository'
                    ) : (
                      'Enter GitHub URL'
                    )}
                  </button>
                </div>
                
                {error && <div className="error-message">{error}</div>}
                
                {analysis && (
                  <div className="analysis-results">
                    <div className="results-header">
                      <h2>Analysis Results</h2>
                      <button 
                        onClick={() => {
                          const printWindow = window.open('', '_blank');
                          if (printWindow) {
                            printWindow.document.write(`
                              <html>
                                <head>
                                  <title>Code Analysis Report - ${analysis.repository.owner}/${analysis.repository.name}</title>
                                  <style>
                                    body { font-family: Arial, sans-serif; padding: 20px; }
                                    h1 { color: #333; }
                                    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 30px 0; }
                                    .summary-card { border: 1px solid #ddd; padding: 15px; text-align: center; border-radius: 8px; }
                                    .summary-value { font-size: 24px; font-weight: bold; color: #667eea; }
                                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                                    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                                    th { background-color: #f8f9fa; }
                                  </style>
                                </head>
                                <body>
                                  <h1>Code Analysis Report</h1>
                                  <h2>${analysis.repository.owner}/${analysis.repository.name}</h2>
                                  <p>${analysis.repository.description || 'No description'}</p>
                                  <p>Generated: ${new Date(analysis.timestamp).toLocaleString()}</p>
                                  
                                  <h3>Repository Stats</h3>
                                  <div style="margin-bottom: 20px;">
                                    <p>⭐ Stars: ${analysis.repository.stars}</p>
                                    <p>🍴 Forks: ${analysis.repository.forks}</p>
                                  </div>
                                  
                                  <div class="summary">
                                    <div class="summary-card">
                                      <h3>Total Lines</h3>
                                      <div class="summary-value">${analysis.summary.totalLines.toLocaleString()}</div>
                                    </div>
                                    <div class="summary-card">
                                      <h3>Total Files</h3>
                                      <div class="summary-value">${analysis.summary.totalFiles}</div>
                                    </div>
                                    <div class="summary-card">
                                      <h3>Comments</h3>
                                      <div class="summary-value">${analysis.summary.totalComment.toLocaleString()}</div>
                                    </div>
                                    <div class="summary-card">
                                      <h3>Blank Lines</h3>
                                      <div class="summary-value">${analysis.summary.totalBlank.toLocaleString()}</div>
                                    </div>
                                  </div>
                                  
                                  <h3>Language Breakdown</h3>
                                  <table>
                                    <thead>
                                      <tr>
                                        <th>Language</th>
                                        <th>Files</th>
                                        <th>Code Lines</th>
                                        <th>Comments</th>
                                        <th>Blank Lines</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      ${analysis.languages.map(([lang, data]: [string, any]) => `
                                        <tr>
                                          <td>${lang}</td>
                                          <td>${data.nFiles}</td>
                                          <td>${data.code}</td>
                                          <td>${data.comment}</td>
                                          <td>${data.blank}</td>
                                        </tr>
                                      `).join('')}
                                    </tbody>
                                  </table>
                                </body>
                              </html>
                            `);
                            printWindow.document.close();
                            printWindow.print();
                          }
                        }}
                        className="download-pdf-btn"
                      >
                        📥 Download Report
                      </button>
                    </div>
                    
                    <div className="repo-info">
                      <h3>{analysis.repository.owner}/{analysis.repository.name}</h3>
                      {analysis.repository.description && (
                        <p className="repo-description">{analysis.repository.description}</p>
                      )}
                      <div className="repo-stats">
                        <span className="repo-stat">⭐ {analysis.repository.stars}</span>
                        <span className="repo-stat">🍴 {analysis.repository.forks}</span>
                        <span className="repo-stat">📅 {new Date(analysis.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="summary-grid">
                      <div className="summary-card">
                        <div className="summary-icon">📄</div>
                        <div className="summary-content">
                          <div className="summary-label">Total Files</div>
                          <div className="summary-value">{analysis.summary.totalFiles}</div>
                        </div>
                      </div>
                      <div className="summary-card">
                        <div className="summary-icon">📝</div>
                        <div className="summary-content">
                          <div className="summary-label">Total Lines</div>
                          <div className="summary-value">{analysis.summary.totalLines.toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="summary-card">
                        <div className="summary-icon">💬</div>
                        <div className="summary-content">
                          <div className="summary-label">Comments</div>
                          <div className="summary-value">{analysis.summary.totalComment.toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="summary-card">
                        <div className="summary-icon">⬜</div>
                        <div className="summary-content">
                          <div className="summary-label">Blank Lines</div>
                          <div className="summary-value">{analysis.summary.totalBlank.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                    
                    {analysis.languages.length > 0 && (
                      <div className="languages-section">
                        <h3>Language Breakdown</h3>
                        <div className="languages-grid">
                          {analysis.languages.map(([lang, data]: [string, any], index: number) => (
                            <div key={index} className="language-card">
                              <div className="language-header">
                                <span className="language-name">{lang}</span>
                                <span className="language-files">{data.nFiles} files</span>
                              </div>
                              <div className="language-stats">
                                <div className="stat">
                                  <span className="stat-label">Code:</span>
                                  <span className="stat-value">{data.code}</span>
                                </div>
                                <div className="stat">
                                  <span className="stat-label">Comments:</span>
                                  <span className="stat-value">{data.comment}</span>
                                </div>
                                <div className="stat">
                                  <span className="stat-label">Blank:</span>
                                  <span className="stat-value">{data.blank}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="feature-upsell">
                <div className="upsell-icon">🔒</div>
                <h2>Code Summaries Feature Locked</h2>
                <p>Your current tier ({getTierDisplay()}) does not include code summaries or the feature data is not loaded.</p>
                <p>Please check your tier and try refreshing the page.</p>
                
                <div className="current-tier-info">
                  <h3>Your Current Status:</h3>
                  <p><strong>Tier:</strong> {getTierDisplay()}</p>
                  <p><strong>Tier Features Loaded:</strong> {tierFeatures ? 'Yes' : 'No'}</p>
                  <p><strong>Available Features:</strong> {availableFeatures.length}</p>
                  <p><strong>Has Code Summaries Feature:</strong> {availableFeatures.some(f => f.type === 'code_summaries') ? 'Yes' : 'No'}</p>
                </div>
                
                <div className="upsell-tiers">
                  <div className="tier-card">
                    <h3>Premium Tier</h3>
                    <ul>
                      <li>15 code summaries per month</li>
                      <li>10 AI reports per month</li>
                      <li>Priority support</li>
                    </ul>
                  </div>
                  <div className="tier-card">
                    <h3>Pro Tier</h3>
                    <ul>
                      <li>100 code summaries per month</li>
                      <li>40 AI reports per month</li>
                      <li>API access & dedicated support</li>
                    </ul>
                  </div>
                </div>
                <a href="/stake" className="upgrade-btn">
                  Upgrade Tier
                </a>
                <button 
                  onClick={() => window.location.reload()} 
                  className="refresh-btn"
                  style={{ marginTop: '1rem', background: '#6c757d' }}
                >
                  Refresh Page
                </button>
              </div>
            )
          ) : (
            <div className="connect-prompt">
              <div className="connect-icon">🔗</div>
              <h2>Connect Your Wallet</h2>
              <p>Please connect your wallet to access code analysis features</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Analyze;