-- Budget Process - Complete Role Management System
local json = require('json')

-- Configuration
config = {
    site_name = "aoBudgetAI - Budget Tracker",
    main_process_id = "MAIN_PROCESS_ID",
    ai_process_id = "AI_PROCESS_ID",
    subscription_process_id = "fcwefM3i145qemaD-uCdPtQsvM_YWEif6CyCeiKUaQI"
}

-- Role management
UserRoles = UserRoles or {}
AD_INTERVAL = 60000 -- 1 minute in milliseconds

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

-- Dynamic navigation based on user role
function getNavigation(userAddress, currentPage)
    local role = getUserRole(userAddress)
    local ai_link = ""
    
    if role == "premium" then
        ai_link = [[<a href="/]] .. config.ai_process_id .. [[/now/analysis" style="color: white; text-decoration: none;">🤖 AI Analysis</a>]]
    else
        ai_link = [[<a href="/]] .. config.main_process_id .. [[/now/upgrade" style="color: gold; text-decoration: none;">✨ Upgrade to Premium</a>]]
    end
    
    -- Determine active page styling
    local dashboardActive = currentPage == 'dashboard' and 'border-bottom: 2px solid white;' or ''
    local transactionsActive = currentPage == 'transactions' and 'border-bottom: 2px solid white;' or ''
    local categoriesActive = currentPage == 'categories' and 'border-bottom: 2px solid white;' or ''
    local reportsActive = currentPage == 'reports' and 'border-bottom: 2px solid white;' or ''
    local addIncomeActive = currentPage == 'add-income' and 'border-bottom: 2px solid white;' or ''
    local addExpenseActive = currentPage == 'add-expense' and 'border-bottom: 2px solid white;' or ''
    
    return [[
<nav style="background: linear-gradient(135deg, #0f2f3f 0%, #1a202c 100%); padding: 1rem; color: white;">
    <div style="max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center;">
        <a href="/]] .. id .. [[/now/dashboard" style="color: #FFFFFF; text-decoration: none; font-weight: bold; font-size: 1.5rem;">aoBudgetAI</a>
        <div style="display: flex; gap: 1.5rem; align-items: center;">
            <span style="color: ]] .. (role == "premium" and "gold" or "white") .. [[;">
                ]] .. (role == "premium" and "⭐ Premium" or "Free") .. [[
            </span>
            <a href="/]] .. id .. [[/now/dashboard" style="color: white; text-decoration: none; ]] .. dashboardActive .. [[">Dashboard</a>
            <a href="/]] .. id .. [[/now/transactions" style="color: white; text-decoration: none; ]] .. transactionsActive .. [[">Transactions</a>
            <a href="/]] .. id .. [[/now/categories" style="color: white; text-decoration: none; ]] .. categoriesActive .. [[">Categories</a>
            <a href="/]] .. id .. [[/now/reports" style="color: white; text-decoration: none; ]] .. reportsActive .. [[">Reports</a>
            <a href="/]] .. id .. [[/now/add-income" style="color: white; text-decoration: none; ]] .. addIncomeActive .. [[">Add Income</a>
            <a href="/]] .. id .. [[/now/add-expense" style="color: white; text-decoration: none; ]] .. addExpenseActive .. [[">Add Expense</a>
            ]] .. ai_link .. [[
            <a href="/]] .. config.main_process_id .. [[/now/home" style="color: white; text-decoration: none;">← Back to Home</a>
        </div>
    </div>
</nav>
]]
end

-- Ads component for freemium users
function getAds(userAddress)
    local role = getUserRole(userAddress)
    
    if role == "premium" then
        return "" -- No ads for premium users
    end
    
    return [[
<div id="adContainer" style="position: fixed; bottom: 20px; right: 20px; background: #2d3748; color: white; padding: 1rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); z-index: 1000; max-width: 300px; display: none;">
    <div style="display: flex; justify-content: between; align-items: start; margin-bottom: 0.5rem;">
        <strong>Advertisement</strong>
        <button onclick="closeAd()" style="background: none; border: none; color: white; cursor: pointer; margin-left: auto;">✕</button>
    </div>
    <p style="margin: 0; font-size: 0.9rem;">Upgrade to Premium to remove ads and unlock AI features!</p>
    <a href="/]] .. config.main_process_id .. [[/now/upgrade" style="color: gold; text-decoration: none; font-size: 0.8rem;">Upgrade Now</a>
</div>

<script>
let adTimer;
function showAd() {
    const adContainer = document.getElementById('adContainer');
    if (adContainer) {
        adContainer.style.display = 'block';
        setTimeout(() => {
            adContainer.style.display = 'none';
        }, 10000);
    }
}

function closeAd() {
    const adContainer = document.getElementById('adContainer');
    if (adContainer) {
        adContainer.style.display = 'none';
    }
}

// Show ad every minute (60000 ms)
adTimer = setInterval(showAd, 60000);
setTimeout(showAd, 5000);
</script>
]]
end

-- Styles for dashboard and other pages
styles = [[
<style>
    :root {
        --primary: #2185D0;
        --primary-dark: #1a6fb3;
        --secondary: #21BA45;
        --danger: #DB2828;
        --warning: #F2711C;
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
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem 1rem;
    }
    
    .dashboard-section {
        margin-bottom: 3rem;
        padding: 2rem;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .stats-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
    }
    
    .stat-card {
        padding: 1.5rem;
        border-radius: 8px;
        background: #f8f9fa;
        text-align: center;
    }
    
    .stat-value {
        font-size: 2rem;
        font-weight: bold;
        margin: 0.5rem 0;
    }
    
    .category-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
    }
    
    .progress-bar {
        background: #e9ecef;
        border-radius: 10px;
        height: 8px;
        margin: 0.5rem 0;
    }
    
    .progress-fill {
        height: 100%;
        border-radius: 10px;
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
    
    .btn-success {
        background: var(--secondary);
    }
    
    .btn-premium {
        background: gold;
        color: black;
        font-weight: bold;
    }
    
    .premium-banner {
        background: linear-gradient(135deg, gold, #ffd700);
        color: black;
        padding: 1.5rem;
        border-radius: 8px;
        text-align: center;
        margin-bottom: 2rem;
    }
    
    .upgrade-banner {
        background: linear-gradient(135deg, #8B5CF6, #7C3AED);
        color: white;
        padding: 1.5rem;
        border-radius: 8px;
        text-align: center;
        margin-bottom: 2rem;
    }
</style>
]]

-- Footer
footer = [[
<footer style="background: #1a1a1a; padding: 2rem 0; margin-top: 3rem; color: #888;">
    <div style="max-width: 1200px; margin: 0 auto; text-align: center;">
        <p>&copy; 2025 aoBudgetAI. Budget Management.</p>
    </div>
</footer>
]]

-- Updated Dashboard Page with Role-Based Content
dashboard = [=[
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - aoBudgetAI</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    ]=] .. styles .. [=[
</head>
<body>
    <!-- NAVIGATION_PLACEHOLDER -->
    
    <div class="container" style="padding: 2rem;">
        <!-- Role-Based Banners -->
        <div id="premiumBanner" class="premium-banner" style="display: none;">
            <h3>⭐ Premium Member</h3>
            <p>You have full access to all features including AI Analysis!</p>
            <a href="/AI_PROCESS_ID/now/analysis" class="btn" style="background: black; color: gold;">Go to AI Analysis</a>
        </div>

        <div id="upgradeBanner" class="upgrade-banner" style="display: none;">
            <h3>✨ Upgrade to Premium</h3>
            <p>Unlock AI-powered financial insights and remove ads!</p>
            <a href="/MAIN_PROCESS_ID/now/upgrade" class="btn btn-premium">Upgrade Now</a>
        </div>

        <!-- Wallet Connection Status -->
        <div id="walletStatus" class="dashboard-section">
            <h3>Wallet Connection</h3>
            <p>Connect your wallet to view your financial data.</p>
            <button class="btn" onclick="connectWallet()">Connect Wallet</button>
        </div>
        
        <!-- Loading State -->
        <div id="loadingState" class="dashboard-section" style="display: none;">
            <h3>Loading Transactions</h3>
            <p>Please wait while we fetch your financial data...</p>
        </div>
        
        <!-- Main Dashboard Content -->
        <div id="dashboardContent" style="display: none;">
            <!-- Overview Section -->
            <div id="overviewSection"></div>
            
            <!-- Category Breakdown -->
            <div id="categorySection"></div>
            
            <!-- History Chart -->
            <div class="dashboard-section">
                <h2>Income vs Expenses History</h2>
                <canvas id="historyChart" width="400" height="200"></canvas>
            </div>
            
            <!-- Action Buttons -->
            <div class="dashboard-section">
                <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                    <a href="/]=] .. id .. [[/now/add-income" class="btn btn-success">💰 Add Income</a>
                    <a href="/]=] .. id .. [[/now/add-expense" class="btn" style="background: #DB2828;">💳 Add Expense</a>
                    <button onclick="refreshData()" class="btn" style="background: #2185D0;">🔄 Refresh Data</button>
                    <button onclick="checkUserRole()" class="btn" style="background: #6435C9;">👤 Check Role</button>
                </div>
            </div>
        </div>
        
        <!-- Error State -->
        <div id="errorState" class="dashboard-section" style="display: none; background: #ffe6e6;">
            <h3 style="color: red;">Error</h3>
            <p id="errorMessage"></p>
            <button class="btn" onclick="dismissError()">Dismiss</button>
        </div>
    </div>

    <!-- ADS_PLACEHOLDER -->

    <script>
        let transactions = [];
        let timeFilter = 'last35days';
        let userRole = 'freemium';
        
        // Initialize the page
        document.addEventListener('DOMContentLoaded', function() {
            checkUserRole();
        });
        
        function checkUserRole() {
            // Simulate role check - in real app, this would call AO process
            const urlParams = new URLSearchParams(window.location.search);
            const role = urlParams.get('role') || 'freemium';
            userRole = role;
            updateRoleUI(role);
        }
        
        function updateRoleUI(role) {
            const premiumBanner = document.getElementById('premiumBanner');
            const upgradeBanner = document.getElementById('upgradeBanner');
            
            if (role === 'premium') {
                premiumBanner.style.display = 'block';
                upgradeBanner.style.display = 'none';
            } else {
                premiumBanner.style.display = 'none';
                upgradeBanner.style.display = 'block';
            }
            
            loadDashboardData();
        }
        
        function loadDashboardData() {
            document.getElementById('walletStatus').style.display = 'none';
            document.getElementById('loadingState').style.display = 'block';
            
            setTimeout(() => {
                document.getElementById('loadingState').style.display = 'none';
                document.getElementById('dashboardContent').style.display = 'block';
                
                updateFinancialOverview();
                updateCategoryBreakdown();
                createHistoryChart();
            }, 1500);
        }
        
        function updateFinancialOverview() {
            const overviewSection = document.getElementById('overviewSection');
            overviewSection.innerHTML = `
                <div class="dashboard-section">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                        <h2>Financial Overview</h2>
                        <select id="timeFilter" onchange="updateTimeFilter(this.value)" style="padding: 0.5rem; border-radius: 4px; border: 1px solid #ddd;">
                            <option value="last7days">Last 7 days</option>
                            <option value="last30days">Last 30 days</option>
                            <option value="last35days" selected>Last 35 days</option>
                            <option value="last90days">Last 90 days</option>
                        </select>
                    </div>
                    
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div style="color: green; font-weight: bold;">💰 Income</div>
                            <div class="stat-value">$4,250</div>
                            <div style="color: #666;">USDA</div>
                        </div>
                        
                        <div class="stat-card">
                            <div style="color: red; font-weight: bold;">💳 Expenses</div>
                            <div class="stat-value">$2,850</div>
                            <div style="color: #666;">USDA</div>
                        </div>
                        
                        <div class="stat-card">
                            <div style="color: blue; font-weight: bold;">⚖️ Balance</div>
                            <div class="stat-value">$1,400</div>
                            <div style="color: #666;">USDA</div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        function updateCategoryBreakdown() {
            const categorySection = document.getElementById('categorySection');
            categorySection.innerHTML = `
                <div class="dashboard-section">
                    <h2>Category Breakdown</h2>
                    <div class="category-grid">
                        <div>
                            <h3>Income Categories</h3>
                            <div>
                                <div style="margin-bottom: 1rem;">
                                    <div style="display: flex; justify-content: space-between;">
                                        <span>Salary</span>
                                        <span>$3,000</span>
                                    </div>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: 70%; background: green;"></div>
                                    </div>
                                    <div style="text-align: right; font-size: 0.8rem; color: #666;">70.6%</div>
                                </div>
                                <div style="margin-bottom: 1rem;">
                                    <div style="display: flex; justify-content: space-between;">
                                        <span>Freelance</span>
                                        <span>$1,250</span>
                                    </div>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: 29.4%; background: green;"></div>
                                    </div>
                                    <div style="text-align: right; font-size: 0.8rem; color: #666;">29.4%</div>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <h3>Expense Categories</h3>
                            <div>
                                <div style="margin-bottom: 1rem;">
                                    <div style="display: flex; justify-content: space-between;">
                                        <span>Housing</span>
                                        <span>$1,200</span>
                                    </div>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: 42%; background: red;"></div>
                                    </div>
                                    <div style="text-align: right; font-size: 0.8rem; color: #666;">42.1%</div>
                                </div>
                                <div style="margin-bottom: 1rem;">
                                    <div style="display: flex; justify-content: space-between;">
                                        <span>Food</span>
                                        <span>$450</span>
                                    </div>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: 16%; background: red;"></div>
                                    </div>
                                    <div style="text-align: right; font-size: 0.8rem; color: #666;">15.8%</div>
                                </div>
                                <div style="margin-bottom: 1rem;">
                                    <div style="display: flex; justify-content: space-between;">
                                        <span>Transportation</span>
                                        <span>$300</span>
                                    </div>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: 10.5%; background: red;"></div>
                                    </div>
                                    <div style="text-align: right; font-size: 0.8rem; color: #666;">10.5%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        function createHistoryChart() {
            const ctx = document.getElementById('historyChart').getContext('2d');
            if (ctx) {
                new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                        datasets: [
                            {
                                label: 'Income',
                                data: [3000, 3200, 3100, 3300, 4250, 4000],
                                borderColor: 'green',
                                backgroundColor: 'rgba(0, 255, 0, 0.1)',
                                tension: 0.4
                            },
                            {
                                label: 'Expenses',
                                data: [2500, 2600, 2700, 2800, 2850, 2900],
                                borderColor: 'red',
                                backgroundColor: 'rgba(255, 0, 0, 0.1)',
                                tension: 0.4
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            title: {
                                display: true,
                                text: 'Monthly Income vs Expenses'
                            }
                        }
                    }
                });
            }
        }
        
        function connectWallet() {
            document.getElementById('walletStatus').style.display = 'none';
            document.getElementById('loadingState').style.display = 'block';
            setTimeout(() => {
                checkUserRole();
            }, 1000);
        }
        
        function refreshData() {
            document.getElementById('loadingState').style.display = 'block';
            setTimeout(() => {
                document.getElementById('loadingState').style.display = 'none';
                updateFinancialOverview();
                updateCategoryBreakdown();
            }, 1000);
        }
        
        function dismissError() {
            document.getElementById('errorState').style.display = 'none';
        }
    </script>
</body>
</html>
]=]

-- Page Handlers with Role Management
Handlers.add('GetDashboard', 'get-dashboard', function(msg)
    local userAddress = msg.From
    local navigation = getNavigation(userAddress, 'dashboard')
    local ads = getAds(userAddress)
    
    local page = dashboard:gsub("<!-- NAVIGATION_PLACEHOLDER -->", navigation)
                       :gsub("<!-- ADS_PLACEHOLDER -->", ads)
                       :gsub("MAIN_PROCESS_ID", config.main_process_id)
                       :gsub("AI_PROCESS_ID", config.ai_process_id)
    
    send({Target = msg.From, Data = page})
end)

-- Transactions Handler
Handlers.add('GetTransactions', 'get-transactions', function(msg)
    local userAddress = msg.From
    local navigation = getNavigation(userAddress, 'transactions')
    local ads = getAds(userAddress)
    
    -- You need to define 'transactions' page variable similar to dashboard
    -- For now, we'll return a simple message
    local page = [[
    <!DOCTYPE html>
    <html>
    <head>
        <title>Transactions - aoBudgetAI</title>
        ]] .. styles .. [[
    </head>
    <body>
        ]] .. navigation .. [[
        <div class="container">
            <div class="dashboard-section">
                <h1>Transactions Page</h1>
                <p>This page would show all your transactions with role-based navigation and ads.</p>
                <p>User Role: ]] .. getUserRole(userAddress) .. [[</p>
            </div>
        </div>
        ]] .. ads .. [[
        ]] .. footer .. [[
    </body>
    </html>
    ]]
    
    send({Target = msg.From, Data = page})
end)

-- Categories Handler  
Handlers.add('GetCategories', 'get-categories', function(msg)
    local userAddress = msg.From
    local navigation = getNavigation(userAddress, 'categories')
    local ads = getAds(userAddress)
    
    local page = [[
    <!DOCTYPE html>
    <html>
    <head>
        <title>Categories - aoBudgetAI</title>
        ]] .. styles .. [[
    </head>
    <body>
        ]] .. navigation .. [[
        <div class="container">
            <div class="dashboard-section">
                <h1>Categories Page</h1>
                <p>This page would show budget categories with role-based navigation and ads.</p>
                <p>User Role: ]] .. getUserRole(userAddress) .. [[</p>
            </div>
        </div>
        ]] .. ads .. [[
        ]] .. footer .. [[
    </body>
    </html>
    ]]
    
    send({Target = msg.From, Data = page})
end)

-- Add Income Handler
Handlers.add('GetAddIncome', 'get-add-income', function(msg)
    local userAddress = msg.From
    local navigation = getNavigation(userAddress, 'add-income')
    local ads = getAds(userAddress)
    
    local page = [[
    <!DOCTYPE html>
    <html>
    <head>
        <title>Add Income - aoBudgetAI</title>
        ]] .. styles .. [[
    </head>
    <body>
        ]] .. navigation .. [[
        <div class="container">
            <div class="dashboard-section">
                <h1>Add Income Page</h1>
                <p>This page would allow adding income transactions with role-based navigation and ads.</p>
                <p>User Role: ]] .. getUserRole(userAddress) .. [[</p>
            </div>
        </div>
        ]] .. ads .. [[
        ]] .. footer .. [[
    </body>
    </html>
    ]]
    
    send({Target = msg.From, Data = page})
end)

-- Add Expense Handler
Handlers.add('GetAddExpense', 'get-add-expense', function(msg)
    local userAddress = msg.From
    local navigation = getNavigation(userAddress, 'add-expense')
    local ads = getAds(userAddress)
    
    local page = [[
    <!DOCTYPE html>
    <html>
    <head>
        <title>Add Expense - aoBudgetAI</title>
        ]] .. styles .. [[
    </head>
    <body>
        ]] .. navigation .. [[
        <div class="container">
            <div class="dashboard-section">
                <h1>Add Expense Page</h1>
                <p>This page would allow adding expense transactions with role-based navigation and ads.</p>
                <p>User Role: ]] .. getUserRole(userAddress) .. [[</p>
            </div>
        </div>
        ]] .. ads .. [[
        ]] .. footer .. [[
    </body>
    </html>
    ]]
    
    send({Target = msg.From, Data = page})
end)

-- Handler for role responses from subscription process
Handlers.add('UserRoleResponse', 'user-role-response', function(msg)
    local data = json.decode(msg.Data)
    if data and data.user and data.role then
        UserRoles[data.user] = data.role
        print("Budget Process: Updated role for user " .. data.user .. ": " .. data.role)
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

print("💰 Budget Process with Complete Role Management Initialized!")
print("⭐ Role-based navigation enabled on all pages")
print("💰 Ads showing for freemium users")
print("🤖 AI access controlled by user role")
print("🔗 Connected to subscription process: " .. config.subscription_process_id)