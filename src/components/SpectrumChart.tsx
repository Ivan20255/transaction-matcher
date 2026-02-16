import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { TrendingUp, AlertCircle, Clock, DollarSign } from 'lucide-react'
import type { BankTransaction } from '../types'
import { formatCurrency, getAgingBuckets } from '../utils/parsers'

interface SpectrumChartProps {
  unmatchedBank: BankTransaction[]
}

export function SpectrumChart({ unmatchedBank }: SpectrumChartProps) {
  const buckets = useMemo(() => getAgingBuckets(unmatchedBank), [unmatchedBank])
  
  const chartData = useMemo(() => 
    buckets.map(b => ({
      name: b.label,
      range: b.range,
      count: b.transactions.length,
      amount: b.totalAmount,
      color: b.color
    })),
    [buckets]
  )

  const stats = useMemo(() => {
    const total = unmatchedBank.length
    const totalAmount = unmatchedBank.reduce((sum, t) => sum + t.amount, 0)
    const avgAge = total > 0
      ? unmatchedBank.reduce((sum, t) => {
          const days = Math.floor((new Date().getTime() - new Date(t.date).getTime()) / (1000 * 60 * 60 * 24))
          return sum + days
        }, 0) / total
      : 0
    
    const criticalCount = buckets.slice(3).reduce((sum, b) => sum + b.transactions.length, 0)
    const criticalAmount = buckets.slice(3).reduce((sum, b) => sum + b.totalAmount, 0)
    
    return { total, totalAmount, avgAge: Math.round(avgAge), criticalCount, criticalAmount }
  }, [unmatchedBank, buckets])

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: typeof chartData[0] }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-gray-900 dark:text-white">{data.name} ({data.range} days)</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {data.count} {data.count === 1 ? 'transaction' : 'transactions'}
          </p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {formatCurrency(data.amount)}
          </p>
        </div>
      )
    }
    return null
  }

  if (unmatchedBank.length === 0) {
    return (
      <div className="text-center py-16 animate-fade-in">
        <div className="w-20 h-20 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <TrendingUp className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No Unmatched Transactions
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          Great job! All transactions have matching receipts. Upload more data to see the aging spectrum.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 mb-1">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs uppercase font-medium">Unmatched</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">transactions</div>
        </div>
        <div className="card p-4 border-l-4 border-l-red-500">
          <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 mb-1">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs uppercase font-medium">At Risk</span>
          </div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(stats.totalAmount)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">total amount</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs uppercase font-medium">Avg Age</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.avgAge}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">days old</div>
        </div>
        <div className="card p-4 border-l-4 border-l-red-600">
          <div className="flex items-center space-x-2 text-red-500 dark:text-red-400 mb-1">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs uppercase font-medium">Critical</span>
          </div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.criticalCount}</div>
          <div className="text-xs text-red-500/70 dark:text-red-400/70">
            {formatCurrency(stats.criticalAmount)}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Aging Spectrum: Unmatched Transaction Ages
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis 
                dataKey="name" 
                tick={{ fill: '#6b7280', fontSize: 12 }}
                axisLine={{ stroke: '#374151', opacity: 0.2 }}
              />
              <YAxis 
                tick={{ fill: '#6b7280', fontSize: 12 }}
                axisLine={{ stroke: '#374151', opacity: 0.2 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          {buckets.map((bucket) => (
            <div key={bucket.range} className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: bucket.color }} />
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{bucket.label}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">({bucket.range} days)</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* By Count */}
        <div className="card p-6">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
            Transaction Count by Age
          </h4>
          <div className="space-y-3">
            {buckets.map((bucket) => (
              <div key={bucket.range} className="flex items-center justify-between group">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded shadow-sm" 
                    style={{ backgroundColor: bucket.color }} 
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{bucket.label}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">({bucket.range})</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${stats.total > 0 ? (bucket.transactions.length / stats.total) * 100 : 0}%`,
                        backgroundColor: bucket.color
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white w-8 text-right">
                    {bucket.transactions.length}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By Amount */}
        <div className="card p-6">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-green-500" />
            Amount at Risk by Age
          </h4>
          <div className="space-y-3">
            {buckets.map((bucket) => (
              <div key={bucket.range} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded shadow-sm" 
                    style={{ backgroundColor: bucket.color }} 
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{bucket.label}</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatCurrency(bucket.totalAmount)}
                </span>
              </div>
            ))}
            <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">Total at Risk</span>
                <span className="text-xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(stats.totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
