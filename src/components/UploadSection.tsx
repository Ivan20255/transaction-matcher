import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, Receipt, CheckCircle, AlertCircle, Trash2 } from 'lucide-react'
import type { BankTransaction, JobberReceipt } from '../types'
import { parseBankPDF, parseJobberCSV } from '../utils/parsers'

interface UploadSectionProps {
  onBankUpload: (transactions: BankTransaction[]) => void
  onJobberUpload: (receipts: JobberReceipt[]) => void
  onClearBank: () => void
  onClearJobber: () => void
  bankCount: number
  jobberCount: number
}

export function UploadSection({ 
  onBankUpload, 
  onJobberUpload, 
  onClearBank,
  onClearJobber,
  bankCount, 
  jobberCount 
}: UploadSectionProps) {
  const onBankDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return
    
    const allTransactions: BankTransaction[] = []
    
    for (const file of acceptedFiles) {
      try {
        const transactions = await parseBankPDF(file)
        allTransactions.push(...transactions)
      } catch (error) {
        console.error('Failed to parse bank file:', error)
      }
    }
    
    if (allTransactions.length > 0) {
      onBankUpload(allTransactions)
    }
  }, [onBankUpload])

  const onJobberDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return
    
    const allReceipts: JobberReceipt[] = []
    
    for (const file of acceptedFiles) {
      try {
        const receipts = await parseJobberCSV(file)
        allReceipts.push(...receipts)
      } catch (error) {
        console.error('Failed to parse Jobber file:', error)
      }
    }
    
    if (allReceipts.length > 0) {
      onJobberUpload(allReceipts)
    }
  }, [onJobberUpload])

  const bankDropzone = useDropzone({
    onDrop: onBankDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls', '.xlsx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: true
  })

  const jobberDropzone = useDropzone({
    onDrop: onJobberDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls', '.xlsx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: true
  })

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center py-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Upload Your Files
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Upload bank statements and Jobber receipts to automatically match transactions and identify missing receipts.
        </p>
      </div>

      {/* Stats Overview */}
      {(bankCount > 0 || jobberCount > 0) && (
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto animate-slide-up">
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 text-center border border-blue-200 dark:border-blue-800">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{bankCount}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Bank Transactions</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/30 rounded-xl p-4 text-center border border-green-200 dark:border-green-800">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">{jobberCount}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Jobber Receipts</div>
          </div>
        </div>
      )}

      {/* Upload Areas */}
      <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {/* Bank Statement Upload */}
        <div
          {...bankDropzone.getRootProps()}
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
            bankDropzone.isDragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[1.02]'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50'
          } ${bankCount > 0 ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
        >
          <input {...bankDropzone.getInputProps()} />
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
              <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Bank Statement
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Drop PDF or CSV files here
              </p>
              {bankDropzone.isDragActive && (
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-2 font-medium">
                  Drop files to upload...
                </p>
              )}
            </div>
            <button 
              type="button"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Select Files</span>
            </button>
            {bankCount > 0 && (
              <div className="flex items-center justify-center space-x-2 text-green-600 dark:text-green-400 animate-fade-in">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">{bankCount} transactions loaded</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onClearBank()
                  }}
                  className="ml-2 p-1 text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                  title="Clear bank transactions"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Jobber Upload */}
        <div
          {...jobberDropzone.getRootProps()}
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
            jobberDropzone.isDragActive
              ? 'border-green-500 bg-green-50 dark:bg-green-900/20 scale-[1.02]'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50'
          } ${jobberCount > 0 ? 'bg-green-50/50 dark:bg-green-900/10' : ''}`}
        >
          <input {...jobberDropzone.getInputProps()} />
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
              <Receipt className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Jobber Receipts
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Drop CSV or Excel files here
              </p>
              {jobberDropzone.isDragActive && (
                <p className="text-sm text-green-600 dark:text-green-400 mt-2 font-medium">
                  Drop files to upload...
                </p>
              )}
            </div>
            <button 
              type="button"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Select Files</span>
            </button>
            {jobberCount > 0 && (
              <div className="flex items-center justify-center space-x-2 text-green-600 dark:text-green-400 animate-fade-in">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">{jobberCount} receipts loaded</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onClearJobber()
                  }}
                  className="ml-2 p-1 text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                  title="Clear Jobber receipts"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="max-w-3xl mx-auto bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2 mb-4">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h4 className="font-semibold text-gray-900 dark:text-white">How it works</h4>
        </div>
        <ol className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          {[
            'Upload your bank statement (PDF or CSV export from your bank)',
            'Upload your Jobber receipts export (CSV format with Date, Employee, Job, Amount columns)',
            'We automatically match transactions by exact dollar amounts',
            'Review unmatched transactions - these may be missing receipts',
            'Use the Spectrum view to see aging of unmatched amounts'
          ].map((step, i) => (
            <li key={i} className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">
                {i + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* File Format Help */}
      <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <h5 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
            <FileText className="w-4 h-4 mr-2 text-blue-500" />
            Bank Statement Format
          </h5>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Supports PDF exports and CSV files with columns: Date, Description, Amount
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <h5 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
            <Receipt className="w-4 h-4 mr-2 text-green-500" />
            Jobber Export Format
          </h5>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            CSV with: Date, Employee/Team Member, Job Number, Amount, Description
          </p>
        </div>
      </div>
    </div>
  )
}
