import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DashboardLayout from "../../../layout/Layout";
import "./AnalysisResults.css";
import { usePDFGenerator } from '../../../hooks/usePDFGenerator';

interface VulnerabilityCounts {
  high: number;
  medium: number;
  low: number;
  total: number;
}

interface StructuredReport {
  riskLevel: 'high' | 'medium' | 'low' | 'unknown';
  vulnerabilityCounts: VulnerabilityCounts;
  auditScore: number;
  productionRecommendation?: string;
  contractComplexity?: string;
}

interface ParsedAIData {
  executiveSummary: string;
  riskLevel: string;
  riskScore: number;
  vulnerabilities: Array<{
    severity: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    location: string;
    recommendation: string;
    exploitScenario: string;
  }>;
  gasOptimizations: string[];
  bestPractices: Array<{
    check: string;
    compliant: boolean;
    details: string;
  }>;
  recommendations: string[];
  detailedAnalysis: string;
}

interface AnalysisData {
  // Contract Info
  contractAddress: string;
  contractName: string;
  isVerified: boolean;
  compilerVersion: string;
  abi: any[];
  
  // AI Analysis Data
  aiAnalysis: string;
  structuredReport: StructuredReport;
  riskLevel: string;
  auditScore: number;
  vulnerabilityCounts: VulnerabilityCounts;
  productionRecommendation: string;
  
  // Metadata
  analysisType: string;
  timestamp: string;
  network: string;
  analysisId: string;
  
  // For PDF generation
  sourceCodePreview: string;
  sourceCodeLength: number;
  
  estimatedTime: string;
}

const AnalysisResults: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [parsedAIData, setParsedAIData] = useState<ParsedAIData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'summary' | 'vulnerabilities' | 'code' | 'export'>('summary');
  
  // Use the PDF generator hook
  const { generateReport, isGenerating, error } = usePDFGenerator();

  // Parse AI analysis from the backend response
  const parseAIAnalysis = (aiAnalysisString: string): ParsedAIData | null => {
    try {
      console.log('Parsing AI analysis string...');
      
      // Remove markdown code blocks and whitespace
      const cleanJson = aiAnalysisString
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .replace(/^\s*{/, '{')
        .replace(/}\s*$/, '}')
        .trim();
      
      console.log('Cleaned JSON string (first 500 chars):', cleanJson.substring(0, 500));
      
      const parsed = JSON.parse(cleanJson);
      console.log('Successfully parsed AI data:', {
        vulnerabilitiesCount: parsed.vulnerabilities?.length || 0,
        riskScore: parsed.riskScore,
        riskLevel: parsed.riskLevel
      });
      
      return parsed;
    } catch (error) {
      console.error('Failed to parse AI analysis:', error);
      
      // Try to extract JSON from the string if it's wrapped
      try {
        const jsonMatch = aiAnalysisString.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          console.log('Extracted JSON from string:', parsed);
          return parsed;
        }
      } catch (secondError) {
        console.error('Second parsing attempt failed:', secondError);
      }
      
      return null;
    }
  };

  

  // Debug logging
  useEffect(() => {
    console.log('=== AnalysisResults Debug Logs ===');
    console.log('Location state:', location.state);
    console.log('Has location state?', !!location.state);
    console.log('Analysis data state:', analysisData);
    console.log('Parsed AI data:', parsedAIData);
    console.log('Is loading?', isLoading);
    console.log('PDF Generator state:', { isGenerating, error });
  }, [location.state, analysisData, parsedAIData, isLoading, isGenerating, error]);

  useEffect(() => {
    const loadAnalysisData = () => {
      console.log('Loading analysis data...');
      
      // First, try to get data from location.state (from navigation)
      if (location.state) {
        console.log('Found data in location.state');
        const data = location.state as AnalysisData;
        setAnalysisData(data);
        
        // Parse the AI analysis data
        if (data.aiAnalysis) {
          const parsed = parseAIAnalysis(data.aiAnalysis);
          setParsedAIData(parsed);
        }
        
        setIsLoading(false);
        
        // Also store in sessionStorage as backup
        try {
          sessionStorage.setItem('lastAnalysis', JSON.stringify(data));
          console.log('Data stored in sessionStorage');
        } catch (error) {
          console.error('Failed to store in sessionStorage:', error);
        }
      } 
      // If no location state, try sessionStorage
      else {
        console.log('No location.state, checking sessionStorage...');
        const storedData = sessionStorage.getItem('lastAnalysis');
        
        if (storedData) {
          try {
            console.log('Found data in sessionStorage');
            const data = JSON.parse(storedData) as AnalysisData;
            setAnalysisData(data);
            
            // Parse the AI analysis data
            if (data.aiAnalysis) {
              const parsed = parseAIAnalysis(data.aiAnalysis);
              setParsedAIData(parsed);
            }
          } catch (error) {
            console.error('Failed to parse sessionStorage data:', error);
          }
        } else {
          console.log('No data found in sessionStorage either');
        }
        
        setIsLoading(false);
      }
    };

    loadAnalysisData();
  }, [location.state]);

  const handleDownloadPDF = async () => {
    console.log('handleDownloadPDF called');
    console.log('analysisData:', analysisData);
    
    if (!analysisData) {
      alert('No analysis data available');
      return;
    }
    
    const success = await generateReport(analysisData);
    if (success) {
      console.log('PDF generated successfully!');
    }
  };

 

  const formatTimestamp = (timestamp: string): string => {
    try {
      return new Date(timestamp).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return new Date().toLocaleString();
    }
  };

  const getRiskBadgeClass = (riskLevel: string): string => {
    switch (riskLevel?.toLowerCase()) {
      case 'high': return 'risk-high';
      case 'medium': return 'risk-medium';
      case 'low': return 'risk-low';
      default: return 'risk-unknown';
    }
  };

  const getRiskBadgeText = (riskLevel: string): string => {
    switch (riskLevel?.toLowerCase()) {
      case 'high': return '🔴 High Risk';
      case 'medium': return '🟡 Medium Risk';
      case 'low': return '🟢 Low Risk';
      default: return '⚪ Unknown Risk';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'high': return <span className="severity-badge high">🔴 High</span>;
      case 'medium': return <span className="severity-badge medium">🟡 Medium</span>;
      case 'low': return <span className="severity-badge low">🟢 Low</span>;
      default: return <span className="severity-badge">⚪ Unknown</span>;
    }
  };

  const renderAIAnalysisContent = () => {
    if (!analysisData?.aiAnalysis) {
      console.log('No aiAnalysis content to render');
      return <p className="no-analysis">No AI analysis content available.</p>;
    }
    
    console.log('Rendering AI analysis content, length:', analysisData.aiAnalysis.length);
    
    // Try to use parsed data for better display
    if (parsedAIData?.detailedAnalysis) {
      return (
        <>
          <h3 className="analysis-heading">Executive Summary</h3>
          <p className="analysis-paragraph">{parsedAIData.executiveSummary}</p>
          
          <h3 className="analysis-heading">Detailed Analysis</h3>
          <p className="analysis-paragraph">{parsedAIData.detailedAnalysis}</p>
          
          {parsedAIData.recommendations && parsedAIData.recommendations.length > 0 && (
            <>
              <h3 className="analysis-heading">Key Recommendations</h3>
              <ul className="analysis-list">
                {parsedAIData.recommendations.map((rec, index) => (
                  <li key={index} className="analysis-bullet">{rec}</li>
                ))}
              </ul>
            </>
          )}
        </>
      );
    }
    
    // Fallback to raw text display
    return analysisData.aiAnalysis.split('\n').map((line, index) => {
      const trimmedLine = line.trim();
      
      // Headings
      if (trimmedLine.match(/^[0-9]+\.\s+.+/) || trimmedLine.match(/^[A-Z][A-Z\s]+:$/)) {
        return <h3 key={index} className="analysis-heading">{trimmedLine}</h3>;
      }
      
      // Sub-headings
      if (trimmedLine.match(/^[-•*]\s+.+/)) {
        return <li key={index} className="analysis-bullet">{trimmedLine.substring(2)}</li>;
      }
      
      // Code blocks
      if (trimmedLine.startsWith('```')) {
        return null;
      }
      
      // Regular paragraphs
      if (trimmedLine) {
        return <p key={index} className="analysis-paragraph">{trimmedLine}</p>;
      }
      
      // Empty lines
      return <br key={index} />;
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading analysis results...</p>
          <p className="loading-details">Checking for analysis data...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!analysisData) {
    return (
      <DashboardLayout>
        <div className="error-container">
          <h2>No Analysis Data Found</h2>
          <p>Unable to load analysis results. This could be because:</p>
          <ul className="error-reasons">
            <li>You refreshed the page and lost the analysis data</li>
            <li>The analysis failed to complete</li>
            <li>There was an error in the analysis process</li>
          </ul>
          <div className="error-actions">
            <button onClick={() => navigate('/aianalysis')} className="back-button primary">
              Start New Analysis
            </button>
            <button onClick={() => navigate('/dashboard')} className="back-button secondary">
              Back to Dashboard
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  
  return (
    <DashboardLayout>
      <div className="analysis-results">
        {/* Header Section */}
        <div className="results-header">
          <div className="header-main">
            <h1>AI Audit Report</h1>
            <div className="contract-info">
              <span className="contract-name">
                {analysisData.contractName || 'Unnamed Contract'}
              </span>
              <code className="contract-address">
                {analysisData.contractAddress.substring(0, 10)}...{analysisData.contractAddress.substring(34)}
              </code>
              {analysisData.isVerified && (
                <span className="verified-badge">✅ Verified</span>
              )}
            </div>
            <div className="analysis-meta">
              <span className="meta-item">
                <strong>Analyzed:</strong> {formatTimestamp(analysisData.timestamp)}
              </span>
              <span className="meta-item">
                <strong>Network:</strong> {analysisData.network || 'Lisk'}
              </span>
              <span className="meta-item">
                <strong>ID:</strong> {analysisData.analysisId?.substring(0, 8) || 'N/A'}
              </span>
            </div>
          </div>
          
          <div className="header-stats">
            <div className="stat-card">
              <div className="stat-label">Risk Level</div>
              <div className={`stat-value ${getRiskBadgeClass(analysisData.riskLevel)}`}>
                {getRiskBadgeText(analysisData.riskLevel)}
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-label">Audit Score</div>
              <div className="stat-value score">
                {analysisData.auditScore || 0}/100
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-label">Analysis Type</div>
              <div className="stat-value">
                {analysisData.analysisType?.charAt(0).toUpperCase() + analysisData.analysisType?.slice(1) || 'Standard'}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="results-tabs">
          <button 
            className={`tab ${activeTab === 'summary' ? 'active' : ''}`}
            onClick={() => setActiveTab('summary')}
          >
            📋 AI Summary
          </button>
          <button 
            className={`tab ${activeTab === 'vulnerabilities' ? 'active' : ''}`}
            onClick={() => setActiveTab('vulnerabilities')}
          >
            🚨 Vulnerabilities ({parsedAIData?.vulnerabilities?.length || analysisData.vulnerabilityCounts?.total || 0})
          </button>
          <button 
            className={`tab ${activeTab === 'code' ? 'active' : ''}`}
            onClick={() => setActiveTab('code')}
          >
            📄 Source Code
          </button>
          <button 
            className={`tab ${activeTab === 'export' ? 'active' : ''}`}
            onClick={() => setActiveTab('export')}
          >
            📥 Export PDF
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {/* AI Summary Tab */}
          {activeTab === 'summary' && (
            <div className="ai-summary-tab">
              <div className="summary-stats">
                <div className="stat-grid">
                  <div className="summary-stat">
                    <div className="stat-title">Vulnerabilities</div>
                    <div className="stat-numbers">
                      <span className="vuln-high">{parsedAIData?.vulnerabilities?.filter(v => v.severity === 'high').length || analysisData.vulnerabilityCounts?.high || 0} High</span>
                      <span className="vuln-medium">{parsedAIData?.vulnerabilities?.filter(v => v.severity === 'medium').length || analysisData.vulnerabilityCounts?.medium || 0} Medium</span>
                      <span className="vuln-low">{parsedAIData?.vulnerabilities?.filter(v => v.severity === 'low').length || analysisData.vulnerabilityCounts?.low || 0} Low</span>
                    </div>
                  </div>
                  <div className="summary-stat">
                    <div className="stat-title">Risk Score</div>
                    <div className="stat-value">
                      {parsedAIData?.riskScore || analysisData.auditScore || 'Unknown'}
                    </div>
                  </div>
                  <div className="summary-stat">
                    <div className="stat-title">Recommendation</div>
                    <div className="stat-value recommendation">
                      {analysisData.productionRecommendation || parsedAIData?.recommendations?.[0] || 'Further review needed'}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="ai-analysis-content">
                <div className="section-header">
                  <h2>🤖 AI Analysis Report</h2>
                  <div className="analysis-info">
                    <span className="info-badge">Generated by AI</span>
                    <span className="info-badge">{analysisData.analysisType} Analysis</span>
                    <span className="info-badge">{parsedAIData?.vulnerabilities?.length || 0} Issues Found</span>
                  </div>
                </div>
                <div className="report-content">
                  {renderAIAnalysisContent()}
                </div>
              </div>
            </div>
          )}

          {/* Vulnerabilities Tab - UPDATED WITH REAL DATA */}
          {activeTab === 'vulnerabilities' && (
            <div className="vulnerabilities-tab">
              <div className="vulnerabilities-header">
                <h2>Detected Vulnerabilities</h2>
                <div className="vulnerabilities-stats">
                  <span className="stat-badge high">
                    🔴 {parsedAIData?.vulnerabilities?.filter(v => v.severity === 'high').length || 0} High
                  </span>
                  <span className="stat-badge medium">
                    🟡 {parsedAIData?.vulnerabilities?.filter(v => v.severity === 'medium').length || 0} Medium
                  </span>
                  <span className="stat-badge low">
                    🟢 {parsedAIData?.vulnerabilities?.filter(v => v.severity === 'low').length || 0} Low
                  </span>
                </div>
              </div>
              
              {parsedAIData?.vulnerabilities && parsedAIData.vulnerabilities.length > 0 ? (
                <div className="vulnerabilities-list">
                  {parsedAIData.vulnerabilities.map((vulnerability, index) => (
                    <div key={index} className={`vulnerability-item severity-${vulnerability.severity}`}>
                      <div className="vulnerability-header">
                        <div className="vulnerability-title">
                          {getSeverityBadge(vulnerability.severity)}
                          <h4>{vulnerability.title || `Vulnerability ${index + 1}`}</h4>
                        </div>
                        {vulnerability.location && (
                          <span className="vulnerability-location">📍 {vulnerability.location}</span>
                        )}
                      </div>
                      
                      <div className="vulnerability-description">
                        <p><strong>Description:</strong> {vulnerability.description}</p>
                      </div>
                      
                      <div className="vulnerability-recommendation">
                        <p><strong>Recommendation:</strong> {vulnerability.recommendation}</p>
                      </div>
                      
                      {vulnerability.exploitScenario && (
                        <div className="vulnerability-exploit">
                          <p><strong>Exploit Scenario:</strong> {vulnerability.exploitScenario}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-vulnerabilities">
                  <h3>🎉 No Vulnerabilities Found</h3>
                  <p>The AI analysis did not detect any security vulnerabilities in this contract.</p>
                  <div className="success-badge">Excellent Security</div>
                </div>
              )}
              
              {/* Gas Optimizations Section */}
              {parsedAIData?.gasOptimizations && parsedAIData.gasOptimizations.length > 0 && (
                <div className="optimizations-section">
                  <h3>Gas Optimization Opportunities</h3>
                  <div className="optimizations-list">
                    {parsedAIData.gasOptimizations.map((optimization, index) => (
                      <div key={index} className="optimization-item">
                        <span className="optimization-icon">⚡</span>
                        <span>{optimization}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Best Practices Section */}
              {parsedAIData?.bestPractices && parsedAIData.bestPractices.length > 0 && (
                <div className="best-practices-section">
                  <h3>Best Practices Compliance</h3>
                  <div className="best-practices-list">
                    {parsedAIData.bestPractices.map((practice, index) => (
                      <div key={index} className={`practice-item ${practice.compliant ? 'compliant' : 'non-compliant'}`}>
                        <span className="practice-status">
                          {practice.compliant ? '✅' : '❌'}
                        </span>
                        <div className="practice-details">
                          <strong>{practice.check}</strong>
                          <p>{practice.details}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Source Code Tab */}
          {activeTab === 'code' && (
            <div className="code-tab">
              <div className="code-header">
                <h3>Contract Source Code Preview</h3>
                <div className="code-info">
                  <span>Compiler: {analysisData.compilerVersion}</span>
                  <span>Length: {analysisData.sourceCodeLength || 0} characters</span>
                  <span>Verified: {analysisData.isVerified ? 'Yes' : 'No'}</span>
                </div>
              </div>
              
              <div className="code-preview">
                <pre>{analysisData.sourceCodePreview || 'No source code preview available'}</pre>
                {analysisData.sourceCodeLength > 300 && (
                  <div className="code-truncated">
                    <p>Code truncated for preview. Full code available in PDF export.</p>
                  </div>
                )}
                {!analysisData.sourceCodePreview && (
                  <div className="no-code">
                    <p>No source code preview available. The contract might not be verified on Blockscout.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Export PDF Tab */}
          {activeTab === 'export' && (
            <div className="export-tab">
              <div className="export-card">
                <h3>📥 Download PDF Report</h3>
                <p>Generate a professional PDF report of this analysis.</p>
                
                <div className="export-features">
                  <ul>
                    <li>✅ Complete AI analysis report</li>
                    <li>✅ Contract source code preview</li>
                    <li>✅ Risk assessment and scores</li>
                    <li>✅ Vulnerability breakdown ({parsedAIData?.vulnerabilities?.length || 0} vulnerabilities)</li>
                    <li>✅ Timestamp and audit information</li>
                    <li>✅ Professional formatting</li>
                    <li>✅ Offline access</li>
                  </ul>
                </div>
                
                <div className="pdf-preview">
                  <h4>Report Contents:</h4>
                  <div className="preview-content">
                    <p><strong>Contract:</strong> {analysisData.contractName || 'Unnamed Contract'}</p>
                    <p><strong>Vulnerabilities:</strong> {parsedAIData?.vulnerabilities?.length || 0} detected</p>
                    <p><strong>Risk Score:</strong> {parsedAIData?.riskScore ? Math.round(parsedAIData.riskScore / 10) : (analysisData.auditScore ? Math.floor(analysisData.auditScore / 10) : 5)}/10</p>
                    <p><strong>File Name:</strong> <code>contract-audit-{analysisData.contractAddress.substring(0, 8)}.pdf</code></p>
                  </div>
                </div>
                
                <button 
                  onClick={handleDownloadPDF}
                  disabled={isGenerating || !analysisData}
                  className="export-button"
                >
                  {isGenerating ? (
                    <>
                      <span className="spinner small"></span>
                      Generating PDF...
                    </>
                  ) : (
                    'Generate & Download PDF Report'
                  )}
                </button>
                
                {error && <div className="error-message">{error}</div>}
                
                <div className="export-note">
                  <p>The PDF will include all analysis data shown in this report with professional formatting.</p>
                  <p className="small">Note: The PDF generation may take a few moments depending on the complexity of the report.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with quick actions */}
        <div className="results-footer">
          <button 
            onClick={() => navigate('/aianalysis')}
            className="action-button secondary"
          >
            Start New Analysis
          </button>
          
          <button 
            onClick={handleDownloadPDF}
            disabled={isGenerating || !analysisData}
            className="action-button primary"
          >
            {isGenerating ? 'Generating PDF...' : 'Download PDF Report'}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AnalysisResults;