import { useMemo } from 'react'
import type { BankTransaction, JobberReceipt, Match } from '../types'
import { findExactMatches } from '../utils/parsers'
import { useLocalStorage } from './useLocalStorage'

export function useAppData() {
  const [bankTransactions, setBankTransactions] = useLocalStorage<BankTransaction[]>('tm-bank-transactions', [])
  const [jobberReceipts, setJobberReceipts] = useLocalStorage<JobberReceipt[]>('tm-jobber-receipts', [])
  const [matches, setMatches] = useLocalStorage<Match[]>('tm-matches', [])

  const addBankTransactions = (transactions: BankTransaction[]) => {
    setBankTransactions(prev => {
      const newTransactions = [...prev, ...transactions]
      recalculateMatches(newTransactions, jobberReceipts)
      return newTransactions
    })
  }

  const addJobberReceipts = (receipts: JobberReceipt[]) => {
    setJobberReceipts(prev => {
      const newReceipts = [...prev, ...receipts]
      recalculateMatches(bankTransactions, newReceipts)
      return newReceipts
    })
  }

  const recalculateMatches = (banks: BankTransaction[], receipts: JobberReceipt[]) => {
    const newMatches = findExactMatches(banks, receipts)
    setMatches(newMatches)
  }

  const clearAllData = () => {
    setBankTransactions([])
    setJobberReceipts([])
    setMatches([])
  }

  const removeBankTransaction = (id: string) => {
    setBankTransactions(prev => prev.filter(t => t.id !== id))
    setMatches(prev => prev.filter(m => m.bankId !== id))
  }

  const removeJobberReceipt = (id: string) => {
    setJobberReceipts(prev => prev.filter(r => r.id !== id))
    setMatches(prev => prev.filter(m => m.receiptId !== id))
  }

  const unmatchedBank = useMemo(() => {
    const matchedIds = new Set(matches.map(m => m.bankId))
    return bankTransactions.filter(bt => !matchedIds.has(bt.id))
  }, [bankTransactions, matches])

  const matchedPairs = useMemo(() => {
    return matches.map(m => ({
      match: m,
      bank: bankTransactions.find(b => b.id === m.bankId),
      receipt: jobberReceipts.find(r => r.id === m.receiptId)
    })).filter(p => p.bank && p.receipt) as {
      match: Match
      bank: BankTransaction
      receipt: JobberReceipt
    }[]
  }, [matches, bankTransactions, jobberReceipts])

  const employees = useMemo(() => 
    [...new Set(jobberReceipts.map(r => r.employee))].sort(),
    [jobberReceipts]
  )

  const jobs = useMemo(() => 
    [...new Set(jobberReceipts.map(r => r.job))].sort(),
    [jobberReceipts]
  )

  const stats = useMemo(() => ({
    totalBank: bankTransactions.length,
    totalReceipts: jobberReceipts.length,
    matched: matches.length,
    unmatchedBank: unmatchedBank.length,
    unmatchedAmount: unmatchedBank.reduce((sum, t) => sum + t.amount, 0),
    matchedAmount: matchedPairs.reduce((sum, p) => sum + p.match.amount, 0)
  }), [bankTransactions, jobberReceipts, matches, unmatchedBank, matchedPairs])

  return {
    bankTransactions,
    jobberReceipts,
    matches,
    unmatchedBank,
    matchedPairs,
    employees,
    jobs,
    stats,
    addBankTransactions,
    addJobberReceipts,
    clearAllData,
    removeBankTransaction,
    removeJobberReceipt
  }
}
