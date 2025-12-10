import React, { useState, useEffect } from 'react';
import { useTransactions } from '../../../../hooks/useTransactions';
import { useNavigation } from '../../../../hooks/useNavigation';
import { useSubscription } from '../../../../hooks/useSubscription';
import { AdComponent } from '../../../../components/ads/adsComponent';
import './AddTransaction.css';

const AddTransaction: React.FC = () => {
  const handleClick = useNavigation();
  const { hasPremium } = useSubscription('budget-tracker');
  const { 
    incomeCategories, 
    expenseCategories, 
    fetchAllCategories, 
    createTransaction, 
    isLoading, 
    error 
  } = useTransactions();

  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('income');
  const [formData, setFormData] = useState({
    category_id: '',
    description: '',
    date: '',
    amount: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  // Set default date to today
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setFormData(prev => ({ ...prev, date: today }));
  }, []);

  // Fetch categories when component mounts
  useEffect(() => {
    fetchAllCategories().catch(console.error);
  }, [fetchAllCategories]);

  // Reset category when transaction type changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, category_id: '' }));
  }, [transactionType]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTransactionTypeChange = (type: 'income' | 'expense') => {
    setTransactionType(type);
    setSubmitStatus('idle');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category_id || !formData.description || !formData.date || !formData.amount) {
      setSubmitStatus('error');
      setStatusMessage('Please fill in all fields');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setSubmitStatus('error');
      setStatusMessage('Please enter a valid amount greater than 0');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const transactionData = {
        type: transactionType,
        category_id: formData.category_id,
        description: formData.description,
        amount: amount,
        date: formData.date
      };

      const success = await createTransaction(transactionData);

      if (success) {
        setSubmitStatus('success');
        setStatusMessage(
          `Successfully recorded ${transactionType} of $${amount.toFixed(2)}`
        );
        
        // Reset form
        setFormData({
          category_id: '',
          description: '',
          date: new Date().toISOString().split('T')[0],
          amount: ''
        });
      } else {
        setSubmitStatus('error');
        setStatusMessage('Failed to create transaction. Please try again.');
      }
    } catch (err) {
      setSubmitStatus('error');
      setStatusMessage(err instanceof Error ? err.message : 'Failed to create transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentCategories = transactionType === 'income' ? incomeCategories : expenseCategories;
  const selectedCategory = currentCategories.find((cat: { id: any; }) => String(cat.id) === formData.category_id);

  return (
    <div className="add-transaction-page">
      {/* Navigation */}
      <nav className="add-transaction-nav">
        <div className="container">
          <a href="#home" onClick={handleClick("/")}>aoBudgetAI</a>
          <div className="nav-links">
            <span className="user-badge">Free</span>
            <a href="#dashboard" onClick={handleClick("/trackerdashboard")}>Dashboard</a>
            <a href="#transactions" onClick={handleClick("/transactions")}>Transactions</a>
            <a href="#categories" onClick={handleClick("/manage")}>Categories</a>
            <a href="#add-transaction" className="active">Add Transaction</a>
            <a href="#upgrade" className="premium-link" onClick={handleClick("/upgrade")}>✨ Upgrade to Premium</a>
          </div>
        </div>
      </nav>

      <div className="container">
        {/* Upgrade Banner */}
        <div className="upgrade-banner">
          <h3>✨ Upgrade to Premium</h3>
          <p>Unlock AI-powered financial insights and remove ads!</p>
          <button className="btn btn-premium" onClick={handleClick("/upgrade")}>Upgrade Now</button>
        </div>

        <div className="card">
          <h1 className="page-title">Add Transaction</h1>

          {/* Transaction Type Selector */}
          <div className="type-selector">
            <div 
              className={`type-option income ${transactionType === 'income' ? 'active' : ''}`}
              onClick={() => handleTransactionTypeChange('income')}
            >
              <div className="type-icon">💰</div>
              <h3>Income</h3>
              <p>Money coming in</p>
            </div>
            <div 
              className={`type-option expense ${transactionType === 'expense' ? 'active' : ''}`}
              onClick={() => handleTransactionTypeChange('expense')}
            >
              <div className="type-icon">💳</div>
              <h3>Expense</h3>
              <p>Money going out</p>
            </div>
          </div>

          {/* Transaction Highlight */}
          <div className={`transaction-highlight ${transactionType === 'expense' ? 'expense-mode' : ''}`}>
            <h3 className={transactionType === 'income' ? 'income-color' : 'expense-color'}>
              {transactionType === 'income' ? '💰 Track Your Earnings' : '💳 Track Your Spending'}
            </h3>
            <p>
              {transactionType === 'income' 
                ? 'Recording income helps you understand your cash flow and plan for future expenses.'
                : 'Recording expenses helps you understand where your money is going and identify savings opportunities.'
              }
            </p>
            <p><strong>User Role: {hasPremium ? 'Premium' : 'Free'}</strong></p>
          </div>

          {/* Wallet Connection Info */}
          <div className="message message-info">
            <h3>Wallet Connected</h3>
            <p>Your transaction will be securely recorded on the Arweave blockchain.</p>
          </div>

          {/* Status Messages */}
          {submitStatus === 'success' && (
            <div className="message message-success">
              <h3>Success!</h3>
              <p>{statusMessage}</p>
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="message message-error">
              <h3>Error</h3>
              <p>{statusMessage}</p>
            </div>
          )}

          {error && (
            <div className="message message-error">
              <h3>Error Loading Categories</h3>
              <p>{error}</p>
            </div>
          )}

          {/* Transaction Form */}
          <form onSubmit={handleSubmit} className="transaction-form">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select 
                value={formData.category_id}
                onChange={(e) => handleInputChange('category_id', e.target.value)}
                className="form-select"
                required
                disabled={isLoading}
              >
                <option value="">Select a category</option>
                {currentCategories.map((category: any) => (
                  <option key={String(category.id)} value={String(category.id)}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
              {selectedCategory && (
                <p className="category-description">{selectedCategory.description}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="form-input"
                placeholder={
                  transactionType === 'income' 
                    ? 'e.g., Monthly salary, Freelance project, Investment returns...'
                    : 'e.g., Groceries, Rent payment, Gas refill, Dinner out...'
                }
                required
                disabled={isLoading || isSubmitting}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className="form-input"
                required
                disabled={isLoading || isSubmitting}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Amount ($)</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                className="form-input"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                required
                disabled={isLoading || isSubmitting}
              />
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className={`btn ${transactionType === 'income' ? 'btn-income' : 'btn-expense'}`}
                disabled={isLoading || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="loading-spinner"></span>
                    Adding Transaction...
                  </>
                ) : transactionType === 'income' ? (
                  '💰 Add Income'
                ) : (
                  '💳 Add Expense'
                )}
              </button>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={handleClick("/trackerdashboard")}
                disabled={isSubmitting}
              >
                ❌ Cancel
              </button>
            </div>
          </form>

          {/* Transaction Tips */}
          <div className="tips">
            <h3>💡 Smart Financial Tracking</h3>
            <p>Recording both income and expenses gives you a complete picture of your financial health.</p>
            
            <div className="tips-grid">
              <div className="tip-card income-tip">
                <h4 className="income-color">Income Best Practices</h4>
                <ul>
                  <li>Record income as soon as you receive it</li>
                  <li>Use specific categories for different sources</li>
                  <li>Note recurring vs one-time income</li>
                </ul>
              </div>
              <div className="tip-card expense-tip">
                <h4 className="expense-color">Expense Best Practices</h4>
                <ul>
                  <li>Record expenses immediately after purchase</li>
                  <li>Use specific categories for accurate reporting</li>
                  <li>Review expenses weekly to spot trends</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ad Component */}
      {!hasPremium && (
        <AdComponent 
          appId="budget-tracker" 
          publisherId="aobudgetai" 
          placement="inline" 
        />
      )}

      <footer className="add-transaction-footer">
        <div className="container">
          <p>&copy; 2025 aoBudgetAI. Budget Management.</p>
        </div>
      </footer>
    </div>
  );
};

export default AddTransaction;