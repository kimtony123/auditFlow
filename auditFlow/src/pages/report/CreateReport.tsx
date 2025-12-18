import React, { useState, useEffect } from "react";
import DashboardLayout from "../../layout/Layout";
import "./CreateReport.css";
import { usePDF } from '@react-pdf/renderer';
import ScopingDocumentPDF from "../../components/ScopingDocumentPDF";

interface BasicInfo {
  protocolName: string;
  website: string;
  documentationLink: string;
  contactName: string;
  contactEmail: string;
  contactTelegram: string;
  whitepaperLink: string;
}

interface CodeDetails {
  repoLink: string;
  commitHash: string;
  numberOfContracts: string;
  totalSLOC: string;
  complexityScore: string;
  externalProtocols: string;
  testCoverage: string;
  inScopeContracts: string;
}

interface ProtocolDetails {
  currentStatus: string;
  isFork: boolean;
  forkProtocol: string;
  usesRollups: boolean;
  multiChain: boolean;
  chains: string;
  usesOracles: boolean;
  usesAMMs: boolean;
  usesZKProofs: boolean;
  erc20Tokens: string;
  erc721Tokens: string;
  erc777Tokens: boolean;
  offChainProcesses: boolean;
  offChainProcessesExplanation: string;
}

interface ProtocolRisks {
  evaluateCentralizationRisks: boolean;
  evaluateAdminRisks: boolean;
  evaluateTokenInflationRisks: boolean;
  evaluateFeeOnTransferRisks: boolean;
  evaluateRebasingTokenRisks: boolean;
  evaluateExternalPausingRisks: boolean;
  evaluateOracleRisks: boolean;
  evaluateBlacklistRisks: boolean;
  complyWithEIPs: boolean;
  eipsList: string;
}

interface KnownIssue {
  id: number;
  description: string;
}

interface PreviousAudits {
  count: string;
  reportLinks: string;
}

interface Resources {
  flowCharts: string;
  explainerVideos: string;
  articles: string;
}

interface RektTest {
  q1: boolean;
  q2: boolean;
  q3: boolean;
  q4: boolean;
  q5: boolean;
  q6: boolean;
  q7: boolean;
  q8: boolean;
  q9: boolean;
  q10: boolean;
  q11: boolean;
  q12: boolean;
}

interface PostDeployment {
  bugBountyProgram: string;
  monitoringSolution: string;
  incidentResponseTeam: string;
}

const CreateReport: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('basic');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfInstance, updatePdfInstance] = usePDF({ document: null });
  const [completionStatus, setCompletionStatus] = useState<Record<string, boolean>>({
    basic: false,
    code: false,
    protocol: false,
    risks: false,
    issues: false,
    audits: false,
    resources: false,
    rekt: false,
    post: false
  });

  // Form state
  const [basicInfo, setBasicInfo] = useState<BasicInfo>({
    protocolName: '',
    website: '',
    documentationLink: '',
    contactName: '',
    contactEmail: '',
    contactTelegram: '',
    whitepaperLink: ''
  });

  const [codeDetails, setCodeDetails] = useState<CodeDetails>({
    repoLink: '',
    commitHash: '',
    numberOfContracts: '',
    totalSLOC: '',
    complexityScore: '',
    externalProtocols: '',
    testCoverage: '',
    inScopeContracts: ''
  });

  const [protocolDetails, setProtocolDetails] = useState<ProtocolDetails>({
    currentStatus: '',
    isFork: false,
    forkProtocol: '',
    usesRollups: false,
    multiChain: false,
    chains: '',
    usesOracles: false,
    usesAMMs: false,
    usesZKProofs: false,
    erc20Tokens: '',
    erc721Tokens: '',
    erc777Tokens: false,
    offChainProcesses: false,
    offChainProcessesExplanation: ''
  });

  const [protocolRisks, setProtocolRisks] = useState<ProtocolRisks>({
    evaluateCentralizationRisks: true,
    evaluateAdminRisks: true,
    evaluateTokenInflationRisks: true,
    evaluateFeeOnTransferRisks: true,
    evaluateRebasingTokenRisks: true,
    evaluateExternalPausingRisks: true,
    evaluateOracleRisks: true,
    evaluateBlacklistRisks: true,
    complyWithEIPs: false,
    eipsList: ''
  });

  const [knownIssues, setKnownIssues] = useState<KnownIssue[]>([
    { id: 1, description: '' }
  ]);

  const [previousAudits, setPreviousAudits] = useState<PreviousAudits>({
    count: '',
    reportLinks: ''
  });

  const [resources, setResources] = useState<Resources>({
    flowCharts: '',
    explainerVideos: '',
    articles: ''
  });

  const [rektTest, setRektTest] = useState<RektTest>({
    q1: false,
    q2: false,
    q3: false,
    q4: false,
    q5: false,
    q6: false,
    q7: false,
    q8: false,
    q9: false,
    q10: false,
    q11: false,
    q12: false
  });

  const [postDeployment, setPostDeployment] = useState<PostDeployment>({
    bugBountyProgram: '',
    monitoringSolution: '',
    incidentResponseTeam: ''
  });

  // Calculate completion percentage
  const calculateCompletion = () => {
    const completed = Object.values(completionStatus).filter(status => status).length;
    const total = Object.keys(completionStatus).length;
    return Math.round((completed / total) * 100);
  };

  // Check if all sections are completed
  const isAllCompleted = () => {
    return Object.values(completionStatus).every(status => status);
  };

  // Validate sections
  const validateSection = (section: string): boolean => {
    switch(section) {
      case 'basic':
        return !!basicInfo.protocolName && 
               !!basicInfo.website && 
               !!basicInfo.documentationLink && 
               !!basicInfo.contactName && 
               !!basicInfo.contactEmail;
      
      case 'code':
        return !!codeDetails.repoLink && 
               !!codeDetails.commitHash;
      
      case 'protocol':
        return !!protocolDetails.currentStatus;
      
      case 'risks':
        return true; // All optional or have defaults
      
      case 'issues':
        return true; // Optional
      
      case 'audits':
        return true; // Optional
      
      case 'resources':
        return true; // Optional
      
      case 'rekt':
        return Object.values(rektTest).some(value => value !== undefined);
      
      case 'post':
        return !!postDeployment.bugBountyProgram || 
               !!postDeployment.monitoringSolution || 
               !!postDeployment.incidentResponseTeam;
      
      default:
        return false;
    }
  };

  // Update completion status when form changes
  useEffect(() => {
    const updatedStatus = { ...completionStatus };
    Object.keys(updatedStatus).forEach(section => {
      updatedStatus[section] = validateSection(section);
    });
    setCompletionStatus(updatedStatus);
  }, [basicInfo, codeDetails, protocolDetails, protocolRisks, knownIssues, previousAudits, resources, rektTest, postDeployment]);

  const handleBasicInfoChange = (field: keyof BasicInfo, value: string) => {
    setBasicInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleCodeDetailsChange = (field: keyof CodeDetails, value: string) => {
    setCodeDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleProtocolDetailsChange = (field: keyof ProtocolDetails, value: any) => {
    setProtocolDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleProtocolRisksChange = (field: keyof ProtocolRisks, value: boolean | string) => {
    setProtocolRisks(prev => ({ ...prev, [field]: value }));
  };

  const handleKnownIssueChange = (id: number, value: string) => {
    setKnownIssues(prev => 
      prev.map(issue => 
        issue.id === id ? { ...issue, description: value } : issue
      )
    );
  };

  const addKnownIssue = () => {
    const newId = knownIssues.length > 0 ? Math.max(...knownIssues.map(issue => issue.id)) + 1 : 1;
    setKnownIssues(prev => [...prev, { id: newId, description: '' }]);
  };

  const removeKnownIssue = (id: number) => {
    if (knownIssues.length > 1) {
      setKnownIssues(prev => prev.filter(issue => issue.id !== id));
    }
  };

  const handlePreviousAuditsChange = (field: keyof PreviousAudits, value: string) => {
    setPreviousAudits(prev => ({ ...prev, [field]: value }));
  };

  const handleResourcesChange = (field: keyof Resources, value: string) => {
    setResources(prev => ({ ...prev, [field]: value }));
  };

  const handleRektTestChange = (question: keyof RektTest, value: boolean) => {
    setRektTest(prev => ({ ...prev, [question]: value }));
  };

  const handlePostDeploymentChange = (field: keyof PostDeployment, value: string) => {
    setPostDeployment(prev => ({ ...prev, [field]: value }));
  };

  const handleGeneratePDF = async () => {
    if (!isAllCompleted()) {
      alert("Please complete all sections before generating PDF");
      return;
    }
    
    setIsGeneratingPDF(true);
    
    const pdfData = {
      basicInfo,
      codeDetails,
      protocolDetails,
      protocolRisks,
      knownIssues: knownIssues.filter(issue => issue.description.trim()),
      previousAudits,
      resources,
      rektTest,
      postDeployment,
      generatedAt: new Date().toISOString()
    };

    updatePdfInstance(<ScopingDocumentPDF data={pdfData} />);
    setIsGeneratingPDF(false);
  };

  const handleDownloadPDF = () => {
    if (pdfInstance.url) {
      const link = document.createElement('a');
      link.href = pdfInstance.url;
      link.download = `security-scoping-${basicInfo.protocolName || 'protocol'}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const tabs = [
    { id: 'basic', label: '📋 Basic Info', icon: '📋' },
    { id: 'code', label: '💻 Code Details', icon: '💻' },
    { id: 'protocol', label: '⚙️ Protocol Details', icon: '⚙️' },
    { id: 'risks', label: '⚠️ Protocol Risks', icon: '⚠️' },
    { id: 'issues', label: '🔍 Known Issues', icon: '🔍' },
    { id: 'audits', label: '📊 Previous Audits', icon: '📊' },
    { id: 'resources', label: '📚 Resources', icon: '📚' },
    { id: 'rekt', label: '🛡️ The Rekt Test', icon: '🛡️' },
    { id: 'post', label: '🚀 Post Deployment', icon: '🚀' },
    { id: 'export', label: '📥 Export PDF', icon: '📥' }
  ];

  const canNavigateToTab = (tabId: string): boolean => {
    const tabIndex = tabs.findIndex(tab => tab.id === tabId);
    const currentTabIndex = tabs.findIndex(tab => tab.id === activeTab);
    
    // Can always go back
    if (tabIndex < currentTabIndex) return true;
    
    // Can only go forward if all previous tabs are completed
    for (let i = 0; i < tabIndex; i++) {
      if (!completionStatus[tabs[i].id]) return false;
    }
    
    return true;
  };

  const handleTabClick = (tabId: string) => {
    if (canNavigateToTab(tabId)) {
      setActiveTab(tabId);
    } else {
      // Find first incomplete tab
      const firstIncomplete = tabs.find(tab => !completionStatus[tab.id] && tab.id !== 'export');
      if (firstIncomplete) {
        setActiveTab(firstIncomplete.id);
        alert(`Please complete "${firstIncomplete.label}" section first`);
      }
    }
  };

  const handleNextTab = () => {
    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
    if (currentIndex < tabs.length - 1) {
      const nextTab = tabs[currentIndex + 1];
      if (canNavigateToTab(nextTab.id)) {
        setActiveTab(nextTab.id);
      } else {
        alert(`Please complete current section before moving to "${nextTab.label}"`);
      }
    }
  };

  const handlePreviousTab = () => {
    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1].id);
    }
  };

  return (
    <DashboardLayout>
      <div className="create-report">
        <div className="report-header">
          <h1>Security Review Scoping Document</h1>
          <p className="subtitle">
            Create a comprehensive scoping document for your smart contract security review
          </p>
        </div>

        {/* Completion Status Bar */}
        <div className="completion-bar">
          <div className="completion-stats">
            <span className="completion-label">Document Completion:</span>
            <span className={`completion-value ${calculateCompletion() === 100 ? 'complete' : 'incomplete'}`}>
              {calculateCompletion()}%
            </span>
          </div>
          <div className="completion-progress">
            <div 
              className="completion-fill" 
              style={{ width: `${calculateCompletion()}%` }}
            ></div>
          </div>
          {calculateCompletion() === 100 && (
            <div className="completion-message">
              🎉 All sections completed! Ready to generate PDF.
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="report-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab ${activeTab === tab.id ? 'active' : ''} ${
                !canNavigateToTab(tab.id) ? 'disabled' : ''
              } ${completionStatus[tab.id] ? 'completed' : ''}`}
              onClick={() => handleTabClick(tab.id)}
              disabled={!canNavigateToTab(tab.id)}
            >
              {tab.icon} {tab.label}
              {tab.id !== 'export' && completionStatus[tab.id] && (
                <span className="tab-check">✅</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="basic-tab">
              <div className="section-header">
                <h2>📋 Basic Information</h2>
                <p className="section-description">
                  Provide basic information about your protocol. All fields marked with * are required.
                </p>
              </div>
              
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="protocolName">Protocol Name *</label>
                  <input
                    type="text"
                    id="protocolName"
                    value={basicInfo.protocolName}
                    onChange={(e) => handleBasicInfoChange('protocolName', e.target.value)}
                    placeholder="Enter protocol name"
                    className="form-input"
                    required
                  />
                  {!basicInfo.protocolName && <div className="error-hint">Required</div>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="website">Website *</label>
                  <input
                    type="url"
                    id="website"
                    value={basicInfo.website}
                    onChange={(e) => handleBasicInfoChange('website', e.target.value)}
                    placeholder="https://example.com"
                    className="form-input"
                    required
                  />
                  {!basicInfo.website && <div className="error-hint">Required</div>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="documentationLink">Documentation Link *</label>
                  <input
                    type="url"
                    id="documentationLink"
                    value={basicInfo.documentationLink}
                    onChange={(e) => handleBasicInfoChange('documentationLink', e.target.value)}
                    placeholder="https://docs.example.com"
                    className="form-input"
                    required
                  />
                  {!basicInfo.documentationLink && <div className="error-hint">Required</div>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="contactName">Contact Name *</label>
                  <input
                    type="text"
                    id="contactName"
                    value={basicInfo.contactName}
                    onChange={(e) => handleBasicInfoChange('contactName', e.target.value)}
                    placeholder="John Doe"
                    className="form-input"
                    required
                  />
                  {!basicInfo.contactName && <div className="error-hint">Required</div>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="contactEmail">Contact Email *</label>
                  <input
                    type="email"
                    id="contactEmail"
                    value={basicInfo.contactEmail}
                    onChange={(e) => handleBasicInfoChange('contactEmail', e.target.value)}
                    placeholder="john@example.com"
                    className="form-input"
                    required
                  />
                  {!basicInfo.contactEmail && <div className="error-hint">Required</div>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="contactTelegram">Telegram Handle</label>
                  <input
                    type="text"
                    id="contactTelegram"
                    value={basicInfo.contactTelegram}
                    onChange={(e) => handleBasicInfoChange('contactTelegram', e.target.value)}
                    placeholder="@username"
                    className="form-input"
                  />
                </div>
                
                <div className="form-group full-width">
                  <label htmlFor="whitepaperLink">Whitepaper Link (Optional)</label>
                  <input
                    type="url"
                    id="whitepaperLink"
                    value={basicInfo.whitepaperLink}
                    onChange={(e) => handleBasicInfoChange('whitepaperLink', e.target.value)}
                    placeholder="https://whitepaper.example.com"
                    className="form-input"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Code Details Tab */}
          {activeTab === 'code' && (
            <div className="code-tab">
              <div className="section-header">
                <h2>💻 Code Details</h2>
                <p className="section-description">
                  Information about the codebase to be audited
                </p>
              </div>
              
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="repoLink">Repository Link *</label>
                  <input
                    type="url"
                    id="repoLink"
                    value={codeDetails.repoLink}
                    onChange={(e) => handleCodeDetailsChange('repoLink', e.target.value)}
                    placeholder="https://github.com/username/repo"
                    className="form-input"
                    required
                  />
                  {!codeDetails.repoLink && <div className="error-hint">Required</div>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="commitHash">Commit Hash/Tag *</label>
                  <input
                    type="text"
                    id="commitHash"
                    value={codeDetails.commitHash}
                    onChange={(e) => handleCodeDetailsChange('commitHash', e.target.value)}
                    placeholder="a1b2c3d4e5f6"
                    className="form-input"
                    required
                  />
                  {!codeDetails.commitHash && <div className="error-hint">Required</div>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="numberOfContracts">Number of Contracts in Scope</label>
                  <input
                    type="number"
                    id="numberOfContracts"
                    value={codeDetails.numberOfContracts}
                    onChange={(e) => handleCodeDetailsChange('numberOfContracts', e.target.value)}
                    placeholder="5"
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="totalSLOC">Total SLOC</label>
                  <input
                    type="number"
                    id="totalSLOC"
                    value={codeDetails.totalSLOC}
                    onChange={(e) => handleCodeDetailsChange('totalSLOC', e.target.value)}
                    placeholder="2500"
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="complexityScore">Complexity Score</label>
                  <select
                    id="complexityScore"
                    value={codeDetails.complexityScore}
                    onChange={(e) => handleCodeDetailsChange('complexityScore', e.target.value)}
                    className="form-input"
                  >
                    <option value="">Select complexity</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="very-high">Very High</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="externalProtocols">External Protocol Interactions</label>
                  <input
                    type="number"
                    id="externalProtocols"
                    value={codeDetails.externalProtocols}
                    onChange={(e) => handleCodeDetailsChange('externalProtocols', e.target.value)}
                    placeholder="3"
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="testCoverage">Test Coverage (%)</label>
                  <input
                    type="number"
                    id="testCoverage"
                    value={codeDetails.testCoverage}
                    onChange={(e) => handleCodeDetailsChange('testCoverage', e.target.value)}
                    placeholder="85"
                    min="0"
                    max="100"
                    className="form-input"
                  />
                </div>
              </div>
              
              <div className="form-group full-width">
                <label htmlFor="inScopeContracts">In Scope Contracts (Tree Output)</label>
                <textarea
                  id="inScopeContracts"
                  value={codeDetails.inScopeContracts}
                  onChange={(e) => handleCodeDetailsChange('inScopeContracts', e.target.value)}
                  placeholder="Run: tree ./src/ | sed 's/└/#/g; s/──/--/g; s/├/#/g; s/│ /|/g; s/│/|/g'"
                  className="form-textarea"
                  rows={6}
                />
                <div className="form-hint">
                  Use the command above to generate a tree view of your contracts
                </div>
              </div>
            </div>
          )}

          {/* Protocol Details Tab */}
          {activeTab === 'protocol' && (
            <div className="protocol-tab">
              <div className="section-header">
                <h2>⚙️ Protocol Details</h2>
                <p className="section-description">
                  Technical details about your protocol
                </p>
              </div>
              
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="currentStatus">Current Status *</label>
                  <select
                    id="currentStatus"
                    value={protocolDetails.currentStatus}
                    onChange={(e) => handleProtocolDetailsChange('currentStatus', e.target.value)}
                    className="form-input"
                    required
                  >
                    <option value="">Select status *</option>
                    <option value="development">In Development</option>
                    <option value="testnet">Testnet</option>
                    <option value="mainnet">Mainnet</option>
                    <option value="upgrade">Planning Upgrade</option>
                  </select>
                  {!protocolDetails.currentStatus && <div className="error-hint">Required</div>}
                </div>
                
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={protocolDetails.isFork}
                      onChange={(e) => handleProtocolDetailsChange('isFork', e.target.checked)}
                    />
                    Is the project a fork of an existing protocol?
                  </label>
                </div>
                
                {protocolDetails.isFork && (
                  <div className="form-group">
                    <label htmlFor="forkProtocol">Specify Protocol</label>
                    <input
                      type="text"
                      id="forkProtocol"
                      value={protocolDetails.forkProtocol}
                      onChange={(e) => handleProtocolDetailsChange('forkProtocol', e.target.value)}
                      placeholder="Uniswap V2, Compound, etc."
                      className="form-input"
                    />
                  </div>
                )}
                
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={protocolDetails.usesRollups}
                      onChange={(e) => handleProtocolDetailsChange('usesRollups', e.target.checked)}
                    />
                    Does the project use rollups?
                  </label>
                </div>
                
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={protocolDetails.multiChain}
                      onChange={(e) => handleProtocolDetailsChange('multiChain', e.target.checked)}
                    />
                    Will the protocol be multi-chain?
                  </label>
                </div>
                
                {protocolDetails.multiChain && (
                  <div className="form-group full-width">
                    <label htmlFor="chains">Specify Chains</label>
                    <input
                      type="text"
                      id="chains"
                      value={protocolDetails.chains}
                      onChange={(e) => handleProtocolDetailsChange('chains', e.target.value)}
                      placeholder="Ethereum, Polygon, Arbitrum, etc."
                      className="form-input"
                    />
                  </div>
                )}
                
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={protocolDetails.usesOracles}
                      onChange={(e) => handleProtocolDetailsChange('usesOracles', e.target.checked)}
                    />
                    Does the protocol use external oracles?
                  </label>
                </div>
                
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={protocolDetails.usesAMMs}
                      onChange={(e) => handleProtocolDetailsChange('usesAMMs', e.target.checked)}
                    />
                    Does the protocol use external AMMs?
                  </label>
                </div>
                
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={protocolDetails.usesZKProofs}
                      onChange={(e) => handleProtocolDetailsChange('usesZKProofs', e.target.checked)}
                    />
                    Does the protocol use zero-knowledge proofs?
                  </label>
                </div>
                
                <div className="form-group full-width">
                  <label htmlFor="erc20Tokens">ERC20 Tokens to Interact With</label>
                  <input
                    type="text"
                    id="erc20Tokens"
                    value={protocolDetails.erc20Tokens}
                    onChange={(e) => handleProtocolDetailsChange('erc20Tokens', e.target.value)}
                    placeholder="USDC, DAI, WETH, etc."
                    className="form-input"
                  />
                </div>
                
                <div className="form-group full-width">
                  <label htmlFor="erc721Tokens">ERC721 Tokens to Interact With</label>
                  <input
                    type="text"
                    id="erc721Tokens"
                    value={protocolDetails.erc721Tokens}
                    onChange={(e) => handleProtocolDetailsChange('erc721Tokens', e.target.value)}
                    placeholder="BAYC, CryptoPunks, etc."
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={protocolDetails.erc777Tokens}
                      onChange={(e) => handleProtocolDetailsChange('erc777Tokens', e.target.checked)}
                    />
                    Are ERC777 tokens expected to interact with protocol?
                  </label>
                </div>
                
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={protocolDetails.offChainProcesses}
                      onChange={(e) => handleProtocolDetailsChange('offChainProcesses', e.target.checked)}
                    />
                    Are there any off-chain processes (keeper bots etc.)?
                  </label>
                </div>
                
                {protocolDetails.offChainProcesses && (
                  <div className="form-group full-width">
                    <label htmlFor="offChainProcessesExplanation">Explain Off-Chain Processes</label>
                    <textarea
                      id="offChainProcessesExplanation"
                      value={protocolDetails.offChainProcessesExplanation}
                      onChange={(e) => handleProtocolDetailsChange('offChainProcessesExplanation', e.target.value)}
                      placeholder="Describe keeper bots, relayers, or other off-chain components..."
                      className="form-textarea"
                      rows={4}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Protocol Risks Tab */}
          {activeTab === 'risks' && (
            <div className="risks-tab">
              <div className="section-header">
                <h2>⚠️ Protocol Risks</h2>
                <p className="section-description">
                  Specify which risks should be evaluated during the audit
                </p>
              </div>
              
              <div className="risks-checkboxes">
                {[
                  { key: 'evaluateCentralizationRisks', label: 'Should we evaluate risks related to centralization?' },
                  { key: 'evaluateAdminRisks', label: 'Should we evaluate the risks of rogue protocol admin capturing user funds?' },
                  { key: 'evaluateTokenInflationRisks', label: 'Should we evaluate risks related to deflationary/inflationary ERC20 tokens?' },
                  { key: 'evaluateFeeOnTransferRisks', label: 'Should we evaluate risks due to fee-on-transfer tokens?' },
                  { key: 'evaluateRebasingTokenRisks', label: 'Should we evaluate risks due to rebasing tokens?' },
                  { key: 'evaluateExternalPausingRisks', label: 'Should we evaluate risks due to the pausing of any external contracts?' },
                  { key: 'evaluateOracleRisks', label: 'Should we evaluate risks associated with external oracles (if they exist)?' },
                  { key: 'evaluateBlacklistRisks', label: 'Should we evaluate risks related to blacklisted users for specific tokens?' }
                ].map(({ key, label }) => (
                  <div key={key} className="checkbox-item">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={protocolRisks[key as keyof ProtocolRisks] as boolean}
                        onChange={(e) => handleProtocolRisksChange(key as keyof ProtocolRisks, e.target.checked)}
                      />
                      {label}
                    </label>
                  </div>
                ))}
              </div>
              
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={protocolRisks.complyWithEIPs}
                    onChange={(e) => handleProtocolRisksChange('complyWithEIPs', e.target.checked)}
                  />
                  Is the code expected to comply with any specific EIPs?
                </label>
              </div>
              
              {protocolRisks.complyWithEIPs && (
                <div className="form-group full-width">
                  <label htmlFor="eipsList">Specify EIPs</label>
                  <input
                    type="text"
                    id="eipsList"
                    value={protocolRisks.eipsList}
                    onChange={(e) => handleProtocolRisksChange('eipsList', e.target.value)}
                    placeholder="EIP-20, EIP-721, EIP-1155, etc."
                    className="form-input"
                  />
                </div>
              )}
            </div>
          )}

          {/* Known Issues Tab */}
          {activeTab === 'issues' && (
            <div className="issues-tab">
              <div className="section-header">
                <h2>🔍 Known Issues</h2>
                <p className="section-description">
                  Issues you're already aware of and working on (optional)
                </p>
              </div>
              
              <div className="issues-list">
                {knownIssues.map((issue) => (
                  <div key={issue.id} className="issue-item">
                    <div className="issue-header">
                      <label htmlFor={`issue-${issue.id}`}>Issue #{issue.id}</label>
                      {knownIssues.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeKnownIssue(issue.id)}
                          className="remove-issue"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <textarea
                      id={`issue-${issue.id}`}
                      value={issue.description}
                      onChange={(e) => handleKnownIssueChange(issue.id, e.target.value)}
                      placeholder="Describe the known issue..."
                      className="form-textarea"
                      rows={3}
                    />
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={addKnownIssue}
                  className="add-issue-button"
                >
                  + Add Another Issue
                </button>
              </div>
            </div>
          )}

          {/* Previous Audits Tab */}
          {activeTab === 'audits' && (
            <div className="audits-tab">
              <div className="section-header">
                <h2>📊 Previous Audits</h2>
                <p className="section-description">
                  Share existing audit reports (optional)
                </p>
              </div>
              
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="auditCount">How many previous audits?</label>
                  <input
                    type="number"
                    id="auditCount"
                    value={previousAudits.count}
                    onChange={(e) => handlePreviousAuditsChange('count', e.target.value)}
                    placeholder="0"
                    min="0"
                    className="form-input"
                  />
                </div>
                
                <div className="form-group full-width">
                  <label htmlFor="reportLinks">Links to Audit Report(s)</label>
                  <textarea
                    id="reportLinks"
                    value={previousAudits.reportLinks}
                    onChange={(e) => handlePreviousAuditsChange('reportLinks', e.target.value)}
                    placeholder="One link per line..."
                    className="form-textarea"
                    rows={4}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Resources Tab */}
          {activeTab === 'resources' && (
            <div className="resources-tab">
              <div className="section-header">
                <h2>📚 Resources</h2>
                <p className="section-description">
                  Additional resources to help understand your protocol (optional)
                </p>
              </div>
              
              <div className="form-group full-width">
                <label htmlFor="flowCharts">Flow Charts / Design Docs</label>
                <textarea
                  id="flowCharts"
                  value={resources.flowCharts}
                  onChange={(e) => handleResourcesChange('flowCharts', e.target.value)}
                  placeholder="One resource per line..."
                  className="form-textarea"
                  rows={3}
                />
              </div>
              
              <div className="form-group full-width">
                <label htmlFor="explainerVideos">Explainer Videos</label>
                <textarea
                  id="explainerVideos"
                  value={resources.explainerVideos}
                  onChange={(e) => handleResourcesChange('explainerVideos', e.target.value)}
                  placeholder="One video link per line..."
                  className="form-textarea"
                  rows={3}
                />
              </div>
              
              <div className="form-group full-width">
                <label htmlFor="articles">Articles / Blogs</label>
                <textarea
                  id="articles"
                  value={resources.articles}
                  onChange={(e) => handleResourcesChange('articles', e.target.value)}
                  placeholder="One article link per line..."
                  className="form-textarea"
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* The Rekt Test Tab */}
          {activeTab === 'rekt' && (
            <div className="rekt-tab">
              <div className="section-header">
                <h2>🛡️ The Rekt Test</h2>
                <p className="section-description">
                  Security assessment questions
                </p>
              </div>
              
              <div className="rekt-test-grid">
                {[
                  'Do you have all actors, roles, and privileges documented?',
                  'Do you keep documentation of all the external services, contracts, and oracles you rely on?',
                  'Do you have a written and tested incident response plan?',
                  'Do you document the best ways to attack your system?',
                  'Do you perform identity verification and background checks on all employees?',
                  'Do you have a team member with security defined in their role?',
                  'Do you require hardware security keys for production systems?',
                  'Does your key management system require multiple humans and physical steps?',
                  'Do you define key invariants for your system and test them on every commit?',
                  'Do you use the best automated tools to discover security issues in your code?',
                  'Do you undergo external audits and maintain a vulnerability disclosure or bug bounty program?',
                  'Have you considered and mitigated avenues for abusing users of your system?'
                ].map((question, index) => (
                  <div key={index} className="rekt-question">
                    <div className="question-text">
                      {index + 1}. {question}
                    </div>
                    <div className="question-options">
                      <label className="radio-label">
                        <input
                          type="radio"
                          name={`rekt-q${index + 1}`}
                          checked={rektTest[`q${index + 1}` as keyof RektTest] === true}
                          onChange={() => handleRektTestChange(`q${index + 1}` as keyof RektTest, true)}
                        />
                        Yes
                      </label>
                      <label className="radio-label">
                        <input
                          type="radio"
                          name={`rekt-q${index + 1}`}
                          checked={rektTest[`q${index + 1}` as keyof RektTest] === false}
                          onChange={() => handleRektTestChange(`q${index + 1}` as keyof RektTest, false)}
                        />
                        No
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Post Deployment Tab */}
          {activeTab === 'post' && (
            <div className="post-tab">
              <div className="section-header">
                <h2>🚀 Post Deployment Planning</h2>
                <p className="section-description">
                  Your plans for after deployment
                </p>
              </div>
              
              <div className="form-grid">
                <div className="form-group full-width">
                  <label htmlFor="bugBountyProgram">Bug Bounty Program</label>
                  <input
                    type="text"
                    id="bugBountyProgram"
                    value={postDeployment.bugBountyProgram}
                    onChange={(e) => handlePostDeploymentChange('bugBountyProgram', e.target.value)}
                    placeholder="e.g., Immunefi, HackerOne, or custom program"
                    className="form-input"
                  />
                </div>
                
                <div className="form-group full-width">
                  <label htmlFor="monitoringSolution">Monitoring Solution</label>
                  <textarea
                    id="monitoringSolution"
                    value={postDeployment.monitoringSolution}
                    onChange={(e) => handlePostDeploymentChange('monitoringSolution', e.target.value)}
                    placeholder="What are you monitoring for and how?"
                    className="form-textarea"
                    rows={4}
                  />
                </div>
                
                <div className="form-group full-width">
                  <label htmlFor="incidentResponseTeam">Incident Response Team</label>
                  <textarea
                    id="incidentResponseTeam"
                    value={postDeployment.incidentResponseTeam}
                    onChange={(e) => handlePostDeploymentChange('incidentResponseTeam', e.target.value)}
                    placeholder="Who is on your incident response team?"
                    className="form-textarea"
                    rows={4}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Export PDF Tab */}
          {activeTab === 'export' && (
            <div className="export-tab">
              <div className="export-card">
                <h3>📥 Download PDF Report</h3>
                <p>Generate a professional PDF report of your scoping document.</p>
                
                <div className="export-features">
                  <ul>
                    <li>✅ Complete scoping document</li>
                    <li>✅ Professional formatting</li>
                    <li>✅ All sections included</li>
                    <li>✅ Risk assessment priorities</li>
                    <li>✅ Audit requirements</li>
                    <li>✅ Timestamp and contact info</li>
                    <li>✅ Ready for audit team review</li>
                  </ul>
                </div>
                
                <div className="pdf-preview">
                  <h4>Document Preview:</h4>
                  <div className="preview-content">
                    <p><strong>Protocol:</strong> {basicInfo.protocolName || 'Unnamed Protocol'}</p>
                    <p><strong>Sections Completed:</strong> {calculateCompletion()}%</p>
                    <p><strong>File Name:</strong> <code>security-scoping-{basicInfo.protocolName?.replace(/\s+/g, '-').toLowerCase() || 'protocol'}-{new Date().toISOString().split('T')[0]}.pdf</code></p>
                    <p><strong>Generated:</strong> {new Date().toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="completion-check">
                  {isAllCompleted() ? (
                    <div className="completion-success">
                      ✅ All sections completed! Ready to generate PDF.
                    </div>
                  ) : (
                    <div className="completion-warning">
                      ⚠️ Complete all sections before generating PDF ({calculateCompletion()}% complete)
                    </div>
                  )}
                </div>
                
                <button 
                  onClick={handleGeneratePDF}
                  disabled={isGeneratingPDF || !isAllCompleted()}
                  className={`export-button ${!isAllCompleted() ? 'disabled' : ''}`}
                >
                  {isGeneratingPDF ? (
                    <>
                      <span className="spinner small"></span>
                      Generating PDF...
                    </>
                  ) : (
                    'Generate & Download PDF Report'
                  )}
                </button>
                
                {pdfInstance.url && (
                  <button
                    onClick={handleDownloadPDF}
                    className="download-button"
                  >
                    Download PDF Again
                  </button>
                )}
                
                <div className="export-note">
                  <p>The PDF will include all completed sections with professional formatting suitable for audit teams.</p>
                  <p className="small">Note: You must complete all sections (100%) before generating the PDF.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="tab-navigation">
          <div className="nav-buttons">
            {activeTab !== 'basic' && (
              <button
                type="button"
                onClick={handlePreviousTab}
                className="nav-button prev"
              >
                ← Previous
              </button>
            )}
            
            {activeTab !== 'export' && (
              <button
                type="button"
                onClick={handleNextTab}
                disabled={!completionStatus[activeTab]}
                className={`nav-button next ${!completionStatus[activeTab] ? 'disabled' : ''}`}
              >
                {completionStatus[activeTab] ? 'Next →' : 'Complete Current Section First'}
              </button>
            )}
          </div>
          
          <div className="completion-summary">
            <span className="summary-label">Progress:</span>
            <span className={`summary-value ${calculateCompletion() === 100 ? 'complete' : ''}`}>
              {calculateCompletion()}% Complete
            </span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreateReport;