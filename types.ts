export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export enum PaymentMethod {
  CASH = 'cash',
  CREDIT = 'credit',
  BANK = 'bank',
}

export interface Attachment {
  id: string;
  name: string;
  dataUrl: string; // base64 data URL
  type: string;
}

export interface Transaction {
  id: string;
  profileId: string;
  type: TransactionType;
  amount: number;
  description: string;
  date: string; // ISO string
  categoryId?: string; // for expenses
  sourceId?: string; // for income
  paymentMethod: PaymentMethod;
  attachments?: Attachment[];
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  isDefault?: boolean;
  profileId: string;
}

export interface IncomeSource {
  id: string;
  name: string;
  icon: string;
  isDefault?: boolean;
  profileId: string;
}

export interface Currency {
  code: string;
  symbol: string;
  name: string;
}

export interface Profile {
  id: string;
  name: string;
  currencyCode: string;
  userId: string;
}

export enum Role {
  ADMIN = 'admin',
  USER = 'user',
}

export interface User {
  id: string;
  email: string;
  passwordHash: string; // In a real app, never store plain text passwords
  role: Role;
}

export interface AppData {
  users: User[];
  profiles: Profile[];
  transactions: Transaction[];
  categories: Category[];
  incomeSources: IncomeSource[];
  currencies: Currency[];
}