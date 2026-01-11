import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserData } from "../../../context/UserDataContext";
import { useWallet } from "../../../services/WalletProvider";
import "./NewAnalysis.css";
import DashboardLayout from "../../../layout/Layout";

interface FeatureCheck {
  hasAccess: boolean;
  remaining: number;
  limit: number;
  canUse: boolean;
}

interface AnalysisOption {
  id: string;
  label: string;
  desc: string;
  time: string;
  available: boolean;
}

const NewAnalysis: React.FC = () => {
  const [contractUrl, setContractUrl] = useState("");
  const [analysisType, setAnalysisType] = useState("standard");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [featureInfo, setFeatureInfo] = useState<FeatureCheck>({
    hasAccess: false,
    remaining: 0,
    limit: 0,
    canUse: false
  });
  
  const navigate = useNavigate();
  const { 
    userTier, 
    availableFeatures,
    userFeatureUsage,
  } = useUserData();
  const { account, isConnected } = useWallet();

  // API Base URL - Use environment variable or fallback

  // Check AI Reports feature access and remaining
  useEffect(() => {
    if (!isConnected || !account) {
      setFeatureInfo({
        hasAccess: false,
        remaining: 0,
        limit: 0,
        canUse: false
      });
      return;
    }

    const aiReportFeature = availableFeatures.find(f => f.type === 'ai_reports');
    const hasAccess = !!aiReportFeature;
    
    if (!aiReportFeature) {
      setFeatureInfo({
        hasAccess: false,
        remaining: 0,
        limit: 0,
        canUse: false
      });
      return;
    }

    const usageRecord = userFeatureUsage.find(u => u.type === 'ai_reports');
    
    let remaining = 0;
    if (!usageRecord) {
      remaining = aiReportFeature.limit || 0;
    } else {
      const resetDate = new Date(usageRecord.resetDate);
      const now = new Date();
      
      if (resetDate < now) {
        remaining = aiReportFeature.limit || 0;
      } else {
        remaining = usageRecord.remaining;
      }
    }
    
    const canUse = remaining > 0;
    
    setFeatureInfo({
      hasAccess,
      remaining,
      limit: aiReportFeature.limit || 0,
      canUse
    });
    
  }, [isConnected, account, availableFeatures, userFeatureUsage]);

  // Extract contract address from URL or input
  const extractContractAddress = (input: string): string | null => {
    if (!input.trim()) return null;
    
    const trimmedInput = input.trim();
    
    // Check if it's a URL
    try {
      const url = new URL(trimmedInput);
      const pathParts = url.pathname.split('/');
      
      for (const part of pathParts) {
        if (part.startsWith('0x') && part.length === 42) {
          return part;
        }
      }
      
      if (url.hash && url.hash.startsWith('#address=')) {
        const addressPart = url.hash.split('=')[1];
        if (addressPart.startsWith('0x') && addressPart.length === 42) {
          return addressPart;
        }
      }
      
    } catch (e) {
      if (trimmedInput.startsWith('0x') && trimmedInput.length === 42) {
        return trimmedInput;
      }
    }
    
    return null;
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setError("");

  if (!isConnected || !account) {
    setError("Please connect your wallet first");
    setIsLoading(false);
    return;
  }

  if (!contractUrl.trim()) {
    setError("Please enter a verified contract address or Blockscout URL");
    setIsLoading(false);
    return;
  }

  const contractAddress = extractContractAddress(contractUrl);
  if (!contractAddress) {
    setError("Invalid contract address or URL format. Please enter a valid Lisk contract address (0x...) or Blockscout URL");
    setIsLoading(false);
    return;
  }

  if (!featureInfo.hasAccess) {
    setError("AI Reports feature is not available for your current tier");
    setIsLoading(false);
    return;
  }

  if (!featureInfo.canUse) {
    setError(`You have used all your available AI reports for this month (${featureInfo.limit}/${featureInfo.limit})`);
    setIsLoading(false);
    return;
  }

  try {
    // Determine API endpoint based on analysis type
    let apiEndpoint = '';
    let apiBody = {
      contractAddress,
      userAddress: account,
      network: 'lisk-sepolia',
      analysisType: analysisType
    };

    if (analysisType === 'quick') {
      apiEndpoint = `https://auditflow-ji70.onrender.com/api/analyze/quick`;
      // For quick analysis, we only need contractAddress and walletAddress
      apiBody = {
        contractAddress,
        userAddress: account,  // Using userAddress field as expected by backend
        network: 'lisk-sepolia',
        analysisType : 'quick'
      };
    } else {
      apiEndpoint = `https://auditflow-ji70.onrender.com/api/analyze`;
      // For standard/full analysis
      apiBody = {
        contractAddress,
        userAddress: account,
        network: 'lisk-sepolia',
        analysisType : analysisType
      };
    }

    console.log(`Calling API: ${apiEndpoint}`, apiBody);

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiBody)
    });

    if (!response.ok) {
      let errorMessage = 'Failed to start AI analysis';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.details || errorData.message || errorMessage;
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError);
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('API Response:', data);
    
    // Record feature usage
    try {
      const usageResponse = await fetch(`https://auditflow-ji70.onrender.com/api/user/features/usage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: account,
          featureType: analysisType === 'quick' ? 'QUICK_ANALYSIS' : 'ANALYSIS',
          quantity: 1
        })
      });
      
      if (!usageResponse.ok) {
        console.warn('Failed to record feature usage, but analysis started');
      } else {
        console.log('Feature usage recorded successfully');
      }
    } catch (usageError) {
      console.warn('Error recording feature usage:', usageError);
    }
    
    // Update local feature info
    setFeatureInfo(prev => ({
      ...prev,
      remaining: Math.max(0, prev.remaining - 1),
      canUse: (prev.remaining - 1) > 0
    }));

    // Prepare the analysis data object
    const analysisData = {
      // Contract Info
      contractAddress: data.contractAddress || contractAddress,
      contractName: data.contractName || 'Unnamed Contract',
      isVerified: data.isVerified || false,
      compilerVersion: data.compilerVersion || 'Unknown',
      abi: data.abi || [],
      
      // AI Analysis Data
      aiAnalysis: data.aiAnalysis || data.quickAnalysis || '',
      structuredReport: data.structuredReport || {},
      riskLevel: data.structuredReport?.riskLevel || data.riskLevel || 'medium',
      auditScore: data.structuredReport?.auditScore || data.riskScore || 50,
      vulnerabilityCounts: data.structuredReport?.vulnerabilityCounts || {
        high: 0,
        medium: 0,
        low: 0,
        total: 0
      },
      productionRecommendation: data.structuredReport?.productionRecommendation || 
                               data.productionRecommendation || 'Manual review required',
      
      // For quick analysis, create a simplified structured report
      ...(analysisType === 'quick' && !data.structuredReport && {
        structuredReport: {
          executiveSummary: data.quickAnalysis?.substring(0, 200) || 'Quick analysis completed',
          riskLevel: 'medium',
          riskScore: 50,
          vulnerabilities: [],
          gasOptimizations: [],
          bestPractices: [],
          recommendations: ['Review the quick analysis results for details'],
          detailedAnalysis: data.quickAnalysis || 'No detailed analysis available for quick scan'
        }
      }),
      
      // Metadata
      analysisType: analysisType,
      timestamp: data.timestamp || new Date().toISOString(),
      network: data.network || 'lisk',
      analysisId: data.analysisId || `analysis_${Date.now()}`,
      
      // For PDF generation
      sourceCodePreview: data.sourceCodePreview || contractAddress.substring(0, 10) + '...',
      sourceCodeLength: data.sourceCodeLength || 0,
      
      estimatedTime: analysisType === 'quick' ? '2-5 min' : 
                    analysisType === 'standard' ? '10-20 min' : '30-60 min'
    };

    console.log('Analysis data prepared for navigation:', analysisData);
    
    // Store in sessionStorage as backup (for page refresh recovery)
    try {
      sessionStorage.setItem('lastAnalysis', JSON.stringify(analysisData));
      console.log('Analysis data stored in sessionStorage');
    } catch (storageError) {
      console.warn('Failed to store in sessionStorage:', storageError);
    }
    
    // Navigate with comprehensive analysis data
    navigate(`/results`, { 
      state: analysisData
    });
    
  } catch (err: any) {
    setError(err.message || 'Failed to start AI analysis');
    console.error('AI Analysis error:', err);
    
    // If there's an error, clear any old sessionStorage data
    try {
      sessionStorage.removeItem('lastAnalysis');
    } catch (storageError) {
      console.warn('Failed to clear sessionStorage:', storageError);
    }
  } finally {
    setIsLoading(false);
  }
};

  // Get analysis types based on tier
  const getAnalysisOptions = (): AnalysisOption[] => {
    const baseOptions = [
      { id: "quick", label: "Quick Scan", desc: "Basic vulnerability check (3 bullet points)", time: "2-5 min", available: userTier !== 'basic' },
      { id: "standard", label: "Standard Audit", desc: "Full security analysis with JSON report", time: "10-20 min", available: true },
      { id: "full", label: "Full Audit", desc: "Comprehensive analysis with recommendations", time: "30-60 min", available: userTier === 'pro' || userTier === 'enterprise' }
    ];
    
    return baseOptions.filter(option => option.available);
  };

  const getTierDisplay = (): string => {
    switch(userTier) {
      case 'basic': return 'Basic';
      case 'premium': return 'Premium';
      case 'pro': return 'Pro';
      case 'enterprise': return 'Enterprise';
      default: return 'Guest';
    }
  };

  // Show connect prompt if not connected
  if (!isConnected) {
    return (
      <DashboardLayout showConnectPrompt={true}>
        <div className="new-analysis">
          <div className="analysis-header">
            <h1>AI Smart Contract Analysis</h1>
            <p className="subtitle">
              Analyze smart contracts using AI-powered security analysis
            </p>
          </div>
          
          <div className="connect-prompt">
            <div className="connect-icon">🔗</div>
            <h2>Connect Your Wallet</h2>
            <p>Please connect your wallet to access AI analysis features</p>
            <div className="api-info">
          
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout showConnectPrompt={true}>
      <div className="new-analysis">
        <div className="analysis-header">
          <h1>AI Smart Contract Analysis</h1>
          <p className="subtitle">
            Submit verified Lisk contract addresses for AI-powered security analysis
          </p>
          
        </div>

        <div className="analysis-form-container">
          <form onSubmit={handleSubmit} className="analysis-form">
            {/* Contract Address Input */}
            <div className="form-group">
              <label htmlFor="contractAddress">
                <span className="label-icon">🔗</span>
                Verified Contract Address
              </label>
              <input
                id="contractAddress"
                type="text"
                value={contractUrl}
                onChange={(e) => setContractUrl(e.target.value)}
                placeholder="0x2D3C12e8520102c81821bDc627614F40e0685929 or https://blockscout.lisk.com/address/0x..."
                className="form-input"
                required
                disabled={!featureInfo.canUse || isLoading}
              />
              <div className="input-hint">
                Enter a verified Lisk contract address or Blockscout URL
              </div>
              {contractUrl && extractContractAddress(contractUrl) && (
                <div className="address-preview">
                  <span className="preview-label">Detected Address:</span>
                  <span className="preview-address">
                    {extractContractAddress(contractUrl)?.substring(0, 10)}...{extractContractAddress(contractUrl)?.substring(34)}
                  </span>
                </div>
              )}
            </div>

            {/* Analysis Type */}
            <div className="form-group">
              <label>
                <span className="label-icon">🔍</span>
                Analysis Type
              </label>
              <div className="analysis-options">
                {getAnalysisOptions().map((option) => (
                  <div
                    key={option.id}
                    className={`analysis-option ${analysisType === option.id ? 'selected' : ''} ${!option.available ? 'disabled' : ''}`}
                    onClick={() => option.available && setAnalysisType(option.id)}
                  >
                    <div className="option-header">
                      <input
                        type="radio"
                        id={`type-${option.id}`}
                        name="analysisType"
                        checked={analysisType === option.id}
                        onChange={() => option.available && setAnalysisType(option.id)}
                        disabled={!option.available || !featureInfo.canUse}
                      />
                      <label htmlFor={`type-${option.id}`} className="option-label">
                        {option.label}
                        {!option.available && <span className="tier-restricted"> ({getTierDisplay()} only)</span>}
                      </label>
                    </div>
                    <div className="option-desc">{option.desc}</div>
                    <div className="option-time">⏱️ {option.time}</div>
                    <div className="option-endpoint">
                      <small>
                        {option.id === 'quick' ? 'POST /api/analyze/quick' : 'POST /api/analyze'}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature Status */}
            <div className="feature-status">
              <div className="status-row">
                <span className="status-label">AI Reports Available:</span>
                <span className={`status-value ${featureInfo.canUse ? 'available' : 'exhausted'}`}>
                  {featureInfo.remaining}/{featureInfo.limit}
                </span>
              </div>
              <div className="status-row">
                <span className="status-label">Status:</span>
                <span className={`status-value ${featureInfo.canUse ? 'enabled' : 'disabled'}`}>
                  {featureInfo.canUse ? 'Ready to Analyze' : 'Limit Reached'}
                </span>
              </div>
              <div className="status-row">
                <span className="status-label">Backend:</span>
                <span className="status-value connected">
                </span>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="error-message">
                ⚠️ {error}
              </div>
            )}

            {/* Submit Button */}
            <div className="form-actions">
              <button
                type="submit"
                disabled={isLoading || !featureInfo.canUse || !contractUrl}
                className={`submit-button ${!featureInfo.canUse ? 'disabled' : ''}`}
              >
                {isLoading ? (
                  <>
                    <span className="spinner"></span>
                    {analysisType === 'quick' ? 'Starting Quick Scan...' : 'Starting AI Analysis...'}
                  </>
                ) : !featureInfo.canUse ? (
                  'Monthly Limit Reached'
                ) : !contractUrl ? (
                  'Enter Contract Address'
                ) : analysisType === 'quick' ? (
                  'Start Quick Scan'
                ) : (
                  'Start AI Analysis'
                )}
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="cancel-button"
                disabled={isLoading}
              >
                Cancel
              </button>

              
            </div>
          </form>

          {/* Side Panel - Analysis Info */}
          <div className="analysis-info">
            <div className="info-card">
              <h3>🤖 AI Analysis Features</h3>
              <ul className="info-list">
                <li><strong>Quick Scan:</strong> Basic vulnerability check (3 bullet points)</li>
                <li><strong>Standard Audit:</strong> Full security analysis with JSON report</li>
                <li><strong>Full Audit:</strong> Comprehensive analysis with recommendations</li>
                <li>Gas optimization suggestions</li>
                <li>Code complexity analysis</li>
                <li>Best practices compliance check</li>
                <li>Security risk assessment</li>
                <li>Automated audit report generation</li>
                <li>PDF export functionality</li>
              </ul>
            </div>

            <div className="info-card">
              <h3>🛡️ Your Tier: {getTierDisplay()}</h3>
              <div className="tier-limits">
                <div className="limit-item">
                  <span className="limit-label">AI Reports Remaining:</span>
                  <span className={`limit-value ${featureInfo.canUse ? 'available' : 'exhausted'}`}>
                    {featureInfo.remaining}/{featureInfo.limit}
                  </span>
                </div>
                <div className="limit-item">
                  <span className="limit-label">Available Analysis Types:</span>
                  <span className="limit-value">
                    {userTier === 'basic' ? 'Standard only' : 
                     userTier === 'premium' ? 'Quick & Standard' : 
                     'All types'}
                  </span>
                </div>
                <div className="limit-item">
                  <span className="limit-label">Priority:</span>
                  <span className="limit-value">
                    {userTier === 'basic' ? 'Standard' : 
                     userTier === 'premium' ? 'High' : 
                     'Highest'}
                  </span>
                </div>
                <div className="limit-item">
                  <span className="limit-label">Backend API:</span>
                  <span className="limit-value connected">
                    ✓ Connected
                  </span>
                </div>
              </div>
            </div>

            <div className="info-card">
              <h3>💡 How to Get Verified Address</h3>
              <ul className="tips-list">
                <li>Deploy your contract on Lisk network</li>
                <li>Verify the contract on Blockscout</li>
                <li>Copy the contract address (0x...)</li>
                <li>Or copy the full Blockscout URL</li>
                <li>Ensure contract source code is public</li>
              </ul>
              <div className="example-url">
                Example: <code>https://blockscout.lisk.com/address/0x2D3C12e8520102c81821bDc627614F40e0685929</code>
              </div>
              <div className="test-address">
                <strong>Test Address:</strong> 0x2D3C12e8520102c81821bDc627614F40e0685929
              </div>
            </div>

            {!featureInfo.hasAccess && (
              <div className="info-card upgrade-card">
                <h3>🔒 Upgrade for AI Reports</h3>
                <p>Your current tier doesn't include AI analysis features</p>
                <div className="upgrade-options">
                  <div className="upgrade-option">
                    <h4>Premium Tier</h4>
                    <ul>
                      <li>10 AI reports per month</li>
                      <li>15 code summaries per month</li>
                      <li>Quick & Standard analysis</li>
                    </ul>
                  </div>
                  <div className="upgrade-option">
                    <h4>Pro Tier</h4>
                    <ul>
                      <li>40 AI reports per month</li>
                      <li>100 code summaries per month</li>
                      <li>All analysis types</li>
                    </ul>
                  </div>
                </div>
                <a href="/stake" className="upgrade-link">
                  Upgrade Tier
                </a>
              </div>
            )}

            <div className="info-card api-info-card">
              <h3>🔧 API Endpoints</h3>
              <div className="endpoint-list">
                <div className="endpoint-item">
                  <strong>POST /api/analyze</strong>
                  <p>Standard/Full audit with JSON report</p>
                </div>
                <div className="endpoint-item">
                  <strong>POST /api/analyze/quick</strong>
                  <p>Quick scan (3 bullet points)</p>
                </div>
                <div className="endpoint-item">
                  <strong>GET /api/health</strong>
                  <p>Backend health check</p>
                </div>
                <div className="endpoint-item">
                  <strong>GET /api/debug/openrouter</strong>
                  <p>Test OpenRouter connection</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NewAnalysis;