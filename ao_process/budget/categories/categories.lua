-- Budget Process - Categories Page (Integrated with Role Management)
local json = require('json')

-- REMOVE these duplicate definitions (they already exist in memory):
-- config = {...}  -- DELETE
-- nav = [[...]]   -- DELETE
-- styles = [[...]] -- DELETE (use the main styles)

-- Categories-specific styles (append to main styles)
categories_styles = [[
<style>
    .card {
        background: var(--bg-card);
        border-radius: 8px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .btn-success {
        background: var(--secondary);
    }
    
    .btn-danger {
        background: var(--danger);
    }
    
    .btn-warning {
        background: var(--warning);
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
    
    .message-info {
        background: #d1ecf1;
        border: 1px solid #bee5eb;
        color: #0c5460;
    }
    
    .message-error {
        background: #f8d7da;
        border: 1px solid #f5c6cb;
        color: #721c24;
    }
    
    .categories-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 1.5rem;
        margin: 2rem 0;
    }
    
    .category-card {
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 1.5rem;
        text-align: center;
        position: relative;
    }
    
    .category-card.income {
        border-left: 4px solid var(--secondary);
    }
    
    .category-card.expense {
        border-left: 4px solid var(--danger);
    }
    
    .category-icon {
        font-size: 2rem;
        margin-bottom: 0.5rem;
    }
    
    .category-actions {
        margin-top: 1rem;
        display: flex;
        gap: 0.5rem;
        justify-content: center;
    }
    
    .icon-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 4px;
        font-size: 1.2rem;
    }
    
    .icon-btn:hover {
        background: #f8f9fa;
    }
    
    .modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 1000;
    }
    
    .modal-content {
        background: white;
        margin: 10% auto;
        padding: 2rem;
        border-radius: 8px;
        max-width: 500px;
    }
    
    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: 2rem 0 1rem 0;
        padding-bottom: 0.5rem;
        border-bottom: 2px solid var(--border);
    }
    
    .placeholder-section {
        text-align: center;
        padding: 3rem;
        background: #f8f9fa;
        border-radius: 8px;
        margin: 2rem 0;
    }
    
    .premium-category-tip {
        background: linear-gradient(135deg, gold, #fff9e6);
        border-left: 4px solid gold;
        padding: 1rem;
        margin: 1rem 0;
        color: black;
    }
</style>
]]

-- Sample categories data
categories_data = categories_data or {
    -- Income Categories
    {
        id = "1",
        name = "Salary",
        description = "Monthly salary income",
        type = "income",
        icon = "💰",
        transaction_count = 12
    },
    {
        id = "2",
        name = "Freelance",
        description = "Freelance work income",
        type = "income", 
        icon = "💻",
        transaction_count = 8
    },
    {
        id = "3",
        name = "Investments",
        description = "Investment returns",
        type = "income",
        icon = "📈",
        transaction_count = 5
    },
    {
        id = "4", 
        name = "Bonus",
        description = "Performance bonuses",
        type = "income",
        icon = "🎁",
        transaction_count = 2
    },
    
    -- Expense Categories
    {
        id = "5",
        name = "Housing",
        description = "Rent and mortgage payments",
        type = "expense",
        icon = "🏠",
        transaction_count = 24
    },
    {
        id = "6",
        name = "Food",
        description = "Groceries and dining",
        type = "expense",
        icon = "🍕",
        transaction_count = 45
    },
    {
        id = "7",
        name = "Transportation",
        description = "Gas, parking, and transit",
        type = "expense",
        icon = "🚗",
        transaction_count = 18
    },
    {
        id = "8",
        name = "Entertainment",
        description = "Movies, games, and hobbies",
        type = "expense",
        icon = "🎮",
        transaction_count = 12
    },
    {
        id = "9",
        name = "Healthcare",
        description = "Medical expenses",
        type = "expense",
        icon = "🏥",
        transaction_count = 6
    },
    {
        id = "10",
        name = "Utilities",
        description = "Electricity, water, internet",
        type = "expense",
        icon = "💡",
        transaction_count = 18
    }
}

-- Categories Page (Updated with Role Management)
categories = [=[
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Categories - aoBudgetAI</title>
    ]=] .. styles .. categories_styles .. [=[
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

        <!-- Header Section -->
        <div class="card">
            <div style="display: flex; justify-content: between; align-items: center;">
                <h1 style="margin: 0;">📁 Categories</h1>
                <div style="display: flex; gap: 1rem;">
                    <a href="/]=] .. id .. [[/now/add-category" class="btn btn-success">+ Add Category</a>
                    <button onclick="refreshCategories()" class="btn">🔄 Refresh</button>
                    <button onclick="showMockModal()" class="btn btn-warning">✨ Mock Data</button>
                    <button onclick="checkUserRole()" class="btn" style="background: var(--warning);">👤 Check Role</button>
                </div>
            </div>
        </div>

        <!-- Premium AI Categories Tip -->
        <div id="premiumCategoryTip" class="premium-category-tip" style="display: none;">
            <h3 style="margin: 0; color: black;">🤖 AI Category Optimization</h3>
            <p style="margin: 0.5rem 0 0 0; color: black;">As a premium member, you can use AI to analyze and optimize your category structure!</p>
            <a href="/]=] .. config.ai_process_id .. [[/now/analysis" class="btn" style="background: black; color: gold; margin-top: 0.5rem;">Optimize Categories</a>
        </div>

        <!-- Information Message -->
        <div class="message message-info">
            <h3>Managing Categories</h3>
            <p>Categories help you organize your transactions. You can add new categories and delete existing ones. Be careful when deleting categories as this action cannot be undone.</p>
            <p><strong>User Role: <span id="userRoleDisplay">Loading...</span></strong></p>
        </div>

        <!-- Wallet Connection Warning -->
        <div class="message message-warning">
            <h3>Wallet Integration Notice</h3>
            <p>In a production environment, this would connect to your Arweave wallet. For this demo, categories are stored locally.</p>
        </div>

        <!-- Loading State -->
        <div id="loadingState" class="message message-info" style="display: none;">
            <h3>Loading Categories</h3>
            <p>Please wait while we fetch your categories...</p>
        </div>

        <!-- Error State -->
        <div id="errorState" class="message message-error" style="display: none;">
            <h3>Error</h3>
            <p id="errorMessage"></p>
            <button onclick="dismissError()" class="btn" style="margin-top: 0.5rem;">Dismiss</button>
        </div>

        <!-- No Categories State -->
        <div id="noCategories" class="message message-info" style="display: none;">
            <h3>No Categories Found</h3>
            <p>You don't have any categories yet. Would you like to create some mock data to test the app?</p>
            <button onclick="showMockModal()" class="btn btn-warning" style="margin-top: 0.5rem;">Create Mock Categories</button>
        </div>

        <!-- Income Categories Section -->
        <div id="incomeSection" style="display: none;">
            <div class="section-header">
                <h2 style="color: var(--secondary); margin: 0;">💰 Income Categories</h2>
                <span id="incomeCount"></span>
            </div>

            <div id="incomeCategories" class="categories-grid">
                <!-- Income categories will be populated here -->
            </div>

            <div id="noIncomeCategories" class="placeholder-section" style="display: none;">
                <h3>💵 No Income Categories</h3>
                <p>Add some income categories to get started</p>
            </div>
        </div>

        <!-- Expense Categories Section -->
        <div id="expenseSection" style="display: none;">
            <div class="section-header">
                <h2 style="color: var(--danger); margin: 0;">💳 Expense Categories</h2>
                <span id="expenseCount"></span>
            </div>

            <div id="expenseCategories" class="categories-grid">
                <!-- Expense categories will be populated here -->
            </div>

            <div id="noExpenseCategories" class="placeholder-section" style="display: none;">
                <h3>🛒 No Expense Categories</h3>
                <p>Add some expense categories to get started</p>
            </div>
        </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div id="deleteModal" class="modal">
        <div class="modal-content">
            <h3>Delete Category</h3>
            <p id="deleteModalText">Are you sure you want to delete this category? This action cannot be undone.</p>
            <div style="display: flex; gap: 0.5rem; margin-top: 1.5rem;">
                <button onclick="closeDeleteModal()" class="btn" style="background: #6c757d;">Cancel</button>
                <button onclick="confirmDelete()" class="btn btn-danger">Delete</button>
            </div>
        </div>
    </div>

    <!-- Mock Data Modal -->
    <div id="mockModal" class="modal">
        <div class="modal-content">
            <h3>Create Mock Categories</h3>
            <p>Would you like to add sample categories to test the application? This will create:</p>
            <ul>
                <li>4 income categories (Salary, Freelance, Investments, Bonus)</li>
                <li>6 expense categories (Housing, Food, Transportation, etc.)</li>
            </ul>
            <div style="display: flex; gap: 0.5rem; margin-top: 1.5rem;">
                <button onclick="closeMockModal()" class="btn" style="background: #6c757d;">Cancel</button>
                <button onclick="addMockCategories()" class="btn btn-warning">Create Mock Categories</button>
            </div>
        </div>
    </div>

    <!-- ADS_PLACEHOLDER -->

    ]=] .. footer .. [=[
    
    <script>
        let categories = [];
        let categoryToDelete = null;
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
            loadCategories();
        }
        
        function updateRoleUI(role) {
            const premiumBanner = document.getElementById('premiumBanner');
            const upgradeBanner = document.getElementById('upgradeBanner');
            const userRoleDisplay = document.getElementById('userRoleDisplay');
            const premiumCategoryTip = document.getElementById('premiumCategoryTip');
            
            userRoleDisplay.textContent = role === 'premium' ? '⭐ Premium' : 'Free';
            
            if (role === 'premium') {
                premiumBanner.style.display = 'block';
                upgradeBanner.style.display = 'none';
                premiumCategoryTip.style.display = 'block';
            } else {
                premiumBanner.style.display = 'none';
                upgradeBanner.style.display = 'block';
                premiumCategoryTip.style.display = 'none';
            }
        }
        
        function loadCategories() {
            document.getElementById('loadingState').style.display = 'block';
            
            // Simulate API call delay
            setTimeout(() => {
                categories = ]=] .. json.encode(categories_data) .. [[;
                
                if (categories.length === 0) {
                    showNoCategories();
                } else {
                    showCategories();
                }
                
                document.getElementById('loadingState').style.display = 'none';
            }, 1000);
        }
        
        function showCategories() {
            const incomeCategories = categories.filter(cat => cat.type === 'income');
            const expenseCategories = categories.filter(cat => cat.type === 'expense');
            
            // Update counts
            document.getElementById('incomeCount').textContent = `${incomeCategories.length} categories`;
            document.getElementById('expenseCount').textContent = `${expenseCategories.length} categories`;
            
            // Show/hide sections based on data
            document.getElementById('incomeSection').style.display = incomeCategories.length > 0 ? 'block' : 'none';
            document.getElementById('expenseSection').style.display = expenseCategories.length > 0 ? 'block' : 'none';
            document.getElementById('noIncomeCategories').style.display = incomeCategories.length === 0 ? 'block' : 'none';
            document.getElementById('noExpenseCategories').style.display = expenseCategories.length === 0 ? 'block' : 'none';
            document.getElementById('noCategories').style.display = 'none';
            
            // Populate income categories
            const incomeContainer = document.getElementById('incomeCategories');
            incomeContainer.innerHTML = '';
            
            incomeCategories.forEach(category => {
                const card = createCategoryCard(category);
                incomeContainer.appendChild(card);
            });
            
            // Populate expense categories
            const expenseContainer = document.getElementById('expenseCategories');
            expenseContainer.innerHTML = '';
            
            expenseCategories.forEach(category => {
                const card = createCategoryCard(category);
                expenseContainer.appendChild(card);
            });
        }
        
        function createCategoryCard(category) {
            const card = document.createElement('div');
            card.className = `category-card ${category.type}`;
            
            card.innerHTML = `
                <div class="category-icon">${category.icon}</div>
                <h3>${category.name}</h3>
                <p style="color: var(--text-light); margin: 0.5rem 0;">${category.description}</p>
                <small style="color: var(--text-light);">${category.transaction_count} transactions</small>
                <div class="category-actions">
                    <button onclick="deleteCategory('${category.id}', '${category.name}')" class="icon-btn" title="Delete category">
                        🗑️
                    </button>
                </div>
            `;
            
            return card;
        }
        
        function showNoCategories() {
            document.getElementById('incomeSection').style.display = 'none';
            document.getElementById('expenseSection').style.display = 'none';
            document.getElementById('noCategories').style.display = 'block';
        }
        
        function deleteCategory(id, name) {
            categoryToDelete = { id, name };
            document.getElementById('deleteModalText').textContent = 
                `Are you sure you want to delete "${name}"? This action cannot be undone.`;
            document.getElementById('deleteModal').style.display = 'block';
        }
        
        function confirmDelete() {
            if (categoryToDelete) {
                categories = categories.filter(cat => cat.id !== categoryToDelete.id);
                
                // In a real app, this would call an AO process handler to delete from storage
                console.log('Deleted category:', categoryToDelete.name);
                
                if (categories.length === 0) {
                    showNoCategories();
                } else {
                    showCategories();
                }
                
                closeDeleteModal();
            }
        }
        
        function closeDeleteModal() {
            document.getElementById('deleteModal').style.display = 'none';
            categoryToDelete = null;
        }
        
        function showMockModal() {
            document.getElementById('mockModal').style.display = 'block';
        }
        
        function closeMockModal() {
            document.getElementById('mockModal').style.display = 'none';
        }
        
        function addMockCategories() {
            // Add mock categories to the data
            categories = ]=] .. json.encode(categories_data) .. [[;
            
            showCategories();
            closeMockModal();
            
            // Show success message
            showTemporaryMessage('Mock categories added successfully!', 'success');
        }
        
        function refreshCategories() {
            document.getElementById('loadingState').style.display = 'block';
            setTimeout(() => {
                loadCategories();
            }, 500);
        }
        
        function dismissError() {
            document.getElementById('errorState').style.display = 'none';
        }
        
        function showTemporaryMessage(message, type) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message message-${type}`;
            messageDiv.innerHTML = `<p>${message}</p>`;
            
            document.querySelector('.container').insertBefore(messageDiv, document.querySelector('.container').firstChild);
            
            setTimeout(() => {
                messageDiv.remove();
            }, 3000);
        }
        
        // Close modals when clicking outside
        window.onclick = function(event) {
            if (event.target.classList.contains('modal')) {
                closeDeleteModal();
                closeMockModal();
            }
        }
    </script>
</body>
</html>
]=]

-- Updated Handler with Role Management
Handlers.add('GetCategories', 'get-categories', function(msg)
    local userAddress = msg.From
    local navigation = getNavigation(userAddress, 'categories')
    local ads = getAds(userAddress)
    
    local page = categories:gsub("<!-- NAVIGATION_PLACEHOLDER -->", navigation)
                          :gsub("<!-- ADS_PLACEHOLDER -->", ads)
                          :gsub("MAIN_PROCESS_ID", config.main_process_id)
                          :gsub("AI_PROCESS_ID", config.ai_process_id)
    
    send({Target = msg.From, Data = page})
end)

-- Keep your existing category handlers (they're fine)
Handlers.add('FetchUserCategories', 'fetch-user-categories', function(msg)
    send({
        Target = msg.From,
        Data = json.encode({
            code = 200,
            data = categories_data,
            message = "Categories fetched successfully"
        })
    })
end)

print("📁 Categories page UPDATED with Role Management!")
print("✅ Dynamic navigation enabled")
print("✅ Ads system integrated")
print("✅ Role-based banners and tips added")
print("🔗 Connected to main role management system")