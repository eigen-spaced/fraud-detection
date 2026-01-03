"use client"

import {
  newSampleTransactions as sampleTransactions,
  TransactionData,
} from "@/lib/sampleData"
import TransactionCard from "./TransactionCard"
import { useState, useEffect, useRef } from "react"

interface TransactionCardInputProps {
  onAnalyze: (transactions: TransactionData[]) => void
  onClear: () => void
  isLoading: boolean
  error: Error | null
}

// Type definitions for database API
interface EngineeredTransaction {
  trans_num: string
  is_fraud: number

  // Original transaction data
  cc_num?: string  // text in database
  acct_num?: number  // bigint in database
  merchant?: string
  category?: string
  lat?: number
  long?: number
  merch_lat?: number
  merch_long?: number

  // Engineered features
  amt: number
  hour_of_day: number
  is_late_night_fraud_window: number
  is_late_evening_fraud_window: number
  log_trans_in_last_1h: number
  log_trans_in_last_24h: number
  log_trans_in_last_7d: number
  log_amt_per_card_avg_ratio_1h: number
  log_amt_per_card_avg_ratio_24h: number
  log_amt_per_card_avg_ratio_7d: number
  log_amt_per_category_avg_ratio_1h: number
  log_amt_per_category_avg_ratio_24h: number
  log_amt_per_category_avg_ratio_7d: number
  amt_diff_from_card_median_1d: number
  amt_diff_from_card_median_7d: number
}

interface TransactionSampleResponse {
  transactions: EngineeredTransaction[]
  count: number
  scenario: string
  timestamp: string
}

export default function TransactionCardInput({
  onAnalyze,
  onClear,
  isLoading,
  error,
}: TransactionCardInputProps) {
  const [transactions, setTransactions] = useState<TransactionData[]>(
    sampleTransactions.suspicious.transactions
  )
  const [loadingScenario, setLoadingScenario] = useState<string | null>(null)
  const [dbError, setDbError] = useState<string | null>(null)
  const [isLiveMode, setIsLiveMode] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Live mode effect
  useEffect(() => {
    if (isLiveMode) {
      // Fetch immediately when enabled
      fetchFromDatabase('mixed', 1, true)

      // Set up interval for subsequent fetches
      timerRef.current = setInterval(() => {
        fetchFromDatabase('mixed', 1, true)
      }, 5000) // 5 seconds
    } else {
      // Clear interval when disabled
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }

    // Cleanup on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isLiveMode])

  // Convert database transaction to frontend format
  const convertDatabaseToTransactionData = (dbTx: EngineeredTransaction): TransactionData => {
    // Generate timestamp from hour_of_day (approximate)
    const now = new Date()
    now.setHours(dbTx.hour_of_day, 0, 0, 0)

    // Get last 4 digits of card number (must be digits only)
    const cardLast4 = dbTx.cc_num ? dbTx.cc_num.slice(-4) : '0000'
    const locationStr = dbTx.merch_lat && dbTx.merch_long ? `${dbTx.merch_lat}, ${dbTx.merch_long}` : '0.0, 0.0'

    return {
      transaction: {
        id: dbTx.trans_num,
        timestamp: now.toISOString(),
        location: locationStr,
        merchant: {
          name: dbTx.merchant || 'Unknown Merchant',
          category: dbTx.category || 'misc',
          location: {
            lat: dbTx.merch_lat || 0,
            lng: dbTx.merch_long || 0
          }
        },
        amount: dbTx.amt,
        card: {
          number: cardLast4,
          full: dbTx.cc_num || dbTx.trans_num
        },
        account: {
          number: dbTx.acct_num ? String(dbTx.acct_num).slice(-4) : '0000',
          full: dbTx.acct_num ? String(dbTx.acct_num) : dbTx.trans_num
        }
      },
      model_features: {
        temporal: {
          trans_in_last_1h: Math.exp(dbTx.log_trans_in_last_1h),
          trans_in_last_24h: Math.exp(dbTx.log_trans_in_last_24h),
          trans_in_last_7d: Math.exp(dbTx.log_trans_in_last_7d)
        },
        amount_ratios: {
          amt_per_card_avg_ratio_1h: Math.exp(dbTx.log_amt_per_card_avg_ratio_1h),
          amt_per_card_avg_ratio_24h: Math.exp(dbTx.log_amt_per_card_avg_ratio_24h),
          amt_per_card_avg_ratio_7d: Math.exp(dbTx.log_amt_per_card_avg_ratio_7d),
          amt_per_category_avg_ratio_1h: Math.exp(dbTx.log_amt_per_category_avg_ratio_1h),
          amt_per_category_avg_ratio_24h: Math.exp(dbTx.log_amt_per_category_avg_ratio_24h),
          amt_per_category_avg_ratio_7d: Math.exp(dbTx.log_amt_per_category_avg_ratio_7d)
        },
        deviations: {
          amt_diff_from_card_median_7d: dbTx.amt_diff_from_card_median_7d
        }
      },
      ground_truth: {
        is_fraud: dbTx.is_fraud === 1
      }
    } as any // Cast to bypass type check - location property needed for backend
  }

  const fetchFromDatabase = async (
    scenario: 'fraud' | 'legit' | 'mixed',
    limit: number = 5,
    isPrepend: boolean = false
  ) => {
    setLoadingScenario(scenario)
    setDbError(null)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(
        `${apiUrl}/api/transactions/sample?scenario=${scenario}&limit=${limit}`
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to fetch transactions')
      }

      const data: TransactionSampleResponse = await response.json()

      // Convert database transactions to frontend format
      if (data.transactions.length === 0) {
        if (!isPrepend) {
          setDbError(`No ${scenario} transactions found in database. Using sample data instead.`)
          handleLoadSample()
        }
      } else {
        // Convert database format to TransactionData format
        const convertedTransactions = data.transactions.map(convertDatabaseToTransactionData)

        if (isPrepend) {
          // Prepend for live mode (add to top)
          setTransactions(prev => [...convertedTransactions, ...prev].slice(0, 20)) // Keep max 20
        } else {
          // Replace for manual loading
          setTransactions(convertedTransactions)
        }
      }
    } catch (err) {
      console.error('Database fetch error:', err)
      setDbError(err instanceof Error ? err.message : 'Failed to load from database')
      // Fallback to sample data
      handleLoadSample()
    } finally {
      setLoadingScenario(null)
    }
  }

  const handleLoadSample = () => {
    setTransactions(sampleTransactions.suspicious.transactions)
    setDbError(null)
  }

  const handleAnalyze = () => {
    if (transactions.length > 0) {
      onAnalyze(transactions)
    }
  }

  const handleClearAll = () => {
    setTransactions([])
    setDbError(null)
    onClear()
  }

  return (
    <div className='backdrop-blur-sm rounded-xl shadow-2xl border flex flex-col h-full' style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      {/* Header */}
      <div className='p-4 border-b' style={{ borderColor: 'var(--border)' }}>
        <h2 className='text-xl font-semibold' style={{ color: 'var(--text-primary)' }}>
          Transaction Cards
        </h2>
      </div>

      {/* Scenario Toolbar */}
      <div className='p-4 border-b space-y-2' style={{ borderColor: 'var(--border)' }}>
        <p className='text-xs mb-2' style={{ color: 'var(--text-secondary)' }}>Load from database:</p>
        <div className='grid grid-cols-3 gap-2'>
          <button
            type='button'
            onClick={() => fetchFromDatabase('fraud', 5)}
            disabled={isLoading || loadingScenario !== null}
            className='px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed border'
            style={{ background: 'var(--critical-bg)', color: 'var(--critical)', borderColor: 'var(--critical-border)' }}
          >
            {loadingScenario === 'fraud' ? '...' : 'Fraud Cases'}
          </button>
          <button
            type='button'
            onClick={() => fetchFromDatabase('legit', 5)}
            disabled={isLoading || loadingScenario !== null}
            className='px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed border'
            style={{ background: 'var(--success-bg)', color: 'var(--success)', borderColor: 'var(--success-border)' }}
          >
            {loadingScenario === 'legit' ? '...' : 'Legit Cases'}
          </button>
          <button
            type='button'
            onClick={() => fetchFromDatabase('mixed', 5)}
            disabled={isLoading || loadingScenario !== null}
            className='px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed border'
            style={{ background: 'var(--primary-bg)', color: 'var(--primary)', borderColor: 'var(--primary-border)' }}
          >
            {loadingScenario === 'mixed' ? '...' : 'Random Mix'}
          </button>
        </div>
      </div>

      {/* Live Mode Toggle */}
      <div className='px-4 py-3 border-b flex items-center justify-between' style={{ borderColor: 'var(--border)' }}>
        <div className='flex items-center gap-2'>
          <span className='text-sm font-medium' style={{ color: 'var(--text-primary)' }}>
            Live Mode
          </span>
          {isLiveMode && (
            <span className='flex items-center gap-1 text-xs' style={{ color: 'var(--success)' }}>
              <span className='relative flex h-2 w-2'>
                <span className='animate-ping absolute inline-flex h-full w-full rounded-full opacity-75' style={{ background: 'var(--success)' }}></span>
                <span className='relative inline-flex rounded-full h-2 w-2' style={{ background: 'var(--success)' }}></span>
              </span>
              Active
            </span>
          )}
        </div>
        <button
          type='button'
          onClick={() => setIsLiveMode(!isLiveMode)}
          disabled={isLoading}
          className='relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          style={{ background: isLiveMode ? 'var(--success)' : 'var(--border)' }}
        >
          <span
            className='inline-block h-4 w-4 transform rounded-full bg-white transition-transform'
            style={{ transform: isLiveMode ? 'translateX(1.5rem)' : 'translateX(0.25rem)' }}
          />
        </button>
      </div>

      {/* Database Error Display */}
      {dbError && (
        <div className='mx-4 mt-4 p-3 rounded-lg border' style={{ background: 'var(--warning-bg)', borderColor: 'var(--warning-border)' }}>
          <p className='text-sm font-medium' style={{ color: 'var(--warning)' }}>
            {dbError}
          </p>
        </div>
      )}

      {/* Transaction Count */}
      <div className='px-4 py-2 border-b' style={{ background: 'var(--background)', borderColor: 'var(--border)' }}>
        <p className='text-sm' style={{ color: 'var(--text-secondary)' }}>
          <span className='font-semibold' style={{ color: 'var(--text-primary)' }}>
            {transactions.length}
          </span>{" "}
          transaction{transactions.length !== 1 ? "s" : ""} loaded
        </p>
      </div>

      {/* Cards Display */}
      <div className='flex-1 overflow-y-auto p-4 max-h-[60vh]'>
        {transactions.length === 0 ? (
          <div className='flex flex-col items-center justify-center h-full gap-4 text-center'>
            <div style={{ color: 'var(--text-tertiary)' }}>
              <svg className='w-16 h-16' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4' />
              </svg>
            </div>
            <p className='text-lg font-medium' style={{ color: 'var(--text-primary)' }}>No Transactions</p>
            <p className='text-sm max-w-md' style={{ color: 'var(--text-secondary)' }}>
              Click a button above to load transaction samples from the database
            </p>
          </div>
        ) : (
          <div className='space-y-4'>
            {transactions.map((transaction, index) => (
              <TransactionCard
                key={transaction.transaction.id}
                transaction={transaction}
                index={index}
              />
            ))}
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className='mx-4 mb-4 p-3 rounded-lg border' style={{ background: 'var(--critical-bg)', borderColor: 'var(--critical-border)' }}>
          <p className='text-sm font-medium' style={{ color: 'var(--critical)' }}>
            {error instanceof Error ? error.message : "An error occurred"}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className='p-4 border-t flex gap-3' style={{ borderColor: 'var(--border)' }}>
        <button
          type='button'
          onClick={handleAnalyze}
          disabled={isLoading || transactions.length === 0}
          className='flex-1 font-semibold py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg'
          style={{ background: 'var(--primary)', color: 'white' }}
        >
          {isLoading ? (
            <>
              <svg className='animate-spin h-5 w-5' viewBox='0 0 24 24'>
                <circle
                  className='opacity-25'
                  cx='12'
                  cy='12'
                  r='10'
                  stroke='currentColor'
                  strokeWidth='4'
                  fill='none'
                />
                <path
                  className='opacity-75'
                  fill='currentColor'
                  d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                />
              </svg>
              Analyzing...
            </>
          ) : (
            <>
              Analyze {transactions.length} Transaction
              {transactions.length !== 1 ? "s" : ""}
            </>
          )}
        </button>
        <button
          type='button'
          onClick={handleClearAll}
          disabled={isLoading}
          className='px-6 py-3 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          style={{ background: 'var(--border)', color: 'var(--text-primary)' }}
        >
          Clear
        </button>
      </div>
    </div>
  )
}

