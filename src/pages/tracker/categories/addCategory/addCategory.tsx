import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCategories } from '../../../../hooks/useCategories';
import { useSubscription } from '../../../../hooks/useSubscription';
import { useConnection , useActiveAddress } from '@arweave-wallet-kit/react';
import { AdComponent } from '../../../../components/ads/adsComponent';
import './addCategory.css';

const AddCategory: React.FC = () => {
  const navigate = useNavigate();
  const { connected } = useConnection();

  const address = useActiveAddress();
  const { createCategory, isLoading, error } = useCategories();
  const { hasPremium } = useSubscription('budget-tracker-dapp-id');
  
  const [formData, setFormData] = useState({
    name: '',
    type: '' as 'income' | 'expense' | '',
    icon: '',
    description: ''
  });
  
  const [selectedIcon, setSelectedIcon] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [localError, setLocalError] = useState('');

  // Available icons for selection
  const availableIcons = [
    { value: '💰', name: 'money' },
    { value: '🍕', name: 'food' },
    { value: '🏠', name: 'home' },
    { value: '🚗', name: 'car' },
    { value: '🛒', name: 'shopping' },
    { value: '❤️', name: 'health' },
    { value: '💻', name: 'tech' },
    { value: '📱', name: 'phone' },
    { value: '🎮', name: 'games' },
    { value: '📚', name: 'books' },
    { value: '🎁', name: 'gifts' },
    { value: '✈️', name: 'travel' },
    { value: '🎓', name: 'education' },
    { value: '🏥', name: 'medical' },
    { value: '💡', name: 'utilities' },
    { value: '👕', name: 'clothing' },
    { value: '🍽️', name: 'dining' },
    { value: '🏋️', name: 'fitness' },
    { value: '🎭', name: 'entertainment' },
    { value: '📈', name: 'investments' }
  ];

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle icon selection
  const handleIconSelect = (iconValue: string) => {
    setSelectedIcon(iconValue);
    setFormData(prev => ({
      ...prev,
      icon: iconValue
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setSuccessMessage('');

    // Validation
    if (!formData.name.trim()) {
      setLocalError('Please enter a category name');
      return;
    }

    if (!formData.type) {
      setLocalError('Please select a category type');
      return;
    }

    if (!formData.icon) {
      setLocalError('Please select an icon');
      return;
    }

    if (!connected) {
      setLocalError('Wallet not connected. Please connect your wallet to create categories.');
      return;
    }

    try {
      // Create category using AO service
      await createCategory({
        name: formData.name.trim(),
        type: formData.type as 'income' | 'expense',
        icon: formData.icon,
        description: formData.description.trim() || undefined
      });

      setSuccessMessage('Category created successfully!');
      
      // Reset form
      setFormData({
        name: '',
        type: '',
        icon: '',
        description: ''
      });
      setSelectedIcon('');

      // Redirect to categories page after 2 seconds
      setTimeout(() => {
        navigate('/manage');
      }, 2000);

    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to create category');
    }
  };

  // Set first icon as default on component mount
  useEffect(() => {
    if (availableIcons.length > 0 && !selectedIcon) {
      handleIconSelect(availableIcons[0].value);
    }
  }, []);

  return (
    <div className="add-category-container">
      {/* Navigation */}
      <nav className="add-category-nav">
        <div className="nav-container">
          <a href="#home" className="nav-brand">aoBudgetAI</a>
          <div className="nav-links">
            <span className="nav-free-badge">Free</span>
            <a href="#dashboard">Dashboard</a>
            <a href="#transactions">Transactions</a>
            <a href="#categories" className="nav-active">Categories</a>
            <a href="#reports">Reports</a>
            <a href="#add-income">Add Income</a>
            <a href="#add-expense">Add Expense</a>
            <a href="#upgrade" className="premium-link">✨ Upgrade to Premium</a>
            <a href="#home">← Back to Home</a>
          </div>
        </div>
      </nav>

      <div className="add-category-content">
        {/* Upgrade Banner for Free Users */}
        {!hasPremium && (
          <div className="upgrade-banner">
            <h3>✨ Upgrade to Premium</h3>
            <p>Unlock AI-powered financial insights and remove ads!</p>
            <button className="btn btn-premium">Upgrade Now</button>
          </div>
        )}

        <div className="add-category-card">
          <h1>Create Category</h1>
          <p className="card-subtitle">
            Categories are used to group your transactions and track spending patterns.
          </p>

          {/* Wallet Connection Status */}
          <div className={`message ${connected ? 'message-info' : 'message-warning'}`}>
            <h3>Wallet Integration</h3>
            <p>
              {connected 
                ? `Connected: ${address?.slice(0, 8)}...${address?.slice(-8)}`
                : 'Please connect your wallet to create categories'
              }
            </p>
            <p><strong>User Role: {hasPremium ? 'Premium' : 'Free'}</strong></p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="message message-success">
              <h3>Success!</h3>
              <p>{successMessage}</p>
            </div>
          )}

          {/* Error Messages */}
          {(error || localError) && (
            <div className="message message-error">
              <h3>Error</h3>
              <p>{error || localError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="category-form">
            {/* Name Field */}
            <div className="form-group">
              <label className="form-label" htmlFor="name">
                Category Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                className="form-input"
                placeholder="e.g., Groceries, Salary, Rent"
                value={formData.name}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
              <small>Give your category a clear, descriptive name</small>
            </div>

            {/* Type Field */}
            <div className="form-group">
              <label className="form-label" htmlFor="type">
                Category Type *
              </label>
              <select
                id="type"
                name="type"
                className="form-select"
                value={formData.type}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              >
                <option value="">Select a type</option>
                <option value="income">💰 Income - Money coming in</option>
                <option value="expense">💳 Expense - Money going out</option>
              </select>
            </div>

            {/* Icon Selection */}
            <div className="form-group">
              <label className="form-label">
                Select an Icon *
              </label>
              <div className="icon-grid">
                {availableIcons.map(icon => (
                  <div
                    key={icon.value}
                    className={`icon-option ${selectedIcon === icon.value ? 'selected' : ''}`}
                    onClick={() => handleIconSelect(icon.value)}
                  >
                    {icon.value}
                  </div>
                ))}
              </div>
              <input
                type="hidden"
                name="icon"
                value={formData.icon}
                required
              />
              <small>Click to select an icon that represents your category</small>
            </div>

            {/* Description Field */}
            <div className="form-group">
              <label className="form-label" htmlFor="description">
                Description
              </label>
              <input
                type="text"
                id="description"
                name="description"
                className="form-input"
                placeholder="It will help with AI analysis (premium feature)"
                value={formData.description}
                onChange={handleInputChange}
                disabled={isLoading}
              />
              <small>A brief description of what this category includes</small>
            </div>

            {/* Submit Buttons */}
            <div className="button-group">
              <button 
                type="submit" 
                className="btn btn-success" 
                disabled={isLoading || !connected}
              >
                {isLoading ? '⏳ Creating...' : '💾 Create Category'}
              </button>
              
              <button 
                type="button"
                onClick={() => navigate('/manage')}
                className="btn btn-secondary"
                disabled={isLoading}
              >
                ❌ Cancel
              </button>
              
              <button 
                type="button"
                onClick={() => console.log('Check role')}
                className="btn btn-warning"
                style={{ gridColumn: 'span 2' }}
              >
                👤 Check Role
              </button>
            </div>
          </form>
        </div>

        {/* Information Section */}
        <div className="info-section">
          <h3>Why categorize transactions?</h3>
          <p>
            Categorizing your transactions helps you understand where your money is going, 
            identify spending patterns, and create better budgets. You can assign each 
            transaction to a category to track expenses and income more effectively.
          </p>
          
          <div className="info-categories">
            <h4>Expense Categories</h4>
            <p>
              Expense categories represent money going out, such as{' '}
              <span className="type-badge type-expense">Groceries</span>{' '}
              <span className="type-badge type-expense">Rent</span>{' '}
              <span className="type-badge type-expense">Utilities</span>{' '}
              <span className="type-badge type-expense">Entertainment</span>{' '}
              and <span className="type-badge type-expense">Transportation</span>.
            </p>
            
            <h4>Income Categories</h4>
            <p>
              Income categories represent money coming in, such as{' '}
              <span className="type-badge type-income">Salary</span>{' '}
              <span className="type-badge type-income">Freelance</span>{' '}
              <span className="type-badge type-income">Investments</span>{' '}
              and <span className="type-badge type-income">Gifts</span>.
            </p>
          </div>
          
          <div className="pro-tip">
            <h4>💡 Pro Tip</h4>
            <p>
              Create specific categories that match your spending habits. The more accurate 
              your categories, the better the AI can analyze your financial patterns and 
              provide useful insights.
            </p>
            <p>
              <strong>Upgrade to Premium</strong> to unlock AI-powered category suggestions 
              based on your spending patterns!
            </p>
          </div>
        </div>

        {/* Ad for Free Users */}
        {!hasPremium && (
          <AdComponent 
            appId="budget-tracker-dapp-id" 
            publisherId="budget-tracker-publisher" 
            placement="inline" 
          />
        )}
      </div>

      <footer className="add-category-footer">
        <div className="footer-container">
          <p>&copy; 2025 aoBudgetAI. Budget Management.</p>
        </div>
      </footer>
    </div>
  );
};

export default AddCategory;