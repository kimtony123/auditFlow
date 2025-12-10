-- Budget Process - Add Category Page (Integrated with Role Management)
local json = require('json')

-- REMOVE these duplicate definitions (they already exist in memory):
-- config = {...}  -- DELETE
-- nav = [[...]]   -- DELETE
-- styles = [[...]] -- DELETE (use the main styles)

-- Add Category-specific styles (append to main styles)
add_category_styles = [[
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
    
    .btn-success {
        background: var(--secondary);
    }
    
    .btn-secondary {
        background: #6c757d;
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
    
    .form-group {
        margin-bottom: 1.5rem;
    }
    
    .form-label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 600;
        color: var(--text);
    }
    
    .form-input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid var(--border);
        border-radius: 4px;
        font-size: 1rem;
        box-sizing: border-box;
    }
    
    .form-input:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 2px rgba(33, 133, 208, 0.2);
    }
    
    .form-select {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid var(--border);
        border-radius: 4px;
        font-size: 1rem;
        background: white;
        cursor: pointer;
    }
    
    .icon-grid {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 0.5rem;
        margin-top: 0.5rem;
    }
    
    .icon-option {
        padding: 0.75rem;
        border: 2px solid var(--border);
        border-radius: 4px;
        text-align: center;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 1.5rem;
    }
    
    .icon-option:hover {
        border-color: var(--primary);
        background: #f8f9fa;
    }
    
    .icon-option.selected {
        border-color: var(--primary);
        background: #e3f2fd;
    }
    
    .button-group {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        margin-top: 2rem;
    }
    
    .info-section {
        background: #f8f9fa;
        padding: 1.5rem;
        border-radius: 6px;
        margin-top: 2rem;
    }
    
    .type-badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.875rem;
        font-weight: 500;
        margin-right: 0.5rem;
    }
    
    .type-income {
        background: #d4edda;
        color: #155724;
    }
    
    .type-expense {
        background: #f8d7da;
        color: #721c24;
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

-- Common icons for categories (using emojis for simplicity)
common_icons = {
    { value = "💰", label = "Money", name = "money" },
    { value = "🍕", label = "Food", name = "food" },
    { value = "🏠", label = "Home", name = "home" },
    { value = "🚗", label = "Car", name = "car" },
    { value = "🛒", label = "Shopping", name = "shopping" },
    { value = "❤️", label = "Health", name = "health" },
    { value = "💻", label = "Tech", name = "tech" },
    { value = "📱", label = "Phone", name = "phone" },
    { value = "🎮", label = "Games", name = "games" },
    { value = "📚", label = "Books", name = "books" },
    { value = "🎁", label = "Gifts", name = "gifts" },
    { value = "✈️", label = "Travel", name = "travel" },
    { value = "🎓", label = "Education", name = "education" },
    { value = "🏥", label = "Medical", name = "medical" },
    { value = "💡", label = "Utilities", name = "utilities" },
    { value = "👕", label = "Clothing", name = "clothing" },
    { value = "🍽️", label = "Dining", name = "dining" },
    { value = "🏋️", label = "Fitness", name = "fitness" },
    { value = "🎭", label = "Entertainment", name = "entertainment" },
    { value = "📈", label = "Investments", name = "investments" }
}

-- Add Category Page (Updated with Role Management)
add_category = [=[
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Add Category - aoBudgetAI</title>
    ]=] .. styles .. add_category_styles .. [=[
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
            <h1>Create Category</h1>
            <p style="color: var(--text-light); margin-bottom: 2rem;">
                Categories are used to group your transactions and track spending patterns.
            </p>

            <!-- Premium AI Category Tip -->
            <div id="premiumCategoryTip" class="premium-category-tip" style="display: none;">
                <h3 style="margin: 0; color: black;">🤖 AI Category Suggestions</h3>
                <p style="margin: 0.5rem 0 0 0; color: black;">As a premium member, you can get AI-powered category suggestions based on your spending patterns!</p>
                <a href="/]=] .. config.ai_process_id .. [[/now/analysis" class="btn" style="background: black; color: gold; margin-top: 0.5rem;">Get AI Suggestions</a>
            </div>

            <!-- Wallet Connection Notice -->
            <div class="message message-warning">
                <h3>Wallet Integration Notice</h3>
                <p>In a production environment, this would connect to your Arweave wallet. For this demo, categories are stored locally.</p>
                <p><strong>User Role: <span id="userRoleDisplay">Loading...</span></strong></p>
            </div>

            <!-- Success Message -->
            <div id="successMessage" class="message message-success" style="display: none;">
                <h3>Success!</h3>
                <p>Your category has been created successfully.</p>
            </div>

            <!-- Error Message -->
            <div id="errorMessage" class="message message-error" style="display: none;">
                <h3>Error</h3>
                <p id="errorText"></p>
            </div>

            <form id="categoryForm">
                <!-- Name Field -->
                <div class="form-group">
                    <label class="form-label" for="name">Category Name *</label>
                    <input 
                        type="text" 
                        id="name" 
                        class="form-input" 
                        placeholder="e.g., Groceries, Salary, Rent"
                        required
                    >
                    <small style="color: var(--text-light);">Give your category a clear, descriptive name</small>
                </div>

                <!-- Type Field -->
                <div class="form-group">
                    <label class="form-label" for="type">Category Type *</label>
                    <select id="type" class="form-select" required>
                        <option value="">Select a type</option>
                        <option value="income">💰 Income - Money coming in</option>
                        <option value="expense">💳 Expense - Money going out</option>
                    </select>
                </div>

                <!-- Icon Selection -->
                <div class="form-group">
                    <label class="form-label">Select an Icon *</label>
                    <div class="icon-grid" id="iconGrid">
                        ]=] .. 
                        (function()
                            local icons_html = ""
                            for _, icon in ipairs(common_icons) do
                                icons_html = icons_html .. [[
                                <div class="icon-option" data-value="]] .. icon.value .. [[" data-name="]] .. icon.name .. [[">
                                    ]] .. icon.value .. [[
                                </div>
                                ]]
                            end
                            return icons_html
                        end)() .. [=[
                    </div>
                    <input type="hidden" id="icon" name="icon" required>
                    <small style="color: var(--text-light);">Click to select an icon that represents your category</small>
                </div>

                <!-- Description Field -->
                <div class="form-group">
                    <label class="form-label" for="description">Description</label>
                    <input 
                        type="text" 
                        id="description" 
                        class="form-input" 
                        placeholder="It will help with AI analysis (optional)"
                    >
                    <small style="color: var(--text-light);">A brief description of what this category includes</small>
                </div>

                <!-- Submit Buttons -->
                <div class="button-group">
                    <button type="submit" class="btn btn-success" id="submitBtn">
                        💾 Create Category
                    </button>
                    <a href="/]=] .. id .. [[/now/categories" class="btn btn-secondary" style="text-align: center;">
                        ❌ Cancel
                    </a>
                    <button onclick="checkUserRole()" class="btn" style="background: var(--warning); grid-column: span 2;">
                        👤 Check Role
                    </button>
                </div>
            </form>
        </div>

        <!-- Information Section -->
        <div class="info-section">
            <h3>Why categorize transactions?</h3>
            <p>Categorizing your transactions helps you understand where your money is going, identify spending patterns, and create better budgets. You can assign each transaction to a category to track expenses and income more effectively.</p>
            
            <div style="margin-top: 1.5rem;">
                <h4>Expense Categories</h4>
                <p>Expense categories represent money going out, such as <span class="type-badge type-expense">Groceries</span> <span class="type-badge type-expense">Rent</span> <span class="type-badge type-expense">Utilities</span> <span class="type-badge type-expense">Entertainment</span> and <span class="type-badge type-expense">Transportation</span>.</p>
                
                <h4>Income Categories</h4>
                <p>Income categories represent money coming in, such as <span class="type-badge type-income">Salary</span> <span class="type-badge type-income">Freelance</span> <span class="type-badge type-income">Investments</span> and <span class="type-badge type-income">Gifts</span>.</p>
            </div>
            
            <div style="margin-top: 1.5rem; padding: 1rem; background: white; border-radius: 4px;">
                <h4>💡 Pro Tip</h4>
                <p>Create specific categories that match your spending habits. The more accurate your categories, the better the AI can analyze your financial patterns and provide useful insights.</p>
            </div>
        </div>
    </div>

    <!-- ADS_PLACEHOLDER -->

    ]=] .. footer .. [=[
    
    <script>
        let selectedIcon = '';
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
            setupForm();
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
        
        function setupForm() {
            // Set up icon selection
            const iconOptions = document.querySelectorAll('.icon-option');
            iconOptions.forEach(option => {
                option.addEventListener('click', function() {
                    // Remove selected class from all options
                    iconOptions.forEach(opt => opt.classList.remove('selected'));
                    
                    // Add selected class to clicked option
                    this.classList.add('selected');
                    
                    // Set the hidden input value
                    selectedIcon = this.getAttribute('data-value');
                    document.getElementById('icon').value = selectedIcon;
                });
            });
            
            // Select first icon by default
            if (iconOptions.length > 0) {
                iconOptions[0].click();
            }
            
            // Handle form submission
            document.getElementById('categoryForm').addEventListener('submit', function(e) {
                e.preventDefault();
                createCategory();
            });
        }
        
        function createCategory() {
            const name = document.getElementById('name').value.trim();
            const type = document.getElementById('type').value;
            const icon = document.getElementById('icon').value;
            const description = document.getElementById('description').value.trim();
            
            // Validation
            if (!name) {
                showError('Please enter a category name');
                return;
            }
            
            if (!type) {
                showError('Please select a category type');
                return;
            }
            
            if (!icon) {
                showError('Please select an icon');
                return;
            }
            
            // Show loading state
            const submitBtn = document.getElementById('submitBtn');
            submitBtn.innerHTML = '⏳ Creating...';
            submitBtn.disabled = true;
            
            // Simulate API call (in real app, this would call AO process)
            setTimeout(() => {
                const categoryData = {
                    name: name,
                    type: type,
                    icon: icon,
                    description: description || 'No description provided',
                    transaction_count: 0
                };
                
                // In a real app, this would send to AO process
                console.log('Creating category:', categoryData);
                
                // Show success message
                showSuccess();
                
                // Reset form after success
                setTimeout(() => {
                    document.getElementById('categoryForm').reset();
                    document.querySelectorAll('.icon-option').forEach(opt => opt.classList.remove('selected'));
                    if (document.querySelectorAll('.icon-option').length > 0) {
                        document.querySelectorAll('.icon-option')[0].click();
                    }
                    submitBtn.innerHTML = '💾 Create Category';
                    submitBtn.disabled = false;
                }, 2000);
                
            }, 1000);
        }
        
        function showSuccess() {
            document.getElementById('errorMessage').style.display = 'none';
            document.getElementById('successMessage').style.display = 'block';
            
            // Redirect after 2 seconds
            setTimeout(() => {
                window.location.href = '/]=] .. id .. [[/now/categories';
            }, 2000);
        }
        
        function showError(message) {
            document.getElementById('successMessage').style.display = 'none';
            document.getElementById('errorMessage').style.display = 'block';
            document.getElementById('errorText').textContent = message;
            
            // Re-enable submit button
            const submitBtn = document.getElementById('submitBtn');
            submitBtn.innerHTML = '💾 Create Category';
            submitBtn.disabled = false;
        }
        
        // Auto-hide error messages after 5 seconds
        function setupAutoHide() {
            const errorMessage = document.getElementById('errorMessage');
            if (errorMessage.style.display === 'block') {
                setTimeout(() => {
                    errorMessage.style.display = 'none';
                }, 5000);
            }
        }
    </script>
</body>
</html>
]=]

-- Updated Handler with Role Management
Handlers.add('GetAddCategory', 'get-add-category', function(msg)
    local userAddress = msg.From
    local navigation = getNavigation(userAddress, 'add-category')
    local ads = getAds(userAddress)
    
    local page = add_category:gsub("<!-- NAVIGATION_PLACEHOLDER -->", navigation)
                            :gsub("<!-- ADS_PLACEHOLDER -->", ads)
                            :gsub("MAIN_PROCESS_ID", config.main_process_id)
                            :gsub("AI_PROCESS_ID", config.ai_process_id)
    
    send({Target = msg.From, Data = page})
end)

-- Keep your existing category handler (it's fine)
Handlers.add('AddCategory', 'add-category', function(msg)
    local data = json.decode(msg.Data)
    
    -- Validate required fields
    if not data.name or not data.type or not data.icon then
        send({
            Target = msg.From,
            Data = json.encode({
                code = 400,
                message = "Missing required fields: name, type, and icon are required"
            })
        })
        return
    end
    
    -- Create new category
    local new_category = {
        id = tostring(os.time()), -- Simple ID generation
        name = data.name,
        description = data.description or "No description provided",
        type = data.type,
        icon = data.icon,
        transaction_count = 0
    }
    
    -- Add to categories data (you'll need to ensure categories_data is accessible)
    if not categories_data then
        categories_data = {}
    end
    table.insert(categories_data, new_category)
    
    send({
        Target = msg.From,
        Data = json.encode({
            code = 200,
            category_id = new_category.id,
            message = "Category created successfully"
        })
    })
end)

print("➕ Add Category page UPDATED with Role Management!")
print("✅ Dynamic navigation enabled")
print("✅ Ads system integrated")
print("✅ Role-based banners and tips added")
print("🎨 Available icons: " .. #common_icons)
print("🔗 Connected to main role management system")