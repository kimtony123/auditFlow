// backend/server.js - Smart Contract Auditor with Usage Tracking
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 3001;

// ========== DATABASE SETUP WITH CONCURRENCY FIX ==========
const db = new Database('usage.db', {
  timeout: 5000,
});

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');

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
    analysis_type TEXT DEFAULT 'full',
    response_data TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE INDEX IF NOT EXISTS idx_user_feature ON feature_usage(user_id, feature_type);
  CREATE INDEX IF NOT EXISTS idx_recorded_at ON feature_usage(recorded_at);
  CREATE INDEX IF NOT EXISTS idx_analyses_user ON analyses(user_address);
  CREATE INDEX IF NOT EXISTS idx_analyses_contract ON analyses(contract_address);
`);

// ========== DATABASE HELPER FUNCTIONS ==========
function executeWithRetry(operation, maxRetries = 3, delay = 100) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    function tryExecute() {
      attempts++;
      try {
        const result = operation();
        resolve(result);
      } catch (error) {
        if (error.code === 'SQLITE_BUSY' && attempts < maxRetries) {
          console.log(`Database busy, retry ${attempts}/${maxRetries}...`);
          setTimeout(tryExecute, delay * attempts);
        } else {
          reject(error);
        }
      }
    }
    
    tryExecute();
  });
}

// Prepare reusable SQL statements
const insertUserStmt = db.prepare('INSERT OR IGNORE INTO users (address) VALUES (?)');
const findUserIdStmt = db.prepare('SELECT id FROM users WHERE address = ?');
const insertUsageStmt = db.prepare('INSERT INTO feature_usage (user_id, feature_type, quantity) VALUES (?, ?, ?)');
const insertAnalysisStmt = db.prepare(`
  INSERT INTO analyses (analysis_id, user_address, contract_address, contract_name, risk_level, risk_score, analysis_type, response_data)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

// ========== MIDDLEWARE ==========
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'https://audit-flow-three.vercel.app'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ========== IN-MEMORY STORAGE ==========
const analysisStorage = new Map();

// ========== HELPER FUNCTIONS ==========
function extractStructureFromText(text) {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return {
      executiveSummary: text.substring(0, 200) + '...',
      riskLevel: 'unknown',
      riskScore: 0,
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
      riskScore: 0,
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

// ========== IMPROVED OPENROUTER HELPER ==========
async function callOpenRouter(messages, options = {}) {
  const {
    model = 'xiaomi/mimo-v2-flash:free',
    max_tokens = 2000,
    temperature = 0.1,
    stream = false
  } = options;

  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenRouter API key is not configured. Please set OPENROUTER_API_KEY in environment variables.');
  }

  console.log(`📡 Sending request to OpenRouter with model: ${model}, max_tokens: ${max_tokens}`);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
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
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: { message: `HTTP ${response.status}: ${response.statusText}` } };
      }
      
      if (response.status === 401) {
        throw new Error(`OpenRouter Authentication Error (401): ${errorData.error?.message || 'Invalid API key'}`);
      } else if (response.status === 429) {
        throw new Error('OpenRouter Rate Limit Error (429): Too many requests. Please try again later.');
      } else if (response.status === 400) {
        throw new Error(`OpenRouter Bad Request (400): ${errorData.error?.message || 'Invalid request parameters'}`);
      } else {
        throw new Error(`OpenRouter API Error (${response.status}): ${errorData.error?.message || response.statusText}`);
      }
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from OpenRouter');
    }

    return data.choices[0].message.content;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('OpenRouter request timed out after 60 seconds');
    }
    throw error;
  }
}

// ========== MAIN AI ANALYSIS ENDPOINT WITH FIXES ==========
app.post('/api/analyze', async (req, res) => {
  console.log('📦 Received analysis request...');
  console.log('Request body:', { 
    contractAddress: req.body.contractAddress,
    userAddress: req.body.userAddress,
    network: req.body.network,
    analysisType: req.body.analysisType
  });
  
  try {
    const { contractAddress, userAddress, analysisType = 'full', network = 'lisk-sepolia' } = req.body;

    // 1. VALIDATE INPUT
    if (!contractAddress) {
      return res.status(400).json({ error: 'Contract address is required' });
    }

    if (!contractAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({ error: 'Invalid contract address format.' });
    }

    // Log user address info
    if (userAddress) {
      console.log(`👤 Analysis requested by user: ${userAddress}`);
    } else {
      console.log('👤 Anonymous analysis request');
    }


     // 2. CHECK USER ACCESS & USAGE LIMITS
    if (userAddress) {
      console.log(`👤 Checking access for user: ${userAddress}`);
      
      // Check if user exists and get their usage
      const user = findUserIdStmt.get(userAddress);
      
      if (user) {
        // Get user's analysis count for current month
        const monthlyUsage = db.prepare(`
          SELECT SUM(quantity) as total 
          FROM feature_usage 
          WHERE user_id = ? 
          AND feature_type = 'ANALYSIS'
          AND recorded_at > datetime('now', '-30 days')
        `).get(user.id);
        
        const totalAnalyses = monthlyUsage?.total || 0;
        const userLimit = 10; // Premium tier limit
        
        if (totalAnalyses >= userLimit) {
          return res.status(429).json({
            error: 'Monthly limit exceeded',
            message: `You have used ${totalAnalyses}/${userLimit} AI analyses this month.`,
            remaining: 0,
            limit: userLimit,
            resetIn: 'Next month'
          });
        }
        
        console.log(`📊 User ${userAddress} has used ${totalAnalyses}/${userLimit} analyses this month`);
      }
    } else {
      console.log('⚠️ Anonymous request - no user tracking');
    }

    // 2. DETERMINE BLOCKSCOUT URL
    let blockscoutBaseUrl;
    switch (network.toLowerCase()) {
      case 'lisk':
        blockscoutBaseUrl = 'https://blockscout.lisk.com';
        break;
      case 'lisk-sepolia':
      case 'sepolia':
        blockscoutBaseUrl = 'https://sepolia-blockscout.lisk.com';
        break;
      default:
        blockscoutBaseUrl = 'https://blockscout.lisk.com';
    }

    const blockscoutUrl = `${blockscoutBaseUrl}/api/v2/smart-contracts/${contractAddress}`;
    console.log(`🔍 Fetching contract from: ${blockscoutUrl}`);
    
    // 3. FETCH CONTRACT DATA
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    try {
      const blockscoutResponse = await fetch(blockscoutUrl, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
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
      
      // 4. PREPARE AI ANALYSIS
      const truncatedSourceCode = contractData.source_code.substring(0, 3500);
      
      const analysisPrompt = `You are a senior smart contract security auditor. Analyze this Solidity contract and provide a JSON audit report.

CONTRACT: ${contractAddress}
NAME: ${contractData.name || 'Unknown'}
COMPILER: ${contractData.compiler_version || 'Unknown'}

SOURCE CODE:
\`\`\`solidity
${truncatedSourceCode}
\`\`\`

Provide analysis in this JSON format only:
{
  "executiveSummary": "Brief summary",
  "riskLevel": "high|medium|low",
  "riskScore": 0-100,
  "vulnerabilities": [{"severity": "high|medium|low", "title": "...", "description": "..."}],
  "gasOptimizations": ["..."],
  "bestPractices": [{"check": "...", "compliant": true/false, "details": "..."}],
  "recommendations": ["..."],
  "detailedAnalysis": "..."
}

Focus on: reentrancy, overflow/underflow, access control issues.
Return ONLY JSON, no other text.`;

      // 5. CALL OPENROUTER
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
          model: 'xiaomi/mimo-v2-flash:free',
          max_tokens: 1500,
          temperature: 0.1
        });
        
        console.log('✅ AI analysis complete, length:', aiResponse.length);
        
        // 6. PARSE RESPONSE WITH DEFAULT VALUES
        try {
          const cleanedResponse = aiResponse
            .replace(/```json\s*/g, '')
            .replace(/```\s*/g, '')
            .trim();
          
          structuredData = JSON.parse(cleanedResponse);
        } catch (parseError) {
          console.log('⚠️ JSON parse failed, extracting JSON from text...');
          structuredData = extractStructureFromText(aiResponse);
        }
        
      } catch (error) {
        console.error('❌ OpenRouter call failed:', error.message);
        
        // IMPORTANT: Don't charge users for failed analyses
        console.log('💸 NOT recording usage - AI analysis failed');
        
        // Try fallback model if first fails
        try {
          console.log('🔄 Trying fallback model...');
          aiResponse = await callOpenRouter([
            { 
              role: 'system', 
              content: 'Return JSON audit summary only.' 
            },
            { 
              role: 'user', 
              content: `Brief security audit for contract ${contractAddress}. Return JSON.` 
            }
          ], {
            model: 'arcee-ai/trinity-mini:free',
            max_tokens: 2000,
            temperature: 0.1
          });
          
          structuredData = extractStructureFromText(aiResponse);
        } catch (fallbackError) {
          throw new Error(`AI analysis failed: ${error.message}`);
        }
      }

      // 7. SET DEFAULT VALUES FOR RISK SCORE AND LEVEL
      // If AI returns nil/undefined, set defaults to 0/unknown
      const riskScore = structuredData.riskScore || calculateAuditScoreFromVulns(structuredData.vulnerabilities) || 0;
      const riskLevel = structuredData.riskLevel || 'unknown';
      
      // Only proceed if we have valid AI response
      if (!aiResponse || aiResponse.trim().length === 0) {
        throw new Error('AI returned empty response');
      }

      const enrichedData = {
        ...structuredData,
        contractAddress,
        contractName: contractData.name || 'Unnamed Contract',
        analysisDate: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString(),
        compilerVersion: contractData.compiler_version,
        network: network,
        analysisType: analysisType,
        isVerified: contractData.is_verified,
        vulnerabilityCounts: {
          high: structuredData.vulnerabilities?.filter(v => v.severity === 'high').length || 0,
          medium: structuredData.vulnerabilities?.filter(v => v.severity === 'medium').length || 0,
          low: structuredData.vulnerabilities?.filter(v => v.severity === 'low').length || 0,
          total: structuredData.vulnerabilities?.length || 0
        },
        auditScore: riskScore,
        riskLevel: riskLevel // Make sure riskLevel is set
      };

      // 8. CREATE RESPONSE DATA
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
        riskScore: riskScore,
        riskLevel: riskLevel, // Include riskLevel in response
        recommendations: enrichedData.recommendations || [],
        timestamp: enrichedData.timestamp,
        analysisType: analysisType,
        network: network,
        sourceCodeLength: contractData.source_code?.length || 0,
        sourceCodePreview: truncatedSourceCode.substring(0, 500) + '...',
        productionRecommendation: getProductionRecommendation(riskLevel)
      };

      // 9. STORE IN MEMORY
      analysisStorage.set(analysisId, responseData);

      // 10. STORE IN DATABASE (WITH RETRY LOGIC)
      // Only store if we have a valid user AND successful analysis
      if (userAddress && aiResponse && riskScore > 0) {
        try {
          await executeWithRetry(() => {
            const transaction = db.transaction(() => {
              // Record user usage
              insertUserStmt.run(userAddress);
              const user = findUserIdStmt.get(userAddress);
              insertUsageStmt.run(user.id, 'ANALYSIS', 1);
              
              // Store analysis with responseData
              insertAnalysisStmt.run(
                analysisId,
                userAddress,
                contractAddress,
                contractData.name || 'Unnamed Contract',
                riskLevel,
                riskScore,
                analysisType,
                JSON.stringify(responseData)
              );
            });
            
            transaction();
            console.log(`📊 Successfully recorded usage and stored analysis for: ${userAddress}`);
          });
        } catch (dbError) {
          console.error('❌ Database recording failed:', dbError.message);
          // Don't fail the request if database fails, just log it
          // User still gets their analysis result
        }
      } else if (!userAddress) {
        // Anonymous analysis - still store but without user info
        try {
          await executeWithRetry(() => {
            insertAnalysisStmt.run(
              analysisId,
              null,
              contractAddress,
              contractData.name || 'Unnamed Contract',
              riskLevel,
              riskScore,
              analysisType,
              JSON.stringify(responseData)
            );
          });
          console.log('📝 Stored anonymous analysis');
        } catch (dbError) {
          console.error('❌ Anonymous analysis storage failed:', dbError.message);
        }
      } else if (!aiResponse || riskScore === 0) {
        console.log('⚠️ NOT storing analysis - AI response was empty or invalid');
      }

      // 11. SEND RESPONSE
      res.json(responseData);

    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }

  } catch (error) {
    console.error('❌ Analysis error:', error.message);
    
    // IMPORTANT: Don't record usage for failed analyses
    console.log('🚫 Analysis failed - NO usage recorded');
    
    if (error.message.includes('Authentication') || error.message.includes('401')) {
      res.status(401).json({ 
        error: 'Authentication Failed',
        message: 'Invalid or missing OpenRouter API key',
        help: 'Check your OPENROUTER_API_KEY environment variable'
      });
    } else if (error.message.includes('Rate Limit') || error.message.includes('429')) {
      res.status(429).json({ 
        error: 'Rate Limit Exceeded',
        message: 'Please wait a minute before trying again',
      });
    } else if (error.message.includes('timed out')) {
      res.status(504).json({ 
        error: 'Request Timeout',
        message: 'The AI analysis took too long to respond',
        suggestion: 'Try a smaller contract or try again later'
      });
    } else if (error.message.includes('Contract not found')) {
      res.status(404).json({ 
        error: 'Contract Not Found', 
        details: error.message,
        suggestion: 'Check the contract address and network'
      });
    } else {
      res.status(500).json({ 
        error: 'Analysis Failed', 
        details: error.message,
        suggestion: 'Try a different contract or check your API key'
      });
    }
  }
});

// ========== USAGE TRACKING ENDPOINTS WITH FIXES ==========
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

    // Use retry logic for database operations
    await executeWithRetry(() => {
      const transaction = db.transaction(() => {
        insertUserStmt.run(userAddress);
        const user = findUserIdStmt.get(userAddress);
        insertUsageStmt.run(user.id, featureType, quantity);
      });
      transaction();
    });

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
      details: error.message,
      suggestion: 'Database might be busy, please try again'
    });
  }
});

// ========== QUICK ANALYSIS ENDPOINT WITH FIXES ==========
app.post('/api/analyze/quick', async (req, res) => {
  try {
    const { contractAddress, userAddress, network = 'lisk-sepolia' } = req.body;
    
    if (!contractAddress) {
      return res.status(400).json({ error: 'Contract address is required' });
    }
    
    console.log(`🚀 Quick analysis for: ${contractAddress}`);


     // 2. CHECK USER ACCESS & USAGE LIMITS
    if (userAddress) {
      console.log(`👤 Checking access for user: ${userAddress}`);
      
      // Check if user exists and get their usage
      const user = findUserIdStmt.get(userAddress);
      
      if (user) {
        // Get user's analysis count for current month
        const monthlyUsage = db.prepare(`
          SELECT SUM(quantity) as total 
          FROM feature_usage 
          WHERE user_id = ? 
          AND feature_type = 'ANALYSIS'
          AND recorded_at > datetime('now', '-30 days')
        `).get(user.id);
        
        const totalAnalyses = monthlyUsage?.total || 0;
        const userLimit = 10; // Premium tier limit
        
        if (totalAnalyses >= userLimit) {
          return res.status(429).json({
            error: 'Monthly limit exceeded',
            message: `You have used ${totalAnalyses}/${userLimit} AI analyses this month.`,
            remaining: 0,
            limit: userLimit,
            resetIn: 'Next month'
          });
        }
        
        console.log(`📊 User ${userAddress} has used ${totalAnalyses}/${userLimit} analyses this month`);
      }
    } else {
      console.log('⚠️ Anonymous request - no user tracking');
    }
    
    // Determine the correct Blockscout URL
    let blockscoutBaseUrl;
    switch (network.toLowerCase()) {
      case 'lisk':
        blockscoutBaseUrl = 'https://blockscout.lisk.com';
        break;
      case 'lisk-sepolia':
      case 'sepolia':
        blockscoutBaseUrl = 'https://sepolia-blockscout.lisk.com';
        break;
      default:
        blockscoutBaseUrl = 'https://blockscout.lisk.com';
    }
    
    const blockscoutUrl = `${blockscoutBaseUrl}/api/v2/smart-contracts/${contractAddress}`;
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
        content: `Code: ${contractData.source_code.substring(0, 3000)}` 
      }
    ], {
      model: 'xiaomi/mimo-v2-flash:free',
      max_tokens: 500,
      temperature: 0.1
    });
    
    // Only record usage if we have a valid user AND successful analysis
    if (userAddress && quickAnalysis && quickAnalysis.trim().length > 0) {
      try {
        await executeWithRetry(() => {
          const transaction = db.transaction(() => {
            insertUserStmt.run(userAddress);
            const user = findUserIdStmt.get(userAddress);
            insertUsageStmt.run(user.id, 'QUICK_ANALYSIS', 1);
          });
          transaction();
        });
        console.log(`📊 Recorded quick analysis usage for: ${userAddress}`);
      } catch (error) {
        console.error('Quick analysis usage recording failed:', error);
        // Don't fail the request if database recording fails
      }
    } else if (!quickAnalysis || quickAnalysis.trim().length === 0) {
      console.log('⚠️ Quick analysis failed - NOT recording usage');
    }
    
    res.json({
      success: true,
      quickAnalysis: quickAnalysis,
      isVerified: contractData.is_verified,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Quick analysis error:', error);
    res.status(500).json({ 
      error: 'Quick analysis failed', 
      details: error.message,
      note: 'No usage was recorded for this failed analysis'
    });
  }
});

// [Keep the rest of your endpoints the same, but update them to use executeWithRetry]

// ========== START SERVER ==========
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🔐 OpenRouter configured: ${process.env.OPENROUTER_API_KEY ? 'YES' : 'NO'}`);
  console.log(`💾 Database: usage.db (WAL mode enabled for concurrency)`);
  console.log(`📊 Available endpoints:`);
  console.log(`   POST /api/analyze                - Full contract analysis`);
  console.log(`   POST /api/analyze/quick          - Quick security check`);
  console.log(`   POST /api/user/features/usage    - Record feature usage`);
  console.log(`   GET  /api/health                 - Health check`);
  console.log(`\n📝 Usage tracking rules:`);
  console.log(`   - Only records usage for successful analyses`);
  console.log(`   - No charges for failed AI responses`);
  console.log(`   - Anonymous analyses don't count toward usage`);
  console.log(`   - Database retries on busy errors`);
});