// src/types/finance.ts
// Финансовые типы, синхронизированные с новой 1С-моделью

export type TransactionChannel = 'CASH' | 'BANK';
export type FinanceType = 'INCOME' | 'EXPENSE';
export type FinanceCategory = 'NUTRITION' | 'CLUBS' | 'MAINTENANCE' | 'SALARY' | 'OTHER';
export type InvoiceDirection = 'INCOMING' | 'OUTGOING';
export type BalanceType = 'CASH' | 'BANK' | 'CONTRACTOR_DEBT';

export type ContractorRef = {
  id: number;
  name: string;
  inn?: string | null;
};

export type PersonRef = {
  id: number;
  name: string;
};

export type CashFlowArticleRef = {
  id: number;
  name: string;
};

export type FinanceTransaction = {
  id: number;
  externalId?: string | null;
  amount: number | string;
  type: FinanceType;
  category: FinanceCategory;
  source: 'BUDGET' | 'EXTRA_BUDGET';
  description?: string | null;
  date: string;
  documentUrl?: string | null;
  channel?: TransactionChannel | null;
  documentNumber?: string | null;
  operationType?: string | null;
  posted?: boolean | null;
  counterpartyType?: string | null;
  purpose?: string | null;
  contractor?: ContractorRef | null;
  person?: PersonRef | null;
  cashFlowArticle?: CashFlowArticleRef | null;
  club?: { name: string } | null;
  createdAt: string;
};

export type Invoice = {
  id: number;
  externalId: string;
  direction: InvoiceDirection;
  documentNumber?: string | null;
  date: string;
  posted: boolean;
  operationType?: string | null;
  totalAmount: number | string;
  comment?: string | null;
  contractor?: ContractorRef | null;
  createdAt: string;
  updatedAt: string;
};

export type BalanceItem = {
  type: BalanceType;
  amount: number;
  label?: string | null;
};

export type BalancesResponse = {
  snapshotDate: string | null;
  balances: BalanceItem[];
};

export type DebtorItem = {
  contractorId: number | null;
  contractorName: string;
  contractorInn?: string | null;
  amount: number;
};

export type DebtorsResponse = {
  snapshotDate: string | null;
  items: DebtorItem[];
  total: number;
};

/** @deprecated Use FinanceTransaction */
export type Transaction = {
  id: number;
  amount: number;
  type: string;
  category: string;
  description?: string;
  date: string;
};
