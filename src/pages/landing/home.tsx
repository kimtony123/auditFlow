import React, { useState } from "react";
import NavigationButton from "../../components/NavigationButton";
import "./Home.css";

const Home: React.FC = () => {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'quarterly' | 'semi-annual' | 'annual'>('monthly');
  const [calculatorValues, setCalculatorValues] = useState({
    codeSummaries: 10,
    aiReports: 5,
    teamMembers: 1
  });

  // Pricing configuration
  const plans: Record<'basic' | 'premium' | 'pro' | 'enterprise', { codeSummaries: number; aiReports: number; teamMembers: number; monthlyPrice: number }> = {
    basic: { codeSummaries: 5, aiReports: 1, teamMembers: 1, monthlyPrice: 0 },
    premium: { codeSummaries: 15, aiReports: 10, teamMembers: 1, monthlyPrice: 15 },
    pro: { codeSummaries: 100, aiReports: 40, teamMembers: 5, monthlyPrice: 50 },
    enterprise: { codeSummaries: 999, aiReports: 999, teamMembers: 999, monthlyPrice: 50 }
  };

  // Discount calculations
  const getDiscount = (interval: string) => {
    switch(interval) {
      case 'quarterly': return 0.05;
      case 'semi-annual': return 0.15;
      case 'annual': return 0.30;
      default: return 0;
    }
  };

  const calculatePrice = (monthlyPrice: number) => {
    const discount = getDiscount(billingInterval);
    const discountedPrice = monthlyPrice * (1 - discount);
    
    switch(billingInterval) {
      case 'quarterly': return (discountedPrice * 3).toFixed(2);
      case 'semi-annual': return (discountedPrice * 6).toFixed(2);
      case 'annual': return (discountedPrice * 12).toFixed(2);
      default: return monthlyPrice.toFixed(2);
    }
  };

  const getRecommendedPlan = () => {
    const { codeSummaries, aiReports, teamMembers } = calculatorValues;
    
    if (teamMembers > 10) return 'enterprise';
    if (teamMembers > 5) return 'pro';
    if (codeSummaries > 15 || aiReports > 10) return 'premium';
    if (codeSummaries <= 5 && aiReports <= 1 && teamMembers === 1) return 'basic';
    
    if (codeSummaries <= 15 && aiReports <= 10) return 'premium';
    return 'pro';
  };

  return (
    <div className="home-body">
      {/* Navigation */}
      <nav className="home-nav">
        <div className="container">
          <div className="nav-brand">
            <span className="brand-logo">🛡️</span>
            <a href="/">AuditFlow</a>
          </div>
          <div className="nav-actions">
            <NavigationButton 
              path="/dashboard"
              style={{
                fontSize: '1rem', 
                padding: '0.75rem 1.5rem',
                background: 'transparent',
                border: '1px solid #4A90E2'
              }}
            >
              Dashboard
            </NavigationButton>
            
            <NavigationButton 
              path="/analyze"
              variant="premium"
              style={{
                fontSize: '1rem', 
                padding: '0.75rem 1.5rem',
                marginLeft: '1rem',
                background: '#4A90E2'
              }}
            >
              Start Free Analysis
            </NavigationButton>
          </div>
        </div>
      </nav>
      
      {/* Hero Section */}
      <div className="hero-section" id="home">
        <div className="container">
          <div className="hero-badge">⚡ SECURITY AUTOMATION</div>
          <h1 className="hero-title">
            Get <span className="hero-highlight">Audit-Ready</span><br />
            in Minutes, Not Weeks
          </h1>
          <p className="hero-description">
            AuditFlow automates smart contract security preparation. Transform raw code into 
            professionally structured audit reports with AI-powered risk analysis. Cut preparation 
            time by 90% and costs by up to 40%.
          </p>
          
          <div className="hero-cta">
            <NavigationButton 
              path="/analyze"
              variant="premium"
              style={{
                fontSize: '1.2rem', 
                padding: '1rem 2.5rem',
                background: '#4A90E2'
              }}
            >
              Analyze Your Code Free
            </NavigationButton>
            <p className="hero-note">
              No credit card required • Connect GitHub in seconds
            </p>
          </div>

          {/* Trust Metrics */}
          <div className="trust-metrics">
            <div className="metric">
              <div className="metric-value">90%</div>
              <div className="metric-label">Faster Prep</div>
            </div>
            <div className="metric-divider"></div>
            <div className="metric">
              <div className="metric-value">40%</div>
              <div className="metric-label">Cost Savings</div>
            </div>
            <div className="metric-divider"></div>
            <div className="metric">
              <div className="metric-value">24/7</div>
              <div className="metric-label">AI Analysis</div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="section-dark">
        <div className="container">
          <h2 className="section-title">The Automated Audit Pipeline</h2>
          <p className="section-subtitle">
            Three simple steps from code to audit-ready package
          </p>
          
          <div className="process-flow">
            <div className="process-step">
              <div className="step-icon">🔗</div>
              <div className="step-number">01</div>
              <h3 className="step-title">Connect Repository</h3>
              <p className="step-description">
                Securely connect your GitHub repo with read-only access. 
                We analyze your smart contracts instantly.
              </p>
            </div>
            
            <div className="process-connector">
              <div className="connector-line"></div>
              <div className="connector-arrow">→</div>
            </div>
            
            <div className="process-step">
              <div className="step-icon">🤖</div>
              <div className="step-number">02</div>
              <h3 className="step-title">AI Analysis Engine</h3>
              <p className="step-description">
                Our AI scans for 50+ vulnerability patterns, analyzes 
                architecture, and maps contract interactions.
              </p>
            </div>
            
            <div className="process-connector">
              <div className="connector-line"></div>
              <div className="connector-arrow">→</div>
            </div>
            
            <div className="process-step">
              <div className="step-icon">📄</div>
              <div className="step-number">03</div>
              <h3 className="step-title">Instant Report Generation</h3>
              <p className="step-description">
                Download a professionally formatted audit-ready package 
                with findings, diagrams, and executive summary.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Calculator */}
      <div className="section-light calculator-section">
        <div className="container">
          <h2 className="section-title">Find Your Perfect Plan</h2>
          <p className="section-subtitle">
            Use our calculator to estimate your needs
          </p>
          
          <div className="calculator-container">
            <div className="calculator-inputs">
              <div className="calculator-slider">
                <label>
                  <span>Code Summaries per Month</span>
                  <span className="calculator-value">{calculatorValues.codeSummaries}</span>
                </label>
                <input 
                  type="range" 
                  min="1" 
                  max="100" 
                  value={calculatorValues.codeSummaries}
                  onChange={(e) => setCalculatorValues({
                    ...calculatorValues,
                    codeSummaries: parseInt(e.target.value)
                  })}
                  className="slider"
                />
                <div className="slider-labels">
                  <span>5</span>
                  <span>50</span>
                  <span>100+</span>
                </div>
              </div>
              
              <div className="calculator-slider">
                <label>
                  <span>AI Reports per Month</span>
                  <span className="calculator-value">{calculatorValues.aiReports}</span>
                </label>
                <input 
                  type="range" 
                  min="1" 
                  max="50" 
                  value={calculatorValues.aiReports}
                  onChange={(e) => setCalculatorValues({
                    ...calculatorValues,
                    aiReports: parseInt(e.target.value)
                  })}
                  className="slider"
                />
                <div className="slider-labels">
                  <span>1</span>
                  <span>25</span>
                  <span>50+</span>
                </div>
              </div>
              
              <div className="calculator-slider">
                <label>
                  <span>Team Members</span>
                  <span className="calculator-value">{calculatorValues.teamMembers}</span>
                </label>
                <input 
                  type="range" 
                  min="1" 
                  max="15" 
                  value={calculatorValues.teamMembers}
                  onChange={(e) => setCalculatorValues({
                    ...calculatorValues,
                    teamMembers: parseInt(e.target.value)
                  })}
                  className="slider"
                />
                <div className="slider-labels">
                  <span>1</span>
                  <span>8</span>
                  <span>15+</span>
                </div>
              </div>
            </div>
            
            <div className="calculator-result">
              <div className="recommended-plan">
                <div className="plan-badge">
                  Recommended Plan
                </div>
                <h3 className="plan-name">
                  {getRecommendedPlan().toUpperCase()}
                </h3>
                <div className="plan-price">
                  ${billingInterval === 'monthly' 
                    ? plans[getRecommendedPlan()].monthlyPrice.toFixed(2)
                    : calculatePrice(plans[getRecommendedPlan()].monthlyPrice)
                  }
                  <span className="price-period">
                    /{billingInterval === 'monthly' ? 'month' : 
                      billingInterval === 'quarterly' ? 'quarter' :
                      billingInterval === 'semi-annual' ? '6 months' : 'year'}
                  </span>
                </div>
                
                <div className="plan-features">
                  <div className="plan-feature">
                    <span className="feature-icon">📊</span>
                    <span>{plans[getRecommendedPlan()].codeSummaries} Code Summaries</span>
                  </div>
                  <div className="plan-feature">
                    <span className="feature-icon">🤖</span>
                    <span>{plans[getRecommendedPlan()].aiReports} AI Reports</span>
                  </div>
                  <div className="plan-feature">
                    <span className="feature-icon">👥</span>
                    <span>{plans[getRecommendedPlan()].teamMembers} Team Members</span>
                  </div>
                </div>
                
                <NavigationButton 
                  path="/signup"
                  variant="premium"
                  style={{
                    width: '100%',
                    marginTop: '1.5rem',
                    background: '#4A90E2'
                  }}
                >
                  Get Started
                </NavigationButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing with Discounts */}
      <div className="section-dark">
        <div className="container">
          <h2 className="section-title">Simple, Predictable Pricing</h2>
          <p className="section-subtitle">
            Choose your billing interval and save up to 30%
          </p>
          
          {/* Billing Interval Selector */}
          <div className="billing-selector">
            <div className="billing-options">
              {[
                { id: 'monthly', label: 'Monthly', discount: 0 },
                { id: 'quarterly', label: 'Quarterly', discount: 5, badge: 'Save 5%' },
                { id: 'semi-annual', label: 'Semi-Annual', discount: 15, badge: 'Save 15%' },
                { id: 'annual', label: 'Annual', discount: 30, badge: 'Save 30%' }
              ].map((option) => (
                <button
                  key={option.id}
                  className={`billing-option ${billingInterval === option.id ? 'active' : ''}`}
                  onClick={() => setBillingInterval(option.id as any)}
                >
                  {option.label}
                  {option.badge && <span className="discount-badge">{option.badge}</span>}
                </button>
              ))}
            </div>
          </div>
          
          {/* Pricing Cards */}
          <div className="pricing-grid">
            {[
              {
                id: 'basic' as 'basic',
                name: 'Basic',
                description: 'For solo developers',
                features: ['5 Code Summaries / month', '1 AI Report / month', 'GitHub integration', 'Basic vulnerability scan', 'Community support']
              },
              {
                id: 'premium' as 'premium',
                name: 'Premium',
                description: 'For growing startups',
                features: ['15 Code Summaries / month', '10 AI Reports / month', 'Priority GitHub integration', 'Advanced AI analysis', 'Email support', 'Auditor recommendations'],
                popular: true
              },
              {
                id: 'pro' as 'pro',
                name: 'Pro',
                description: 'For teams & serious projects',
                features: ['100+ Code Summaries / month', '40+ AI Reports / month', 'Up to 5 team members', 'White-label reporting', 'API access', 'Priority email & chat support']
              }
            ].map((plan) => (
              <div key={plan.id} className={`pricing-card ${plan.popular ? 'featured' : ''}`}>
                {plan.popular && <div className="pricing-badge">MOST POPULAR</div>}
                
                <div className="pricing-header">
                  <h3 className="pricing-title">{plan.name}</h3>
                  <div className="pricing-price">
                    ${billingInterval === 'monthly' 
                      ? plans[plan.id].monthlyPrice.toFixed(2)
                      : calculatePrice(plans[plan.id].monthlyPrice)
                    }
                    <span className="price-period">
                      /{billingInterval === 'monthly' ? 'month' : 
                        billingInterval === 'quarterly' ? 'quarter' :
                        billingInterval === 'semi-annual' ? '6 months' : 'year'}
                    </span>
                  </div>
                  <p className="pricing-description">{plan.description}</p>
                  
                  {billingInterval !== 'monthly' && plans[plan.id].monthlyPrice > 0 && (
                    <div className="original-price">
                      Originally ${plans[plan.id].monthlyPrice}/month
                    </div>
                  )}
                </div>
                
                <ul className="pricing-features">
                  {plan.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
                
                <NavigationButton 
                  path="/signup"
                  variant={plan.popular ? 'premium' : 'default'}
                  style={{
                    width: '100%',
                    marginTop: '1.5rem',
                    background: plan.popular ? '#4A90E2' : 'transparent',
                    border: plan.popular ? 'none' : '1px solid #666'
                  }}
                >
                  {plan.id === 'basic' ? 'Get Started Free' : 
                   plan.popular ? 'Start 7-Day Trial' : 'Go Pro'}
                </NavigationButton>
              </div>
            ))}
          </div>
          
          {/* Enterprise Plan */}
          <div className="enterprise-plan">
            <div className="enterprise-header">
              <h3>Enterprise Plan</h3>
              <div className="enterprise-price">${calculatePrice(50)}<span>/year</span></div>
            </div>
            <div className="enterprise-features">
              <div className="enterprise-feature">
                <span className="feature-icon">∞</span>
                <span>Unlimited Code Summaries</span>
              </div>
              <div className="enterprise-feature">
                <span className="feature-icon">∞</span>
                <span>Unlimited AI Reports</span>
              </div>
              <div className="enterprise-feature">
                <span className="feature-icon">👥</span>
                <span>10+ Team Members</span>
              </div>
              <div className="enterprise-feature">
                <span className="feature-icon">⚙️</span>
                <span>Custom Integrations</span>
              </div>
              <div className="enterprise-feature">
                <span className="feature-icon">📞</span>
                <span>Dedicated Support</span>
              </div>
              <div className="enterprise-feature">
                <span className="feature-icon">🏢</span>
                <span>SLA Guarantee</span>
              </div>
            </div>
            <NavigationButton 
              path="/contact"
              style={{
                background: 'transparent',
                border: '1px solid #4A90E2',
                color: '#4A90E2',
                marginTop: '2rem'
              }}
            >
              Contact Sales for Custom Quote
            </NavigationButton>
          </div>
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="section-light">
        <div className="container">
          <h2 className="section-title">Plan Comparison</h2>
          <p className="section-subtitle">
            Detailed feature breakdown across all plans
          </p>
          
          <div className="comparison-table-container">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th className="feature-column">Features</th>
                  <th className="plan-column">
                    <div className="plan-header">Basic</div>
                    <div className="plan-price">Free</div>
                  </th>
                  <th className="plan-column featured">
                    <div className="plan-header">Premium</div>
                    <div className="plan-price">$15<span>/month</span></div>
                  </th>
                  <th className="plan-column">
                    <div className="plan-header">Pro</div>
                    <div className="plan-price">$50<span>/month</span></div>
                  </th>
                  <th className="plan-column">
                    <div className="plan-header">Enterprise</div>
                    <div className="plan-price">Custom</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Code Summaries / month</td>
                  <td>5</td>
                  <td>15</td>
                  <td>100+</td>
                  <td>Unlimited</td>
                </tr>
                <tr>
                  <td>AI Reports / month</td>
                  <td>1</td>
                  <td>10</td>
                  <td>40+</td>
                  <td>Unlimited</td>
                </tr>
                <tr>
                  <td>Team Members</td>
                  <td>1</td>
                  <td>1</td>
                  <td>Up to 5</td>
                  <td>10+</td>
                </tr>
                <tr>
                  <td>GitHub Integration</td>
                  <td>✓</td>
                  <td>✓</td>
                  <td>✓</td>
                  <td>✓</td>
                </tr>
                <tr>
                  <td>Advanced AI Analysis</td>
                  <td>-</td>
                  <td>✓</td>
                  <td>✓</td>
                  <td>✓</td>
                </tr>
                <tr>
                  <td>API Access</td>
                  <td>-</td>
                  <td>-</td>
                  <td>✓</td>
                  <td>✓</td>
                </tr>
                <tr>
                  <td>White-label Reports</td>
                  <td>-</td>
                  <td>-</td>
                  <td>✓</td>
                  <td>✓</td>
                </tr>
                <tr>
                  <td>Priority Support</td>
                  <td>-</td>
                  <td>Email</td>
                  <td>Chat & Email</td>
                  <td>24/7 Phone</td>
                </tr>
                <tr>
                  <td>Custom Integrations</td>
                  <td>-</td>
                  <td>-</td>
                  <td>-</td>
                  <td>✓</td>
                </tr>
                <tr>
                  <td>SLA Guarantee</td>
                  <td>-</td>
                  <td>-</td>
                  <td>-</td>
                  <td>✓</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td></td>
                  <td>
                    <NavigationButton 
                      path="/signup"
                      style={{ width: '100%' }}
                    >
                      Get Started
                    </NavigationButton>
                  </td>
                  <td>
                    <NavigationButton 
                      path="/signup"
                      variant="premium"
                      style={{ width: '100%', background: '#4A90E2' }}
                    >
                      Start Trial
                    </NavigationButton>
                  </td>
                  <td>
                    <NavigationButton 
                      path="/signup"
                      style={{ width: '100%' }}
                    >
                      Go Pro
                    </NavigationButton>
                  </td>
                  <td>
                    <NavigationButton 
                      path="/contact"
                      style={{ width: '100%' }}
                    >
                      Contact Sales
                    </NavigationButton>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="section-cta">
        <div className="container">
          <h2 className="cta-title">Ready to Secure Your Smart Contracts?</h2>
          <p className="cta-description">
            Join 500+ Web3 projects that trust AuditFlow for their audit preparation. 
            Your first analysis is completely free.
          </p>
          <div className="cta-actions">
            <NavigationButton 
              path="/analyze"
              variant="premium"
              style={{
                fontSize: '1.2rem',
                padding: '1rem 2.5rem',
                background: '#4A90E2'
              }}
            >
              Start Free Analysis
            </NavigationButton>
            <a href="/demo" className="cta-link">
              Request a Demo →
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="home-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <span className="brand-logo">🛡️</span>
              <div className="footer-brand-text">
                <h4>AuditFlow</h4>
                <p>Automated Audit Preparation</p>
              </div>
            </div>
            
            <div className="footer-links">
              <h4>Product</h4>
              <ul>
                <li><a href="/features">Features</a></li>
                <li><a href="/pricing">Pricing</a></li>
                <li><a href="/security">Security</a></li>
                <li><a href="/status">Status</a></li>
              </ul>
            </div>
            
            <div className="footer-links">
              <h4>Resources</h4>
              <ul>
                <li><a href="/docs">Documentation</a></li>
                <li><a href="/blog">Blog</a></li>
                <li><a href="/audit-guide">Audit Guide</a></li>
                <li><a href="/api">API</a></li>
              </ul>
            </div>
            
            <div className="footer-links">
              <h4>Company</h4>
              <ul>
                <li><a href="/about">About</a></li>
                <li><a href="/careers">Careers</a></li>
                <li><a href="/contact">Contact</a></li>
                <li><a href="/terms">Terms</a></li>
              </ul>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>© {new Date().getFullYear()} AuditFlow. Making Web3 security accessible.</p>
            <div className="footer-social">
              <a href="https://github.com/auditflow" aria-label="GitHub">🐙</a>
              <a href="https://twitter.com/auditflow" aria-label="Twitter">𝕏</a>
              <a href="https://discord.gg/auditflow" aria-label="Discord">💬</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;