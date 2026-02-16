import type { BankTransaction, JobberReceipt, Match, AgingBucket } from '../types'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

export const generateId = (prefix: string): string => 
  `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// Bank PDF/CSV Parsing
export const parseBankPDF = async (file: File): Promise<BankTransaction[]> => {
  const text = await file.text()
  
  if (file.name.toLowerCase().endsWith('.csv')) {
    return parseBankCSV(text)
  }
  
  // For PDFs, extract text and parse line by line
  const lines = text.split(/\r?\n/)
  const transactions: BankTransaction[] = []
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line || isHeaderLine(line)) continue
    
    const parsed = parseTransactionLine(line)
    if (parsed) {
      if (parsed.date && parsed.description && parsed.amount !== undefined) {
        transactions.push({
          id: generateId('bank'),
          date: parsed.date,
          description: parsed.description,
          amount: parsed.amount,
          type: parsed.type || 'debit',
          rawText: parsed.rawText
        })
      }
    }
  }
  
  return transactions
}

const isHeaderLine = (line: string): boolean => {
  const headers = ['date', 'description', 'amount', 'balance', 'transaction', 'posting']
  const lower = line.toLowerCase()
  return headers.some(h => lower.includes(h)) && lower.split(/\s+/).length <= 5
}

const parseTransactionLine = (line: string): Partial<BankTransaction> | null => {
  const datePatterns = [
    { regex: /(\d{1,2})\/(\d{1,2})\/(\d{4})/ },
    { regex: /(\d{1,2})-(\d{1,2})-(\d{4})/ },
    { regex: /(\d{4})-(\d{1,2})-(\d{1,2})/ },
    { regex: /(\d{1,2})\/(\d{1,2})\/(\d{2})/ },
  ]
  
  let date = ''
  for (const pattern of datePatterns) {
    const match = line.match(pattern.regex)
    if (match) {
      date = normalizeDate(match[0])
      if (date) break
    }
  }
  
  if (!date) return null
  
  const amountPattern = /-?\$?[\d,]+\.\d{2}/g
  const amounts = line.match(amountPattern)
  
  if (!amounts || amounts.length === 0) return null
  
  const lastAmount = amounts[amounts.length - 1]
  const amountValue = parseFloat(lastAmount.replace(/[$,]/g, ''))
  
  let description = line
  for (const pattern of datePatterns) {
    const match = line.match(pattern.regex)
    if (match) {
      description = description.replace(match[0], '')
      break
    }
  }
  description = description.replace(lastAmount, '')
  description = description.replace(/[^\w\s-]/g, ' ').replace(/\s+/g, ' ').trim()
  
  if (description.length < 3) return null
  
  return {
    date,
    description: description.substring(0, 150),
    amount: Math.abs(amountValue),
    type: amountValue < 0 ? 'debit' : 'credit',
    rawText: line
  }
}

const parseBankCSV = (text: string): BankTransaction[] => {
  const lines = text.split(/\r?\n/)
  const transactions: BankTransaction[] = []
  let headerFound = false
  
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    
    if (!headerFound) {
      if (isHeaderLine(trimmed)) {
        headerFound = true
      }
      continue
    }
    
    const parts = trimmed.split(',').map(p => p.trim().replace(/^["']|["']$/g, ''))
    if (parts.length < 3) continue
    
    const date = normalizeDate(parts[0])
    const description = parts[1]
    const amountStr = parts[parts.length - 1].replace(/[$,]/g, '')
    const amount = parseFloat(amountStr)
    
    if (date && !isNaN(amount) && description && description.length > 2) {
      transactions.push({
        id: generateId('bank'),
        date,
        description: description.substring(0, 150),
        amount: Math.abs(amount),
        type: amount < 0 ? 'debit' : 'credit'
      })
    }
  }
  
  return transactions
}

// Jobber CSV/Excel Parsing with better error handling
export const parseJobberFile = async (file: File): Promise<JobberReceipt[]> => {
  const fileName = file.name.toLowerCase()
  console.log('Parsing Jobber file:', fileName, 'Type:', file.type)
  
  try {
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      console.log('Detected Excel file, using Excel parser')
      return await parseJobberExcel(file)
    } else if (fileName.endsWith('.csv')) {
      console.log('Detected CSV file, using CSV parser')
      return await parseJobberCSV(file)
    } else {
      // Try to detect by content
      const text = await file.text()
      console.log('File content preview:', text.substring(0, 200))
      if (text.includes(',') || text.includes('\t')) {
        console.log('Attempting CSV parse based on content')
        return await parseJobberCSV(file)
      }
      throw new Error('Unsupported file format. Please upload CSV or Excel files (.csv, .xlsx, .xls)')
    }
  } catch (error) {
    console.error('Error parsing Jobber file:', error)
    throw error
  }
}

const parseJobberExcel = async (file: File): Promise<JobberReceipt[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        console.log('Reading Excel file...')
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        console.log('File size:', data.length, 'bytes')
        
        const workbook = XLSX.read(data, { type: 'array' })
        console.log('Excel sheets found:', workbook.SheetNames)
        
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as string[][]
        
        console.log('Excel rows found:', jsonData.length)
        
        if (jsonData.length < 2) {
          reject(new Error('Excel file appears to be empty or has no data rows'))
          return
        }
        
        // Find header row
        const headers = jsonData[0].map((h: string) => String(h).trim().toLowerCase().replace(/[^a-z0-9\s]/g, ''))
        console.log('Excel headers found:', headers)
        
        const receipts: JobberReceipt[] = []
        
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i]
          if (!row || row.length === 0) continue
          
          const rowData: Record<string, string> = {}
          headers.forEach((header, index) => {
            rowData[header] = String(row[index] || '').trim()
          })
          
          console.log('Processing row', i, ':', rowData)
          
          const date = extractDate(rowData)
          const employee = extractField(rowData, ['employee', 'teammember', 'team member', 'submittedby', 'submitted by', 'user', 'staff', 'person', 'name']) || 'Unknown'
          const job = extractField(rowData, ['job', 'jobnumber', 'job number', 'project', 'workorder', 'work order', 'wo', 'site', 'job #', 'job#']) || 'General'
          const amount = extractAmount(rowData)
          const description = extractField(rowData, ['description', 'expensename', 'expense name', 'details', 'memo', 'note', 'item', 'expense']) || ''
          const category = extractField(rowData, ['category', 'expensetype', 'expense type', 'type', 'account']) || ''
          
          console.log('Extracted:', { date, employee, job, amount, description })
          
          if (date && amount > 0) {
            receipts.push({
              id: generateId('jobber'),
              date,
              employee: capitalizeWords(employee),
              job: job.toUpperCase(),
              amount,
              description: description.substring(0, 150),
              category
            })
          }
        }
        
        console.log('Total receipts extracted:', receipts.length)
        resolve(receipts)
      } catch (error) {
        console.error('Excel parsing error:', error)
        reject(new Error('Failed to parse Excel file: ' + (error instanceof Error ? error.message : 'Unknown error')))
      }
    }
    
    reader.onerror = () => reject(new Error('Failed to read Excel file'))
    reader.readAsArrayBuffer(file)
  })
}

const parseJobberCSV = async (file: File): Promise<JobberReceipt[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim().toLowerCase().replace(/[^a-z0-9\s]/g, ''),
      complete: (results) => {
        try {
          if (!results.data || results.data.length === 0) {
            reject(new Error('CSV file appears to be empty'))
            return
          }
          
          const receipts: JobberReceipt[] = []
          
          ;(results.data as Record<string, string>[]).forEach((row) => {
            const date = extractDate(row)
            const employee = extractField(row, ['employee', 'teammember', 'submittedby', 'submitted by', 'user', 'staff', 'person', 'name', 'team member']) || 'Unknown'
            const job = extractField(row, ['job', 'jobnumber', 'job number', 'project', 'workorder', 'work order', 'wo', 'site', 'job #', 'job#']) || 'General'
            const amount = extractAmount(row)
            const description = extractField(row, ['description', 'expensename', 'expense name', 'details', 'memo', 'note', 'item', 'expense']) || ''
            const category = extractField(row, ['category', 'expensetype', 'expense type', 'type', 'account']) || ''
            
            if (date && amount > 0) {
              receipts.push({
                id: generateId('jobber'),
                date,
                employee: capitalizeWords(employee),
                job: job.toUpperCase(),
                amount,
                description: description.substring(0, 150),
                category
              })
            }
          })
          
          if (receipts.length === 0) {
            reject(new Error('No valid receipts found in file. Please check the column headers.'))
            return
          }
          
          resolve(receipts)
        } catch (error) {
          reject(error)
        }
      },
      error: (error) => reject(new Error(`CSV parsing error: ${error.message}`))
    })
  })
}

const extractDate = (row: Record<string, string>): string => {
  const dateFields = ['date', 'reportdate', 'report date', 'expensedate', 'expense date', 'transactiondate', 'transaction date', 'created', 'submitted', 'datecreated', 'date created']
  for (const field of dateFields) {
    if (row[field]) {
      const normalized = normalizeDate(row[field])
      if (normalized) return normalized
    }
  }
  return ''
}

const extractAmount = (row: Record<string, string>): number => {
  const amountFields = ['amount', 'total', 'totalamount', 'total amount', 'cost', 'value', 'price', 'expenseamount', 'expense amount', 'expense']
  for (const field of amountFields) {
    if (row[field]) {
      // Handle various formats: $1,234.56, 1234.56, (1,234.56) for negative
      let cleaned = row[field].replace(/[$,]/g, '').trim()
      // Handle parentheses for negative numbers
      if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
        cleaned = '-' + cleaned.slice(1, -1)
      }
      const amount = parseFloat(cleaned)
      if (!isNaN(amount)) return Math.abs(amount)
    }
  }
  return 0
}

const extractField = (row: Record<string, string>, possibleNames: string[]): string => {
  for (const name of possibleNames) {
    const normalizedName = name.toLowerCase().replace(/[^a-z0-9\s]/g, '')
    if (row[normalizedName] && row[normalizedName].trim()) {
      return row[normalizedName].trim()
    }
    // Also try exact match
    if (row[name] && row[name].trim()) {
      return row[name].trim()
    }
  }
  return ''
}

const normalizeDate = (dateStr: string): string => {
  if (!dateStr) return ''
  
  dateStr = dateStr.trim()
  
  // Already ISO format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr
  
  // MM/DD/YYYY or MM-DD-YYYY
  const usMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (usMatch) {
    const [, m, d, y] = usMatch
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  
  // MM/DD/YY
  const shortMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/)
  if (shortMatch) {
    const [, m, d, y] = shortMatch
    const year = parseInt(y) < 50 ? `20${y}` : `19${y}`
    return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  
  // Try native Date parsing
  const parsed = new Date(dateStr)
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0]
  }
  
  return ''
}

const capitalizeWords = (str: string): string => {
  return str.replace(/\b\w/g, char => char.toUpperCase())
}

export const findExactMatches = (
  bankTransactions: BankTransaction[],
  jobberReceipts: JobberReceipt[]
): Match[] => {
  const matches: Match[] = []
  const usedBankIds = new Set<string>()
  const usedReceiptIds = new Set<string>()
  
  const bankByAmount = new Map<number, BankTransaction[]>()
  bankTransactions.forEach(bt => {
    const list = bankByAmount.get(bt.amount) || []
    list.push(bt)
    bankByAmount.set(bt.amount, list)
  })
  
  const sortedReceipts = [...jobberReceipts].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )
  
  for (const receipt of sortedReceipts) {
    if (usedReceiptIds.has(receipt.id)) continue
    
    const candidates = bankByAmount.get(receipt.amount) || []
    const match = candidates.find(bt => !usedBankIds.has(bt.id))
    
    if (match) {
      const daysDiff = Math.abs(
        Math.floor((new Date(match.date).getTime() - new Date(receipt.date).getTime()) / (1000 * 60 * 60 * 24))
      )
      
      matches.push({
        id: generateId('match'),
        bankId: match.id,
        receiptId: receipt.id,
        amount: receipt.amount,
        matchDate: new Date().toISOString(),
        confidence: daysDiff <= 7 ? 'exact' : 'fuzzy',
        daysSinceMatch: daysDiff
      })
      
      usedBankIds.add(match.id)
      usedReceiptIds.add(receipt.id)
    }
  }
  
  return matches
}

export const getAgingBuckets = (transactions: BankTransaction[]): AgingBucket[] => {
  const now = new Date()
  
  const buckets: AgingBucket[] = [
    { range: '0-7', label: 'Current', minDays: 0, maxDays: 7, color: '#22c55e', bgColor: 'bg-green-100 dark:bg-green-900/30', transactions: [], totalAmount: 0 },
    { range: '8-14', label: 'Warning', minDays: 8, maxDays: 14, color: '#eab308', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', transactions: [], totalAmount: 0 },
    { range: '15-30', label: 'Attention', minDays: 15, maxDays: 30, color: '#f97316', bgColor: 'bg-orange-100 dark:bg-orange-900/30', transactions: [], totalAmount: 0 },
    { range: '31-60', label: 'Critical', minDays: 31, maxDays: 60, color: '#ef4444', bgColor: 'bg-red-100 dark:bg-red-900/30', transactions: [], totalAmount: 0 },
    { range: '60+', label: 'Overdue', minDays: 61, maxDays: Infinity, color: '#dc2626', bgColor: 'bg-red-200 dark:bg-red-900/50', transactions: [], totalAmount: 0 },
  ]
  
  transactions.forEach(t => {
    const days = Math.floor((now.getTime() - new Date(t.date).getTime()) / (1000 * 60 * 60 * 24))
    const bucket = buckets.find(b => days >= b.minDays && days <= b.maxDays) || buckets[buckets.length - 1]
    bucket.transactions.push(t)
    bucket.totalAmount += t.amount
  })
  
  return buckets
}

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date)
}

export const formatShortDate = (dateStr: string): string => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric'
  }).format(date)
}

export const getDaysSince = (dateStr: string): number => {
  const date = new Date(dateStr)
  const now = new Date()
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
}

export const exportToJSON = (data: unknown, filename: string): void => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
