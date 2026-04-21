export type AccountType = 'card' | 'cash' | 'savings' | 'investment'
export type TransactionType = 'income' | 'expense' | 'transfer'
export type CategoryType = 'income' | 'expense'

export interface Account {
  id: string
  user_id: string
  name: string
  type: AccountType
  balance: number
  currency: string
  color: string
  icon: string
  created_at: string
}

export interface Category {
  id: string
  user_id: string
  name: string
  type: CategoryType
  color: string
  icon: string
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  account_id: string
  category_id: string | null
  type: TransactionType
  amount: number
  description: string | null
  date: string
  created_at: string
  account?: Account
  category?: Category
}

export interface Budget {
  id: string
  user_id: string
  category_id: string
  amount: number
  month: number
  year: number
  created_at: string
  category?: Category
  spent?: number
}

export interface Goal {
  id: string
  user_id: string
  name: string
  target_amount: number
  current_amount: number
  deadline: string | null
  color: string
  icon: string
  created_at: string
}
