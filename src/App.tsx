import { useState } from 'react'
import { FileText, Receipt, BarChart3, LayoutDashboard, AlertCircle, Trash2, Zap } from 'lucide-react'
import { UploadSection } from './components/UploadSection'
import { Dashboard } from './components/Dashboard'
import { MatchView } from './components/MatchView'
import { UnmatchedView } from './components/UnmatchedView'
import { SpectrumChart } from './components/SpectrumChart'
import { useAppData } from './hooks/useAppData'
import type { ViewTab } from './types'

function App() {
  const [activeTab, setActiveTab] = useState<ViewTab>('upload')
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

  const handleClearBank = () => {
    if (confirm('Clear all bank transactions?')) {
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
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.08),transparent_50%)] pointer-events-none" />
      
      <div className="relative">
        {/* Sleek Header */}
        <header className="sticky top-0 z-50 border-b border-gray-800/50 bg-gray-950/80 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold gradient-text">
                    TransactionMatcher
                  </h1>
                  <p className="text-xs text-gray-500">Reconcile & Match</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {(stats.totalBank > 0 || stats.totalReceipts > 0) && (
                  <button
                    onClick={() => {
                      if (confirm('Clear all data? This cannot be undone.')) {
                        clearAllData()
                      }
                    }}
                    className="p-2.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                    title="Clear all data"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Stats Bar */}
        {(stats.totalBank > 0 || stats.totalReceipts > 0) && (
          <div className="border-b border-gray-800/50 bg-gray-900/30 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <div className="flex flex-wrap items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Bank</span>
                  <span className="font-semibold text-blue-400">{stats.totalBank}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Receipts</span>
                  <span className="font-semibold text-emerald-400">{stats.totalReceipts}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Matched</span>
                  <span className="font-semibold text-emerald-400">{stats.matched}</span>
                </div>
                {stats.unmatchedBank > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Unmatched</span>
                    <span className="font-semibold text-red-400">{stats.unmatchedBank}</span>
                  </div>
                )}
                {stats.unmatchedAmount > 0 && (
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-gray-500">At Risk</span>
                    <span className="font-bold text-red-400">
                      ${stats.unmatchedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="sticky top-16 z-40 border-b border-gray-800/50 bg-gray-950/60 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-1 overflow-x-auto scrollbar-thin py-2">
              {tabs.map(({ id, label, icon: Icon, badge }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all duration-200 ${
                    activeTab === id
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{label}</span>
                  {badge !== undefined && badge > 0 && (
                    <span className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
                      id === 'unmatched' 
                        ? 'bg-red-500 text-white' 
                        : 'bg-blue-500 text-white'
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
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
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
