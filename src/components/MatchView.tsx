import { CheckCircle, Calendar, User, Briefcase, FileText, DollarSign } from 'lucide-react'
import type { BankTransaction, JobberReceipt, Match } from '../types'
import { formatCurrency, formatDate } from '../utils/parsers'

interface MatchViewProps {
  matchedPairs: Array<{
    match: Match
    bank: BankTransaction
    receipt: JobberReceipt
  }>
}

export function MatchView({ matchedPairs }: MatchViewProps) {
  if (matchedPairs.length === 0) {
    return (
      <div className="text-center py-16 animate-fade-in">
        <div className="w-20 h-20 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No Matches Yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          Upload your bank statement and Jobber receipts to see matched transactions here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Matched Transactions
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {matchedPairs.length} exact amount matches found
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(matchedPairs.reduce((sum, p) => sum + p.match.amount, 0))}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Total matched</div>
        </div>
      </div>

      <div className="grid gap-4">
        {matchedPairs.map(({ bank, receipt, match }) => (
          <div
            key={match.id}
            className="card overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Match Header */}
            <div className={`px-4 py-3 border-b flex items-center justify-between ${
              match.confidence === 'exact' 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30' 
                : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-100 dark:border-yellow-900/30'
            }`}>
              <div className="flex items-center space-x-2">
                <CheckCircle className={`w-5 h-5 ${
                  match.confidence === 'exact' ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'
                }`} />
                <span className={`font-medium ${
                  match.confidence === 'exact' ? 'text-green-800 dark:text-green-300' : 'text-yellow-800 dark:text-yellow-300'
                }`}>
                  {match.confidence === 'exact' ? 'Exact Match' : 'Fuzzy Match'}
                </span>
              </div>
              <span className={`text-sm ${
                match.confidence === 'exact' ? 'text-green-700 dark:text-green-400' : 'text-yellow-700 dark:text-yellow-400'
              }`}>
                {match.daysSinceMatch <= 1 
                  ? 'Same day' 
                  : `${match.daysSinceMatch} days apart`}
              </span>
            </div>

            {/* Match Content */}
            <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-700">
              {/* Bank Side */}
              <div className="p-4">
                <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 mb-3">
                  <FileText className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Bank Transaction</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                      <Calendar className="w-3.5 h-3.5 mr-1.5" />
                      Date
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDate(bank.date)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                      <DollarSign className="w-3.5 h-3.5 mr-1.5" />
                      Amount
                    </span>
                    <span className="text-xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(bank.amount)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                    <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">Description</span>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{bank.description}</p>
                  </div>
                </div>
              </div>

              {/* Receipt Side */}
              <div className="p-4">
                <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 mb-3">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Jobber Receipt</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                      <User className="w-3.5 h-3.5 mr-1.5" />
                      Employee
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {receipt.employee}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                      <Briefcase className="w-3.5 h-3.5 mr-1.5" />
                      Job
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                      {receipt.job}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                      <Calendar className="w-3.5 h-3.5 mr-1.5" />
                      Date
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDate(receipt.date)}
                    </span>
                  </div>
                  {receipt.category && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Category</span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{receipt.category}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                    <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">Description</span>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{receipt.description}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
