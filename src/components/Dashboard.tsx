import { useState, useMemo } from 'react'
import { Search, Filter, Download, Calendar, User, Briefcase, X, ChevronDown } from 'lucide-react'
import type { BankTransaction, JobberReceipt, Match, FilterState } from '../types'
import { formatCurrency, formatDate, exportToJSON } from '../utils/parsers'

interface DashboardProps {
  bankTransactions: BankTransaction[]
  jobberReceipts: JobberReceipt[]
  matches: Match[]
  employees: string[]
  jobs: string[]
}

export function Dashboard({ bankTransactions, jobberReceipts, matches, employees, jobs }: DashboardProps) {
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

  const matchedBankIds = useMemo(() => new Set(matches.map(m => m.bankId)), [matches])

  const filteredBank = useMemo(() => {
    return bankTransactions.filter(bt => {
      if (filters.searchQuery && !bt.description.toLowerCase().includes(filters.searchQuery.toLowerCase())) return false
      if (filters.minAmount !== '' && bt.amount < Number(filters.minAmount)) return false
      if (filters.maxAmount !== '' && bt.amount > Number(filters.maxAmount)) return false
      if (filters.dateFrom && bt.date < filters.dateFrom) return false
      if (filters.dateTo && bt.date > filters.dateTo) return false
      return true
    })
  }, [bankTransactions, filters])

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filters.employee) count++
    if (filters.job) count++
    if (filters.dateFrom) count++
    if (filters.dateTo) count++
    if (filters.minAmount !== '') count++
    if (filters.maxAmount !== '') count++
    if (filters.searchQuery) count++
    return count
  }, [filters])

  const clearFilters = () => {
    setFilters({
      employee: '',
      job: '',
      dateFrom: '',
      dateTo: '',
      minAmount: '',
      maxAmount: '',
      searchQuery: ''
    })
  }

  const exportData = () => {
    exportToJSON({
      bankTransactions: filteredBank,
      jobberReceipts,
      matches,
      exportDate: new Date().toISOString()
    }, `transaction-matcher-${new Date().toISOString().split('T')[0]}.json`)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Filters Bar */}
      <div className="card p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search transactions..."
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
              showFilters || activeFiltersCount > 0
                ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="ml-1 px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full">
                {activeFiltersCount}
              </span>
            )}
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          <button
            onClick={exportData}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>

        {showFilters && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                <User className="w-3 h-3 inline mr-1" /> Employee
              </label>
              <select
                value={filters.employee}
                onChange={(e) => setFilters(f => ({ ...f, employee: e.target.value }))}
                className="input text-sm"
              >
                <option value="">All Employees</option>
                {employees.map(emp => <option key={emp} value={emp}>{emp}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Briefcase className="w-3 h-3 inline mr-1" /> Job
              </label>
              <select
                value={filters.job}
                onChange={(e) => setFilters(f => ({ ...f, job: e.target.value }))}
                className="input text-sm"
              >
                <option value="">All Jobs</option>
                {jobs.map(job => <option key={job} value={job}>{job}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Calendar className="w-3 h-3 inline mr-1" /> From Date
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
                className="input text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Calendar className="w-3 h-3 inline mr-1" /> To Date
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(f => ({ ...f, dateTo: e.target.value }))}
                className="input text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Min Amount ($)
              </label>
              <input
                type="number"
                placeholder="0.00"
                value={filters.minAmount}
                onChange={(e) => setFilters(f => ({ ...f, minAmount: e.target.value === '' ? '' : Number(e.target.value) }))}
                className="input text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max Amount ($)
              </label>
              <input
                type="number"
                placeholder="No limit"
                value={filters.maxAmount}
                onChange={(e) => setFilters(f => ({ ...f, maxAmount: e.target.value === '' ? '' : Number(e.target.value) }))}
                className="input text-sm"
              />
            </div>
            {activeFiltersCount > 0 && (
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Transactions
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Showing {filteredBank.length} of {bankTransactions.length}
        </span>
      </div>

      {/* Transactions List */}
      {filteredBank.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No transactions found
          </h4>
          <p className="text-gray-500 dark:text-gray-400">
            {bankTransactions.length === 0 
              ? 'Upload a bank statement to get started'
              : 'Try adjusting your filters to see more results'}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredBank.slice(0, 100).map((bt) => {
                  const isMatched = matchedBankIds.has(bt.id)
                  return (
                    <tr key={bt.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {formatDate(bt.date)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        <div className="max-w-xs sm:max-w-sm md:max-w-md truncate" title={bt.description}>
                          {bt.description}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                        {formatCurrency(bt.amount)}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {isMatched ? (
                          <span className="badge bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300">
                            Matched
                          </span>
                        ) : (
                          <span className="badge bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300">
                            Missing
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {filteredBank.length > 100 && (
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 text-center text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
              Showing 100 of {filteredBank.length} transactions. Use filters to narrow results.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
