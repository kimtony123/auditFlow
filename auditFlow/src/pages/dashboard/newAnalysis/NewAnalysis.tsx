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
    // UPDATED: Call our new backend API (running on port 3001)
    const response = await fetch('https://auditflow-e16i.onrender.com/api/analyze/', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contractAddress,
        analysisType,
        userTier,
        walletAddress: account,
        network: 'lisk'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || errorData.details || 'Failed to start AI analysis');
    }

    const data = await response.json();
    
    // Record feature usage
    const usageRecorded = await fetch('/api/user/features/usage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userAddress: account,
      featureType: 'ANALYSIS',
      quantity: 1
    })
  });
    if (!usageRecorded) {
      console.warn('Failed to record feature usage, but analysis started');
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
      contractAddress: data.contractAddress,
      contractName: data.contractName,
      isVerified: data.isVerified,
      compilerVersion: data.compilerVersion,
      abi: data.abi,
      
      // AI Analysis Data
      aiAnalysis: data.aiAnalysis,
      structuredReport: data.structuredReport,
      riskLevel: data.structuredReport?.riskLevel,
      auditScore: data.structuredReport?.auditScore,
      vulnerabilityCounts: data.structuredReport?.vulnerabilityCounts,
      productionRecommendation: data.structuredReport?.productionRecommendation,
      
      // Metadata
      analysisType: data.analysisType,
      timestamp: data.timestamp,
      network: data.network,
      analysisId: data.analysisId,
      
      // For PDF generation
      sourceCodePreview: data.sourceCodePreview,
      sourceCodeLength: data.sourceCodeLength,
      
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
    
    // UPDATED: Navigate with comprehensive analysis data
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
      { id: "quick", label: "Quick Scan", desc: "Basic vulnerability check", time: "2-5 min", available: userTier !== 'basic' },
      { id: "standard", label: "Standard Audit", desc: "Full security analysis", time: "10-20 min", available: true },
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
                    Starting AI Analysis...
                  </>
                ) : !featureInfo.canUse ? (
                  'Monthly Limit Reached'
                ) : !contractUrl ? (
                  'Enter Contract Address'
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
                <li>Smart contract vulnerability detection</li>
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
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NewAnalysis;