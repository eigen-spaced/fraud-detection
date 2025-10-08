'use client';

import { newSampleTransactions as sampleTransactions, TransactionData } from '@/lib/newSampleData';
import TransactionCard from './TransactionCard';
import { useState } from 'react';

interface TransactionCardInputProps {
  onAnalyze: (transactions: TransactionData[]) => void;
  onClear: () => void;
  isLoading: boolean;
  error: Error | null;
}

export default function TransactionCardInput({
  onAnalyze,
  onClear,
  isLoading,
  error
}: TransactionCardInputProps) {
  const [selectedType, setSelectedType] = useState<'legitimate' | 'suspicious' | 'fraudulent'>('legitimate');
  const [transactions, setTransactions] = useState<TransactionData[]>(sampleTransactions.legitimate.transactions);

  const handleLoadSample = (type: 'legitimate' | 'suspicious' | 'fraudulent') => {
    setSelectedType(type);
    setTransactions(sampleTransactions[type].transactions);
  };

  const handleAnalyze = () => {
    if (transactions.length > 0) {
      onAnalyze(transactions);
    }
  };

  const handleClearAll = () => {
    setTransactions([]);
    onClear();
  };

  return (
    <div className="bg-white backdrop-blur-sm rounded-xl shadow-2xl border border-navy-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-navy-200">
        <h2 className="text-xl font-semibold text-navy-900 flex items-center gap-2">
          <span>💳</span>
          Transaction Cards
        </h2>
        <p className="text-sm text-navy-600 mt-1">
          View transactions in an intuitive card format
        </p>
      </div>

      {/* Sample Data Buttons */}
      <div className="p-4 border-b border-navy-200 space-y-2">
        <p className="text-xs text-navy-500 mb-2">Load sample data:</p>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleLoadSample('legitimate')}
            disabled={isLoading}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed border ${
              selectedType === 'legitimate'
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 ring-2 ring-emerald-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            ✓ Legitimate
          </button>
          <button
            onClick={() => handleLoadSample('suspicious')}
            disabled={isLoading}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed border ${
              selectedType === 'suspicious'
                ? 'bg-golden-100 text-golden-800 border-golden-300 ring-2 ring-golden-200'
                : 'bg-golden-50 text-golden-700 border-golden-200 hover:bg-golden-100'
            }`}
          >
            ⚠️ Suspicious
          </button>
          <button
            onClick={() => handleLoadSample('fraudulent')}
            disabled={isLoading}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed border ${
              selectedType === 'fraudulent'
                ? 'bg-coral-100 text-coral-800 border-coral-300 ring-2 ring-coral-200'
                : 'bg-coral-50 text-coral-700 border-coral-200 hover:bg-coral-100'
            }`}
          >
            ⛔ Fraudulent
          </button>
        </div>
      </div>

      {/* Transaction Count */}
      <div className="px-4 py-2 bg-navy-50 border-b border-navy-200">
        <p className="text-sm text-navy-700">
          <span className="font-semibold text-navy-900">{transactions.length}</span>
          {' '}transaction{transactions.length !== 1 ? 's' : ''} loaded
        </p>
      </div>

      {/* Cards Display */}
      <div className="flex-1 overflow-y-auto p-4 max-h-[60vh]">
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="text-6xl">📭</div>
            <p className="text-navy-700 text-lg font-medium">No Transactions</p>
            <p className="text-navy-500 text-sm max-w-md">
              Click one of the sample data buttons above to load transaction cards
            </p>
          </div>
        ) : (
          <div className="space-y-4">
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
        <div className="mx-4 mb-4 p-3 bg-coral-50 border border-coral-200 rounded-lg">
          <p className="text-coral-700 text-sm font-medium">
            {error instanceof Error ? error.message : 'An error occurred'}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="p-4 border-t border-navy-200 flex gap-3">
        <button
          onClick={handleAnalyze}
          disabled={isLoading || transactions.length === 0}
          className="flex-1 bg-gradient-to-r from-ocean-500 to-ocean-600 hover:from-ocean-600 hover:to-ocean-700 text-white font-semibold py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-ocean-500/20"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Analyzing...
            </>
          ) : (
            <>
              <span>🔍</span>
              Analyze {transactions.length} Transaction{transactions.length !== 1 ? 's' : ''}
            </>
          )}
        </button>
        <button
          onClick={handleClearAll}
          disabled={isLoading}
          className="px-6 py-3 bg-navy-200 hover:bg-navy-300 text-navy-700 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Clear
        </button>
      </div>
    </div>
  );
}