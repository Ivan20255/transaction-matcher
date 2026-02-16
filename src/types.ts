export interface BankTransaction {
  id: string
  date: string
  description: string
  amount: number
  type: 'debit' | 'credit'
  rawText?: string
  matched?: boolean
  matchedTo?: string
}

export interface JobberReceipt {
  id: string
  date: string
  employee: string
  job: string
  amount: number
  description: string
  category?: string
  matched?: boolean
}

export interface Match {
  id: string
  bankId: string
  receiptId: string
  amount: number
  matchDate: string
  confidence: 'exact' | 'fuzzy'
  daysSinceMatch: number
}

export interface FilterState {
  employee: string
  job: string
  dateFrom: string
  dateTo: string
  minAmount: number | ''
  maxAmount: number | ''
  searchQuery: string
}

export interface AgingBucket {
  range: string
  label: string
  minDays: number
  maxDays: number
  color: string
  bgColor: string
  transactions: BankTransaction[]
  totalAmount: number
}

export type ViewTab = 'upload' | 'dashboard' | 'matched' | 'unmatched' | 'spectrum'
