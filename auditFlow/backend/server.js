// backend/server.js - Smart Contract Auditor with Usage Tracking
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args)); // Use dynamic import for fetch

const app = express();
const PORT = process.env.PORT || 3001;

// ========== DATABASE SETUP FOR USER USAGE ==========
const db = new Database('usage.db');

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    address TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TABLE IF NOT EXISTS feature_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    feature_type TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );
  
  CREATE TABLE IF NOT EXISTS analyses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    analysis_id TEXT UNIQUE NOT NULL,
    user_address TEXT,
    contract_address TEXT NOT NULL,
    contract_name TEXT,
    risk_level TEXT,
    risk_score INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE INDEX IF NOT EXISTS idx_user_feature ON feature_usage(user_id, feature_type);
  CREATE INDEX IF NOT EXISTS idx_recorded_at ON feature_usage(recorded_at);
  CREATE INDEX IF NOT EXISTS idx_analyses_user ON analyses(user_address);
`);

// Prepare reusable SQL statements
const insertUserStmt = db.prepare('INSERT OR IGNORE INTO users (address) VALUES (?)');
const findUserIdStmt = db.prepare('SELECT id FROM users WHERE address = ?');
const insertUsageStmt = db.prepare('INSERT INTO feature_usage (user_id, feature_type, quantity) VALUES (?, ?, ?)');
const insertAnalysisStmt = db.prepare(`
  INSERT INTO analyses (analysis_id, user_address, contract_address, contract_name, risk_level, risk_score)
  VALUES (?, ?, ?, ?, ?, ?)
`);
const getUserUsageStmt = db.prepare(`
  SELECT 
    feature_type,
    SUM(quantity) as total_usage,
    COUNT(*) as transaction_count,
    MAX(recorded_at) as last_used
  FROM feature_usage 
  WHERE user_id = ?
  GROUP BY feature_type
`);

// ========== MIDDLEWARE ==========
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'https://audit-flow-three.vercel.app'],
  credentials: true
}));
app.use(express.json());

// ========== IN-MEMORY STORAGE FOR ANALYSES ==========
const analysisStorage = new Map();

// ========== HELPER FUNCTION TO CALL OPENROUTER ==========
async function callOpenRouter(messages, options = {}) {
  const {
    model = 'nousresearch/hermes-3-llama-3.1-405b:free',
    max_tokens = 4000,
    temperature = 0.1,
    stream = false
  } = options;

  const apiKey = process.env.OPENROUTER_API_KEY || "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";

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://audit-flow-three.vercel.app',
      'X-Title': 'Smart Contract Auditor',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens,
      temperature,
      stream
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`OpenRouter API Error (${response.status}): ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// ========== USAGE TRACKING ENDPOINTS ==========

// Record feature usage
app.post('/api/user/features/usage', async (req, res) => {
  try {
    console.log('📊 Recording feature usage...');
    const { userAddress, featureType, quantity = 1 } = req.body;

    if (!userAddress || !featureType) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['userAddress', 'featureType']
      });
    }

    // Start transaction
    const transaction = db.transaction(() => {
      insertUserStmt.run(userAddress);
      const user = findUserIdStmt.get(userAddress);
      insertUsageStmt.run(user.id, featureType, quantity);
    });

    transaction();

    console.log(`✅ Recorded usage: ${userAddress} used ${featureType} x${quantity}`);

    res.json({
      success: true,
      message: 'Usage recorded successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error recording usage:', error);
    res.status(500).json({
      error: 'Failed to record usage',
      details: error.message
    });
  }
});

// Get user usage statistics
app.get('/api/user/:address/usage', async (req, res) => {
  try {
    const { address } = req.params;
    const { period = '30d' } = req.query;

    console.log(`📈 Fetching usage for: ${address}, period: ${period}`);

    const user = findUserIdStmt.get(address);
    
    if (!user) {
      return res.json({
        address,
        totalAnalyses: 0,
        features: {},
        period
      });
    }

    let usageQuery = getUserUsageStmt;
    
    if (period !== 'all') {
      const days = parseInt(period);
      usageQuery = db.prepare(`
        SELECT 
          feature_type,
          SUM(quantity) as total_usage,
          COUNT(*) as transaction_count,
          MAX(recorded_at) as last_used
        FROM feature_usage 
        WHERE user_id = ? 
        AND recorded_at > datetime('now', '-${days} days')
        GROUP BY feature_type
      `);
    }

    const usageData = usageQuery.all(user.id);
    
    const totalAnalyses = usageData
      .filter(item => item.feature_type === 'ANALYSIS')
      .reduce((sum, item) => sum + item.total_usage, 0);

    const features = {};
    usageData.forEach(item => {
      features[item.feature_type] = {
        totalUsage: item.total_usage,
        transactions: item.transaction_count,
        lastUsed: item.last_used
      };
    });

    res.json({
      address,
      totalAnalyses,
      features,
      period,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching usage:', error);
    res.status(500).json({
      error: 'Failed to fetch usage data',
      details: error.message
    });
  }
});

// Get user's analysis history
app.get('/api/user/:address/analyses', async (req, res) => {
  try {
    const { address } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    const analyses = db.prepare(`
      SELECT 
        analysis_id, contract_address, contract_name, risk_level, risk_score, created_at
      FROM analyses 
      WHERE user_address = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(address, parseInt(limit), parseInt(offset));

    const total = db.prepare(`
      SELECT COUNT(*) as count FROM analyses WHERE user_address = ?
    `).get(address);

    res.json({
      success: true,
      analyses,
      total: total.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    console.error('❌ Error fetching user analyses:', error);
    res.status(500).json({ error: 'Failed to fetch analyses' });
  }
});

// ========== MAIN AI ANALYSIS ENDPOINT ==========
app.post('/api/analyze', async (req, res) => {
  console.log('📦 Received analysis request...');
  
  try {
    const { contractAddress, analysisType, userAddress, userTier, network = 'lisk' } = req.body;

    // 1. VALIDATE INPUT
    if (!contractAddress) {
      return res.status(400).json({ error: 'Contract address is required' });
    }

    if (!contractAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({ error: 'Invalid contract address format.' });
    }

    // 2. FETCH CONTRACT DATA FROM BLOCKSCOUT
    console.log(`🔍 Fetching contract from Blockscout: ${contractAddress}`);
    const blockscoutUrl = `https://blockscout.lisk.com/api/v2/smart-contracts/${contractAddress}`;
    const blockscoutResponse = await fetch(blockscoutUrl);
    
    if (!blockscoutResponse.ok) {
      if (blockscoutResponse.status === 404) {
        throw new Error('Contract not found on Blockscout.');
      }
      throw new Error(`Blockscout API failed: ${blockscoutResponse.statusText}`);
    }
    
    const contractData = await blockscoutResponse.json();
    
    if (!contractData.source_code) {
      throw new Error('Contract source code not found or not verified.');
    }
    
    console.log('✅ Contract data fetched successfully');

    // 3. PREPARE SMART CONTRACT ANALYSIS PROMPT
    const truncatedSourceCode = contractData.source_code.substring(0, 2000);
    
    const analysisPrompt = `
You are a senior smart contract security auditor. Analyze this Solidity contract and provide a comprehensive audit report in the following EXACT JSON format:

{
  "executiveSummary": "Brief 3-4 sentence summary",
  "riskLevel": "high|medium|low",
  "riskScore": 0-100,
  "vulnerabilities": [
    {
      "severity": "high|medium|low",
      "title": "Vulnerability name",
      "description": "Detailed description",
      "location": "File:Line or Function name",
      "recommendation": "How to fix it",
      "exploitScenario": "How it could be exploited"
    }
  ],
  "gasOptimizations": [
    "Specific optimization 1",
    "Specific optimization 2"
  ],
  "bestPractices": [
    {
      "check": "Naming conventions",
      "compliant": true/false,
      "details": "Explanation"
    },
    {
      "check": "Error handling",
      "compliant": true/false,
      "details": "Explanation"
    },
    {
      "check": "Access control",
      "compliant": true/false,
      "details": "Explanation"
    },
    {
      "check": "Reentrancy protection",
      "compliant": true/false,
      "details": "Explanation"
    }
  ],
  "recommendations": [
    "Priority recommendation 1",
    "Priority recommendation 2"
  ],
  "detailedAnalysis": "Full 3-5 paragraph analysis here"
}

CONTRACT INFORMATION:
- Address: ${contractAddress}
- Name: ${contractData.name || 'Unknown'}
- Compiler: ${contractData.compiler_version || 'Unknown'}
- Network: ${network.toUpperCase()}

CONTRACT SOURCE CODE (truncated):
\`\`\`solidity
${truncatedSourceCode}
\`\`\`

ANALYSIS INSTRUCTIONS:
1. Look for: reentrancy, overflow/underflow, access control, logic errors
2. Check gas optimizations: storage vs memory, loop optimizations
3. Verify compliance with best practices
4. Provide actionable recommendations
5. Assign risk score based on vulnerabilities found

RETURN ONLY VALID JSON. No additional text before or after.`;

    // 4. CALL OPENROUTER
    console.log('🤖 Calling OpenRouter AI...');
    
    let aiResponse = '';
    let structuredData = null;
    
    try {
      aiResponse = await callOpenRouter([
        { 
          role: 'system', 
          content: 'You are a smart contract auditor. Return ONLY valid JSON as specified.' 
        },
        { 
          role: 'user', 
          content: analysisPrompt 
        }
      ], {
        model: 'nousresearch/hermes-3-llama-3.1-405b:free',
        max_tokens: 5000,
        temperature: 0.1
      });
      
      console.log('✅ AI analysis complete');
      
      try {
        structuredData = JSON.parse(aiResponse);
      } catch (parseError) {
        console.log('   Failed to parse JSON from AI response, using fallback...');
        structuredData = extractStructureFromText(aiResponse || '');
      }
      
    } catch (error) {
      console.error('❌ OpenRouter call failed:', error);
      throw error;
    }

    // 5. ENRICH STRUCTURED DATA WITH CONTRACT INFO
    const riskScore = structuredData.riskScore || calculateAuditScoreFromVulns(structuredData.vulnerabilities);
    
    const enrichedData = {
      ...structuredData,
      contractAddress,
      contractName: contractData.name || 'Unnamed Contract',
      analysisDate: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString(),
      compilerVersion: contractData.compiler_version,
      network: network,
      analysisType: analysisType || 'full',
      isVerified: contractData.is_verified,
      vulnerabilityCounts: {
        high: structuredData.vulnerabilities?.filter(v => v.severity === 'high').length || 0,
        medium: structuredData.vulnerabilities?.filter(v => v.severity === 'medium').length || 0,
        low: structuredData.vulnerabilities?.filter(v => v.severity === 'low').length || 0,
        total: structuredData.vulnerabilities?.length || 0
      },
      auditScore: riskScore
    };

    // 6. CREATE RESPONSE DATA
    const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const responseData = {
      success: true,
      analysisId,
      contractAddress,
      contractName: contractData.name || 'Unnamed Contract',
      isVerified: contractData.is_verified,
      compilerVersion: contractData.compiler_version,
      abi: contractData.abi || [],
      aiAnalysis: aiResponse,
      structuredReport: enrichedData,
      analysisDate: enrichedData.analysisDate,
      aiSummary: enrichedData.executiveSummary || enrichedData.detailedAnalysis || '',
      vulnerabilities: enrichedData.vulnerabilities || [],
      gasOptimizations: enrichedData.gasOptimizations || [],
      bestPractices: enrichedData.bestPractices || [],
      riskScore: enrichedData.auditScore,
      recommendations: enrichedData.recommendations || [],
      timestamp: enrichedData.timestamp,
      analysisType: analysisType || 'full',
      network: network,
      sourceCodeLength: contractData.source_code?.length || 0,
      sourceCodePreview: truncatedSourceCode.substring(0, 500) + '...',
      productionRecommendation: getProductionRecommendation(enrichedData.riskLevel)
    };

    // 7. STORE IN MEMORY AND DATABASE
    analysisStorage.set(analysisId, responseData);

    // AUTO-RECORD USAGE FOR ANALYSIS FEATURE
    if (userAddress) {
      try {
        const transaction = db.transaction(() => {
          insertUserStmt.run(userAddress);
          const user = findUserIdStmt.get(userAddress);
          insertUsageStmt.run(user.id, 'ANALYSIS', 1);
          
          // Also store in analyses table for user history
          insertAnalysisStmt.run(
            analysisId,
            userAddress,
            contractAddress,
            contractData.name || 'Unnamed Contract',
            enrichedData.riskLevel,
            riskScore
          );
        });
        
        transaction();
        console.log(`📊 Auto-recorded analysis usage for: ${userAddress}`);
      } catch (error) {
        console.error('Auto-usage recording failed:', error);
      }
    }

    // 8. SEND RESPONSE
    res.json(responseData);

  } catch (error) {
    console.error('❌ Analysis error:', error);
    
    if (error.message.includes('API key') || error.message.includes('401')) {
      res.status(401).json({ 
        error: 'Authentication Failed',
        message: 'Please check your OpenRouter API key',
        help: '1. Get a free API key from https://openrouter.ai/keys'
      });
    } else if (error.message.includes('rate limit')) {
      res.status(429).json({ 
        error: 'Rate Limit Exceeded',
        message: 'Please try again in a few minutes',
      });
    } else {
      res.status(500).json({ 
        error: 'Analysis Failed', 
        details: error.message,
        suggestion: 'Try using a smaller contract or check your API key'
      });
    }
  }
});

// ========== HELPER FUNCTIONS ==========
function extractStructureFromText(text) {
  try {
    // Try to find JSON in the text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // Fallback structure
    return {
      executiveSummary: text.substring(0, 200) + '...',
      riskLevel: 'medium',
      riskScore: 50,
      vulnerabilities: [],
      gasOptimizations: [],
      bestPractices: [],
      recommendations: ['Further manual review recommended'],
      detailedAnalysis: text
    };
  } catch (error) {
    return {
      executiveSummary: 'Analysis completed but formatting failed',
      riskLevel: 'unknown',
      riskScore: 50,
      vulnerabilities: [],
      gasOptimizations: [],
      bestPractices: [],
      recommendations: ['Parse error occurred'],
      detailedAnalysis: text
    };
  }
}

function calculateAuditScoreFromVulns(vulnerabilities = []) {
  const high = vulnerabilities.filter(v => v.severity === 'high').length;
  const medium = vulnerabilities.filter(v => v.severity === 'medium').length;
  const low = vulnerabilities.filter(v => v.severity === 'low').length;
  
  const score = 100 - (high * 25 + medium * 15 + low * 5);
  return Math.max(0, Math.min(100, Math.round(score)));
}

function getProductionRecommendation(riskLevel) {
  switch (riskLevel?.toLowerCase()) {
    case 'high':
      return 'Do not deploy until critical issues are fixed';
    case 'medium':
      return 'Deploy with caution after addressing medium issues';
    case 'low':
      return 'Safe to deploy with minor improvements';
    default:
      return 'Manual review required';
  }
}

// ========== QUICK ANALYSIS ENDPOINT ==========
app.post('/api/analyze/quick', async (req, res) => {
  try {
    const { contractAddress, userAddress } = req.body;
    
    if (!contractAddress) {
      return res.status(400).json({ error: 'Contract address is required' });
    }
    
    console.log(`🚀 Quick analysis for: ${contractAddress}`);
    
    const blockscoutUrl = `https://blockscout.lisk.com/api/v2/smart-contracts/${contractAddress}`;
    const blockscoutResponse = await fetch(blockscoutUrl);
    
    if (!blockscoutResponse.ok) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    
    const contractData = await blockscoutResponse.json();
    
    if (!contractData.source_code) {
      return res.status(400).json({ error: 'Source code not available' });
    }
    
    const quickAnalysis = await callOpenRouter([
      { 
        role: 'system', 
        content: 'Give 3 bullet points about security issues in this smart contract code.' 
      },
      { 
        role: 'user', 
        content: `Code: ${contractData.source_code.substring(0, 1000)}` 
      }
    ], {
      model: 'nousresearch/hermes-3-llama-3.1-405b:free',
      max_tokens: 300,
      temperature: 0.1
    });
    
    // Record quick analysis usage
    if (userAddress) {
      try {
        const transaction = db.transaction(() => {
          insertUserStmt.run(userAddress);
          const user = findUserIdStmt.get(userAddress);
          insertUsageStmt.run(user.id, 'QUICK_ANALYSIS', 1);
        });
        transaction();
      } catch (error) {
        console.error('Quick analysis usage recording failed:', error);
      }
    }
    
    res.json({
      success: true,
      quickAnalysis: quickAnalysis,
      isVerified: contractData.is_verified,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Quick analysis error:', error);
    res.status(500).json({ error: 'Quick analysis failed', details: error.message });
  }
});

// ========== OTHER ENDPOINTS ==========
app.get('/api/analysis/:analysisId', async (req, res) => {
  try {
    const { analysisId } = req.params;
    const analysis = analysisStorage.get(analysisId);
    
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }
    
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analysis' });
  }
});

app.get('/api/analyses', async (req, res) => {
  try {
    const analyses = Array.from(analysisStorage.entries()).map(([id, data]) => ({
      id,
      contractAddress: data.contractAddress,
      contractName: data.contractName,
      timestamp: data.timestamp,
      riskLevel: data.structuredReport.riskLevel,
    }));
    
    res.json({ total: analyses.length, analyses });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list analyses' });
  }
});

// Get platform statistics (admin endpoint)
app.get('/api/admin/stats', async (req, res) => {
  try {
    const { adminKey } = req.query;
    if (adminKey !== process.env.ADMIN_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
    const totalAnalyses = db.prepare('SELECT COUNT(*) as count FROM analyses').get();
    const totalUsage = db.prepare('SELECT SUM(quantity) as total FROM feature_usage').get();
    
    const dailyUsage = db.prepare(`
      SELECT 
        DATE(recorded_at) as date,
        feature_type,
        COUNT(*) as transactions,
        SUM(quantity) as usage_count
      FROM feature_usage
      WHERE recorded_at > datetime('now', '-7 days')
      GROUP BY DATE(recorded_at), feature_type
      ORDER BY date DESC
    `).all();

    res.json({
      totals: {
        users: totalUsers.count,
        analyses: totalAnalyses.count,
        usage: totalUsage.total || 0
      },
      dailyUsage,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Admin stats error:', error);
    res.status(500).json({ error: 'Failed to generate stats' });
  }
});

app.get('/api/health', async (req, res) => {
  const dbStatus = db.open ? 'connected' : 'disconnected';
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    analysesStored: analysisStorage.size,
    openrouterConfigured: !!process.env.OPENROUTER_API_KEY,
    database: dbStatus,
    endpoints: {
      analyze: 'POST /api/analyze',
      quickAnalyze: 'POST /api/analyze/quick',
      getAnalysis: 'GET /api/analysis/:id',
      recordUsage: 'POST /api/user/features/usage',
      getUserUsage: 'GET /api/user/:address/usage',
      getUserAnalyses: 'GET /api/user/:address/analyses',
      health: 'GET /api/health'
    }
  });
});

// ========== START SERVER ==========
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`🔐 OpenRouter API key: ${process.env.OPENROUTER_API_KEY ? 'Set' : 'Using hardcoded key'}`);
  console.log(`💾 Database: usage.db (SQLite)`);
  console.log(`📊 Available endpoints:`);
  console.log(`   POST /api/analyze                - Full contract analysis`);
  console.log(`   POST /api/analyze/quick          - Quick security check`);
  console.log(`   POST /api/user/features/usage    - Record feature usage`);
  console.log(`   GET  /api/user/:address/usage    - Get user usage stats`);
  console.log(`   GET  /api/user/:address/analyses - Get user analysis history`);
  console.log(`   GET  /api/analysis/:id           - Retrieve analysis by ID`);
  console.log(`   GET  /api/analyses               - List all analyses`);
  console.log(`   GET  /api/health                 - Health check`);
  console.log(`   GET  /api/admin/stats?adminKey=  - Platform statistics (admin)`);
});