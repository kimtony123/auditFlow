-- My Subscriptions Page (AD-FREE + Role-Based Upgrade/Downgrade)
mySubscriptions = [=[
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Subscriptions - aoBudgetAI</title>
    ]=] .. styles .. [=[
    <style>
        .plan-card {
            background: white;
            border-radius: 12px;
            padding: 2rem;
            margin-bottom: 1.5rem;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            border: 2px solid #e2e8f0;
            transition: all 0.3s ease;
        }
        
        .plan-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 15px rgba(0,0,0,0.1);
        }
        
        .plan-card.current {
            border-color: var(--primary);
            background: linear-gradient(135deg, #f0f9ff, #ffffff);
        }
        
        .plan-card.premium {
            border-color: gold;
            background: linear-gradient(135deg, #fff9e6, #ffffff);
        }
        
        .plan-card.pro {
            border-color: #8B5CF6;
            background: linear-gradient(135deg, #f3f4f6, #ffffff);
        }
        
        .plan-badge {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.875rem;
            font-weight: 600;
            margin-bottom: 1rem;
        }
        
        .badge-current {
            background: var(--primary);
            color: white;
        }
        
        .badge-premium {
            background: gold;
            color: black;
        }
        
        .badge-pro {
            background: #8B5CF6;
            color: white;
        }
        
        .price {
            font-size: 2rem;
            font-weight: bold;
            margin: 1rem 0;
        }
        
        .feature-list {
            list-style: none;
            padding: 0;
            margin: 1.5rem 0;
        }
        
        .feature-list li {
            padding: 0.5rem 0;
            border-bottom: 1px solid #f1f5f9;
        }
        
        .feature-list li:last-child {
            border-bottom: none;
        }
        
        .feature-list li::before {
            content: "✓";
            color: var(--secondary);
            font-weight: bold;
            margin-right: 0.5rem;
        }
    </style>
</head>
<body>
    <!-- NAVIGATION_PLACEHOLDER -->
    
    <div class="container">
        <!-- Role-Based Header -->
        <div class="card">
            <h1>Subscription Management</h1>
            <div id="currentPlanInfo">
                <!-- Current plan info will be populated by JavaScript -->
            </div>
        </div>

        <!-- Available Plans -->
        <div class="card">
            <h2>Available Plans</h2>
            <p>Choose the plan that works best for your financial tracking needs</p>
            
            <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; margin-top: 2rem;">
                
                <!-- Freemium Plan -->
                <div class="plan-card" id="freemiumCard">
                    <div class="plan-badge" style="background: #6B7280; color: white;">Freemium</div>
                    <h3>Free</h3>
                    <div class="price">$0/month</div>
                    <ul class="feature-list">
                        <li>Basic expense tracking</li>
                        <li>Category management</li>
                        <li>30-day transaction history</li>
                        <li>Ad-supported experience</li>
                        <li>Community support</li>
                    </ul>
                    <div id="freemiumActions">
                        <!-- Actions will be populated based on current role -->
                    </div>
                </div>
                
                <!-- Premium Plan -->
                <div class="plan-card premium" id="premiumCard">
                    <div class="plan-badge badge-premium">Premium</div>
                    <h3>Premium</h3>
                    <div class="price">$5/month</div>
                    <ul class="feature-list">
                        <li>All Freemium features</li>
                        <li>AI-powered financial insights</li>
                        <li>Ad-free experience</li>
                        <li>Unlimited transaction history</li>
                        <li>Advanced analytics & reports</li>
                        <li>Priority email support</li>
                        <li>Custom categories & tags</li>
                    </ul>
                    <div id="premiumActions">
                        <!-- Actions will be populated based on current role -->
                    </div>
                </div>
                
                <!-- Pro Plan -->
                <div class="plan-card pro" id="proCard">
                    <div class="plan-badge badge-pro">Pro</div>
                    <h3>Professional</h3>
                    <div class="price">$15/month</div>
                    <ul class="feature-list">
                        <li>All Premium features</li>
                        <li>Advanced AI predictions</li>
                        <li>Multi-wallet support</li>
                        <li>Tax optimization insights</li>
                        <li>Investment tracking</li>
                        <li>Custom financial reports</li>
                        <li>Dedicated account manager</li>
                        <li>API access</li>
                    </ul>
                    <div id="proActions">
                        <!-- Actions will be populated based on current role -->
                    </div>
                </div>
            </div>
        </div>

        <!-- Billing History (for paid users) -->
        <div id="billingHistory" class="card" style="display: none;">
            <h2>Billing History</h2>
            <p>You don't have any billing history yet.</p>
        </div>
    </div>

    ]=] .. footer .. [=[ 
    
    <script>
        let currentUserRole = 'freemium';
        
        // Initialize the page
        document.addEventListener('DOMContentLoaded', function() {
            checkUserRole();
        });
        
        function checkUserRole() {
            // Simulate role check - in real app, this would call AO process
            const urlParams = new URLSearchParams(window.location.search);
            const role = urlParams.get('role') || 'freemium';
            currentUserRole = role;
            updateSubscriptionUI(role);
        }
        
        function updateSubscriptionUI(role) {
            updateCurrentPlanInfo(role);
            updatePlanActions(role);
            highlightCurrentPlan(role);
        }
        
        function updateCurrentPlanInfo(role) {
            const currentPlanInfo = document.getElementById('currentPlanInfo');
            const billingHistory = document.getElementById('billingHistory');
            
            const plans = {
                'freemium': {
                    name: 'Freemium',
                    price: 'Free',
                    features: ['Basic tracking', 'Ad-supported', 'Community support']
                },
                'premium': {
                    name: 'Premium', 
                    price: '$5/month',
                    features: ['AI insights', 'Ad-free', 'Priority support']
                },
                'pro': {
                    name: 'Professional',
                    price: '$15/month', 
                    features: ['Advanced AI', 'Multi-wallet', 'Dedicated support']
                }
            };
            
            const currentPlan = plans[role] || plans.freemium;
            
            currentPlanInfo.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
                    <div>
                        <h2 style="margin: 0; color: var(--primary);">Your Current Plan: ${currentPlan.name}</h2>
                        <p style="margin: 0.5rem 0 0 0; color: var(--text-light);">
                            <strong>Price:</strong> ${currentPlan.price} | 
                            <strong>Features:</strong> ${currentPlan.features.join(', ')}
                        </p>
                    </div>
                    <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                        <button onclick="showBillingHistory()" class="btn" style="background: var(--warning);">
                            📊 Billing History
                        </button>
                        <button onclick="contactSupport()" class="btn" style="background: var(--primary);">
                            💬 Support
                        </button>
                    </div>
                </div>
            `;
            
            // Show billing history for paid users
            if (role !== 'freemium') {
                billingHistory.style.display = 'block';
            }
        }
        
        function updatePlanActions(role) {
            const freemiumActions = document.getElementById('freemiumActions');
            const premiumActions = document.getElementById('premiumActions');
            const proActions = document.getElementById('proActions');
            
            // Reset all actions
            freemiumActions.innerHTML = '';
            premiumActions.innerHTML = '';
            proActions.innerHTML = '';
            
            // Freemium plan actions
            if (role === 'freemium') {
                freemiumActions.innerHTML = `<div class="btn" style="background: #6B7280; width: 100%; text-align: center;">Current Plan</div>`;
                premiumActions.innerHTML = `<button onclick="upgradeToPremium()" class="btn" style="background: gold; color: black; width: 100%;">Upgrade to Premium</button>`;
                proActions.innerHTML = `<button onclick="upgradeToPro()" class="btn" style="background: #8B5CF6; width: 100%;">Upgrade to Pro</button>`;
            }
            // Premium plan actions  
            else if (role === 'premium') {
                freemiumActions.innerHTML = `<button onclick="downgradeToFreemium()" class="btn" style="background: #6B7280; width: 100%;">Downgrade to Free</button>`;
                premiumActions.innerHTML = `<div class="btn" style="background: gold; color: black; width: 100%; text-align: center;">Current Plan</div>`;
                proActions.innerHTML = `<button onclick="upgradeToPro()" class="btn" style="background: #8B5CF6; width: 100%;">Upgrade to Pro</button>`;
            }
            // Pro plan actions
            else if (role === 'pro') {
                freemiumActions.innerHTML = `<button onclick="downgradeToFreemium()" class="btn" style="background: #6B7280; width: 100%;">Downgrade to Free</button>`;
                premiumActions.innerHTML = `<button onclick="downgradeToPremium()" class="btn" style="background: gold; color: black; width: 100%;">Downgrade to Premium</button>`;
                proActions.innerHTML = `<div class="btn" style="background: #8B5CF6; width: 100%; text-align: center;">Current Plan</div>`;
            }
        }
        
        function highlightCurrentPlan(role) {
            // Remove current class from all cards
            document.getElementById('freemiumCard').classList.remove('current');
            document.getElementById('premiumCard').classList.remove('current');
            document.getElementById('proCard').classList.remove('current');
            
            // Add current class to active plan
            if (role === 'freemium') {
                document.getElementById('freemiumCard').classList.add('current');
            } else if (role === 'premium') {
                document.getElementById('premiumCard').classList.add('current');
            } else if (role === 'pro') {
                document.getElementById('proCard').classList.add('current');
            }
        }
        
        // Upgrade/Downgrade functions
        function upgradeToPremium() {
            if (confirm('Upgrade to Premium for $5/month? You will get AI insights and ad-free experience.')) {
                // In real app, this would call AO process to upgrade
                simulateSubscriptionChange('premium');
            }
        }
        
        function upgradeToPro() {
            if (confirm('Upgrade to Pro for $15/month? You will get advanced AI, multi-wallet support, and dedicated help.')) {
                // In real app, this would call AO process to upgrade
                simulateSubscriptionChange('pro');
            }
        }
        
        function downgradeToPremium() {
            if (confirm('Downgrade to Premium? You will lose Pro features but keep AI insights and ad-free experience.')) {
                // In real app, this would call AO process to downgrade
                simulateSubscriptionChange('premium');
            }
        }
        
        function downgradeToFreemium() {
            if (confirm('Downgrade to Free? You will lose all premium features and see ads.')) {
                // In real app, this would call AO process to downgrade
                simulateSubscriptionChange('freemium');
            }
        }
        
        function simulateSubscriptionChange(newRole) {
            // Show loading state
            const buttons = document.querySelectorAll('.btn');
            buttons.forEach(btn => btn.disabled = true);
            
            // Simulate API call
            setTimeout(() => {
                // Update UI
                currentUserRole = newRole;
                updateSubscriptionUI(newRole);
                
                // Re-enable buttons
                buttons.forEach(btn => btn.disabled = false);
                
                // Show success message
                alert(`Successfully changed to ${newRole} plan!`);
                
                // In real app, this would refresh the page or update navigation
                console.log(`User changed to ${newRole} plan`);
                
            }, 1500);
        }
        
        function showBillingHistory() {
            alert('Billing history would show here with past payments and invoices.');
        }
        
        function contactSupport() {
            alert('Contact support at support@aobudgetai.com for help with your subscription.');
        }
    </script>
</body>
</html>
]=]

-- My Subscription Info Page (AD-FREE + Detailed Management)
mySubscriptionInfo = [=[
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Subscription Details - aoBudgetAI</title>
    ]=] .. styles .. [=[
    <style>
        .subscription-detail {
            background: white;
            border-radius: 8px;
            padding: 1.5rem;
            margin-bottom: 1rem;
            border-left: 4px solid var(--primary);
        }
        
        .detail-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
            margin: 1.5rem 0;
        }
        
        .detail-item {
            padding: 1rem;
            background: #f8f9fa;
            border-radius: 6px;
        }
        
        .danger-zone {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 8px;
            padding: 1.5rem;
            margin-top: 2rem;
        }
    </style>
</head>
<body>
    <!-- NAVIGATION_PLACEHOLDER -->
    
    <div class="container">
        <div class="card">
            <a href="/]=] .. id .. [[/now/mySubscriptions" class="btn" style="background: #6c757d; display: inline-flex; align-items: center;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="margin-right: 8px;">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
                </svg>
                Back to Subscriptions
            </a>
        </div>
        
        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; flex-wrap: wrap;">
                <div>
                    <h1 id="subName">Premium Plan</h1>
                    <p id="subDescription" style="color: var(--text-light); margin: 0.5rem 0 0 0;">AI-powered financial insights and ad-free experience</p>
                </div>
                <span id="statusBadge" style="background: var(--secondary); color: white; padding: 0.5rem 1rem; border-radius: 9999px; font-weight: bold;">Active</span>
            </div>
            
            <div class="detail-grid">
                <div class="detail-item">
                    <strong>💰 Price</strong>
                    <div id="subPrice" style="font-size: 1.25rem; font-weight: bold; color: var(--primary); margin-top: 0.5rem;">$5 / month</div>
                </div>
                
                <div class="detail-item">
                    <strong>📅 Billing Cycle</strong>
                    <div style="margin-top: 0.5rem;">Monthly</div>
                </div>
                
                <div class="detail-item">
                    <strong>⏰ Next Billing</strong>
                    <div id="nextBilling" style="margin-top: 0.5rem;">October 27, 2025</div>
                </div>
                
                <div class="detail-item">
                    <strong>🎯 Payment Method</strong>
                    <div style="margin-top: 0.5rem;">AO Token Wallet</div>
                </div>
            </div>

            <div class="subscription-detail">
                <h3>Plan Features</h3>
                <ul id="featureList" style="color: var(--text); margin: 1rem 0;">
                    <li>AI-powered financial insights</li>
                    <li>Ad-free experience</li>
                    <li>Unlimited transaction history</li>
                    <li>Advanced analytics & reports</li>
                    <li>Priority email support</li>
                    <li>Custom categories & tags</li>
                </ul>
            </div>

            <!-- Upgrade/Downgrade Options -->
            <div id="changePlanSection" style="margin-top: 2rem;">
                <h3>Change Plan</h3>
                <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 1rem;">
                    <button id="upgradeBtn" class="btn" style="background: var(--secondary); display: none;">Upgrade to Pro</button>
                    <button id="downgradeBtn" class="btn" style="background: var(--warning); display: none;">Downgrade to Free</button>
                    <button id="switchPremiumBtn" class="btn" style="background: gold; color: black; display: none;">Switch to Premium</button>
                </div>
            </div>

            <!-- Danger Zone -->
            <div class="danger-zone">
                <h3 style="color: var(--danger); margin: 0 0 1rem 0;">Danger Zone</h3>
                <p style="color: var(--text-light); margin: 0 0 1rem 0;">Cancel your subscription. You will lose access to premium features at the end of your billing period.</p>
                <button id="cancelBtn" class="btn" style="background: var(--danger);">Cancel Subscription</button>
            </div>
        </div>
    </div>

    ]=] .. footer .. [=[ 
    
    <script>
        const urlParams = new URLSearchParams(window.location.search);
        const planType = urlParams.get('plan') || 'premium';
        
        const plans = {
            freemium: {
                name: "Freemium Plan",
                description: "Basic financial tracking with ads",
                price: "Free",
                nextBilling: "N/A",
                features: [
                    "Basic expense tracking",
                    "Category management", 
                    "30-day transaction history",
                    "Ad-supported experience",
                    "Community support"
                ],
                canUpgrade: true,
                canDowngrade: false
            },
            premium: {
                name: "Premium Plan",
                description: "AI-powered financial insights and ad-free experience", 
                price: "$5 / month",
                nextBilling: "October 27, 2025",
                features: [
                    "AI-powered financial insights",
                    "Ad-free experience",
                    "Unlimited transaction history", 
                    "Advanced analytics & reports",
                    "Priority email support",
                    "Custom categories & tags"
                ],
                canUpgrade: true,
                canDowngrade: true
            },
            pro: {
                name: "Professional Plan",
                description: "Advanced AI features and dedicated support",
                price: "$15 / month",
                nextBilling: "October 27, 2025", 
                features: [
                    "Advanced AI predictions",
                    "Multi-wallet support",
                    "Tax optimization insights",
                    "Investment tracking",
                    "Custom financial reports",
                    "Dedicated account manager",
                    "API access"
                ],
                canUpgrade: false,
                canDowngrade: true
            }
        };
        
        const plan = plans[planType] || plans.premium;
        
        // Update page content
        document.getElementById('subName').textContent = plan.name;
        document.getElementById('subDescription').textContent = plan.description;
        document.getElementById('subPrice').textContent = plan.price;
        document.getElementById('nextBilling').textContent = plan.nextBilling;
        
        const featureList = document.getElementById('featureList');
        featureList.innerHTML = '';
        plan.features.forEach(feature => {
            const li = document.createElement('li');
            li.textContent = feature;
            featureList.appendChild(li);
        });
        
        // Show/hide action buttons based on plan capabilities
        const upgradeBtn = document.getElementById('upgradeBtn');
        const downgradeBtn = document.getElementById('downgradeBtn');
        const switchPremiumBtn = document.getElementById('switchPremiumBtn');
        const cancelBtn = document.getElementById('cancelBtn');
        
        if (plan.canUpgrade) {
            upgradeBtn.style.display = 'block';
            upgradeBtn.onclick = function() {
                if (confirm('Upgrade to Professional plan for $15/month?')) {
                    alert('Upgrade successful!');
                    window.location.href = '/]=] .. id .. [[/now/mySubscriptionInfo?plan=pro';
                }
            };
        }
        
        if (plan.canDowngrade) {
            downgradeBtn.style.display = 'block';
            downgradeBtn.onclick = function() {
                if (confirm('Downgrade to Freemium plan? You will lose premium features.')) {
                    alert('Downgrade successful!');
                    window.location.href = '/]=] .. id .. [[/now/mySubscriptionInfo?plan=freemium';
                }
            };
            
            // Show switch to premium for pro users
            if (planType === 'pro') {
                switchPremiumBtn.style.display = 'block';
                switchPremiumBtn.onclick = function() {
                    if (confirm('Switch to Premium plan for $5/month?')) {
                        alert('Plan changed to Premium!');
                        window.location.href = '/]=] .. id .. [[/now/mySubscriptionInfo?plan=premium';
                    }
                };
            }
        }
        
        cancelBtn.onclick = function() {
            if (confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of the billing period.')) {
                alert('Subscription cancelled successfully.');
                window.location.href = '/]=] .. id .. [[/now/mySubscriptions';
            }
        };
    </script>
</body>
</html>
]=]

-- Updated Handlers (NO ADS on subscription pages!)
Handlers.add('GetMySubscriptions', 'get-my-subscriptions', function(msg)
    local userAddress = msg.From
    local navigation = getNavigation(userAddress, 'subscriptions')
    
    -- NO ADS on subscription pages!
    local page = mySubscriptions:gsub("<!-- NAVIGATION_PLACEHOLDER -->", navigation)
                               :gsub("MAIN_PROCESS_ID", config.main_process_id)
                               :gsub("AI_PROCESS_ID", config.ai_process_id)
    
    send({Target = msg.From, Data = page})
end)

Handlers.add('GetMySubscriptionInfo', 'get-my-subscription-info', function(msg)
    local userAddress = msg.From
    local navigation = getNavigation(userAddress, 'subscriptions')
    
    -- NO ADS on subscription pages!
    local page = mySubscriptionInfo:gsub("<!-- NAVIGATION_PLACEHOLDER -->", navigation)
                                   :gsub("MAIN_PROCESS_ID", config.main_process_id)
                                   :gsub("AI_PROCESS_ID", config.ai_process_id)
    
    send({Target = msg.From, Data = page})
end)

print("💰 Subscription Management Pages UPDATED!")
print("✅ NO ADS on subscription pages")
print("✅ Role-based upgrade/downgrade options")
print("✅ Premium → Pro upgrade flow")
print("✅ Pro → Premium downgrade flow")
print("✅ Freemium → Premium upgrade flow")