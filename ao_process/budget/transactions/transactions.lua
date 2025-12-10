-- Budget Process - Transactions Page (Integrated with Role Management)
local json = require('json')

-- REMOVE these duplicate definitions (they already exist in memory):
-- config = {...}  -- DELETE
-- nav = [[...]]   -- DELETE
-- styles = [[...]] -- DELETE (use the main styles)

-- Transactions-specific styles (append to main styles)
transactions_styles = [[
<style>
    .card {
        background: var(--bg-card);
        border-radius: 8px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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
    
    .filter-menu {
        display: flex;
        gap: 1rem;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
        align-items: center;
    }
    
    .filter-group {
        display: flex;
        gap: 0.5rem;
        align-items: center;
    }
    
    select, input[type="date"] {
        padding: 0.5rem;
        border: 1px solid var(--border);
        border-radius: 4px;
        background: white;
    }
    
    .table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 1rem;
    }
    
    .table th, .table td {
        padding: 0.75rem;
        text-align: left;
        border-bottom: 1px solid var(--border);
    }
    
    .table th {
        background: #f8f9fa;
        font-weight: 600;
    }
    
    .table tr:hover {
        background: #f8f9fa;
    }
    
    .label {
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.875rem;
        font-weight: 500;
    }
    
    .label-income {
        background: #d4edda;
        color: #155724;
    }
    
    .label-expense {
        background: #f8d7da;
        color: #721c24;
    }
    
    .amount-positive {
        color: #28a745;
        font-weight: 600;
    }
    
    .amount-negative {
        color: #dc3545;
        font-weight: 600;
    }
    
    .action-buttons {
        display: flex;
        gap: 0.5rem;
    }
    
    .icon-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 4px;
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
    
    .date-picker-popup {
        display: none;
        position: absolute;
        background: white;
        border: 1px solid var(--border);
        border-radius: 6px;
        padding: 1rem;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 100;
    }
</style>
]]

-- Sample transactions data
transactions_data = transactions_data or {
    {
        id = "1",
        category = "Salary",
        description = "Monthly salary",
        date = "2024-01-15",
        type = "income",
        amount = 3000.00
    },
    {
        id = "2", 
        category = "Housing",
        description = "Rent payment",
        date = "2024-01-01",
        type = "expense",
        amount = -1200.00
    },
    {
        id = "3",
        category = "Food",
        description = "Groceries",
        date = "2024-01-05",
        type = "expense", 
        amount = -250.00
    },
    {
        id = "4",
        category = "Freelance",
        description = "Web design project",
        date = "2024-01-10",
        type = "income",
        amount = 850.00
    },
    {
        id = "5",
        category = "Transportation",
        description = "Gas and parking",
        date = "2024-01-08",
        type = "expense",
        amount = -120.00
    }
}

-- Transactions Page (Updated with Role Management)
transactions = [=[
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Transactions - aoBudgetAI</title>
    ]=] .. styles .. transactions_styles .. [=[
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
                <h1 style="margin: 0;">Transaction History</h1>
                <div style="display: flex; gap: 1rem;">
                    <a href="/]=] .. id .. [[/now/add-income" class="btn btn-success">+ Add Income</a>
                    <a href="/]=] .. id .. [[/now/add-expense" class="btn" style="background: var(--danger);">+ Add Expense</a>
                </div>
            </div>
        </div>

        <!-- Wallet Connection Warning -->
        <div id="walletWarning" class="message message-warning">
            <h3>Wallet Integration Notice</h3>
            <p>In a production environment, this would connect to your Arweave wallet. For this demo, transactions are stored locally.</p>
            <p><strong>User Role: <span id="userRoleDisplay">Loading...</span></strong></p>
        </div>

        <!-- Loading State -->
        <div id="loadingState" class="message message-info" style="display: none;">
            <h3>Loading Transactions</h3>
            <p>Please wait while we fetch your transactions...</p>
        </div>

        <!-- Error State -->
        <div id="errorState" class="message message-error" style="display: none;">
            <h3>Error</h3>
            <p id="errorMessage"></p>
            <button onclick="dismissError()" class="btn" style="margin-top: 0.5rem;">Dismiss</button>
        </div>

        <!-- No Transactions State -->
        <div id="noTransactions" class="message message-info" style="display: none;">
            <h3>No Transactions Found</h3>
            <p>You don't have any transactions yet. Add some transactions to get started.</p>
            <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                <a href="/]=] .. id .. [[/now/add-income" class="btn btn-success">Add Income</a>
                <a href="/]=] .. id .. [[/now/add-expense" class="btn" style="background: var(--danger);">Add Expense</a>
            </div>
        </div>

        <!-- Filter Menu -->
        <div class="card" id="filterSection" style="display: none;">
            <div class="filter-menu">
                <div class="filter-group">
                    <label>Date Range:</label>
                    <span id="dateRangeText">All Dates</span>
                    <button onclick="toggleDatePicker()" class="btn">Select Date Range</button>
                </div>
                
                <div class="filter-group">
                    <label>Category:</label>
                    <select id="categoryFilter" onchange="applyFilters()">
                        <option value="all">All Categories</option>
                        <option value="Salary">Salary</option>
                        <option value="Freelance">Freelance</option>
                        <option value="Housing">Housing</option>
                        <option value="Food">Food</option>
                        <option value="Transportation">Transportation</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Entertainment">Entertainment</option>
                    </select>
                </div>
                
                <div class="filter-group">
                    <label>Type:</label>
                    <select id="typeFilter" onchange="applyFilters()">
                        <option value="all">All Types</option>
                        <option value="income">Income</option>
                        <option value="expense">Expense</option>
                    </select>
                </div>
                
                <div style="margin-left: auto;">
                    <button onclick="exportToCSV()" class="btn">
                        📥 Export CSV
                    </button>
                    <button onclick="refreshTransactions()" class="btn">
                        🔄 Refresh
                    </button>
                    <button onclick="checkUserRole()" class="btn" style="background: var(--warning);">
                        👤 Check Role
                    </button>
                </div>
            </div>

            <!-- Date Picker Popup -->
            <div id="datePicker" class="date-picker-popup">
                <h4>Select Date Range</h4>
                <div style="margin-bottom: 1rem;">
                    <label>Start Date: </label>
                    <input type="date" id="startDate">
                </div>
                <div style="margin-bottom: 1rem;">
                    <label>End Date: </label>
                    <input type="date" id="endDate">
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button onclick="applyDateRange()" class="btn">Apply</button>
                    <button onclick="cancelDateRange()" class="btn" style="background: #6c757d;">Cancel</button>
                </div>
            </div>
        </div>

        <!-- Transactions Table -->
        <div class="card" id="transactionsSection" style="display: none;">
            <table class="table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Category</th>
                        <th>Description</th>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="transactionsTable">
                    <!-- Transactions will be populated here -->
                </tbody>
            </table>
        </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div id="deleteModal" class="modal">
        <div class="modal-content">
            <h3>Delete Transaction</h3>
            <p>Are you sure you want to delete this transaction? This action cannot be undone.</p>
            <div style="display: flex; gap: 0.5rem; margin-top: 1.5rem;">
                <button onclick="closeDeleteModal()" class="btn" style="background: #6c757d;">Cancel</button>
                <button onclick="confirmDelete()" class="btn" style="background: var(--danger);">Delete</button>
            </div>
        </div>
    </div>

    <!-- ADS_PLACEHOLDER -->

    ]=] .. footer .. [=[
    
    <script>
        let transactions = [];
        let filteredTransactions = [];
        let transactionToDelete = null;
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
            loadTransactions();
        }
        
        function updateRoleUI(role) {
            const premiumBanner = document.getElementById('premiumBanner');
            const upgradeBanner = document.getElementById('upgradeBanner');
            const userRoleDisplay = document.getElementById('userRoleDisplay');
            
            userRoleDisplay.textContent = role === 'premium' ? '⭐ Premium' : 'Free';
            
            if (role === 'premium') {
                premiumBanner.style.display = 'block';
                upgradeBanner.style.display = 'none';
            } else {
                premiumBanner.style.display = 'none';
                upgradeBanner.style.display = 'block';
            }
        }
        
        function loadTransactions() {
            // Show loading state
            document.getElementById('loadingState').style.display = 'block';
            document.getElementById('walletWarning').style.display = 'none';
            
            // Simulate API call delay
            setTimeout(() => {
                // In a real app, this would fetch from AO process
                transactions = ]=] .. json.encode(transactions_data) .. [[;
                
                if (transactions.length === 0) {
                    showNoTransactions();
                } else {
                    showTransactions();
                }
                
                document.getElementById('loadingState').style.display = 'none';
            }, 1000);
        }
        
        function showTransactions() {
            filteredTransactions = [...transactions];
            updateTransactionsTable();
            
            document.getElementById('filterSection').style.display = 'block';
            document.getElementById('transactionsSection').style.display = 'block';
            document.getElementById('noTransactions').style.display = 'none';
        }
        
        function showNoTransactions() {
            document.getElementById('filterSection').style.display = 'none';
            document.getElementById('transactionsSection').style.display = 'none';
            document.getElementById('noTransactions').style.display = 'block';
        }
        
        function updateTransactionsTable() {
            const tableBody = document.getElementById('transactionsTable');
            tableBody.innerHTML = '';
            
            filteredTransactions.forEach(transaction => {
                const row = document.createElement('tr');
                const amountClass = transaction.amount >= 0 ? 'amount-positive' : 'amount-negative';
                const amountSign = transaction.amount >= 0 ? '+' : '';
                
                row.innerHTML = `
                    <td>${transaction.id}</td>
                    <td>${transaction.category}</td>
                    <td>${transaction.description}</td>
                    <td>${transaction.date}</td>
                    <td><span class="label ${transaction.type === 'income' ? 'label-income' : 'label-expense'}">${transaction.type}</span></td>
                    <td class="${amountClass}">${amountSign}$${Math.abs(transaction.amount).toFixed(2)}</td>
                    <td>
                        <div class="action-buttons">
                            <button onclick="deleteTransaction('${transaction.id}')" class="icon-btn" title="Delete">
                                🗑️
                            </button>
                        </div>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        }
        
        // ... (rest of your JavaScript functions remain the same)
        function applyFilters() {
            const categoryFilter = document.getElementById('categoryFilter').value;
            const typeFilter = document.getElementById('typeFilter').value;
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;
            
            filteredTransactions = transactions.filter(transaction => {
                // Category filter
                if (categoryFilter !== 'all' && transaction.category !== categoryFilter) {
                    return false;
                }
                
                // Type filter
                if (typeFilter !== 'all' && transaction.type !== typeFilter) {
                    return false;
                }
                
                // Date range filter
                if (startDate && endDate) {
                    const transactionDate = new Date(transaction.date);
                    const start = new Date(startDate);
                    const end = new Date(endDate);
                    
                    if (transactionDate < start || transactionDate > end) {
                        return false;
                    }
                }
                
                return true;
            });
            
            updateTransactionsTable();
        }
        
        function toggleDatePicker() {
            const picker = document.getElementById('datePicker');
            picker.style.display = picker.style.display === 'block' ? 'none' : 'block';
        }
        
        function applyDateRange() {
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;
            
            if (startDate && endDate) {
                document.getElementById('dateRangeText').textContent = 
                    `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;
            } else {
                document.getElementById('dateRangeText').textContent = 'All Dates';
            }
            
            document.getElementById('datePicker').style.display = 'none';
            applyFilters();
        }
        
        function cancelDateRange() {
            document.getElementById('startDate').value = '';
            document.getElementById('endDate').value = '';
            document.getElementById('dateRangeText').textContent = 'All Dates';
            document.getElementById('datePicker').style.display = 'none';
            applyFilters();
        }
        
        function deleteTransaction(id) {
            transactionToDelete = id;
            document.getElementById('deleteModal').style.display = 'block';
        }
        
        function confirmDelete() {
            if (transactionToDelete) {
                transactions = transactions.filter(t => t.id !== transactionToDelete);
                filteredTransactions = filteredTransactions.filter(t => t.id !== transactionToDelete);
                
                if (transactions.length === 0) {
                    showNoTransactions();
                } else {
                    updateTransactionsTable();
                }
                
                closeDeleteModal();
                
                // In a real app, this would call an AO process handler to delete from storage
                console.log('Deleted transaction:', transactionToDelete);
            }
        }
        
        function closeDeleteModal() {
            document.getElementById('deleteModal').style.display = 'none';
            transactionToDelete = null;
        }
        
        function exportToCSV() {
            if (filteredTransactions.length === 0) {
                alert('No transactions to export');
                return;
            }
            
            const headers = ['ID', 'Category', 'Description', 'Date', 'Type', 'Amount'];
            const csvContent = [
                headers.join(','),
                ...filteredTransactions.map(t => [
                    t.id,
                    `"${t.category}"`,
                    `"${t.description}"`,
                    t.date,
                    t.type,
                    t.amount
                ].join(','))
            ].join('\\n');
            
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'transactions.csv';
            a.click();
            URL.revokeObjectURL(url);
        }
        
        function refreshTransactions() {
            document.getElementById('loadingState').style.display = 'block';
            setTimeout(() => {
                loadTransactions();
            }, 500);
        }
        
        function dismissError() {
            document.getElementById('errorState').style.display = 'none';
        }
        
        // Close modal when clicking outside
        window.onclick = function(event) {
            const modal = document.getElementById('deleteModal');
            if (event.target === modal) {
                closeDeleteModal();
            }
        }
    </script>
</body>
</html>
]=]

-- Updated Handler with Role Management
Handlers.add('GetTransactions', 'get-transactions', function(msg)
    local userAddress = msg.From
    local navigation = getNavigation(userAddress, 'transactions')
    local ads = getAds(userAddress)
    
    local page = transactions:gsub("<!-- NAVIGATION_PLACEHOLDER -->", navigation)
                            :gsub("<!-- ADS_PLACEHOLDER -->", ads)
                            :gsub("MAIN_PROCESS_ID", config.main_process_id)
                            :gsub("AI_PROCESS_ID", config.ai_process_id)
    
    send({Target = msg.From, Data = page})
end)

-- Keep your existing transaction handlers (they're fine)
Handlers.add('FetchUserTransactions', 'fetch-user-transactions', function(msg)
    send({
        Target = msg.From,
        Data = json.encode({
            code = 200,
            data = transactions_data,
            message = "Transactions fetched successfully"
        })
    })
end)

print("💳 Transactions page UPDATED with Role Management!")
print("✅ Dynamic navigation enabled")
print("✅ Ads system integrated")
print("✅ Role-based banners added")
print("🔗 Connected to main role management system")