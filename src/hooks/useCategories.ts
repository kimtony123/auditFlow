import { useState, useCallback, useEffect } from 'react';
import { useConnection } from '@arweave-wallet-kit/react';
import { CategoryService } from '../services/categoryService';
import type { Category } from '../types/categories';

export const useCategories = () => {
  const { connected } = useConnection();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    if (!connected) {
      throw new Error("Wallet not connected");
    }

    setIsLoading(true);
    setError(null);

    try {
      const categoriesData = await CategoryService.fetchCategories();
      setCategories(categoriesData);
      return categoriesData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch categories';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [connected]);

  // Create category
  const createCategory = useCallback(async (categoryData: {
    name: string;
    type: 'income' | 'expense';
    icon: string;
    description?: string;
  }) => {
    if (!connected) {
      throw new Error("Wallet not connected");
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload = { ...categoryData, description: categoryData.description ?? '' };
      const result = await CategoryService.createCategory(payload);
      // Validate and narrow the result to Category before updating state
      if (!result || typeof (result as any).id === 'undefined') {
        const message = 'Invalid category returned from service';
        setError(message);
        throw new Error(message);
      }
      const newCategory = result as unknown as Category;
      setCategories(prev => [...prev, newCategory]);
      return newCategory;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create category';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [connected]);

  // Delete category
  const deleteCategory = useCallback(async (categoryId: string) => {
    if (!connected) {
      throw new Error("Wallet not connected");
    }

    setIsLoading(true);
    setError(null);

    try {
      await CategoryService.deleteCategory(categoryId);
      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete category';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [connected]);

  // Auto-fetch categories on mount
  useEffect(() => {
    if (connected) {
      fetchCategories();
    }
  }, [connected, fetchCategories]);

  // Group categories by type
  const incomeCategories = categories.filter(cat => cat.type === 'income');
  const expenseCategories = categories.filter(cat => cat.type === 'expense');

  return {
    // Data
    categories,
    incomeCategories,
    expenseCategories,
    
    // Actions
    fetchCategories,
    createCategory,
    deleteCategory,
    
    // State
    isLoading,
    error,
    clearError: () => setError(null),
    
    // Derived state
    hasCategories: categories.length > 0,
    totalCategories: categories.length
  };
};