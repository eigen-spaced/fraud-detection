"use client"

import {
  newSampleTransactions as sampleTransactions,
  TransactionData,
} from "@/lib/sampleData"
import TransactionCard from "./TransactionCard"
import { useState } from "react"

interface TransactionCardInputProps {
  onAnalyze: (transactions: TransactionData[]) => void
  onClear: () => void
  isLoading: boolean
  error: Error | null
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

  const handleLoadSample = () => {
    setTransactions(sampleTransactions.suspicious.transactions)
  }

  const handleAnalyze = () => {
    if (transactions.length > 0) {
      onAnalyze(transactions)
    }
  }

  const handleClearAll = () => {
    setTransactions([])
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

      {/* Sample Data Buttons 
          NOTE: Currently loading only suspicious transactions for demonstration.
          FUTURE: This will be replaced with database integration to fetch 
          random transactions from the analyzed_transactions table.
          See backend/app/db_service.py for database query functions.
      */}
      <div className='p-4 border-b space-y-2' style={{ borderColor: 'var(--border)' }}>
        <p className='text-xs mb-2' style={{ color: 'var(--text-secondary)' }}>Load sample data:</p>
        <button
          type='button'
          onClick={handleLoadSample}
          disabled={isLoading}
          className='w-full px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed border'
          style={{ background: 'var(--warning-bg)', color: 'var(--warning)', borderColor: 'var(--warning-border)' }}
        >
          Load Suspicious Transactions
        </button>
      </div>

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
            <div className='text-navy-400'>
              <svg className='w-16 h-16' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4' />
              </svg>
            </div>
            <p className='text-navy-700 text-lg font-medium'>No Transactions</p>
            <p className='text-navy-500 text-sm max-w-md'>
              Click the button above to load sample transaction cards
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
