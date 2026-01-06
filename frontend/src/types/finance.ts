export type Transaction = {
  id: number;
  amount: number;
  type: string;
  category: string;
  description?: string;
  date: string;
};

export type FinanceTransaction = {
  id: number;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: 'NUTRITION' | 'CLUBS' | 'MAINTENANCE' | 'SALARY';
  source: 'BUDGET' | 'EXTRA_BUDGET';
  description?: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
};
