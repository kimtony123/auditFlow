-- AI Process - AI Analysis Page with Complete Role Management
local json = require('json')

-- Configuration
config = {
    site_name = "aoBudgetAI - AI Analysis",
    budget_process_id = "BUDGET_PROCESS_ID",  -- Replace with actual budget process ID
    main_process_id = "MAIN_PROCESS_ID",      -- Replace with actual main process ID
    subscription_process_id = "fcwefM3i145qemaD-uCdPtQsvM_YWEif6CyCeiKUaQI"
}

-- Role management
UserRoles = UserRoles or {}

-- Function to get user role from subscription process
function getUserRole(userAddress)
    if UserRoles[userAddress] then
        return UserRoles[userAddress]
    end
    
    -- Default to freemium until we fetch the role
    UserRoles[userAddress] = "freemium"
    
    -- Fetch role from subscription process
    send({
        Target = config.subscription_process_id,
        Action = "GetUserRole",
        User = userAddress
    })
    
    return "freemium"
end

-- Function to check if user can access AI
function canAccessAI(userAddress)
    local role = getUserRole(userAddress)
    return role == "premium"
end

-- Navigation for AI page (only shown to premium users)
function getNavigation(userAddress)
    local role = getUserRole(userAddress)
    
    if role ~= "premium" then
        return "" -- No navigation for non-premium users on AI page
    end
    
    return [[
    <nav style="background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%); padding: 1rem; color: white;">
        <div style="max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #FFFFFF; font-weight: bold; font-size: 1.5rem;">🤖 AI Analysis</span>
            <div style="display: flex; gap: 1.5rem; align-items: center;">
                <span style="color: gold;">⭐ Premium</span>
                <a href="/]] .. config.budget_process_id .. [[/now/dashboard" style="color: white; text-decoration: none;">← Back to Budget</a>
                <a href="/]] .. config.main_process_id .. [[/now/home" style="color: white; text-decoration: none;">Home</a>
            </div>
        </div>
    </nav>
    ]]
end

-- Your existing styles remain the same
styles = [[
<style>
    :root {
        --primary: #8B5CF6;
        --primary-dark: #7C3AED;
        --secondary: #10B981;
        --danger: #EF4444;
        --warning: #F59E0B;
        --bg-dark: #0F0F0F;
        --bg-light: #f9f9f9;
        --bg-card: #FFFFFF;
        --text: #1a1a1a;
        --text-light: #666666;
        --border: #ddd;
    }
    
    body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: var(--bg-light);
        color: var(--text);
        margin: 0;
        padding: 0;
        line-height: 1.6;
    }
    
    .container {
        max-width: 1000px;
        margin: 0 auto;
        padding: 2rem 1rem;
    }
    
    .card {
        background: var(--bg-card);
        border-radius: 8px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .btn {
        display: inline-block;
        background: var(--primary);
        color: white;
        padding: 0.75rem 1.5rem;
        border-radius: 6px;
        text-decoration: none;
        font-weight: 500;
        border: none;
        cursor: pointer;
        font-size: 1rem;
    }
    
    .btn:hover {
        background: var(--primary-dark);
    }
    
    .btn:disabled {
        background: #6c757d;
        cursor: not-allowed;
    }
    
    .message {
        padding: 1rem;
        border-radius: 6px;
        margin-bottom: 1.5rem;
    }
    
    .message-warning {
        background: #fff3cd;
        border: 1px solid #ffeaa7;
        color: #856404;
    }
    
    .message-success {
        background: #d4edda;
        border: 1px solid #c3e6cb;
        color: #155724;
    }
    
    .message-error {
        background: #f8d7da;
        border: 1px solid #f5c6cb;
        color: #721c24;
    }
    
    .message-info {
        background: #d1ecf1;
        border: 1px solid #bee5eb;
        color: #0c5460;
    }
    
    .form-group {
        margin-bottom: 1.5rem;
    }
    
    .form-label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 600;
    }
    
    .form-input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid var(--border);
        border-radius: 4px;
        font-size: 1rem;
        box-sizing: border-box;
    }
    
    .loading-container {
        text-align: center;
        padding: 3rem;
    }
    
    .loader {
        border: 4px solid #f3f3f3;
        border-top: 4px solid var(--primary);
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 2s linear infinite;
        margin: 0 auto 1rem;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .analysis-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
        margin: 1.5rem 0;
    }
    
    .stat-card {
        text-align: center;
        padding: 1.5rem;
        border-radius: 8px;
        border: 1px solid var(--border);
    }
    
    .stat-value {
        font-size: 1.5rem;
        font-weight: bold;
        margin: 0.5rem 0;
    }
    
    .progress-bar {
        background: #e9ecef;
        border-radius: 10px;
        height: 10px;
        margin: 1rem 0;
        overflow: hidden;
    }
    
    .progress-fill {
        height: 100%;
        border-radius: 10px;
        transition: width 0.3s ease;
    }
    
    .insights-list, .recommendations-list {
        list-style: none;
        padding: 0;
    }
    
    .insights-list li, .recommendations-list li {
        padding: 0.75rem;
        margin-bottom: 0.5rem;
        background: #f8f9fa;
        border-left: 4px solid var(--primary);
        border-radius: 4px;
    }
    
    .risk-badge {
        display: inline-block;
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-weight: 600;
        margin-bottom: 1rem;
    }
    
    .risk-low {
        background: #d4edda;
        color: #155724;
    }
    
    .risk-medium {
        background: #fff3cd;
        color: #856404;
    }
    
    .risk-high {
        background: #f8d7da;
        color: #721c24;
    }
    
    .section-divider {
        border-bottom: 2px solid var(--border);
        padding-bottom: 1rem;
        margin: 2rem 0 1.5rem 0;
    }
</style>
]]

-- Footer
footer = [[
<footer style="background: #1a1a1a; padding: 2rem 0; margin-top: 3rem; color: #888;">
    <div style="max-width: 1200px; margin: 0 auto; text-align: center;">
        <p>&copy; 2025 aoBudgetAI. AI Financial Analysis.</p>
    </div>
</footer>
]]

-- Sample analysis data structure (your existing data remains the same)
sample_analysis = {
    riskAssessment = {
        level = "medium",
        concerns = {"High spending on dining out", "Low savings rate"},
        positiveSigns = {"Consistent income", "No debt"}
    },
    summary = {
        totalIncome = 4250,
        totalExpenses = 2850,
        netCashFlow = 1400,
        savingsRate = 0.33,
        topSpendingCategories = {
            {category = "Housing", amount = 1200, percentage = 42},
            {category = "Food", amount = 450, percentage = 16},
            {category = "Transportation", amount = 300, percentage = 11}
        }
    },
    insights = {
        "Your savings rate of 33% is excellent - well above the recommended 20%",
        "Housing costs represent 42% of your expenses, which is higher than the recommended 30%",
        "You have a consistent positive cash flow of $1,400 per month"
    },
    recommendations = {
        "Consider finding ways to reduce housing costs to below 30% of your income",
        "Continue your good savings habits - consider investing the surplus",
        "Set up automatic transfers to savings to maintain your high savings rate"
    },
    trends = {
        "Income has been stable over the last 3 months",
        "Dining expenses increased by 15% this month",
        "Transportation costs decreased due to working from home"
    }
}

-- AI Analysis Page (Updated with dynamic navigation)
ai_analysis = [=[
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Financial Analysis - aoBudgetAI</title>
    ]=] .. styles .. [=[
</head>
<body>
    <!-- NAVIGATION_PLACEHOLDER -->
    
    <div class="container">

        <!-- Header Section -->
        <div class="card">
            <h1 style="text-align: center; margin-bottom: 0.5rem;">🤖 AI Financial Analysis</h1>
            <p style="text-align: center; color: var(--text-light); margin-bottom: 0;">
                Get intelligent insights and recommendations based on your transaction history
            </p>
        </div>

        <!-- Information Message -->
        <div class="message message-info">
            <h3>How AI Analysis Works</h3>
            <p>Our AI analyzes your spending patterns, income sources, and financial habits to provide personalized advice. This analysis runs securely on the AO network.</p>
        </div>

        <!-- Analysis Controls -->
        <div class="card">
            <h3>🔍 Select Analysis Period</h3>
            <div class="form-group">
                <label class="form-label" for="daysInput">Number of days to analyze (1-365)</label>
                <input 
                    type="number" 
                    id="daysInput" 
                    class="form-input" 
                    min="1" 
                    max="365" 
                    value="30"
                    placeholder="Enter days to analyze"
                >
            </div>
            
            <button id="analyzeBtn" class="btn" onclick="startAnalysis()">
                🤖 Analyze Transactions
            </button>
            
            <div id="taskInfo" style="display: none; margin-top: 1rem;">
                <small><strong>Request ID:</strong> <span id="taskRef"></span></small>
            </div>
        </div>

        <!-- Error Message -->
        <div id="errorMessage" class="message message-error" style="display: none;">
            <h3>Error</h3>
            <p id="errorText"></p>
        </div>

        <!-- Loading State -->
        <div id="loadingState" class="card" style="display: none;">
            <div class="loading-container">
                <div class="loader"></div>
                <h3 id="loadingText">Fetching your transactions...</h3>
                <p id="loadingSubtext">Retrieving your financial data from the AO network</p>
                
                <div id="analysisProgress" style="display: none; margin-top: 1rem;">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 45%; background: var(--primary);"></div>
                    </div>
                    <p>Processing with AI Agent</p>
                </div>
            </div>
        </div>

        <!-- Analysis Results -->
        <div id="analysisResults" style="display: none;">
            <div class="card">
                <h2>📊 Financial Analysis Report</h2>
                <p>Generated on <span id="reportDate"></span> • Analysis period: <span id="analysisPeriod"></span> days</p>
            </div>

            <!-- Risk Assessment -->
            <div class="card">
                <h3 class="section-divider">🛡️ Risk Assessment</h3>
                <div id="riskAssessment">
                    <!-- Risk assessment will be populated here -->
                </div>
            </div>

            <!-- Financial Summary -->
            <div class="card">
                <h3 class="section-divider">📈 Financial Summary</h3>
                <div class="analysis-grid" id="financialSummary">
                    <!-- Financial summary will be populated here -->
                </div>
                
                <div id="savingsRateSection" style="margin-top: 1.5rem;">
                    <!-- Savings rate will be populated here -->
                </div>
                
                <div id="spendingCategories" style="margin-top: 1.5rem;">
                    <!-- Spending categories will be populated here -->
                </div>
            </div>

            <!-- Insights -->
            <div class="card">
                <h3 class="section-divider">💡 Key Insights</h3>
                <ul class="insights-list" id="insightsList">
                    <!-- Insights will be populated here -->
                </ul>
            </div>

            <!-- Recommendations -->
            <div class="card">
                <h3 class="section-divider">🚀 Actionable Recommendations</h3>
                <ul class="recommendations-list" id="recommendationsList">
                    <!-- Recommendations will be populated here -->
                </ul>
            </div>

            <!-- Trends -->
            <div class="card">
                <h3 class="section-divider">📊 Trends & Patterns</h3>
                <ul class="insights-list" id="trendsList">
                    <!-- Trends will be populated here -->
                </ul>
            </div>

            <!-- AO Computer Notice -->
            <div class="message message-info">
                <h3>Powered by AO Computer</h3>
                <p>This analysis was generated by our AI agent running on the decentralized AO computer network.</p>
            </div>
        </div>

        <!-- Empty State -->
        <div id="emptyState" class="card">
            <div style="text-align: center; padding: 3rem;">
                <div style="font-size: 4rem; margin-bottom: 1rem;">🚀</div>
                <h3>No Analysis Yet</h3>
                <p>Enter the number of days and click "Analyze Transactions" to get started with our AI financial analysis.</p>
            </div>
        </div>

        <!-- Wallet Notice -->
        <div class="message message-warning">
            <h3>Data Integration Notice</h3>
            <p>In a production environment, this would connect to your Budget Process to analyze your actual transaction data. For this demo, we're showing sample analysis results.</p>
        </div>
    </div>

    ]=] .. footer .. [=[
    
    <script>
        let currentAnalysis = null;
        
        // Format currency function
        function formatCurrency(amount) {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            }).format(amount);
        }
        
        function startAnalysis() {
            const days = document.getElementById('daysInput').value;
            const analyzeBtn = document.getElementById('analyzeBtn');
            
            if (!days || days < 1 || days > 365) {
                showError('Please enter a valid number of days (1-365)');
                return;
            }
            
            // Show loading state
            showLoadingState('Fetching your transactions...', 'Retrieving your financial data from the AO network');
            
            // Simulate API call to fetch transactions and analyze
            setTimeout(() => {
                // Simulate analysis process
                showLoadingState('Analyzing your transactions...', 'This may take a few moments as we process your data on the AO network');
                document.getElementById('analysisProgress').style.display = 'block';
                
                setTimeout(() => {
                    // Generate sample analysis based on days
                    currentAnalysis = generateSampleAnalysis(parseInt(days));
                    showAnalysisResults(currentAnalysis, days);
                }, 2000);
                
            }, 1500);
        }
        
        function generateSampleAnalysis(days) {
            // Modify sample data based on analysis period
            const baseAnalysis = ]=] .. json.encode(sample_analysis) .. [[;
            
            // Adjust numbers based on days analyzed
            const multiplier = days / 30; // Base on 30-day month
            
            baseAnalysis.summary.totalIncome = Math.round(4250 * multiplier);
            baseAnalysis.summary.totalExpenses = Math.round(2850 * multiplier);
            baseAnalysis.summary.netCashFlow = Math.round(1400 * multiplier);
            
            // Add period-specific insights
            if (days > 60) {
                baseAnalysis.insights.push("Your financial patterns are consistent over this " + days + "-day period");
                baseAnalysis.trends.push("Analysis based on " + days + " days of data shows long-term stability");
            }
            
            return baseAnalysis;
        }
        
        function showLoadingState(mainText, subText) {
            document.getElementById('emptyState').style.display = 'none';
            document.getElementById('analysisResults').style.display = 'none';
            document.getElementById('errorMessage').style.display = 'none';
            
            document.getElementById('loadingText').textContent = mainText;
            document.getElementById('loadingSubtext').textContent = subText;
            document.getElementById('loadingState').style.display = 'block';
            
            // Disable analyze button during processing
            document.getElementById('analyzeBtn').disabled = true;
            document.getElementById('analyzeBtn').innerHTML = '⏳ Processing...';
        }
        
        function showAnalysisResults(analysis, days) {
            document.getElementById('loadingState').style.display = 'none';
            document.getElementById('emptyState').style.display = 'none';
            document.getElementById('analysisResults').style.display = 'block';
            
            // Update report info
            document.getElementById('reportDate').textContent = new Date().toLocaleDateString();
            document.getElementById('analysisPeriod').textContent = days;
            
            // Display risk assessment
            displayRiskAssessment(analysis.riskAssessment);
            
            // Display financial summary
            displayFinancialSummary(analysis.summary);
            
            // Display insights
            displayList('insightsList', analysis.insights);
            
            // Display recommendations
            displayList('recommendationsList', analysis.recommendations);
            
            // Display trends
            displayList('trendsList', analysis.trends);
            
            // Re-enable analyze button
            document.getElementById('analyzeBtn').disabled = false;
            document.getElementById('analyzeBtn').innerHTML = '🤖 Analyze Transactions';
        }
        
        function displayRiskAssessment(riskAssessment) {
            const riskContainer = document.getElementById('riskAssessment');
            let riskClass = 'risk-medium';
            if (riskAssessment.level === 'low') riskClass = 'risk-low';
            if (riskAssessment.level === 'high') riskClass = 'risk-high';
            
            riskContainer.innerHTML = `
                <div class="risk-badge ${riskClass}">
                    Financial Health: ${riskAssessment.level.toUpperCase()}
                </div>
                
                ${riskAssessment.concerns && riskAssessment.concerns.length > 0 ? `
                <div style="margin-top: 1rem;">
                    <h4>Areas of Concern:</h4>
                    <ul>
                        ${riskAssessment.concerns.map(concern => `<li>${concern}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
                
                ${riskAssessment.positiveSigns && riskAssessment.positiveSigns.length > 0 ? `
                <div style="margin-top: 1rem;">
                    <h4>Positive Indicators:</h4>
                    <ul>
                        ${riskAssessment.positiveSigns.map(positive => `<li>${positive}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
            `;
        }
        
        function displayFinancialSummary(summary) {
            const summaryContainer = document.getElementById('financialSummary');
            summaryContainer.innerHTML = `
                <div class="stat-card" style="border-left: 4px solid #10B981;">
                    <div>Total Income</div>
                    <div class="stat-value">${formatCurrency(summary.totalIncome)}</div>
                </div>
                <div class="stat-card" style="border-left: 4px solid #EF4444;">
                    <div>Total Expenses</div>
                    <div class="stat-value">${formatCurrency(summary.totalExpenses)}</div>
                </div>
                <div class="stat-card" style="border-left: 4px solid ${summary.netCashFlow >= 0 ? '#10B981' : '#EF4444'};">
                    <div>Net Cash Flow</div>
                    <div class="stat-value">${formatCurrency(summary.netCashFlow)}</div>
                </div>
            `;
            
            // Savings rate
            if (summary.savingsRate !== undefined) {
                const savingsRate = Math.round(summary.savingsRate * 100);
                let progressColor = '#EF4444';
                if (savingsRate >= 20) progressColor = '#10B981';
                else if (savingsRate >= 10) progressColor = '#F59E0B';
                
                document.getElementById('savingsRateSection').innerHTML = `
                    <h4>Savings Rate</h4>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${savingsRate}%; background: ${progressColor};"></div>
                    </div>
                    <p>${savingsRate}% Savings Rate</p>
                `;
            }
            
            // Spending categories
            if (summary.topSpendingCategories && summary.topSpendingCategories.length > 0) {
                document.getElementById('spendingCategories').innerHTML = `
                    <h4>Top Spending Categories</h4>
                    <ul>
                        ${summary.topSpendingCategories.map(cat => `
                            <li style="padding: 0.5rem 0; border-bottom: 1px solid #eee;">
                                <strong>${cat.category}</strong>: ${formatCurrency(cat.amount)} (${cat.percentage}% of expenses)
                            </li>
                        `).join('')}
                    </ul>
                `;
            }
        }
        
        function displayList(listId, items) {
            const listContainer = document.getElementById(listId);
            if (items && items.length > 0) {
                listContainer.innerHTML = items.map(item => `<li>${item}</li>`).join('');
            } else {
                listContainer.innerHTML = '<li>No items available</li>';
            }
        }
        
        function showError(message) {
            document.getElementById('errorText').textContent = message;
            document.getElementById('errorMessage').style.display = 'block';
            
            // Re-enable analyze button
            document.getElementById('analyzeBtn').disabled = false;
            document.getElementById('analyzeBtn').innerHTML = '🤖 Analyze Transactions';
        }
        
        // Initialize the page
        document.addEventListener('DOMContentLoaded', function() {
            document.getElementById('emptyState').style.display = 'block';
        });
    </script>
</body>
</html>
]=]

-- Access denied page with redirect to subscription (Updated with correct process IDs)
access_denied = [=[
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Premium Required - aoBudgetAI</title>
    <style>
        :root {
            --primary: #8B5CF6;
            --primary-dark: #7C3AED;
            --secondary: #10B981;
            --bg-dark: #0F0F0F;
            --bg-light: #f9f9f9;
            --bg-card: #FFFFFF;
            --text: #1a1a1a;
            --text-light: #666666;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--bg-light);
            color: var(--text);
            margin: 0;
            padding: 0;
            line-height: 1.6;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 4rem 1rem;
        }
        
        .card {
            background: var(--bg-card);
            border-radius: 12px;
            padding: 3rem;
            text-align: center;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        
        .btn {
            display: inline-block;
            background: gold;
            color: black;
            padding: 1rem 2rem;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            font-size: 1.1rem;
            margin: 0.5rem;
        }
        
        .btn-secondary {
            background: #6c757d;
            color: white;
        }
        
        .icon-large {
            font-size: 4rem;
            margin-bottom: 1rem;
        }
        
        .feature-list {
            list-style: none;
            padding: 0;
            max-width: 400px;
            margin: 2rem auto;
            text-align: left;
        }
        
        .feature-list li {
            padding: 0.75rem 0;
            border-bottom: 1px solid #eee;
            display: flex;
            align-items: center;
        }
        
        .feature-list li:before {
            content: "✓";
            color: var(--secondary);
            font-weight: bold;
            margin-right: 1rem;
            font-size: 1.2rem;
        }
        
        .countdown {
            font-size: 1.2rem;
            color: var(--primary);
            font-weight: bold;
            margin: 1rem 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="icon-large">🔒</div>
            <h1 style="font-size: 2.5rem; margin-bottom: 1rem;">Premium Feature</h1>
            <p style="font-size: 1.2rem; color: var(--text-light); margin-bottom: 2rem;">
                AI Financial Analysis is available exclusively for Premium users. 
                Upgrade now to unlock powerful AI insights and take control of your finances.
            </p>
            
            <div class="countdown" id="countdown">
                Redirecting to upgrade page in <span id="timer">5</span> seconds...
            </div>
            
            <div style="margin: 2rem 0;">
                <h3>✨ Premium Benefits</h3>
                <ul class="feature-list">
                    <li>🤖 AI Financial Analysis & Insights</li>
                    <li>🚫 Ad-free experience across all pages</li>
                    <li>📈 Advanced analytics & reporting</li>
                    <li>💡 Smart investment recommendations</li>
                    <li>🎯 Personalized financial guidance</li>
                </ul>
            </div>
            
            <div style="margin-top: 2rem;">
                <a href="/MAIN_PROCESS_ID/now/upgrade" class="btn" id="upgradeBtn">
                    🚀 Upgrade to Premium Now
                </a>
                <a href="/BUDGET_PROCESS_ID/now/dashboard" class="btn btn-secondary">
                    ← Back to Budget App
                </a>
            </div>
            
            <div style="margin-top: 2rem; padding: 1.5rem; background: #f8f9fa; border-radius: 8px;">
                <h4>💡 Why Upgrade?</h4>
                <p style="margin: 0.5rem 0; font-size: 0.9rem;">
                    Our AI analyzes your spending patterns, income sources, and financial habits to provide 
                    personalized advice that can help you save more, invest smarter, and reach your financial goals faster.
                </p>
            </div>
        </div>
    </div>

    <script>
        let seconds = 5;
        const countdownElement = document.getElementById('timer');
        const upgradeBtn = document.getElementById('upgradeBtn');
        
        function updateCountdown() {
            countdownElement.textContent = seconds;
            seconds--;
            
            if (seconds < 0) {
                // Redirect to upgrade page
                window.location.href = upgradeBtn.href;
            } else {
                setTimeout(updateCountdown, 1000);
            }
        }
        
        // Start countdown
        updateCountdown();
        
        // Allow immediate click without waiting
        upgradeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = this.href;
        });
    </script>
</body>
</html>
]=]

-- Update the AI analysis handler to check access and redirect
Handlers.add('GetAIAnalysis', 'get-ai-analysis', function(msg)
    local userAddress = msg.From
    local canAccess = canAccessAI(userAddress)
    
    if not canAccess then
        -- Return access denied page with redirect
        local accessPage = access_denied:gsub("MAIN_PROCESS_ID", config.main_process_id)
                                      :gsub("BUDGET_PROCESS_ID", config.budget_process_id)
        
        send({
            Target = msg.From,
            Data = accessPage
        })
        return
    end
    
    -- User has premium access, show AI analysis page
    local navigation = getNavigation(userAddress)
    local page = ai_analysis:gsub("<!-- NAVIGATION_PLACEHOLDER -->", navigation)
    
    send({
        Target = msg.From,
        Data = page
    })
end)

-- Handler for role responses from subscription process
Handlers.add('UserRoleResponse', 'user-role-response', function(msg)
    local data = json.decode(msg.Data)
    if data and data.user and data.role then
        UserRoles[data.user] = data.role
        print("AI Process: Updated role for user " .. data.user .. ": " .. data.role)
    end
end)

-- Handler to manually check user role
Handlers.add('CheckUserRole', 'check-user-role', function(msg)
    local userAddress = msg.From
    local role = getUserRole(userAddress)
    
    send({
        Target = msg.From,
        Data = json.encode({
            role = role,
            user = userAddress,
            can_access_ai = role == "premium"
        })
    })
end)

-- Your existing analysis handlers remain the same
Handlers.add('AnalyzeTransactions', 'analyze-transactions', function(msg)
    local data = json.decode(msg.Data)
    local days = data.days or 30
    local transactions = data.transactions or {}
    
    -- Simulate AI analysis
    local analysis = {
        riskAssessment = {
            level = "medium",
            concerns = {"High spending on discretionary categories", "Savings rate could be improved"},
            positiveSigns = {"Stable income source", "No overdue payments"}
        },
        summary = {
            totalIncome = calculateTotal(transactions, "income"),
            totalExpenses = calculateTotal(transactions, "expense"),
            netCashFlow = calculateNetCashFlow(transactions),
            savingsRate = calculateSavingsRate(transactions),
            topSpendingCategories = getTopCategories(transactions, 5)
        },
        insights = generateInsights(transactions, days),
        recommendations = generateRecommendations(transactions),
        trends = identifyTrends(transactions, days)
    }
    
    send({
        target = msg.From,
        data = json.encode({
            code = 200,
            analysis = analysis,
            message = "Analysis completed successfully"
        })
    })
end)

-- Your existing helper functions remain the same
function calculateTotal(transactions, type)
    local total = 0
    for _, transaction in ipairs(transactions) do
        if transaction.type == type then
            total = total + math.abs(transaction.amount)
        end
    end
    return total
end

function calculateNetCashFlow(transactions)
    return calculateTotal(transactions, "income") - calculateTotal(transactions, "expense")
end

function calculateSavingsRate(transactions)
    local income = calculateTotal(transactions, "income")
    if income == 0 then return 0 end
    return calculateNetCashFlow(transactions) / income
end

function getTopCategories(transactions, limit)
    local categories = {}
    for _, transaction in ipairs(transactions) do
        if transaction.type == "expense" then
            local category = transaction.category
            categories[category] = (categories[category] or 0) + math.abs(transaction.amount)
        end
    end
    
    local topCategories = {}
    for category, amount in pairs(categories) do
        table.insert(topCategories, {category = category, amount = amount})
    end
    
    table.sort(topCategories, function(a, b) return a.amount > b.amount end)
    
    local totalExpenses = calculateTotal(transactions, "expense")
    for i, category in ipairs(topCategories) do
        if i <= limit then
            category.percentage = totalExpenses > 0 and math.round((category.amount / totalExpenses) * 100) or 0
        end
    end
    
    return {table.unpack(topCategories, 1, math.min(limit, #topCategories))}
end

function generateInsights(transactions, days)
    local insights = {}
    local savingsRate = calculateSavingsRate(transactions)
    
    if savingsRate > 0.2 then
        table.insert(insights, "Your savings rate is excellent - well above the recommended 20%")
    elseif savingsRate > 0.1 then
        table.insert(insights, "Your savings rate is good, but could be improved to reach the recommended 20%")
    else
        table.insert(insights, "Consider increasing your savings rate to build financial security")
    end
    
    if days > 90 then
        table.insert(insights, "Long-term analysis shows consistent financial patterns")
    end
    
    return insights
end

function generateRecommendations(transactions)
    local recommendations = {}
    local savingsRate = calculateSavingsRate(transactions)
    
    if savingsRate < 0.2 then
        table.insert(recommendations, "Set up automatic transfers to savings to improve your savings rate")
    end
    
    table.insert(recommendations, "Review your top spending categories for potential optimization opportunities")
    table.insert(recommendations, "Consider creating specific budget goals for each major category")
    
    return recommendations
end

function identifyTrends(transactions, days)
    local trends = {}
    
    if days >= 30 then
        table.insert(trends, "Monthly patterns are visible in your spending habits")
    end
    
    if #transactions > 50 then
        table.insert(trends, "You have consistent transaction activity throughout the period")
    end
    
    return trends
end

function math.round(num)
    return math.floor(num + 0.5)
end

print("🤖 AI Process with Complete Role Management Initialized!")
print("🔒 AI Analysis restricted to premium users only")
print("💰 Non-premium users redirected to upgrade page")
print("🔗 Connected to subscription process: " .. config.subscription_process_id)