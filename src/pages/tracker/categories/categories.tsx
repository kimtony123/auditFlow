import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCategories } from '../../../hooks/useCategories';
import { useSubscription } from '../../../hooks/useSubscription';
import { AdComponent } from '../../../components/ads/adsComponent';
import './categories.css';

const CategoriesPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    categories, 
    incomeCategories, 
    expenseCategories, 
    deleteCategory, 
    isLoading, 
    error,
    hasCategories 
  } = useCategories();
  
  const { hasPremium } = useSubscription('budget-tracker-dapp-id');

  // Redirect to add category if no categories exist
  useEffect(() => {
    if (!isLoading && !hasCategories) {
      navigate('/addCategory');
    }
  }, [isLoading, hasCategories, navigate]);

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    if (window.confirm(`Are you sure you want to delete "${categoryName}"?`)) {
      try {
        await deleteCategory(categoryId);
      } catch (error) {
        console.error('Failed to delete category:', error);
      }
    }
  };

  const handleEditCategory = (categoryId: string) => {
    // Navigate to edit category page (you can implement this)
    console.log('Edit category:', categoryId);
  };

  if (isLoading) {
    return (
      <div className="categories-container">
        <div className="categories-loading">
          <h2>Loading Categories...</h2>
          <p>Fetching your categories from the blockchain...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="categories-container">
        <div className="categories-error">
          <h2>Error Loading Categories</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!hasCategories) {
    // This should redirect automatically, but show a message just in case
    return (
      <div className="categories-container">
        <div className="categories-empty">
          <h2>No Categories Found</h2>
          <p>Redirecting you to create your first category...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="categories-container">
      {/* Header */}
      <div className="categories-header">
        <h1>Manage Categories</h1>
        <p>Organize your income and expense categories</p>
        
        <div className="header-actions">
          <button 
            onClick={() => navigate('/addCategory')}
            className="btn btn-success"
          >
            + Add New Category
          </button>
          <div className="categories-stats">
            <span>Total: {categories.length} categories</span>
            <span>Income: {incomeCategories.length}</span>
            <span>Expense: {expenseCategories.length}</span>
          </div>
        </div>
      </div>

      {/* Ad for free users */}
      {!hasPremium && (
        <AdComponent 
          appId="budget-tracker-dapp-id" 
          publisherId="budget-tracker-publisher" 
          placement="inline" 
        />
      )}

      {/* Income Categories */}
      <div className="categories-section">
        <h2 className="section-title income-title">
          💰 Income Categories ({incomeCategories.length})
        </h2>
        
        {incomeCategories.length === 0 ? (
          <div className="empty-categories">
            <p>No income categories yet. <a href="/addCategory">Create one</a></p>
          </div>
        ) : (
          <div className="categories-grid">
            {incomeCategories.map(category => (
              <div key={category.id} className="category-card income-category">
                <div className="category-header">
                  <span className="category-icon">{category.icon}</span>
                  <h3 className="category-name">{category.name}</h3>
                </div>
                
                <p className="category-description">
                  {category.description || 'No description'}
                </p>
                
                <div className="category-footer">
                  <span className="transaction-count">
                    {category.transaction_count || 0} transactions
                  </span>
                  
                  <div className="category-actions">
                    <button 
                      onClick={() => handleEditCategory(category.id)}
                      className="btn-edit"
                      title="Edit category"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => handleDeleteCategory(category.id, category.name)}
                      className="btn-delete"
                      title="Delete category"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Expense Categories */}
      <div className="categories-section">
        <h2 className="section-title expense-title">
          💳 Expense Categories ({expenseCategories.length})
        </h2>
        
        {expenseCategories.length === 0 ? (
          <div className="empty-categories">
            <p>No expense categories yet. <a href="/addCategory">Create one</a></p>
          </div>
        ) : (
          <div className="categories-grid">
            {expenseCategories.map(category => (
              <div key={category.id} className="category-card expense-category">
                <div className="category-header">
                  <span className="category-icon">{category.icon}</span>
                  <h3 className="category-name">{category.name}</h3>
                </div>
                
                <p className="category-description">
                  {category.description || 'No description'}
                </p>
                
                <div className="category-footer">
                  <span className="transaction-count">
                    {category.transaction_count || 0} transactions
                  </span>
                  
                  <div className="category-actions">
                    <button 
                      onClick={() => handleEditCategory(category.id)}
                      className="btn-edit"
                      title="Edit category"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => handleDeleteCategory(category.id, category.name)}
                      className="btn-delete"
                      title="Delete category"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button 
          onClick={() => navigate('/addCategory')}
          className="btn btn-primary"
        >
          + Add New Category
        </button>
        <button 
          onClick={() => navigate('/transactions')}
          className="btn btn-secondary"
        >
          View Transactions
        </button>
        <button 
          onClick={() => navigate('/trackerdashboard')}
          className="btn btn-secondary"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default CategoriesPage;