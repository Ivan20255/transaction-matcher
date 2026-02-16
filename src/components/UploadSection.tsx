import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, Receipt, CheckCircle, AlertCircle, Trash2, X, FileSpreadsheet, Loader2 } from 'lucide-react'
import type { BankTransaction, JobberReceipt } from '../types'
import { parseBankPDF, parseJobberFile } from '../utils/parsers'

interface UploadSectionProps {
  onBankUpload: (transactions: BankTransaction[]) => void
  onJobberUpload: (receipts: JobberReceipt[]) => void
  onClearBank: () => void
  onClearJobber: () => void
  bankCount: number
  jobberCount: number
}

interface UploadStatus {
  type: 'success' | 'error' | 'loading' | null
  message: string
}

export function UploadSection({ 
  onBankUpload, 
  onJobberUpload, 
  onClearBank,
  onClearJobber,
  bankCount, 
  jobberCount 
}: UploadSectionProps) {
  const [bankStatus, setBankStatus] = useState<UploadStatus>({ type: null, message: '' })
  const [jobberStatus, setJobberStatus] = useState<UploadStatus>({ type: null, message: '' })
  const [isBankLoading, setIsBankLoading] = useState(false)
  const [isJobberLoading, setIsJobberLoading] = useState(false)

  const clearStatus = (type: 'bank' | 'jobber') => {
    setTimeout(() => {
      if (type === 'bank') setBankStatus({ type: null, message: '' })
      else setJobberStatus({ type: null, message: '' })
    }, 5000)
  }

  const onBankDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return
    
    setIsBankLoading(true)
    setBankStatus({ type: 'loading', message: 'Processing files...' })
    
    const allTransactions: BankTransaction[] = []
    let errorCount = 0
    
    for (const file of acceptedFiles) {
      try {
        const transactions = await parseBankPDF(file)
        allTransactions.push(...transactions)
      } catch (error) {
        console.error('Failed to parse bank file:', error)
        errorCount++
      }
    }
    
    setIsBankLoading(false)
    
    if (allTransactions.length > 0) {
      onBankUpload(allTransactions)
      setBankStatus({ 
        type: 'success', 
        message: `Loaded ${allTransactions.length} transactions${errorCount > 0 ? ` (${errorCount} files failed)` : ''}`
      })
    } else {
      setBankStatus({ 
        type: 'error', 
        message: errorCount > 0 ? 'Failed to parse files. Try CSV format.' : 'No transactions found in files.'
      })
    }
    clearStatus('bank')
  }, [onBankUpload])

  const onJobberDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return
    
    setIsJobberLoading(true)
    setJobberStatus({ type: 'loading', message: 'Processing files...' })
    
    const allReceipts: JobberReceipt[] = []
    const errors: string[] = []
    
    for (const file of acceptedFiles) {
      try {
        const receipts = await parseJobberFile(file)
        allReceipts.push(...receipts)
      } catch (error) {
        console.error('Failed to parse Jobber file:', error)
        errors.push(error instanceof Error ? error.message : 'Unknown error')
      }
    }
    
    setIsJobberLoading(false)
    
    if (allReceipts.length > 0) {
      onJobberUpload(allReceipts)
      setJobberStatus({ 
        type: 'success', 
        message: `Loaded ${allReceipts.length} receipts` 
      })
    } else if (errors.length > 0) {
      setJobberStatus({ 
        type: 'error', 
        message: errors[0] || 'Failed to parse files. Check format.'
      })
    } else {
      setJobberStatus({ 
        type: 'error', 
        message: 'No receipts found. Check column headers.'
      })
    }
    clearStatus('jobber')
  }, [onJobberUpload])

  const bankDropzone = useDropzone({
    onDrop: onBankDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls', '.xlsx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: true,
    disabled: isBankLoading
  })

  const jobberDropzone = useDropzone({
    onDrop: onJobberDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls', '.xlsx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: true,
    disabled: isJobberLoading
  })

  const renderStatus = (status: UploadStatus) => {
    if (!status.type) return null
    
    const styles = {
      success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      error: 'bg-red-500/10 text-red-400 border-red-500/20',
      loading: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    }
    
    const icons = {
      success: CheckCircle,
      error: AlertCircle,
      loading: Loader2
    }
    
    const Icon = icons[status.type]
    
    return (
      <div className={`mt-3 px-4 py-2 rounded-lg border text-sm flex items-center gap-2 animate-fade-in ${styles[status.type]}`}>
        <Icon className={`w-4 h-4 ${status.type === 'loading' ? 'animate-spin' : ''}`} />
        <span>{status.message}</span>
        <button 
          onClick={(e) => {
            e.stopPropagation()
            status.type === 'success' && status.message.includes('bank') 
              ? setBankStatus({ type: null, message: '' })
              : setJobberStatus({ type: null, message: '' })
          }}
          className="ml-auto hover:opacity-70"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      {/* Sleek Header */}
      <div className="text-center py-10">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 mb-6 shadow-2xl shadow-purple-500/20">
          <Upload className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-4xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent mb-3">
          Upload Your Files
        </h2>
        <p className="text-gray-400 max-w-xl mx-auto text-lg">
          Import bank statements and Jobber receipts to automatically match transactions and identify missing receipts.
        </p>
      </div>

      {/* Stats Cards */}
      {(bankCount > 0 || jobberCount > 0) && (
        <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity" />
            <div className="relative bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-5 text-center">
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">{bankCount}</div>
              <div className="text-sm text-gray-500 mt-1">Bank Transactions</div>
            </div>
          </div>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity" />
            <div className="relative bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-5 text-center">
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">{jobberCount}</div>
              <div className="text-sm text-gray-500 mt-1">Jobber Receipts</div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Areas */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Bank Statement Upload */}
        <div
          {...bankDropzone.getRootProps()}
          className={`relative group cursor-pointer ${isBankLoading ? 'pointer-events-none' : ''}`}
        >
          <div className={`absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-3xl blur-xl transition-all duration-500 ${bankDropzone.isDragActive ? 'opacity-100 scale-105' : 'opacity-0 group-hover:opacity-50'}`} />
          <div className={`relative h-full border-2 border-dashed rounded-3xl p-8 text-center transition-all duration-300 ${
            bankDropzone.isDragActive
              ? 'border-blue-400 bg-blue-500/10 scale-[1.02]'
              : 'border-gray-700 bg-gray-900/50 hover:border-gray-600 hover:bg-gray-800/50'
          } ${bankCount > 0 ? 'border-blue-500/30 bg-blue-500/5' : ''}`}>
            <input {...bankDropzone.getInputProps()} />
            
            <div className="space-y-5">
              <div className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center transition-all duration-300 ${
                bankDropzone.isDragActive 
                  ? 'bg-blue-500 shadow-lg shadow-blue-500/30' 
                  : 'bg-gray-800 group-hover:bg-gray-700'
              }`}>
                {isBankLoading ? (
                  <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
                ) : (
                  <FileText className={`w-10 h-10 transition-colors ${bankDropzone.isDragActive ? 'text-white' : 'text-blue-400'}`} />
                )}
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Bank Statement
                </h3>
                <p className="text-gray-400 text-sm">
                  Drop PDF, CSV, or Excel files
                </p>
              </div>
              
              <button 
                type="button"
                disabled={isBankLoading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all border border-gray-700 hover:border-gray-600"
              >
                <Upload className="w-4 h-4" />
                <span>Select Files</span>
              </button>
              
              {bankCount > 0 && (
                <div className="flex items-center justify-center gap-2 text-emerald-400 animate-fade-in">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">{bankCount} transactions loaded</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onClearBank()
                    }}
                    className="ml-2 p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Clear bank transactions"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
              
              {renderStatus(bankStatus)}
            </div>
          </div>
        </div>

        {/* Jobber Upload */}
        <div
          {...jobberDropzone.getRootProps()}
          className={`relative group cursor-pointer ${isJobberLoading ? 'pointer-events-none' : ''}`}
        >
          <div className={`absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-3xl blur-xl transition-all duration-500 ${jobberDropzone.isDragActive ? 'opacity-100 scale-105' : 'opacity-0 group-hover:opacity-50'}`} />
          <div className={`relative h-full border-2 border-dashed rounded-3xl p-8 text-center transition-all duration-300 ${
            jobberDropzone.isDragActive
              ? 'border-emerald-400 bg-emerald-500/10 scale-[1.02]'
              : 'border-gray-700 bg-gray-900/50 hover:border-gray-600 hover:bg-gray-800/50'
          } ${jobberCount > 0 ? 'border-emerald-500/30 bg-emerald-500/5' : ''}`}>
            <input {...jobberDropzone.getInputProps()} />
            
            <div className="space-y-5">
              <div className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center transition-all duration-300 ${
                jobberDropzone.isDragActive 
                  ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' 
                  : 'bg-gray-800 group-hover:bg-gray-700'
              }`}>
                {isJobberLoading ? (
                  <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
                ) : (
                  <FileSpreadsheet className={`w-10 h-10 transition-colors ${jobberDropzone.isDragActive ? 'text-white' : 'text-emerald-400'}`} />
                )}
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Jobber Receipts
                </h3>
                <p className="text-gray-400 text-sm">
                  Drop CSV or Excel files
                </p>
              </div>
              
              <button 
                type="button"
                disabled={isJobberLoading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all border border-gray-700 hover:border-gray-600"
              >
                <Upload className="w-4 h-4" />
                <span>Select Files</span>
              </button>
              
              {jobberCount > 0 && (
                <div className="flex items-center justify-center gap-2 text-emerald-400 animate-fade-in">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">{jobberCount} receipts loaded</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onClearJobber()
                    }}
                    className="ml-2 p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Clear Jobber receipts"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
              
              {renderStatus(jobberStatus)}
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-2xl" />
        <div className="relative bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-blue-400" />
            </div>
            <h4 className="font-semibold text-white text-lg">How it works</h4>
          </div>
          
          <div className="grid md:grid-cols-5 gap-4">
            {[
              { step: '1', text: 'Upload bank statement', color: 'from-blue-500 to-cyan-500' },
              { step: '2', text: 'Upload Jobber receipts', color: 'from-emerald-500 to-teal-500' },
              { step: '3', text: 'Auto-match by amount', color: 'from-purple-500 to-pink-500' },
              { step: '4', text: 'Review unmatched', color: 'from-orange-500 to-red-500' },
              { step: '5', text: 'View aging spectrum', color: 'from-pink-500 to-rose-500' },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center group">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform`}>
                  <span className="text-white font-bold">{item.step}</span>
                </div>
                <p className="text-sm text-gray-400">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* File Format Help */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-5 hover:border-blue-500/30 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <h5 className="font-medium text-white">Bank Statement</h5>
          </div>
          <p className="text-sm text-gray-500">
            Supports PDF exports and CSV files with columns: <span className="text-gray-400">Date, Description, Amount</span>
          </p>
        </div>
        <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-5 hover:border-emerald-500/30 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-emerald-400" />
            </div>
            <h5 className="font-medium text-white">Jobber Export</h5>
          </div>
          <p className="text-sm text-gray-500">
            CSV or Excel with: <span className="text-gray-400">Date, Employee, Job #, Amount, Description</span>
          </p>
        </div>
      </div>
    </div>
  )
}
