-- aoBudgetAI - Main Process (Landing Gateway) with Role System
local json = require('json')

-- Configuration with process IDs (Replace with your actual process IDs)
config = {
    processes = {
        budget = "BUDGET_PROCESS_ID",      -- Budget tracker process ID
        ai = "AI_PROCESS_ID"              -- AI insights process ID (internal only)
    },
    site_name = "aoBudgetAI",
    base_url = "https://workshop.forward.computer/" .. (id or "PROCESS_ID"),
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

-- Navigation (AI process removed from public navigation)
nav = [[
<nav style="background: linear-gradient(135deg, #0f2f3f 0%, #1a202c 100%); padding: 1rem; color: white;">
    <div style="max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center;">
        <a href="/]] .. id .. [[/now/home" style="color: #FFFFFF; text-decoration: none; font-weight: bold; font-size: 1.5rem;">aoBudgetAI</a>
        <div style="display: flex; gap: 1.5rem;">
            <a href="/]] .. id .. [[/now/home" style="color: white; text-decoration: none;">Home</a>
            <a href="/]] .. config.processes.budget .. [[/now/dashboard" style="color: white; text-decoration: none;">Budget App</a>
            <a href="/]] .. id .. [[/now/features" style="color: white; text-decoration: none;">Features</a>
            <a href="/]] .. id .. [[/now/how-it-works" style="color: white; text-decoration: none;">How It Works</a>
            <a href="/]] .. id .. [[/now/upgrade" style="color: gold; text-decoration: none;">✨ Upgrade</a>
        </div>
    </div>
</nav>
]]

-- Shared Styles (your existing styles remain the same)
styles = [[
<style>
    :root {
        --primary: #2185D0;
        --primary-dark: #1a6fb3;
        --secondary: #21BA45;
        --accent: #6435C9;
        --warning: #F2711C;
        --bg-dark: #0F0F0F;
        --bg-light: #f9f9f9;
        --bg-card: #1E1E1E;
        --text: #FFFFFF;
        --text-dark: #1a1a1a;
        --border: #333333;
    }
    
    body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: var(--bg-dark);
        color: var(--text);
        margin: 0;
        padding: 0;
        line-height: 1.6;
    }
    
    .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem 1rem;
    }
    
    .card {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
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
        font-size: 1.1rem;
    }
    
    .btn:hover {
        background: var(--primary-dark);
    }
    
    .btn-success {
        background: var(--secondary);
    }
    
    .btn-premium {
        background: gold;
        color: black;
        font-weight: bold;
    }
    
    .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
        margin: 2rem 0;
    }
    
    .hero-section {
        min-height: 700px;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        background: linear-gradient(135deg, #0f2f3f 0%, #1a202c 100%);
        color: white;
    }
    
    .section-light {
        background: var(--bg-light);
        color: var(--text-dark);
    }
    
    .step-item {
        text-align: center;
        padding: 1.5rem;
    }
    
    .step-icon {
        font-size: 3rem;
        color: var(--primary);
        margin-bottom: 1rem;
    }
    
    .statistic {
        text-align: center;
        padding: 1rem;
    }
    
    .statistic-value {
        font-size: 2.5rem;
        font-weight: bold;
        color: var(--primary);
    }
    
    .progress {
        background: #333;
        border-radius: 10px;
        margin: 0.5rem 0;
        height: 10px;
    }
    
    .progress-bar {
        background: var(--primary);
        height: 100%;
        border-radius: 10px;
    }
    
    .feature-list {
        list-style: none;
        padding: 0;
    }
    
    .feature-list li {
        margin-bottom: 0.5rem;
        display: flex;
        align-items: center;
    }
    
    .feature-list li:before {
        content: "✓";
        color: var(--secondary);
        font-weight: bold;
        margin-right: 0.5rem;
    }
    
    .architecture-diagram {
        background: white;
        padding: 2rem;
        border-radius: 8px;
        margin: 2rem 0;
    }
    
    .process-flow {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: 2rem 0;
    }
    
    .process-step {
        text-align: center;
        flex: 1;
        padding: 1rem;
    }
    
    .process-arrow {
        font-size: 2rem;
        color: var(--primary);
    }
    
    /* Premium specific styles */
    .premium-card {
        background: linear-gradient(135deg, gold, #ffd700);
        color: black;
        border: none;
    }
    
    .premium-feature {
        background: rgba(255, 215, 0, 0.1);
        border-left: 4px solid gold;
        padding: 1rem;
        margin: 1rem 0;
    }
    
    .pricing-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 2rem;
        margin: 3rem 0;
    }
    
    .pricing-card {
        background: var(--bg-card);
        border-radius: 12px;
        padding: 2rem;
        text-align: center;
        border: 1px solid var(--border);
    }
    
    .pricing-card.featured {
        border: 2px solid gold;
        transform: scale(1.05);
    }
    
    .price {
        font-size: 3rem;
        font-weight: bold;
        margin: 1rem 0;
    }
    
    .price-featured {
        color: gold;
    }
</style>
]]

-- Footer
footer = [[
<footer style="background: #1a1a1a; padding: 3rem 0; margin-top: 3rem; color: #888;">
    <div style="max-width: 1200px; margin: 0 auto; padding: 0 1rem;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 2rem;">
            <div>
                <h4 style="color: white;">aoBudgetAI</h4>
                <ul style="list-style: none; padding: 0;">
                    <li><a href="/]] .. id .. [[/now/home" style="color: #888; text-decoration: none;">About Us</a></li>
                    <li><a href="/]] .. id .. [[/now/home" style="color: #888; text-decoration: none;">Contact</a></li>
                    <li><a href="/]] .. id .. [[/now/home" style="color: #888; text-decoration: none;">Privacy Policy</a></li>
                </ul>
            </div>
            <div>
                <h4 style="color: white;">Features</h4>
                <ul style="list-style: none; padding: 0;">
                    <li><a href="/]] .. config.processes.budget .. [[/now/dashboard" style="color: #888; text-decoration: none;">Budget Tracking</a></li>
                    <li><a href="/]] .. id .. [[/now/features" style="color: #888; text-decoration: none;">AI Insights</a></li>
                    <li><a href="/]] .. id .. [[/now/features" style="color: #888; text-decoration: none;">Investment Management</a></li>
                </ul>
            </div>
            <div>
                <h4 style="color: white;">Resources</h4>
                <ul style="list-style: none; padding: 0;">
                    <li><a href="/]] .. id .. [[/now/how-it-works" style="color: #888; text-decoration: none;">How It Works</a></li>
                    <li><a href="/]] .. id .. [[/now/home" style="color: #888; text-decoration: none;">Tutorials</a></li>
                    <li><a href="/]] .. id .. [[/now/home" style="color: #888; text-decoration: none;">Support</a></li>
                </ul>
            </div>
            <div>
                <h4 style="color: white;">The Budget Tracker That Invests For You</h4>
                <p>aoBudgetAI combines comprehensive budget tracking with AI-powered investment management.</p>
                <a href="/]] .. config.processes.budget .. [[/now/dashboard" class="btn">Go to Budget App</a>
            </div>
        </div>
        <div style="text-align: center; margin-top: 2rem; padding-top: 2rem; border-top: 1px solid #333;">
            <p>&copy; 2025 aoBudgetAI. Decentralized Budgeting Intelligence.</p>
        </div>
    </div>
</footer>
]]

-- Home Page (Landing Page)
home = [=[
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>aoBudgetAI - The Budget Tracker That Invests For You</title>
    ]=] .. styles .. [=[
</head>
<body>
    ]=] .. nav .. [=[
    
    <!-- Hero Section -->
    <div class="hero-section">
        <div class="container">
            <h1 style="font-size: 4em; font-weight: normal; margin-bottom: 0;">aoBudgetAI</h1>
            <h2 style="font-size: 1.7em; font-weight: normal; margin-top: 0.5em; margin-bottom: 1.5em;">
                The Budget Tracker That Invests For You
            </h2>
            <p style="color: rgba(255,255,255,0.8); font-size: 1.3em; margin-bottom: 2em; max-width: 800px; margin-left: auto; margin-right: auto;">
                Track your income and expenses, then let your personal AI agent invest the surplus based on your financial health. 
                Your agent is completely sovereign and owned by you - deposit or withdraw anytime.
            </p>
            <a href="/]] .. config.processes.budget .. [[/now/dashboard" class="btn" style="font-size: 1.2rem; padding: 1rem 2rem;">Start Budgeting</a>
            <a href="/]] .. id .. [[/now/upgrade" class="btn btn-premium" style="font-size: 1.2rem; padding: 1rem 2rem; margin-left: 1rem;">✨ Go Premium</a>
        </div>
    </div>

    <!-- Premium Features Highlight -->
    <div class="container" style="padding: 4rem 0;">
        <div class="premium-card">
            <div style="text-align: center; padding: 2rem;">
                <h2 style="margin-bottom: 1rem;">✨ Unlock Premium Features</h2>
                <p style="font-size: 1.2em; margin-bottom: 2em;">Get AI-powered financial insights and ad-free experience</p>
                <a href="/]] .. id .. [[/now/upgrade" class="btn" style="background: black; color: gold; font-size: 1.1rem;">Upgrade to Premium</a>
            </div>
        </div>
    </div>

    <!-- How It Works Section -->
    <div class="container" style="padding: 6rem 0;">
        <h2 style="text-align: center; font-size: 2.5em; margin-bottom: 2em;">How aoBudgetAI Works</h2>
        
        <div class="architecture-diagram">
            <h3 style="text-align: center; color: var(--text-dark);">Architecture Flow</h3>
            <div class="process-flow">
                <div class="process-step">
                    <div style="font-size: 3rem;">📝</div>
                    <h4>1. Budget App</h4>
                    <p>Track transactions in the Budget App</p>
                </div>
                <div class="process-arrow">→</div>
                <div class="process-step">
                    <div style="font-size: 3rem;">🔒</div>
                    <h4>2. Secure Data</h4>
                    <p>Data stays within your control</p>
                </div>
                <div class="process-arrow">→</div>
                <div class="process-step">
                    <div style="font-size: 3rem;">🤖</div>
                    <h4>3. AI Analysis</h4>
                    <p>AI processes your budget data</p>
                </div>
                <div class="process-arrow">→</div>
                <div class="process-step">
                    <div style="font-size: 3rem;">💡</div>
                    <h4>4. Insights</h4>
                    <p>Get recommendations in Budget App</p>
                </div>
            </div>
        </div>

        <div class="grid">
            <div class="card">
                <h3>📊 Budget Tracking First</h3>
                <p>All AI features are accessed through the Budget App. You need transaction data for the AI to analyze.</p>
                <ul class="feature-list">
                    <li>Start by tracking income and expenses</li>
                    <li>AI needs data to provide insights</li>
                    <li>All analysis happens within your secure environment</li>
                    <li>No direct access to AI process - it's a background service</li>
                </ul>
            </div>
            
            <div class="card">
                <h3>🔒 Secure Data Flow</h3>
                <p>Your financial data never leaves your control. The AI process only receives what it needs to analyze.</p>
                <ul class="feature-list">
                    <li>Budget data stays in Budget Process</li>
                    <li>AI only receives anonymized analysis data</li>
                    <li>You control what data gets analyzed</li>
                    <li>Complete privacy and security</li>
                </ul>
            </div>
        </div>
    </div>

    <!-- Budget Tracking Section -->
    <div class="section-light" style="padding: 6rem 0;">
        <div class="container">
            <h2 style="text-align: center; font-size: 2.5em; margin-bottom: 2em;">Start With Budget Tracking</h2>
            
            <div class="grid">
                <div class="card">
                    <h3>💰 Income Tracking</h3>
                    <p>Easily track all your income sources with automatic categorization.</p>
                    <ul class="feature-list">
                        <li>Multiple income streams support</li>
                        <li>Automatic categorization</li>
                        <li>Recurring income detection</li>
                        <li>Income forecasting</li>
                    </ul>
                </div>
                
                <div class="card">
                    <h3>🛒 Expense Tracking</h3>
                    <p>Monitor your spending with detailed categorization.</p>
                    <ul class="feature-list">
                        <li>Smart expense categorization</li>
                        <li>Spending limit alerts</li>
                        <li>Recurring bill tracking</li>
                        <li>Custom budget categories</li>
                    </ul>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 3rem;">
                <p style="font-size: 1.2em; max-width: 600px; margin: 0 auto;">
                    <strong>Important:</strong> AI insights are only available after you've tracked some transactions. 
                    The more data you provide, the better the AI can help you.
                </p>
                <a href="/]] .. config.processes.budget .. [[/now/dashboard" class="btn" style="margin-top: 1.5rem;">Start Tracking Now</a>
            </div>
        </div>
    </div>

    <!-- AI Features Section -->
    <div class="container" style="padding: 6rem 0;">
        <h2 style="text-align: center; font-size: 2.5em; margin-bottom: 2em;">AI Insights (Available in Budget App)</h2>
        
        <div class="premium-feature">
            <h3>⭐ Premium Feature</h3>
            <p>AI Financial Analysis is available exclusively for Premium users. Upgrade to unlock powerful insights.</p>
        </div>
        
        <div class="grid">
            <div class="card">
                <h3>📈 Financial Health Score</h3>
                <p>Based on your transaction data, the AI calculates your financial health:</p>
                <ul class="feature-list">
                    <li><strong>Income/Expense Ratio</strong> - How much you save</li>
                    <li><strong>Spending Patterns</strong> - Where your money goes</li>
                    <li><strong>Budget Adherence</strong> - How well you stick to budgets</li>
                    <li><strong>Financial Stability</strong> - Your overall financial health</li>
                </ul>
                <p><em>Access this in the Budget App after tracking transactions</em></p>
            </div>
            
            <div class="card">
                <h3>💡 Smart Recommendations</h3>
                <p>The AI provides personalized recommendations based on your data:</p>
                <ul class="feature-list">
                    <li>Savings opportunities</li>
                    <li>Budget optimization tips</li>
                    <li>Spending pattern insights</li>
                    <li>Financial goal planning</li>
                </ul>
                <p><em>These appear in your Budget App dashboard</em></p>
            </div>
        </div>
    </div>

    <!-- CTA Section -->
    <div class="section-light" style="padding: 6rem 0; text-align: center;">
        <div class="container">
            <h2 style="font-size: 2.5em; margin-bottom: 1em;">Ready to Get Started?</h2>
            <p style="font-size: 1.33em; max-width: 800px; margin: 0 auto 2em;">
                Start with the Budget App to track your transactions. AI insights will automatically become available 
                as you build your financial data. Your privacy and data security are our top priority.
            </p>
            
            <a href="/]] .. config.processes.budget .. [[/now/dashboard" class="btn" style="font-size: 1.2rem; padding: 1rem 2rem;">Go to Budget App</a>
            <a href="/]] .. id .. [[/now/upgrade" class="btn btn-premium" style="font-size: 1.2rem; padding: 1rem 2rem; margin-left: 1rem;">✨ Go Premium</a>
            <p style="margin-top: 1em;"><small>Start with budget tracking - AI insights will follow</small></p>
        </div>
    </div>

    ]=] .. footer .. [=[
</body>
</html>
]=]

-- How It Works Page
howItWorks = [=[
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>How It Works - aoBudgetAI</title>
    ]=] .. styles .. [=[
</head>
<body>
    ]=] .. nav .. [=[
    
    <div class="container" style="padding: 4rem 0;">
        <h1 style="text-align: center; font-size: 3em; margin-bottom: 2em;">How aoBudgetAI Works</h1>
        
        <div class="card">
            <h2>🚫 No Direct AI Access</h2>
            <p><strong>Important:</strong> You cannot access the AI process directly. It's designed to work exclusively with data from the Budget App.</p>
            
            <div class="grid">
                <div class="card">
                    <h3>Why This Design?</h3>
                    <ul class="feature-list">
                        <li><strong>Data Dependency:</strong> AI needs transaction data to analyze</li>
                        <li><strong>Security:</strong> Prevents unauthorized access to AI features</li>
                        <li><strong>User Experience:</strong> All features in one place (Budget App)</li>
                        <li><strong>Privacy:</strong> Your data stays within controlled processes</li>
                    </ul>
                </div>
                
                <div class="card">
                    <h3>Proper Usage Flow</h3>
                    <ol style="line-height: 2;">
                        <li>Go to <strong>Budget App</strong></li>
                        <li>Track your income and expenses</li>
                        <li>AI automatically analyzes your data</li>
                        <li>View insights in the Budget App</li>
                        <li>Get personalized recommendations</li>
                    </ol>
                </div>
            </div>
        </div>

        <div class="card">
            <h2>🔐 Secure Architecture</h2>
            <div class="process-flow">
                <div class="process-step">
                    <div style="font-size: 3rem;">👤</div>
                    <h4>User</h4>
                    <p>You</p>
                </div>
                <div class="process-arrow">→</div>
                <div class="process-step">
                    <div style="font-size: 3rem;">📱</div>
                    <h4>Budget App</h4>
                    <p>Track transactions</p>
                </div>
                <div class="process-arrow">→</div>
                <div class="process-step">
                    <div style="font-size: 3rem;">🔒</div>
                    <h4>Secure Channel</h4>
                    <p>Encrypted data transfer</p>
                </div>
                <div class="process-arrow">→</div>
                <div class="process-step">
                    <div style="font-size: 3rem;">🤖</div>
                    <h4>AI Process</h4>
                    <p>Background analysis</p>
                </div>
                <div class="process-arrow">→</div>
                <div class="process-step">
                    <div style="font-size: 3rem;">💡</div>
                    <h4>Budget App</h4>
                    <p>Show insights to you</p>
                </div>
            </div>
        </div>

        <div style="text-align: center; margin-top: 3rem;">
            <a href="/]] .. config.processes.budget .. [[/now/dashboard" class="btn">Start Using Budget App</a>
            <a href="/]] .. id .. [[/now/upgrade" class="btn btn-premium" style="margin-left: 1rem;">✨ Upgrade to Premium</a>
            <p style="margin-top: 1rem; color: #888;">
                Remember: AI features are accessed through the Budget App after you have transaction data
            </p>
        </div>
    </div>

    ]=] .. footer .. [=[
</body>
</html>
]=]

-- Features Page (Updated)
features = [=[
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Features - aoBudgetAI</title>
    ]=] .. styles .. [=[
</head>
<body>
    ]=] .. nav .. [=[
    
    <div class="container" style="padding: 4rem 0;">
        <h1 style="text-align: center; font-size: 3em; margin-bottom: 2em;">aoBudgetAI Features</h1>
        
        <div class="card">
            <h2>📍 All Features Accessed Through Budget App</h2>
            <p><strong>Note:</strong> AI features are integrated into the Budget App. You don't need to access separate processes.</p>
        </div>
        
        <div class="grid">
            <div class="card">
                <h3>📝 Budget Management</h3>
                <ul class="feature-list">
                    <li>Income and expense tracking</li>
                    <li>Custom budget categories</li>
                    <li>Recurring transaction detection</li>
                    <li>Real-time budget monitoring</li>
                    <li>Spending limit alerts</li>
                </ul>
            </div>
            
            <div class="card">
                <h3>🤖 AI Intelligence <small>(Premium Feature)</small></h3>
                <div class="premium-feature">
                    <strong>⭐ Premium Exclusive</strong>
                </div>
                <ul class="feature-list">
                    <li>Financial health scoring</li>
                    <li>Spending pattern analysis</li>
                    <li>Predictive budgeting</li>
                    <li>Investment recommendations</li>
                    <li>Anomaly detection</li>
                </ul>
                <p><em>Available after tracking transactions</em></p>
            </div>
            
            <div class="card">
                <h3>💰 Integrated Experience</h3>
                <ul class="feature-list">
                    <li>Single app for all features</li>
                    <li>Seamless data flow between modules</li>
                    <li>Unified dashboard</li>
                    <li>Consistent user experience</li>
                    <li>No process switching required</li>
                </ul>
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 4rem;">
            <a href="/]] .. config.processes.budget .. [[/now/dashboard" class="btn">Access All Features in Budget App</a>
            <a href="/]] .. id .. [[/now/upgrade" class="btn btn-premium" style="margin-left: 1rem;">✨ Unlock AI Features</a>
            <p style="margin-top: 1rem; color: #888;">
                The Budget App is your gateway to all aoBudgetAI features
            </p>
        </div>
    </div>

    ]=] .. footer .. [=[
</body>
</html>
]=]

-- Upgrade Page (Complete Version)
upgrade_page = [=[
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Upgrade to Premium - aoBudgetAI</title>
    ]=] .. styles .. [=[
</head>
<body>
    ]=] .. nav .. [=[
    
    <div class="container" style="padding: 4rem 0;">
        <div style="text-align: center; margin-bottom: 3rem;">
            <h1 style="font-size: 3em; margin-bottom: 0.5em;">✨ Upgrade to Premium</h1>
            <p style="font-size: 1.2em; color: #666;">Unlock the full potential of aoBudgetAI</p>
        </div>

        <div class="pricing-grid">
            <!-- Freemium Plan -->
            <div class="pricing-card">
                <h3>Freemium</h3>
                <div class="price">$0</div>
                <p>Perfect for getting started with basic budgeting</p>
                <ul class="feature-list">
                    <li>Basic budget tracking</li>
                    <li>Expense categorization</li>
                    <li>Transaction history</li>
                    <li style="color: #ccc; text-decoration: line-through;">AI Financial Analysis</li>
                    <li style="color: #ccc; text-decoration: line-through;">Advanced Analytics</li>
                    <li style="color: #ccc; text-decoration: line-through;">Ad-free experience</li>
                    <li style="color: #ccc; text-decoration: line-through;">Priority support</li>
                </ul>
                <button class="btn" style="background: #6c757d; margin-top: 1rem;" disabled>Current Plan</button>
            </div>

            <!-- Premium Plan -->
            <div class="pricing-card featured">
                <div style="position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: gold; color: black; padding: 0.25rem 1rem; border-radius: 20px; font-size: 0.8em; font-weight: bold;">
                    RECOMMENDED
                </div>
                <h3>Premium</h3>
                <div class="price price-featured">$9.99<span style="font-size: 0.5em; color: #666;">/month</span></div>
                <p>Complete financial management with AI insights</p>
                <ul class="feature-list">
                    <li>All Freemium features</li>
                    <li>🤖 AI Financial Analysis</li>
                    <li>Advanced Analytics & Insights</li>
                    <li>Ad-free experience</li>
                    <li>Priority support</li>
                    <li>Export capabilities</li>
                    <li>Investment recommendations</li>
                </ul>
                <button class="btn btn-premium" style="margin-top: 1rem;" onclick="upgradeToPremium()">
                    Upgrade Now
                </button>
            </div>
        </div>

        <div class="card" style="margin-top: 2rem; text-align: center;">
            <h3>Ready to upgrade?</h3>
            <p>Click the button above to upgrade your account to Premium. You'll get immediate access to all premium features.</p>
            <div id="upgradeMessage" style="display: none;"></div>
        </div>

        <!-- Feature Comparison -->
        <div class="card" style="margin-top: 3rem;">
            <h3 style="text-align: center; margin-bottom: 2rem;">Feature Comparison</h3>
            <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 1rem; text-align: center;">
                <div style="font-weight: bold;">Feature</div>
                <div style="font-weight: bold;">Freemium</div>
                <div style="font-weight: bold; color: gold;">Premium</div>
                
                <div style="text-align: left;">Basic Budget Tracking</div>
                <div>✓</div>
                <div>✓</div>
                
                <div style="text-align: left;">Transaction History</div>
                <div>✓</div>
                <div>✓</div>
                
                <div style="text-align: left;">AI Financial Analysis</div>
                <div>✗</div>
                <div>✓</div>
                
                <div style="text-align: left;">Ad-free Experience</div>
                <div>✗</div>
                <div>✓</div>
                
                <div style="text-align: left;">Advanced Analytics</div>
                <div>✗</div>
                <div>✓</div>
                
                <div style="text-align: left;">Priority Support</div>
                <div>✗</div>
                <div>✓</div>
            </div>
        </div>
    </div>

    <script>
    function upgradeToPremium() {
        const button = event.target;
        button.disabled = true;
        button.innerHTML = 'Upgrading...';
        
        // In a real app, this would process payment
        // For demo, we'll simulate upgrade
        setTimeout(() => {
            const messageDiv = document.getElementById('upgradeMessage');
            messageDiv.innerHTML = `
                <div style="background: #d4edda; color: #155724; padding: 1rem; border-radius: 6px; margin-top: 1rem;">
                    <h3 style="margin: 0 0 0.5rem 0;">🎉 Upgrade Successful!</h3>
                    <p style="margin: 0;">You are now a Premium user! You can now access AI features in the Budget App.</p>
                </div>
            `;
            messageDiv.style.display = 'block';
            
            // Redirect to Budget App after success
            setTimeout(() => {
                window.location.href = '/]] .. config.processes.budget .. [[/now/dashboard';
            }, 2000);
        }, 1500);
    }
    </script>

    ]=] .. footer .. [=[
</body>
</html>
]=]

-- Handler for role responses from subscription process
Handlers.add('UserRoleResponse', 'user-role-response', function(msg)
    local data = json.decode(msg.Data)
    if data and data.user and data.role then
        UserRoles[data.user] = data.role
        print("Main Process: Updated role for user " .. data.user .. ": " .. data.role)
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
            features = {
                ai_access = role == "premium",
                ads = role ~= "premium",
                advanced_analytics = role == "premium"
            }
        })
    })
end)

-- Page Handlers
Handlers.add('GetHomePage', 'get-home', function(msg)
    send({Target = msg.From, Data = home})
end)

Handlers.add('GetFeaturesPage', 'get-features', function(msg)
    send({Target = msg.From, Data = features})
end)

Handlers.add('GetHowItWorksPage', 'get-how-it-works', function(msg)
    send({Target = msg.From, Data = howItWorks})
end)

Handlers.add('GetUpgradePage', 'get-upgrade', function(msg)
    send({Target = msg.From, Data = upgrade_page})
end)

-- Existing Handlers (Updated - AI process marked as internal)
Handlers.add('GetSitemap', 'get-sitemap', function(msg)
    local sitemap = {
        main = {
            process = id,
            pages = {
                home = "/now/home",
                features = "/now/features", 
                how_it_works = "/now/how-it-works",
                upgrade = "/now/upgrade"
            }
        },
        budget = {
            process = config.processes.budget,
            pages = {
                dashboard = "/now/dashboard",
                transactions = "/now/transactions",
                categories = "/now/categories",
                reports = "/now/reports",
                ai_insights = "/now/ai-insights"
            }
        },
        ai = {
            process = config.processes.ai,
            internal = true,
            description = "Background AI analysis service (premium only)",
            pages = {}
        },
        base_url = config.base_url
    }
    
    send({
        target = msg.From,
        data = json.encode(sitemap)
    })
end)

Handlers.add('GetProcessStatus', 'get-process-status', function(msg)
    local status = {
        main = {
            process_id = id,
            status = "active",
            role = "Landing Gateway",
            endpoints = 4,
            description = "Public landing page and documentation"
        },
        budget = {
            process_id = config.processes.budget,
            status = "active", 
            role = "Budget Tracking & AI Interface",
            endpoints = 5,
            description = "Main application with integrated AI features"
        },
        ai = {
            process_id = config.processes.ai,
            status = "active",
            role = "Background AI Analysis",
            endpoints = 0,
            description = "Premium-only service - no direct user access",
            internal = true
        }
    }
    
    send({
        target = msg.From,
        data = json.encode(status)
    })
end)

print("🚀 aoBudgetAI Main Process with Role System Initialized!")
print("📍 Landing page available at /now/home")
print("📊 Features page available at /now/features") 
print("🔧 How It Works page available at /now/how-it-works")
print("✨ Upgrade page available at /now/upgrade")
print("")
print("💰 Premium features enabled with role-based access")
print("🤖 AI access restricted to premium users")
print("🔗 Process Connections:")
print("   • Budget App: " .. config.processes.budget)
print("   • AI Insights: " .. config.processes.ai .. " (Premium Only)")
print("   • Subscription: " .. config.subscription_process_id)