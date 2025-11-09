export type Transaction = {
  id: number;
  amount: number;
  type: string;
  category: string;
  description?: string;
  date: string;
};
