import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, FileSpreadsheet, CheckCircle, AlertCircle, Trash2, X, Loader2 } from 'lucide-react'
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
    }, 8000)
  }

  const onBankDrop = useCallback(async (acceptedFiles: File[]) => {
    console.log('Bank files dropped:', acceptedFiles)
    if (acceptedFiles.length === 0) {
      setBankStatus({ type: 'error', message: 'No files accepted. Please check file format.' })
      clearStatus('bank')
      return
    }
    
    setIsBankLoading(true)
    setBankStatus({ type: 'loading', message: `Processing ${acceptedFiles.length} file(s)...` })
    
    const allTransactions: BankTransaction[] = []
    let errorCount = 0
    let lastError = ''
    
    for (const file of acceptedFiles) {
      try {
        console.log('Processing bank file:', file.name, 'Type:', file.type)
        const transactions = await parseBankPDF(file)
        console.log('Parsed transactions:', transactions.length)
        allTransactions.push(...transactions)
      } catch (error) {
        console.error('Failed to parse bank file:', error)
        errorCount++
        lastError = error instanceof Error ? error.message : 'Unknown error'
      }
    }
    
    setIsBankLoading(false)
    
    if (allTransactions.length > 0) {
      onBankUpload(allTransactions)
      setBankStatus({ 
        type: 'success', 
        message: `✓ Loaded ${allTransactions.length} transactions${errorCount > 0 ? ` (${errorCount} files failed)` : ''}`
      })
    } else {
      setBankStatus({ 
        type: 'error', 
        message: errorCount > 0 ? `Failed: ${lastError || 'Check file format'}` : 'No transactions found. Try CSV format.'
      })
    }
    clearStatus('bank')
  }, [onBankUpload])

  const onJobberDrop = useCallback(async (acceptedFiles: File[]) => {
    console.log('Jobber files dropped:', acceptedFiles)
    if (acceptedFiles.length === 0) {
      setJobberStatus({ type: 'error', message: 'No files accepted. Please check file format.' })
      clearStatus('jobber')
      return
    }
    
    setIsJobberLoading(true)
    setJobberStatus({ type: 'loading', message: `Processing ${acceptedFiles.length} file(s)...` })
    
    const allReceipts: JobberReceipt[] = []
    const errors: string[] = []
    
    for (const file of acceptedFiles) {
      try {
        console.log('Processing Jobber file:', file.name, 'Type:', file.type, 'Size:', file.size)
        const receipts = await parseJobberFile(file)
        console.log('Parsed receipts:', receipts.length)
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
        message: `✓ Loaded ${allReceipts.length} receipts` 
      })
    } else if (errors.length > 0) {
      setJobberStatus({ 
        type: 'error', 
        message: `✗ ${errors[0]}`
      })
    } else {
      setJobberStatus({ 
        type: 'error', 
        message: '✗ No receipts found. Check column headers (Date, Employee, Job, Amount).'
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
      <div className={`mt-3 px-4 py-2.5 rounded-xl border text-sm flex items-center gap-2 animate-fade-in ${styles[status.type]}`}>
        <Icon className={`w-4 h-4 ${status.type === 'loading' ? 'animate-spin' : ''}`} />
        <span className="flex-1">{status.message}</span>
        <button 
          onClick={(e) => {
            e.stopPropagation()
            status.type === 'success' && status.message.includes('transactions')
              ? setBankStatus({ type: null, message: '' })
              : setJobberStatus({ type: null, message: '' })
          }}
          className="hover:opacity-70 p-1"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-10 animate-fade-in max-w-6xl mx-auto">
      {/* Sleek Header */}
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 mb-8 shadow-2xl shadow-purple-500/25">
          <Upload className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-5xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent mb-4">
          Upload Files
        </h2>
        <p className="text-gray-400 max-w-xl mx-auto text-lg">
          Import your bank statements and Jobber receipts to automatically match transactions
        </p>
      </div>

      {/* Stats Cards */}
      {(bankCount > 0 || jobberCount > 0) && (
        <div className="grid grid-cols-2 gap-6 max-w-lg mx-auto">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
            <div className="relative bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 text-center">
              <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">{bankCount}</div>
              <div className="text-sm text-gray-500 mt-2">Bank Transactions</div>
            </div>
          </div>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
            <div className="relative bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 text-center">
              <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">{jobberCount}</div>
              <div className="text-sm text-gray-500 mt-2">Jobber Receipts</div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Areas */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Bank Statement Upload */}
        <div
          {...bankDropzone.getRootProps()}
          className={`relative group cursor-pointer ${isBankLoading ? 'pointer-events-none opacity-70' : ''}`}
        >
          <div className={`absolute inset-0 bg-gradient-to-br from-blue-500/30 to-cyan-500/30 rounded-3xl blur-2xl transition-all duration-500 ${bankDropzone.isDragActive ? 'opacity-100 scale-105' : 'opacity-0 group-hover:opacity-60'}`} />
          <div className={`relative h-full border-2 border-dashed rounded-3xl p-10 text-center transition-all duration-300 ${
            bankDropzone.isDragActive
              ? 'border-blue-400 bg-blue-500/10 scale-[1.02]'
              : 'border-gray-700 bg-gray-900/40 hover:border-gray-500 hover:bg-gray-800/40'
          } ${bankCount > 0 ? 'border-blue-500/40 bg-blue-500/5' : ''}`}>
            <input {...bankDropzone.getInputProps()} />
            
            <div className="space-y-6">
              <div className={`w-24 h-24 mx-auto rounded-2xl flex items-center justify-center transition-all duration-300 ${
                bankDropzone.isDragActive 
                  ? 'bg-blue-500 shadow-xl shadow-blue-500/40' 
                  : 'bg-gray-800 group-hover:bg-gray-700'
              }`}>
                {isBankLoading ? (
                  <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
                ) : (
                  <FileText className={`w-12 h-12 transition-colors ${bankDropzone.isDragActive ? 'text-white' : 'text-blue-400'}`} />
                )}
              </div>
              
              <div>
                <h3 className="text-2xl font-semibold text-white mb-2">
                  Bank Statement
                </h3>
                <p className="text-gray-400">
                  Drop PDF, CSV, or Excel files here
                </p>
              </div>
              
              <button 
                type="button"
                disabled={isBankLoading}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all border border-gray-700 hover:border-gray-500"
              >
                <Upload className="w-5 h-5" />
                <span>Select Files</span>
              </button>
              
              {bankCount > 0 && (
                <div className="flex items-center justify-center gap-2 text-emerald-400 animate-fade-in">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">{bankCount} loaded</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onClearBank()
                    }}
                    className="ml-2 p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
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
          className={`relative group cursor-pointer ${isJobberLoading ? 'pointer-events-none opacity-70' : ''}`}
        >
          <div className={`absolute inset-0 bg-gradient-to-br from-emerald-500/30 to-teal-500/30 rounded-3xl blur-2xl transition-all duration-500 ${jobberDropzone.isDragActive ? 'opacity-100 scale-105' : 'opacity-0 group-hover:opacity-60'}`} />
          <div className={`relative h-full border-2 border-dashed rounded-3xl p-10 text-center transition-all duration-300 ${
            jobberDropzone.isDragActive
              ? 'border-emerald-400 bg-emerald-500/10 scale-[1.02]'
              : 'border-gray-700 bg-gray-900/40 hover:border-gray-500 hover:bg-gray-800/40'
          } ${jobberCount > 0 ? 'border-emerald-500/40 bg-emerald-500/5' : ''}`}>
            <input {...jobberDropzone.getInputProps()} />
            
            <div className="space-y-6">
              <div className={`w-24 h-24 mx-auto rounded-2xl flex items-center justify-center transition-all duration-300 ${
                jobberDropzone.isDragActive 
                  ? 'bg-emerald-500 shadow-xl shadow-emerald-500/40' 
                  : 'bg-gray-800 group-hover:bg-gray-700'
              }`}>
                {isJobberLoading ? (
                  <Loader2 className="w-12 h-12 text-emerald-400 animate-spin" />
                ) : (
                  <FileSpreadsheet className={`w-12 h-12 transition-colors ${jobberDropzone.isDragActive ? 'text-white' : 'text-emerald-400'}`} />
                )}
              </div>
              
              <div>
                <h3 className="text-2xl font-semibold text-white mb-2">
                  Jobber Receipts
                </h3>
                <p className="text-gray-400">
                  Drop CSV or Excel files here
                </p>
              </div>
              
              <button 
                type="button"
                disabled={isJobberLoading}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all border border-gray-700 hover:border-gray-500"
              >
                <Upload className="w-5 h-5" />
                <span>Select Files</span>
              </button>
              
              {jobberCount > 0 && (
                <div className="flex items-center justify-center gap-2 text-emerald-400 animate-fade-in">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">{jobberCount} loaded</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onClearJobber()
                    }}
                    className="ml-2 p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
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
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl" />
        <div className="relative bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-3xl p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-blue-400" />
            </div>
            <h4 className="font-semibold text-white text-xl">How It Works</h4>
          </div>
          
          <div className="grid md:grid-cols-5 gap-6">
            {[
              { step: '1', text: 'Upload bank statement', color: 'from-blue-500 to-cyan-500' },
              { step: '2', text: 'Upload Jobber receipts', color: 'from-emerald-500 to-teal-500' },
              { step: '3', text: 'Auto-match by amount', color: 'from-purple-500 to-pink-500' },
              { step: '4', text: 'Review unmatched', color: 'from-orange-500 to-red-500' },
              { step: '5', text: 'View aging spectrum', color: 'from-pink-500 to-rose-500' },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center group">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-3 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform`}>
                  <span className="text-white font-bold text-lg">{item.step}</span>
                </div>
                <p className="text-sm text-gray-400">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* File Format Help */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gray-900/30 border border-gray-800 rounded-2xl p-6 hover:border-blue-500/30 transition-colors">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-400" />
            </div>
            <h5 className="font-medium text-white text-lg">Bank Statement</h5>
          </div>
          <p className="text-gray-500">
            Supports PDF exports and CSV files with columns: <span className="text-gray-300">Date, Description, Amount</span>
          </p>
        </div>
        <div className="bg-gray-900/30 border border-gray-800 rounded-2xl p-6 hover:border-emerald-500/30 transition-colors">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
            </div>
            <h5 className="font-medium text-white text-lg">Jobber Export</h5>
          </div>
          <p className="text-gray-500">
            CSV or Excel with: <span className="text-gray-300">Date, Employee, Job #, Amount, Description</span>
          </p>
        </div>
      </div>
    </div>
  )
}
