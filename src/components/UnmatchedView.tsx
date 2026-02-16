import { useState, useMemo } from 'react'
import { AlertTriangle, Search, Clock, Filter, X, TrendingUp } from 'lucide-react'
import type { BankTransaction, JobberReceipt, FilterState } from '../types'
import { formatCurrency, formatDate, getDaysSince, getAgingBuckets } from '../utils/parsers'

interface UnmatchedViewProps {
  unmatchedBank: BankTransaction[]
  jobberReceipts: JobberReceipt[]
}

export function UnmatchedView({ unmatchedBank, jobberReceipts }: UnmatchedViewProps) {
  const [filters, setFilters] = useState<FilterState>({
    employee: '',
    job: '',
    dateFrom: '',
    dateTo: '',
    minAmount: '',
    maxAmount: '',
    searchQuery: ''
  })
  const [showFilters, setShowFilters] = useState(false)

  const filteredUnmatched = useMemo(() => {
    return unmatchedBank.filter(bt => {
      if (filters.searchQuery && !bt.description.toLowerCase().includes(filters.searchQuery.toLowerCase())) return false
      if (filters.minAmount !== '' && bt.amount < Number(filters.minAmount)) return false
      if (filters.maxAmount !== '' && bt.amount > Number(filters.maxAmount)) return false
      if (filters.dateFrom && bt.date < filters.dateFrom) return false
      if (filters.dateTo && bt.date > filters.dateTo) return false
      return true
    })
  }, [unmatchedBank, filters])

  const agingBuckets = useMemo(() => getAgingBuckets(filteredUnmatched), [filteredUnmatched])
  const totalUnmatchedAmount = filteredUnmatched.reduce((sum, bt) => sum + bt.amount, 0)

  const getAgingColor = (days: number): string => {
    if (days <= 7) return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800'
    if (days <= 14) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800'
    if (days <= 30) return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800'
    if (days <= 60) return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800'
    return 'bg-red-200 dark:bg-red-900/50 text-red-900 dark:text-red-200 border-red-300 dark:border-red-700'
  }

  if (unmatchedBank.length === 0 && jobberReceipts.length === 0) {
    return (
      <div className="text-center py-16 animate-fade-in">
        <div className="w-20 h-20 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No Data Yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          Upload your files on the Upload tab to see unmatched transactions.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Alert Banner */}
      {unmatchedBank.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 dark:text-red-300">
                {filteredUnmatched.length} Unmatched {filteredUnmatched.length === 1 ? 'Transaction' : 'Transactions'}
              </h3>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                These bank transactions have no matching Jobber receipts.
              </p>
              <p className="text-lg font-bold text-red-600 dark:text-red-400 mt-2">
                {formatCurrency(totalUnmatchedAmount)} at risk
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Aging Summary */}
      {unmatchedBank.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {agingBuckets.map((bucket) => (
            <div 
              key={bucket.range} 
              className={`${bucket.bgColor} rounded-lg p-3 text-center border transition-transform hover:scale-105`}
            >
              <div className="text-2xl font-bold">{bucket.transactions.length}</div>
              <div className="text-xs opacity-75">{bucket.label}</div>
              <div className="text-xs font-medium mt-1">{formatCurrency(bucket.totalAmount)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search unmatched transactions..."
              value={filters.searchQuery}
              onChange={(e) => setFilters(f => ({ ...f, searchQuery: e.target.value }))}
              className="input pl-10"
            />
            {filters.searchQuery && (
              <button
                onClick={() => setFilters(f => ({ ...f, searchQuery: '' }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
              showFilters ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700' : 'border-gray-300 dark:border-gray-600'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 animate-slide-up">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Min Amount</label>
              <input
                type="number"
                placeholder="$0"
                value={filters.minAmount}
                onChange={(e) => setFilters(f => ({ ...f, minAmount: e.target.value === '' ? '' : Number(e.target.value) }))}
                className="input text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Max Amount</label>
              <input
                type="number"
                placeholder="No max"
                value={filters.maxAmount}
                onChange={(e) => setFilters(f => ({ ...f, maxAmount: e.target.value === '' ? '' : Number(e.target.value) }))}
                className="input text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">From</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
                className="input text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">To</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(f => ({ ...f, dateTo: e.target.value }))}
                className="input text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Unmatched List */}
      <div className="space-y-3">
        {filteredUnmatched.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              All Caught Up!
            </h4>
            <p className="text-gray-500 dark:text-gray-400">
              No unmatched transactions found. All receipts are accounted for.
            </p>
          </div>
        ) : (
          filteredUnmatched.map((bt) => {
            const daysSince = getDaysSince(bt.date)
            return (
              <div
                key={bt.id}
                className="card p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getAgingColor(daysSince)}`}>
                        <Clock className="w-3 h-3 mr-1" />
                        {daysSince === 0 ? 'Today' : `${daysSince} days ago`}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(bt.date)}
                      </span>
                    </div>
                    <p className="text-gray-900 dark:text-white font-medium truncate" title={bt.description}>
                      {bt.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xl font-bold text-red-600 dark:text-red-400">
                      {formatCurrency(bt.amount)}
                    </span>
                    <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-full text-xs font-medium whitespace-nowrap">
                      Missing Receipt
                    </span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
