import { useState } from 'react'
import { FileText, Receipt, BarChart3, LayoutDashboard, AlertCircle, Moon, Sun, Trash2 } from 'lucide-react'
import { UploadSection } from './components/UploadSection'
import { Dashboard } from './components/Dashboard'
import { MatchView } from './components/MatchView'
import { UnmatchedView } from './components/UnmatchedView'
import { SpectrumChart } from './components/SpectrumChart'
import { useAppData } from './hooks/useAppData'
import { useLocalStorage } from './hooks/useLocalStorage'
import type { ViewTab } from './types'

function App() {
  const [activeTab, setActiveTab] = useState<ViewTab>('upload')
  const [darkMode, setDarkMode] = useLocalStorage('tm-dark-mode', true)
  const { 
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
    clearAllData
  } = useAppData()

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    if (darkMode) {
      document.documentElement.classList.remove('dark')
    } else {
      document.documentElement.classList.add('dark')
    }
  }

  const handleClearBank = () => {
    if (confirm('Clear all bank transactions?')) {
      // Need to implement this in useAppData
      window.location.reload()
    }
  }

  const handleClearJobber = () => {
    if (confirm('Clear all Jobber receipts?')) {
      window.location.reload()
    }
  }

  const tabs: { id: ViewTab; label: string; icon: typeof FileText; badge?: number }[] = [
    { id: 'upload', label: 'Upload', icon: LayoutDashboard },
    { id: 'dashboard', label: 'All', icon: FileText },
    { id: 'matched', label: 'Matched', icon: Receipt, badge: stats.matched },
    { id: 'unmatched', label: 'Unmatched', icon: AlertCircle, badge: stats.unmatchedBank },
    { id: 'spectrum', label: 'Spectrum', icon: BarChart3 },
  ]

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  TransactionMatcher
                </h1>
              </div>
              <div className="flex items-center space-x-2">
                {(stats.totalBank > 0 || stats.totalReceipts > 0) && (
                  <button
                    onClick={() => {
                      if (confirm('Clear all data? This cannot be undone.')) {
                        clearAllData()
                      }
                    }}
                    className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    title="Clear all data"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={toggleDarkMode}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Stats Bar */}
        {(stats.totalBank > 0 || stats.totalReceipts > 0) && (
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500 dark:text-gray-400">Bank:</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">{stats.totalBank}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500 dark:text-gray-400">Receipts:</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">{stats.totalReceipts}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500 dark:text-gray-400">Matched:</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">{stats.matched}</span>
                </div>
                {stats.unmatchedBank > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500 dark:text-gray-400">Unmatched:</span>
                    <span className="font-semibold text-red-600 dark:text-red-400">{stats.unmatchedBank}</span>
                  </div>
                )}
                {stats.unmatchedAmount > 0 && (
                  <div className="flex items-center space-x-2 ml-auto">
                    <span className="text-gray-500 dark:text-gray-400">At Risk:</span>
                    <span className="font-bold text-red-600 dark:text-red-400">
                      ${stats.unmatchedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="sticky top-16 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-1 overflow-x-auto scrollbar-thin py-2">
              {tabs.map(({ id, label, icon: Icon, badge }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                    activeTab === id
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                  {badge !== undefined && badge > 0 && (
                    <span className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
                      id === 'unmatched' 
                        ? 'bg-red-500 text-white' 
                        : 'bg-blue-600 text-white'
                    }`}>
                      {badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
          {activeTab === 'upload' && (
            <UploadSection
              onBankUpload={addBankTransactions}
              onJobberUpload={addJobberReceipts}
              onClearBank={handleClearBank}
              onClearJobber={handleClearJobber}
              bankCount={stats.totalBank}
              jobberCount={stats.totalReceipts}
            />
          )}
          {activeTab === 'dashboard' && (
            <Dashboard
              bankTransactions={bankTransactions}
              jobberReceipts={jobberReceipts}
              matches={matches}
              employees={employees}
              jobs={jobs}
            />
          )}
          {activeTab === 'matched' && (
            <MatchView matchedPairs={matchedPairs} />
          )}
          {activeTab === 'unmatched' && (
            <UnmatchedView
              unmatchedBank={unmatchedBank}
              jobberReceipts={jobberReceipts}
            />
          )}
          {activeTab === 'spectrum' && (
            <SpectrumChart unmatchedBank={unmatchedBank} />
          )}
        </main>
      </div>
    </div>
  )
}

export default App
