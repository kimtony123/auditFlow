-- Budget Process - Combined Add Transaction Page (Income & Expense)
local json = require('json')

-- Combined transaction styles
transaction_styles = [[
<style>
    .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 2rem 1rem;
    }
    
    .card {
        background: var(--bg-card);
        border-radius: 8px;
        padding: 2rem;
        margin-bottom: 1.5rem;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .btn-income {
        background: var(--secondary);
    }
    
    .btn-expense {
        background: var(--danger);
    }
    
    .form-group {
        margin-bottom: 1.5rem;
    }
    
    .form-label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 600;
        color: var(--text);
    }
    
    .form-input, .form-select {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid var(--border);
        border-radius: 4px;
        font-size: 1rem;
        box-sizing: border-box;
    }
    
    .form-input:focus, .form-select:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 2px rgba(33, 133, 208, 0.2);
    }
    
    .message {
        padding: 1rem;
        border-radius: 6px;
        margin-bottom: 1rem;
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
    
    .grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        margin-top: 1.5rem;
    }
    
    .loading {
        display: inline-block;
        width: 20px;
        height: 20px;
        border: 3px solid #f3f3f3;
        border-top: 3px solid var(--primary);
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .tips {
        background: #f8f9fa;
        padding: 1.5rem;
        border-radius: 6px;
        margin-top: 2rem;
    }
    
    .transaction-highlight {
        background: linear-gradient(135deg, #e8f5e8, #f8f9fa);
        border-left: 4px solid var(--secondary);
        padding: 1rem;
        margin: 1rem 0;
        transition: all 0.3s ease;
    }
    
    .transaction-highlight.expense-mode {
        background: linear-gradient(135deg, #f8d7da, #f8f9fa);
        border-left-color: var(--danger);
    }
    
    .premium-tip {
        background: linear-gradient(135deg, gold, #fff9e6);
        border-left: 4px solid gold;
        padding: 1rem;
        margin: 1rem 0;
        color: black;
    }
    
    .type-selector {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        margin-bottom: 2rem;
    }
    
    .type-option {
        padding: 1rem;
        border: 2px solid var(--border);
        border-radius: 8px;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s ease;
        background: white;
    }
    
    .type-option:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    
    .type-option.active {
        border-color: var(--primary);
        background: var(--bg-card);
    }
    
    .type-option.income.active {
        border-color: var(--secondary);
        background: #e8f5e8;
    }
    
    .type-option.expense.active {
        border-color: var(--danger);
        background: #f8d7da;
    }
    
    .type-icon {
        font-size: 2rem;
        margin-bottom: 0.5rem;
    }
</style>
]]

-- Sample categories data
categories_data = categories_data or {
    -- Expense Categories
    {
        id = "1",
        name = "Housing",
        type = "expense",
        icon = "home"
    },
    {
        id = "2",
        name = "Food", 
        type = "expense",
        icon = "food"
    },
    {
        id = "3",
        name = "Transportation",
        type = "expense",
        icon = "car"
    },
    {
        id = "4",
        name = "Healthcare",
        type = "expense",
        icon = "heart"
    },
    {
        id = "5",
        name = "Entertainment",
        type = "expense",
        icon = "film"
    },
    -- Income Categories
    {
        id = "6",
        name = "Salary",
        type = "income",
        icon = "money"
    },
    {
        id = "7",
        name = "Freelance", 
        type = "income",
        icon = "laptop"
    },
    {
        id = "8",
        name = "Investments",
        type = "income",
        icon = "line graph"
    },
    {
        id = "9",
        name = "Business",
        type = "income",
        icon = "building"
    },
    {
        id = "10",
        name = "Dividends",
        type = "income",
        icon = "chart line"
    }
}

-- Transactions storage
transactions_data = transactions_data or {}

-- Wallet connection validation function
function isWalletConnected(msg)
    if not msg or not msg.From or msg.From == "" then
        return false, "Wallet not connected"
    end
    return true, nil
end

-- Combined Add Transaction Page
addTransaction = [=[
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Add Transaction - aoBudgetAI</title>
    ]=] .. styles .. transaction_styles .. [=[
</head>
<body>
    <!-- NAVIGATION_PLACEHOLDER -->
    
    <div class="container">
        <!-- Role-Based Banners -->
        <div id="premiumBanner" class="premium-banner" style="display: none;">
            <h3>⭐ Premium Member</h3>
            <p>You have full access to all features including AI Analysis!</p>
            <a href="/]=] .. config.ai_process_id .. [[/now/analysis" class="btn" style="background: black; color: gold;">Go to AI Analysis</a>
        </div>

        <div id="upgradeBanner" class="upgrade-banner" style="display: none;">
            <h3>✨ Upgrade to Premium</h3>
            <p>Unlock AI-powered financial insights and remove ads!</p>
            <a href="/]=] .. config.main_process_id .. [[/now/upgrade" class="btn btn-premium">Upgrade Now</a>
        </div>

        <div class="card">
            <h1 style="text-align: center; margin-bottom: 2rem;">Add Transaction</h1>

            <!-- Transaction Type Selector -->
            <div class="type-selector">
                <div class="type-option income active" data-type="income" onclick="selectTransactionType('income')">
                    <div class="type-icon">💰</div>
                    <h3 style="margin: 0; color: var(--secondary);">Income</h3>
                    <p style="margin: 0.5rem 0 0 0; color: var(--text);">Money coming in</p>
                </div>
                <div class="type-option expense" data-type="expense" onclick="selectTransactionType('expense')">
                    <div class="type-icon">💳</div>
                    <h3 style="margin: 0; color: var(--danger);">Expense</h3>
                    <p style="margin: 0.5rem 0 0 0; color: var(--text);">Money going out</p>
                </div>
            </div>

            <!-- Transaction Highlight -->
            <div id="transactionHighlight" class="transaction-highlight">
                <h3 id="highlightTitle" style="color: var(--secondary); margin: 0;">💰 Track Your Earnings</h3>
                <p id="highlightText" style="margin: 0.5rem 0 0 0;">Recording income helps you understand your cash flow and plan for future expenses.</p>
                <p><strong>User Role: <span id="userRoleDisplay">Loading...</span></strong></p>
            </div>

            <!-- Premium AI Tip -->
            <div id="premiumTip" class="premium-tip" style="display: none;">
                <h3 style="margin: 0; color: black;">🤖 AI Financial Insights Available</h3>
                <p style="margin: 0.5rem 0 0 0; color: black;">As a premium member, you can analyze your financial patterns with AI!</p>
                <a href="/]=] .. config.ai_process_id .. [[/now/analysis" class="btn" style="background: black; color: gold; margin-top: 0.5rem;">Analyze Finances</a>
            </div>

            <!-- Wallet Connection Warning -->
            <div id="walletWarning" class="message message-warning">
                <h3>Wallet Integration Notice</h3>
                <p>In a production environment, this would validate your Arweave wallet connection. For this demo, you can submit transactions directly.</p>
            </div>

            <!-- Success Message -->
            <div id="successMessage" class="message message-success" style="display: none;">
                <h3>Success!</h3>
                <p id="successText">Your transaction has been added successfully.</p>
            </div>

            <!-- Error Message -->
            <div id="errorMessage" class="message message-error" style="display: none;">
                <h3>Error</h3>
                <p id="errorText"></p>
            </div>

            <!-- Loading Message -->
            <div id="loadingMessage" class="message message-info" style="display: none;">
                <h3>Loading Categories</h3>
                <p>Please wait while we fetch your categories...</p>
                <div class="loading"></div>
            </div>

            <!-- No Categories Message -->
            <div id="noCategoriesMessage" class="message message-info" style="display: none;">
                <h3>No Categories Found</h3>
                <p>You need to create categories before adding transactions.</p>
                <a href="/]=] .. id .. [[/now/add-category" class="btn btn-success">Add Categories</a>
            </div>

            <!-- Transaction Form -->
            <form id="transactionForm">
                <input type="hidden" id="transactionType" value="income">

                <div class="form-group">
                    <label class="form-label">Category</label>
                    <select id="categorySelect" class="form-select" required>
                        <option value="">Select a category</option>
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label">Description</label>
                    <input type="text" id="descriptionInput" class="form-input" 
                           placeholder="Enter a description for this transaction" required>
                </div>

                <div class="form-group">
                    <label class="form-label">Date</label>
                    <input type="date" id="dateInput" class="form-input" required>
                </div>

                <div class="form-group">
                    <label class="form-label">Amount ($)</label>
                    <input type="number" id="amountInput" class="form-input" 
                           step="0.01" min="0.01" placeholder="0.00" required>
                </div>

                <div class="grid">
                    <button type="submit" class="btn btn-income" id="submitBtn">
                        💰 Add Income
                    </button>
                    <a href="/]=] .. id .. [[/now/dashboard" class="btn" style="background: #6c757d; text-align: center;">
                        ❌ Cancel
                    </a>
                </div>
            </form>

            <!-- Transaction Tips -->
            <div class="tips">
                <h3>💡 Smart Financial Tracking</h3>
                <p>Recording both income and expenses gives you a complete picture of your financial health.</p>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem;">
                    <div style="background: #e8f5e8; padding: 1rem; border-radius: 4px;">
                        <h4 style="color: var(--secondary); margin: 0 0 0.5rem 0;">Income Best Practices</h4>
                        <ul style="margin: 0;">
                            <li>Record income as soon as you receive it</li>
                            <li>Use specific categories for different sources</li>
                            <li>Note recurring vs one-time income</li>
                        </ul>
                    </div>
                    <div style="background: #ffe6e6; padding: 1rem; border-radius: 4px;">
                        <h4 style="color: var(--danger); margin: 0 0 0.5rem 0;">Expense Best Practices</h4>
                        <ul style="margin: 0;">
                            <li>Record expenses immediately after purchase</li>
                            <li>Use specific categories for accurate reporting</li>
                            <li>Review expenses weekly to spot trends</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- ADS_PLACEHOLDER -->

    ]=] .. footer .. [=[
    
    <script>
        let userRole = 'freemium';
        let currentTransactionType = 'income';
        let allCategories = ]=] .. json.encode(categories_data) .. [[;
        
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
            loadCategories();
        }
        
        function updateRoleUI(role) {
            const premiumBanner = document.getElementById('premiumBanner');
            const upgradeBanner = document.getElementById('upgradeBanner');
            const userRoleDisplay = document.getElementById('userRoleDisplay');
            const premiumTip = document.getElementById('premiumTip');
            
            userRoleDisplay.textContent = role === 'premium' ? '⭐ Premium' : 'Free';
            
            if (role === 'premium') {
                premiumBanner.style.display = 'block';
                upgradeBanner.style.display = 'none';
                premiumTip.style.display = 'block';
            } else {
                premiumBanner.style.display = 'none';
                upgradeBanner.style.display = 'block';
                premiumTip.style.display = 'none';
            }
        }
        
        function setDefaultDate() {
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('dateInput').value = today;
        }
        
        function loadCategories() {
            if (allCategories.length === 0) {
                showNoCategories();
            } else {
                populateCategorySelect(currentTransactionType);
            }
            setDefaultDate();
        }
        
        function populateCategorySelect(transactionType) {
            const select = document.getElementById('categorySelect');
            select.innerHTML = '<option value="">Select a category</option>';
            
            const filteredCategories = allCategories.filter(category => 
                category.type === transactionType
            );
            
            filteredCategories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                select.appendChild(option);
            });
            
            if (filteredCategories.length === 0) {
                showNoCategoriesForType(transactionType);
            }
        }
        
        function showNoCategories() {
            document.getElementById('noCategoriesMessage').style.display = 'block';
            document.getElementById('categorySelect').disabled = true;
            document.getElementById('submitBtn').disabled = true;
        }
        
        function showNoCategoriesForType(type) {
            document.getElementById('noCategoriesMessage').style.display = 'block';
            document.getElementById('noCategoriesMessage').innerHTML = `
                <h3>No ${type} Categories Found</h3>
                <p>You need to create ${type} categories before adding ${type} transactions.</p>
                <a href="/]=] .. id .. [[/now/add-category" class="btn btn-success">Add ${type.charAt(0).toUpperCase() + type.slice(1)} Categories</a>
            `;
            document.getElementById('categorySelect').disabled = true;
            document.getElementById('submitBtn').disabled = true;
        }
        
        function selectTransactionType(type) {
            currentTransactionType = type;
            
            // Update UI for selected type
            document.querySelectorAll('.type-option').forEach(option => {
                option.classList.remove('active');
            });
            document.querySelector(`.type-option.${type}`).classList.add('active');
            
            // Update form elements
            document.getElementById('transactionType').value = type;
            
            const submitBtn = document.getElementById('submitBtn');
            const highlight = document.getElementById('transactionHighlight');
            const highlightTitle = document.getElementById('highlightTitle');
            const highlightText = document.getElementById('highlightText');
            
            if (type === 'income') {
                submitBtn.textContent = '💰 Add Income';
                submitBtn.className = 'btn btn-income';
                highlight.className = 'transaction-highlight';
                highlightTitle.textContent = '💰 Track Your Earnings';
                highlightTitle.style.color = 'var(--secondary)';
                highlightText.textContent = 'Recording income helps you understand your cash flow and plan for future expenses.';
            } else {
                submitBtn.textContent = '💳 Add Expense';
                submitBtn.className = 'btn btn-expense';
                highlight.className = 'transaction-highlight expense-mode';
                highlightTitle.textContent = '💳 Track Your Spending';
                highlightTitle.style.color = 'var(--danger)';
                highlightText.textContent = 'Recording expenses helps you understand where your money is going and identify savings opportunities.';
            }
            
            // Reload categories for the selected type
            populateCategorySelect(type);
            
            // Update placeholder text
            const descriptionInput = document.getElementById('descriptionInput');
            if (type === 'income') {
                descriptionInput.placeholder = 'e.g., Monthly salary, Freelance project, Investment returns...';
            } else {
                descriptionInput.placeholder = 'e.g., Groceries, Rent payment, Gas refill, Dinner out...';
            }
        }
        
        function showSuccess(message) {
            document.getElementById('successText').textContent = message;
            document.getElementById('successMessage').style.display = 'block';
            setTimeout(() => {
                document.getElementById('successMessage').style.display = 'none';
            }, 3000);
        }
        
        function showError(message) {
            document.getElementById('errorText').textContent = message;
            document.getElementById('errorMessage').style.display = 'block';
        }
        
        function hideError() {
            document.getElementById('errorMessage').style.display = 'none';
        }
        
        // Form submission handler
        document.getElementById('transactionForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const type = document.getElementById('transactionType').value;
            const category = document.getElementById('categorySelect').value;
            const description = document.getElementById('descriptionInput').value;
            const date = document.getElementById('dateInput').value;
            const amount = document.getElementById('amountInput').value;
            
            // Validation
            if (!category || !description || !date || !amount || parseFloat(amount) <= 0) {
                showError('Please fill in all fields with valid values');
                return;
            }
            
            // Submit the transaction
            submitTransaction({
                type: type,
                category: category,
                description: description,
                date: date,
                amount: parseFloat(amount) * (type === 'income' ? 1 : -1)
            });
        });
        
        function submitTransaction(transactionData) {
            // Show loading state
            const submitBtn = document.getElementById('submitBtn');
            submitBtn.innerHTML = '⏳ Adding Transaction...';
            submitBtn.disabled = true;
            
            // Simulate API call
            setTimeout(() => {
                // In real app, this would call an AO process handler
                addTransactionToStorage(transactionData);
                
                // Show success
                const successMessage = transactionData.type === 'income' 
                    ? `Successfully recorded income of $${transactionData.amount.toFixed(2)}`
                    : `Successfully recorded expense of $${Math.abs(transactionData.amount).toFixed(2)}`;
                showSuccess(successMessage);
                
                // Reset form
                document.getElementById('transactionForm').reset();
                setDefaultDate();
                
                // Reset button
                submitBtn.innerHTML = transactionData.type === 'income' ? '💰 Add Income' : '💳 Add Expense';
                submitBtn.disabled = false;
                
            }, 1000);
        }
        
        function addTransactionToStorage(transactionData) {
            // This would be handled by AO process in production
            console.log('Transaction added:', transactionData);
            
            // For demo purposes, show a confirmation in console
            const amount = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            }).format(Math.abs(transactionData.amount));
            
            console.log(`Successfully recorded ${transactionData.type} of ${amount} for ${transactionData.description}`);
        }
        
        // Add some helpful auto-fill examples
        document.getElementById('descriptionInput').addEventListener('focus', function() {
            if (!this.value) {
                if (currentTransactionType === 'income') {
                    this.placeholder = 'e.g., Monthly salary, Freelance project, Investment returns...';
                } else {
                    this.placeholder = 'e.g., Groceries, Rent payment, Gas refill, Dinner out...';
                }
            }
        });
        
        document.getElementById('descriptionInput').addEventListener('blur', function() {
            this.placeholder = 'Enter a description for this transaction';
        });
    </script>
</body>
</html>
]=]

-- Combined Handler for Add Transaction
Handlers.add('GetAddTransaction', 'get-add-transaction', function(msg)
    local userAddress = msg.From
    local navigation = getNavigation(userAddress, 'add-transaction')
    local ads = getAds(userAddress)
    
    local page = addTransaction:gsub("<!-- NAVIGATION_PLACEHOLDER -->", navigation)
                              :gsub("<!-- ADS_PLACEHOLDER -->", ads)
                              :gsub("MAIN_PROCESS_ID", config.main_process_id)
                              :gsub("AI_PROCESS_ID", config.ai_process_id)
    
    send({Target = msg.From, Data = page})
end)

-- Combined Transaction Handler
Handlers.add('AddTransaction', 'add-transaction', function(msg)
    local isConnected, errorMsg = isWalletConnected(msg)
    if not isConnected then
        send({
            Target = msg.From,
            Data = json.encode({
                code = 400,
                message = errorMsg
            })
        })
        return
    end
    
    local data = json.decode(msg.Data)
    
    -- Validate required fields
    if not data.type or not data.category or not data.description or not data.date or not data.amount then
        send({
            Target = msg.From,
            Data = json.encode({
                code = 400,
                message = "Missing required fields"
            })
        })
        return
    end
    
    -- Validate amount based on type
    if data.type == "income" and data.amount <= 0 then
        send({
            Target = msg.From,
            Data = json.encode({
                code = 400,
                message = "Income amount must be positive"
            })
        })
        return
    end
    
    if data.type == "expense" and data.amount >= 0 then
        send({
            Target = msg.From,
            Data = json.encode({
                code = 400,
                message = "Expense amount must be negative"
            })
        })
        return
    end
    
    -- Create new transaction
    local new_transaction = {
        id = tostring(#transactions_data + 1),
        type = data.type,
        category = data.category,
        description = data.description,
        date = data.date,
        amount = data.amount
    }
    
    table.insert(transactions_data, new_transaction)
    
    send({
        Target = msg.From,
        Data = json.encode({
            code = 200,
            transaction_id = new_transaction.id,
            message = data.type:gsub("^%l", string.upper) .. " added successfully"
        })
    })
end)

print("💰 Combined Transaction page CREATED!")
print("✅ Single page for both income and expense")
print("✅ Dynamic type selector with visual feedback")
print("✅ Role management integrated")
print("✅ Smart category filtering based on transaction type")
print("🎯 Much better user experience!")