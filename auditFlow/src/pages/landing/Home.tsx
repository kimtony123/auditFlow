import React, { useState } from "react";
import NavigationButton from "../../components/NavigationsButton";
import { useTheme } from "../../services/ThemeProvider";

import "./Home.css";

const Home: React.FC = () => {
  const [selectedTier, setSelectedTier] = useState<'basic' | 'premium' | 'pro' | 'enterprise'>('premium');
  const [stakingDuration, setStakingDuration] = useState(30);

  // Tier configurations
  const stakingTiers = {
    basic: {
      name: 'Basic',
      baseTokens: 0,
      maxTokens: 0,
      description: 'For solo developers',
      features: [
        '5 Code Summaries / month',
        '1 AI Report / month',
        'GitHub integration',
        'Basic vulnerability scan',
        'Community support'
      ]
    },
    premium: {
      name: 'Premium',
      baseTokens: 100,
      maxTokens: 200,
      description: 'For growing startups',
      features: [
        '15 Code Summaries / month',
        '10 AI Reports / month',
        'Priority GitHub integration',
        'Advanced AI analysis',
        'Email support',
        'Auditor recommendations'
      ],
      popular: true
    },
    pro: {
      name: 'Pro',
      baseTokens: 500,
      maxTokens: 1000,
      description: 'For teams & serious projects',
      features: [
        '100+ Code Summaries / month',
        '40+ AI Reports / month',
        'Up to 5 team members',
        'White-label reporting',
        'API access',
        'Priority email & chat support'
      ]
    },
    enterprise: {
      name: 'Enterprise',
      baseTokens: 800,
      maxTokens: 1600,
      description: 'For enterprise teams',
      features: [
        'Unlimited Code Summaries',
        'Unlimited AI Reports',
        '10+ Team Members',
        'Custom Integrations',
        'Dedicated Support',
        'SLA Guarantee'
      ]
    }
  };

  // Calculate required stake
  const calculateRequiredStake = (tier: keyof typeof stakingTiers, days: number): number => {
    if (tier === 'basic') return 0;
    
    const config = stakingTiers[tier];
    const normalizedDays = days / 365;
    const decayRate = 2.5;
    
    const exponent = -decayRate * normalizedDays;
    const decayFactor = Math.exp(exponent);
    const multiplier = 1 + decayFactor;
    
    let required = config.baseTokens * multiplier;
    
    required = Math.max(config.baseTokens, Math.min(required, config.maxTokens));
    
    return Math.ceil(required * 100) / 100;
  };

  const requiredStake = calculateRequiredStake(selectedTier, stakingDuration);

  // Calculate unlock date
  const getUnlockDate = (days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Duration presets
  const durationPresets = [1, 7, 30, 90, 180, 365];

  const { theme, toggleTheme } = useTheme();

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
                border: '1px solid var(--accent-blue)'
              }}
            >
              Dashboard
            </NavigationButton>
            
            <NavigationButton 
              path="/stake"
              variant="premium"
              style={{
                fontSize: '1rem', 
                padding: '0.75rem 1.5rem',
                marginLeft: '1rem'
              }}
            >
              Start Free Analysis
            </NavigationButton>
            <button
            onClick={toggleTheme}
            className="theme-toggle"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <span className="theme-icon">🌙</span>
            ) : (
              <span className="theme-icon">☀️</span>
            )}
          </button>
          </div>
        </div>
      </nav>
      
      {/* Hero Section */}
      <div className="hero-section" id="home">
        <div className="container">
          <div className="hero-badge">⚡ LISK STAKING ACCESS</div>
          <h1 className="hero-title">
            Stake LSK, Get <span className="hero-highlight">Audit-Ready</span>
          </h1>
          <p className="hero-description">
            Access professional audit preparation by staking LSK tokens. Longer commitments get lower rates. 
            Your tokens are locked temporarily, then returned. Simple, transparent, no subscriptions.
          </p>
          
          <div className="hero-cta">
            <NavigationButton 
              path="/stake"
              variant="premium"
              style={{
                fontSize: '1.2rem', 
                padding: '1rem 2.5rem'
              }}
            >
              Start Staking Now
            </NavigationButton>
            <p className="hero-note">
              No monthly fees • Your tokens are returned after staking period
            </p>
          </div>

          {/* Trust Metrics */}
          <div className="trust-metrics">
            <div className="metric">
              <div className="metric-value">0%</div>
              <div className="metric-label">Monthly Fees</div>
            </div>
            <div className="metric-divider"></div>
            <div className="metric">
              <div className="metric-value">100%</div>
              <div className="metric-label">Token Return</div>
            </div>
            <div className="metric-divider"></div>
            <div className="metric">
              <div className="metric-value">1-365</div>
              <div className="metric-label">Flexible Days</div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="section-dark">
        <div className="container">
          <h2 className="section-title">How Staking Access Works</h2>
          <p className="section-subtitle">
            Simple, transparent, no permanent commitments
          </p>
          
          <div className="process-flow">
            <div className="process-step">
              <div className="step-icon">💰</div>
              <div className="step-number">01</div>
              <h3 className="step-title">Stake Tokens</h3>
              <p className="step-description">
                Choose tier and duration. Stake LSK tokens. Longer stakes get lower daily rates.
              </p>
            </div>
            
            <div className="process-connector">
              <div className="connector-line"></div>
              <div className="connector-arrow">→</div>
            </div>
            
            <div className="process-step">
              <div className="step-icon">🔓</div>
              <div className="step-number">02</div>
              <h3 className="step-title">Get Instant Access</h3>
              <p className="step-description">
                Immediately use AuditFlow with full features based on your tier.
              </p>
            </div>
            
            <div className="process-connector">
              <div className="connector-line"></div>
              <div className="connector-arrow">→</div>
            </div>
            
            <div className="process-step">
              <div className="step-icon">↩️</div>
              <div className="step-number">03</div>
              <h3 className="step-title">Tokens Returned</h3>
              <p className="step-description">
                After your chosen duration, withdraw 100% of your staked tokens.
              </p>
            </div>
          </div>

          {/* Warning Box */}
          <div className="warning-box">
            <div className="warning-icon">⚠️</div>
            <div className="warning-content">
              <h4>Important: Emergency Unstaking Penalty</h4>
              <p>
                Need your tokens back early? Emergency unstaking is available with a <strong>50% penalty</strong>. 
                The penalty goes to the AuditFlow DAO. Only unstake early if absolutely necessary.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Staking Calculator */}
      <div className="section-light calculator-section">
        <div className="container">
          <h2 className="section-title">Staking Calculator</h2>
          <p className="section-subtitle">
            See exactly how much to stake and for how long
          </p>
          
          <div className="staking-calculator">
            {/* Tier Selection */}
            <div className="tier-selection">
              <h3>Select Your Tier</h3>
              <div className="tier-cards">
                {Object.entries(stakingTiers).map(([key, tier]) => (
                  <div 
                    key={key}
                    className={`tier-card ${selectedTier === key ? 'selected' : ''}`}
                    onClick={() => setSelectedTier(key as any)}
                  >
                    <div className="tier-name">{tier.name}</div>
                    {key !== 'basic' && (
                      <div className="tier-range">
                        <span className="min">{tier.baseTokens} LSK/yr</span>
                        <span className="arrow">→</span>
                        <span className="max">{tier.maxTokens} LSK/day</span>
                      </div>
                    )}
                    <div className="tier-features">
                      {tier.features.slice(0, 3).map((feature, idx) => (
                        <div key={idx} className="feature">✓ {feature}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Duration Selection */}
            <div className="duration-selection">
              <h3>Staking Duration: <span className="duration-value">{stakingDuration} days</span></h3>
              
              <div className="duration-slider-container">
                <input
                  type="range"
                  min="1"
                  max="365"
                  value={stakingDuration}
                  onChange={(e) => setStakingDuration(parseInt(e.target.value))}
                  className="duration-slider"
                />
                <div className="slider-labels">
                  <span>1 day</span>
                  <span>365 days</span>
                </div>
              </div>
              
              <div className="duration-presets">
                {durationPresets.map(days => (
                  <button
                    key={days}
                    className={`preset-btn ${stakingDuration === days ? 'active' : ''}`}
                    onClick={() => setStakingDuration(days)}
                  >
                    {days === 1 ? '24h' : days === 365 ? '1y' : `${days}d`}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Results */}
            <div className="staking-results">
              <div className="results-grid">
                <div className="result-card primary">
                  <div className="result-label">Required Stake</div>
                  <div className="result-value">{requiredStake.toFixed(2)} LSK</div>
                  <div className="result-subtext">Stake this amount to get started</div>
                </div>
                
                <div className="result-card">
                  <div className="result-label">Tokens Returned</div>
                  <div className="result-value">{requiredStake.toFixed(2)} LSK</div>
                  <div className="result-subtext">After {stakingDuration} days</div>
                  <div className="result-detail">
                    Unlock date: {getUnlockDate(stakingDuration)}
                  </div>
                </div>
                
                <div className="result-card warning">
                  <div className="result-label">Emergency Unstaking</div>
                  <div className="result-value penalty">50% Penalty</div>
                  <div className="result-subtext">If unstaking early</div>
                  <div className="result-detail">
                    You receive: {(requiredStake * 0.5).toFixed(2)} LSK
                    <div className="penalty-note">Penalty goes to AuditFlow DAO</div>
                  </div>
                </div>
              </div>
              
              {/* Visual Timeline */}
              <div className="timeline-visualization">
                <h4>Your Staking Timeline</h4>
                <div className="timeline">
                  <div className="timeline-point start">
                    <div className="point-icon">⏰</div>
                    <div className="point-label">Day 0</div>
                    <div className="point-desc">Stake {requiredStake.toFixed(2)} LSK</div>
                  </div>
                  
                  <div className="timeline-line">
                    <div className="line-days">{stakingDuration} days</div>
                  </div>
                  
                  <div className="timeline-point end">
                    <div className="point-icon">✅</div>
                    <div className="point-label">Day {stakingDuration}</div>
                    <div className="point-desc">Withdraw {requiredStake.toFixed(2)} LSK</div>
                  </div>
                </div>
              </div>
              
              {/* Action Button */}
              <div className="staking-action">
                <NavigationButton 
                  path={`/stake?tier=${selectedTier}&duration=${stakingDuration}`}
                  variant="premium"
                  style={{
                    fontSize: '1.2rem',
                    padding: '1rem 3rem',
                    width: '100%',
                    maxWidth: '500px'
                  }}
                >
                  {selectedTier === 'basic' ? 'Get Basic (Free)' : `Stake ${requiredStake.toFixed(2)} LSK for ${stakingDuration} day${stakingDuration !== 1 ? 's' : ''}`}
                </NavigationButton>
                <div className="action-notes">
                  <p className="action-note">
                    💡 <strong>Best value:</strong> Stake for 365 days to get the lowest rate of {stakingTiers[selectedTier].baseTokens} LSK total
                  </p>
                  <p className="warning-note">
                    ⚠️ <strong>Remember:</strong> Your tokens are locked for {stakingDuration} days. Emergency unstaking has a 50% penalty.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="section-dark">
        <div className="container">
          <h2 className="section-title">Why Stake Instead of Subscribe?</h2>
          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-icon">📉</div>
              <h3>Inverted Curve Pricing</h3>
              <p>Longer commitments get significantly lower rates. Stake for 1 year and pay just the base rate.</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">🔄</div>
              <h3>Tokens Returned 100%</h3>
              <p>After your staking period ends, withdraw 100% of your staked tokens. No token dilution.</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">⚡</div>
              <h3>No Recurring Fees</h3>
              <p>Stake once for your desired duration. No monthly subscriptions or hidden fees.</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">🏢</div>
              <h3>Supports DAO Growth</h3>
              <p>DAO earns yield from staked assets to fund development and improve the platform.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="section-light">
        <div className="container">
          <h2 className="section-title">Plan Comparison</h2>
          <p className="section-subtitle">
            Detailed staking requirements and feature breakdown
          </p>
          
          <div className="comparison-table-container">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th className="feature-column">Features</th>
                  <th className="plan-column">
                    <div className="plan-header">Basic</div>
                    <div className="plan-price">Free</div>
                    <div className="plan-subtitle">No staking required</div>
                  </th>
                  <th className="plan-column featured">
                    <div className="plan-header">Premium</div>
                    <div className="plan-price">100-200 LSK</div>
                    <div className="plan-subtitle">1 day to 1 year</div>
                  </th>
                  <th className="plan-column">
                    <div className="plan-header">Pro</div>
                    <div className="plan-price">500-1000 LSK</div>
                    <div className="plan-subtitle">1 day to 1 year</div>
                  </th>
                  <th className="plan-column">
                    <div className="plan-header">Enterprise</div>
                    <div className="plan-price">800-1600 LSK</div>
                    <div className="plan-subtitle">1 day to 1 year</div>
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
                  <td>Minimum (1 day)</td>
                  <td>-</td>
                  <td>200 LSK</td>
                  <td>1000 LSK</td>
                  <td>1600 LSK</td>
                </tr>
                <tr>
                  <td>Annual (365 days)</td>
                  <td>-</td>
                  <td>100 LSK</td>
                  <td>500 LSK</td>
                  <td>800 LSK</td>
                </tr>
                <tr>
                  <td>Token Return</td>
                  <td>-</td>
                  <td colSpan={3}>100% after lock period</td>
                </tr>
                <tr>
                  <td>Emergency Unstaking</td>
                  <td>-</td>
                  <td colSpan={3}>50% penalty (half to DAO)</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td></td>
                  <td>
                    <NavigationButton 
                      path="/dashboard"
                      style={{ width: '100%' }}
                    >
                      Get Started
                    </NavigationButton>
                  </td>
                  <td>
                    <NavigationButton 
                      path="/stake?tier=premium"
                      variant="premium"
                      style={{ width: '100%' }}
                    >
                      Stake Now
                    </NavigationButton>
                  </td>
                  <td>
                    <NavigationButton 
                      path="/stake?tier=pro"
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
                      Contact for Enterprise
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
            Stake LSK, get professional audit preparation, withdraw your tokens later. 
            It's that simple.
          </p>
          <div className="cta-actions">
            <NavigationButton 
              path="/stake"
              variant="premium"
              style={{
                fontSize: '1.2rem',
                padding: '1rem 2.5rem'
              }}
            >
              Start Staking Now
            </NavigationButton>
            <div className="cta-links">
              <a href="/demo" className="cta-link">
                Request a Demo →
              </a>
              <a href="/docs/staking" className="cta-link">
                Read Staking Docs →
              </a>
            </div>
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
                <p className="footer-tagline">Stake LSK, Get Audit-Ready</p>
              </div>
            </div>
            
            <div className="footer-links">
              <h4>Product</h4>
              <ul>
                <li><a href="/features">Features</a></li>
                <li><a href="/staking">Staking</a></li>
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
                <li><a href="/staking-guide">Staking Guide</a></li>
              </ul>
            </div>
            
            <div className="footer-links">
              <h4>DAO & Community</h4>
              <ul>
                <li><a href="/dao">AuditFlow DAO</a></li>
                <li><a href="/governance">Governance</a></li>
                <li><a href="/contact">Contact</a></li>
                <li><a href="/terms">Terms</a></li>
              </ul>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>© {new Date().getFullYear()} AuditFlow. Stake LSK, Get Audit-Ready. Your tokens are returned 100% after staking period.</p>
            <div className="footer-social">
              <a href="https://github.com/auditflow" aria-label="GitHub">🐙</a>
              <a href="https://twitter.com/auditflow" aria-label="Twitter">𝕏</a>
              <a href="https://discord.gg/auditflow" aria-label="Discord">💬</a>
              <a href="https://lisk.com" aria-label="Lisk" className="lisk-badge">⛓️ Lisk</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;