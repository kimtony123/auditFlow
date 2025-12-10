import { AOService } from './aoService';
import { DataEncoder } from '../utils/dataEncoder';

export interface Category {
  id: string;
  name: string;
  description: string;
  type: 'income' | 'expense';
  icon: string;
  transaction_count: number;
  created_at?: number;
}

export interface CategoriesResponse {
  categories: Category[];
  success: boolean;
  count: number;
}

export class CategoryService {
  private static processId = process.env.TRACKER_PROCESS_ID;

  /**
   * Fetch all categories for a user
   */
  static async fetchCategories(): Promise<Category[]> {
    const tags = AOService.createTags("GetCategories", {
      Data: DataEncoder.encode({ action: "get_categories" })
    });

    const response = await AOService.sendMessage({
      process: this.processId!,
      tags
    });

    if (response.code === 200 && response.data.success) {
      return response.data.categories || [];
    } else {
      throw new Error(response.data?.message || "Failed to fetch categories");
    }
  }

  /**
   * Create a new category
   */
  static async createCategory(categoryData: {
    name: string;
    description: string;
    type: 'income' | 'expense';
    icon: string;
  }): Promise<boolean> {
    const tags = AOService.createTags("CreateCategory", {
      ...categoryData,
      Data: DataEncoder.encode(categoryData)
    });

    const response = await AOService.sendMessage({
      process: this.processId!,
      tags
    });

    if (response.code === 200) {
      return response.data.success || false;
    } else {
      throw new Error(response.data?.message || "Failed to create category");
    }
  }

  /**
   * Delete a category
   */
  static async deleteCategory(categoryId: string): Promise<boolean> {
    const tags = AOService.createTags("DeleteCategory", {
      categoryId,
      Data: DataEncoder.encode({ categoryId })
    });

    const response = await AOService.sendMessage({
      process: this.processId!,
      tags
    });

    if (response.code === 200) {
      return response.data.success || false;
    } else {
      throw new Error(response.data?.message || "Failed to delete category");
    }
  }

  /**
   * Get mock categories for demo (fallback)
   */
  static getMockCategories(): Category[] {
    return [
      // Income Categories
      {
        id: "1",
        name: "Salary",
        description: "Monthly salary income",
        type: "income",
        icon: "💰",
        transaction_count: 12
      },
      {
        id: "2",
        name: "Freelance",
        description: "Freelance work income",
        type: "income", 
        icon: "💻",
        transaction_count: 8
      },
      {
        id: "3",
        name: "Investments",
        description: "Investment returns",
        type: "income",
        icon: "📈",
        transaction_count: 5
      },
      {
        id: "4", 
        name: "Bonus",
        description: "Performance bonuses",
        type: "income",
        icon: "🎁",
        transaction_count: 2
      },
      
      // Expense Categories
      {
        id: "5",
        name: "Housing",
        description: "Rent and mortgage payments",
        type: "expense",
        icon: "🏠",
        transaction_count: 24
      },
      {
        id: "6",
        name: "Food",
        description: "Groceries and dining",
        type: "expense",
        icon: "🍕",
        transaction_count: 45
      },
      {
        id: "7",
        name: "Transportation",
        description: "Gas, parking, and transit",
        type: "expense",
        icon: "🚗",
        transaction_count: 18
      },
      {
        id: "8",
        name: "Entertainment",
        description: "Movies, games, and hobbies",
        type: "expense",
        icon: "🎮",
        transaction_count: 12
      },
      {
        id: "9",
        name: "Healthcare",
        description: "Medical expenses",
        type: "expense",
        icon: "🏥",
        transaction_count: 6
      },
      {
        id: "10",
        name: "Utilities",
        description: "Electricity, water, internet",
        type: "expense",
        icon: "💡",
        transaction_count: 18
      }
    ];
  }
}