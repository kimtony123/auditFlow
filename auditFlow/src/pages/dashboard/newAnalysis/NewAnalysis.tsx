import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserType } from "../../../context/UserTypeContext";
import "./NewAnalysis.css";

const NewAnalysis: React.FC = () => {
  const [githubRepo, setGithubRepo] = useState("");
  const [etherscanLink, setEtherscanLink] = useState("");
  const [analysisType, setAnalysisType] = useState("full");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const navigate = useNavigate();
  const { userTier, hasFeatureAccess } = useUserType();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validate inputs
    if (!githubRepo.trim()) {
      setError("Please enter a GitHub repository URL");
      setIsLoading(false);
      return;
    }

    if (!etherscanLink.trim()) {
      setError("Please enter an Etherscan link");
      setIsLoading(false);
      return;
    }

    // Check if user has remaining analyses
    if (userTier === 'basic' && !hasFeatureAccess('5_summaries_month')) {
      setError("You've reached your monthly limit for Basic tier");
      setIsLoading(false);
      return;
    }

    try {
      // TODO: Call backend API to start analysis
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          githubRepo,
          etherscanLink,
          analysisType,
          userTier
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start analysis');
      }

      const data = await response.json();
      
      // Navigate to analysis results
      navigate(`/dashboard/analysis/${data.analysisId}`);
      
    } catch (err: any) {
      setError(err.message || 'Failed to start analysis');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="new-analysis">
      <div className="analysis-header">
        <h1>New Smart Contract Analysis</h1>
        <p className="subtitle">
          Submit your GitHub repository and Etherscan link for comprehensive security analysis
        </p>
      </div>

      <div className="analysis-form-container">
        <form onSubmit={handleSubmit} className="analysis-form">
          {/* GitHub Repository Input */}
          <div className="form-group">
            <label htmlFor="githubRepo">
              <span className="label-icon">🐙</span>
              GitHub Repository URL
            </label>
            <input
              id="githubRepo"
              type="url"
              value={githubRepo}
              onChange={(e) => setGithubRepo(e.target.value)}
              placeholder="https://github.com/username/repository"
              className="form-input"
              required
            />
            <div className="input-hint">
              Enter the public GitHub repository containing your smart contracts
            </div>
          </div>

          {/* Etherscan Link Input */}
          <div className="form-group">
            <label htmlFor="etherscanLink">
              <span className="label-icon">🔗</span>
              Etherscan Contract Link
            </label>
            <input
              id="etherscanLink"
              type="url"
              value={etherscanLink}
              onChange={(e) => setEtherscanLink(e.target.value)}
              placeholder="https://etherscan.io/address/0x..."
              className="form-input"
              required
            />
            <div className="input-hint">
              Enter the Etherscan link to your deployed contract (mainnet, testnet, or all)
            </div>
          </div>

          {/* Analysis Type */}
          <div className="form-group">
            <label>
              <span className="label-icon">🔍</span>
              Analysis Type
            </label>
            <div className="analysis-options">
              {[
                { id: "quick", label: "Quick Scan", desc: "Basic vulnerability check", time: "5-10 min" },
                { id: "standard", label: "Standard Audit", desc: "Full security analysis", time: "30-60 min" },
                { id: "full", label: "Full Audit", desc: "Comprehensive analysis with recommendations", time: "2-4 hours" }
              ].map((option) => (
                <div
                  key={option.id}
                  className={`analysis-option ${analysisType === option.id ? 'selected' : ''}`}
                  onClick={() => setAnalysisType(option.id)}
                >
                  <div className="option-header">
                    <input
                      type="radio"
                      id={`type-${option.id}`}
                      name="analysisType"
                      checked={analysisType === option.id}
                      onChange={() => setAnalysisType(option.id)}
                    />
                    <label htmlFor={`type-${option.id}`} className="option-label">
                      {option.label}
                    </label>
                  </div>
                  <div className="option-desc">{option.desc}</div>
                  <div className="option-time">⏱️ {option.time}</div>
                </div>
              ))}
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
              disabled={isLoading}
              className="submit-button"
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Starting Analysis...
                </>
              ) : (
                'Start Analysis'
              )}
            </button>
            
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="cancel-button"
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Side Panel - Analysis Info */}
        <div className="analysis-info">
          <div className="info-card">
            <h3>📋 What We Analyze</h3>
            <ul className="info-list">
              <li>Smart contract vulnerabilities</li>
              <li>Gas optimization opportunities</li>
              <li>Code complexity analysis</li>
              <li>Best practices compliance</li>
              <li>Test coverage evaluation</li>
            </ul>
          </div>

          <div className="info-card">
            <h3>⚡ Your Tier: {userTier.charAt(0).toUpperCase() + userTier.slice(1)}</h3>
            <div className="tier-limits">
              <div className="limit-item">
                <span className="limit-label">Remaining Analyses:</span>
                <span className="limit-value">
                  {userTier === 'basic' ? '4/5' : 
                   userTier === 'premium' ? '9/10' : 
                   userTier === 'pro' ? '39/40' : 'Unlimited'}
                </span>
              </div>
              <div className="limit-item">
                <span className="limit-label">Max Contract Size:</span>
                <span className="limit-value">
                  {userTier === 'basic' ? '1 MB' : 
                   userTier === 'premium' ? '5 MB' : 
                   userTier === 'pro' ? '50 MB' : 'Unlimited'}
                </span>
              </div>
            </div>
          </div>

          <div className="info-card">
            <h3>💡 Tips for Best Results</h3>
            <ul className="tips-list">
              <li>Ensure repository is public</li>
              <li>Include all dependencies in package.json</li>
              <li>Make sure contracts are verified on Etherscan</li>
              <li>Include test files for better analysis</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewAnalysis;