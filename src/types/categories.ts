export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  description?: string;
  transaction_count?: number;
  created_at?: number;
  user_id?: string;
}

export interface CategoriesResponse {
  categories: Category[];
  count: number;
}