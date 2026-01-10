import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from "../../../layout/Layout";
import JSZip from 'jszip';
import "./FoundryTestGenerator.css"; // Add this line


interface Vulnerability {
  severity: 'high' | 'medium' | 'low';
  title: string;
  description?: string;
  location?: string;
  recommendation?: string;
  exploitScenario?: string;
}

interface AnalysisData {
  contractAddress: string;
  contractName: string;
  compilerVersion: string;
  timestamp: string;
  riskLevel: string;
}

interface ParsedAIData {
  vulnerabilities: Vulnerability[];
}

const FoundryTestGenerator: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState('');
  
  // Get data from navigation state
  const analysisData: AnalysisData = location.state?.analysisData;
  const parsedAIData: ParsedAIData = location.state?.parsedAIData;
  
  if (!analysisData || !parsedAIData) {
    return (
      <DashboardLayout>
        <div className="error-container">
          <h2>No Analysis Data Found</h2>
          <p>Please generate an AI analysis first, then come back to generate tests.</p>
          <button onClick={() => navigate('/aianalysis')} className="back-button primary">
            Start New Analysis
          </button>
          <button onClick={() => navigate('/dashboard')} className="back-button secondary">
            Back to Dashboard
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const handleGenerateFoundryTests = async () => {
    if (!parsedAIData?.vulnerabilities || !analysisData) {
      alert('No vulnerability data available to generate tests');
      return;
    }

    setIsGenerating(true);
    setStatus('Creating test files...');

    try {
      const zip = new JSZip();
      const contractNameSafe = analysisData.contractName?.replace(/[^a-zA-Z0-9]/g, '_') || 'Contract';
      
      // 1. Create the basic Foundry project structure
      zip.file("foundry.toml", `[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc_version = "${analysisData.compilerVersion || '0.8.19'}"
optimizer = true
optimizer_runs = 200

[fmt]
line_length = 80
tab_width = 2
bracket_spacing = true`);

      // 2. Create README with instructions
      zip.file("README.md", `# Foundry Tests for ${analysisData.contractName}

Generated from AI Audit Report

## How to Run Tests

1. Install Foundry: \`curl -L https://foundry.paradigm.xyz | bash\`
2. Run \`foundryup\`
3. Run tests: \`forge test --vv\`

## Test Coverage
${parsedAIData.vulnerabilities.length} vulnerabilities converted to test cases
Generated: ${new Date().toISOString()}
Contract: ${analysisData.contractAddress}
Risk Level: ${analysisData.riskLevel}
`);

      // 3. Create the main test contract
      let testContent = `// SPDX-License-Identifier: MIT
pragma solidity ${analysisData.compilerVersion || '^0.8.19'};

import "forge-std/Test.sol";
import "../src/${contractNameSafe}.sol";

contract ${contractNameSafe}AuditTest is Test {
    ${contractNameSafe} public auditContract;
    
    function setUp() public {
        // Deploy the contract to test
        auditContract = new ${contractNameSafe}();
    }
    
    // ============================================
    // GENERATED TESTS FOR DETECTED VULNERABILITIES
    // ============================================\n\n`;

      // 4. Generate test functions for each vulnerability
      parsedAIData.vulnerabilities.forEach((vuln, index) => {
        if (!vuln) return;
        
        const safeVuln = {
          title: vuln?.title || `Vulnerability ${index + 1}`,
          severity: vuln?.severity || 'unknown',
          location: vuln?.location || 'Not specified',
          description: vuln?.description || '',
          recommendation: vuln?.recommendation || ''
        };
        
        const testName = `test_Vulnerability_${index + 1}_${safeVuln.title.replace(/[^a-zA-Z0-9]/g, '_')}`;
        
        testContent += `    function ${testName}() public {
        // Vulnerability: ${safeVuln.title}
        // Severity: ${safeVuln.severity}
        // Location: ${safeVuln.location}
        
        // Test Description: ${safeVuln.description?.substring(0, 100) || ''}...
        
        // TODO: Implement specific test for this vulnerability
        // Recommendation: ${safeVuln.recommendation?.substring(0, 150) || ''}...     
        
        emit log_string("Testing: ${safeVuln.title}");
        
        // Placeholder assertion - replace with actual vulnerability test
        assertTrue(true, "Test for ${safeVuln.title} needs implementation");
        
        emit log_string("✓ Test placeholder for ${safeVuln.severity} severity vulnerability");
    }\n\n`;
        
        // Add specific test templates for common vulnerability types
        if (safeVuln.title.toLowerCase().includes('reentrancy')) {
          testContent += `    function ${testName}_ReentrancySpecific() public {
        // Reentrancy Guard Test
        // This test should verify reentrancy protection is in place
        
        // Example: Attempt reentrant call and expect revert
        // vm.expectRevert();
        // vulnerableFunction();
        
        emit log_string("Reentrancy test stub for: ${safeVuln.title}");
        assertTrue(true, "Implement reentrancy checks");
    }\n\n`;
        }
        
        // Add test for overflow vulnerabilities
        if (safeVuln.title.toLowerCase().includes('overflow') || safeVuln.title.toLowerCase().includes('underflow')) {
          testContent += `    function ${testName}_OverflowProtection() public {
        // Integer overflow/underflow test
        // Should verify SafeMath or built-in overflow checks
        
        // Example: Test max values
        // uint256 max = type(uint256).max;
        // vm.expectRevert();
        // auditContract.increment(max);
        
        emit log_string("Overflow protection test for: ${safeVuln.title}");
        assertTrue(true, "Implement overflow checks");
    }\n\n`;
        }
        
        // Add test for access control vulnerabilities
        if (safeVuln.title.toLowerCase().includes('access') || safeVuln.title.toLowerCase().includes('permission')) {
          testContent += `    function ${testName}_AccessControl() public {
        // Access control test
        // Should verify only authorized addresses can call restricted functions
        
        // Example: Test with non-owner address
        // address attacker = address(0x123);
        // vm.prank(attacker);
        // vm.expectRevert();
        // auditContract.restrictedFunction();
        
        emit log_string("Access control test for: ${safeVuln.title}");
        assertTrue(true, "Implement access control checks");
    }\n\n`;
        }
      });

      // 5. Add generic security tests
      testContent += `    // ============================================
    // GENERIC SECURITY TESTS
    // ============================================
    
    function test_ContractDeploys() public view {
        // Basic test: contract should deploy successfully
        assertTrue(address(auditContract).code.length > 0, "Contract should have code");
    }
    
    function test_InitialState() public view {
        // Test initial contract state
        // Add assertions based on expected initial state
    }
    
    function test_EventLogging() public {
        // Test that critical events are properly emitted
        // vm.expectEmit(true, true, true, true);
        // emit SomeEvent();
        // someFunction();
    }
    
    function test_ContractOwnership() public view {
        // Test contract ownership if applicable
        // assertEq(auditContract.owner(), expectedOwner);
    }
    
    function test_PausableFunctionality() public {
        // Test pausable functionality if contract is pausable
        // Only if contract has pause/unpause functionality
    }\n`;

      // Close the contract
      testContent += "}\n";

      // Add the test file to ZIP
      zip.file(`test/${contractNameSafe}AuditTest.t.sol`, testContent);

      // 6. Create a placeholder contract file
      zip.file(`src/${contractNameSafe}.sol`, `// SPDX-License-Identifier: MIT
pragma solidity ${analysisData.compilerVersion || '^0.8.19'};

// IMPORTANT: Replace this with your actual contract code
// This is a placeholder for the contract being audited

contract ${contractNameSafe} {
    // Your contract code goes here
    // The generated tests in /test/ will test this contract
    
    string public constant VERSION = "1.0.0";
    
    constructor() {
        // Initialize your contract
    }
    
    // Add your contract functions here
}`);

      // 7. Create a vulnerabilities summary JSON
      const vulnerabilitiesSummary = {
        contract: analysisData.contractName,
        address: analysisData.contractAddress,
        auditDate: analysisData.timestamp,
        riskLevel: analysisData.riskLevel,
        totalVulnerabilities: parsedAIData.vulnerabilities.length,
        bySeverity: {
          high: parsedAIData.vulnerabilities.filter(v => v?.severity === 'high').length,
          medium: parsedAIData.vulnerabilities.filter(v => v?.severity === 'medium').length,
          low: parsedAIData.vulnerabilities.filter(v => v?.severity === 'low').length
        },
        vulnerabilities: parsedAIData.vulnerabilities.map((v, index) => ({
          title: v?.title || `Vulnerability ${index + 1}`,
          severity: v?.severity || 'unknown',
          location: v?.location || 'Not specified',
          description: v?.description?.substring(0, 200) || '',
          recommendation: v?.recommendation?.substring(0, 200) || ''
        }))
      };
      
      zip.file("vulnerabilities-summary.json", JSON.stringify(vulnerabilitiesSummary, null, 2));

      // 8. Create a script to run tests
      zip.file("scripts/run-tests.sh", `#!/bin/bash
echo "Running Foundry tests for ${analysisData.contractName}"
echo "=========================================="

# Install Foundry if not present
if ! command -v forge &> /dev/null; then
    echo "Foundry not found. Installing..."
    curl -L https://foundry.paradigm.xyz | bash
    foundryup
fi

# Run tests
echo "Running tests..."
forge test --vv

echo "=========================================="
echo "Test execution complete!"
echo "Generated: $(date)"
echo "Contract: ${analysisData.contractAddress}"
`);

      // 9. Generate and trigger the ZIP download
      setStatus('Creating ZIP archive...');
      
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = `foundry-tests-${contractNameSafe}-${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatus('✅ Tests generated successfully!');
      
      // Show success message
      setTimeout(() => {
        setStatus('');
      }, 3000);

    } catch (error) {
      console.error('Failed to generate tests:', error);
      setStatus('❌ Error generating tests');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="test-generator-container">
        <div className="test-generator-header">
          <h1>⚙️ Generate Foundry Tests</h1>
          <p>Convert detected vulnerabilities into executable Solidity tests for the Foundry framework.</p>
          
          <div className="test-generator-info">
            <div className="info-card">
              <h3>Contract Information</h3>
              <p><strong>Name:</strong> {analysisData.contractName}</p>
              <p><strong>Address:</strong> {analysisData.contractAddress.substring(0, 10)}...{analysisData.contractAddress.substring(34)}</p>
              <p><strong>Compiler:</strong> {analysisData.compilerVersion}</p>
              <p><strong>Risk Level:</strong> {analysisData.riskLevel}</p>
            </div>
            
            <div className="info-card">
              <h3>Vulnerabilities Found</h3>
              <p><strong>Total:</strong> {parsedAIData.vulnerabilities.length}</p>
              <p><strong>High:</strong> {parsedAIData.vulnerabilities.filter(v => v?.severity === 'high').length}</p>
              <p><strong>Medium:</strong> {parsedAIData.vulnerabilities.filter(v => v?.severity === 'medium').length}</p>
              <p><strong>Low:</strong> {parsedAIData.vulnerabilities.filter(v => v?.severity === 'low').length}</p>
            </div>
          </div>
        </div>

        <div className="test-generator-content">
          <div className="test-features">
            <h3>📦 What You'll Get</h3>
            <ul>
              <li>Complete Foundry project structure</li>
              <li>Test file with placeholders for each vulnerability</li>
              <li><code>foundry.toml</code> configuration</li>
              <li>README with setup instructions</li>
              <li>Vulnerabilities summary JSON</li>
              <li>Placeholder contract file</li>
              <li>Test runner script</li>
            </ul>
          </div>

          <div className="test-steps">
            <h3>🚀 How It Works</h3>
            <ol>
              <li>Download the ZIP file below</li>
              <li>Replace placeholder contract with your actual contract</li>
              <li>Implement test logic for each vulnerability placeholder</li>
              <li>Run <code>forge test</code> to verify fixes</li>
            </ol>
          </div>

          <div className="vulnerabilities-preview">
            <h3>Vulnerabilities to be Tested ({parsedAIData.vulnerabilities.length})</h3>
            <div className="vuln-list">
              {parsedAIData.vulnerabilities.slice(0, 10).map((vuln, index) => (
                <div key={index} className="vuln-item">
                  <span className={`severity-dot ${vuln?.severity || 'unknown'}`}></span>
                  <span className="vuln-title">{vuln?.title || `Vulnerability ${index + 1}`}</span>
                </div>
              ))}
              {parsedAIData.vulnerabilities.length > 10 && (
                <div className="vuln-more">
                  + {parsedAIData.vulnerabilities.length - 10} more vulnerabilities
                </div>
              )}
            </div>
          </div>

          <div className="generation-section">
            <button 
              onClick={handleGenerateFoundryTests}
              disabled={isGenerating}
              className="generate-button"
            >
              {isGenerating ? (
                <>
                  <span className="spinner small"></span>
                  Generating Test Package...
                </>
              ) : (
                '📥 Download Foundry Test Suite (.zip)'
              )}
            </button>
            
            {status && (
              <div className={`generation-status ${status.includes('✅') ? 'success' : 
                status.includes('❌') ? 'error' : 'info'}`}>
                {status}
              </div>
            )}
          </div>

          <div className="test-notes">
            <h4>Important Notes</h4>
            <ul>
              <li>The generated tests are <strong>templates</strong> that need to be implemented</li>
              <li>Replace the placeholder contract in <code>/src/</code> with your actual contract</li>
              <li>Implement the specific test logic for each vulnerability placeholder</li>
              <li>Run <code>forge test</code> to verify your fixes work correctly</li>
              <li>These tests are generated based on AI analysis and may need manual review</li>
            </ul>
          </div>
        </div>

        <div className="test-generator-footer">
          <button onClick={() => navigate(-1)} className="back-button">
            ← Back to Analysis
          </button>
          <button onClick={() => navigate('/aianalysis')} className="new-analysis-button">
            Start New Analysis
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FoundryTestGenerator;