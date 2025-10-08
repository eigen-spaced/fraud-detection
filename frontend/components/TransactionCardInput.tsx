'use client';

import { convertedSampleTransactions, TransactionData } from '@/lib/convertedSampleData';
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
  const [selectedType, setSelectedType] = useState<'legitimate' | 'suspicious' | 'fraud' | 'mixed'>('legitimate');
  const [transactions, setTransactions] = useState<TransactionData[]>(convertedSampleTransactions.legitimate.transactions);

  const handleLoadSample = (type: 'legitimate' | 'suspicious' | 'fraud' | 'mixed') => {
    setSelectedType(type);
    setTransactions(convertedSampleTransactions[type].transactions);
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
    <div className="bg-white backdrop-blur-sm rounded-xl shadow-2xl border border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <span>💳</span>
          Transaction Cards
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          View transactions in an intuitive card format
        </p>
      </div>

      {/* Sample Data Buttons */}
      <div className="p-4 border-b border-gray-200 space-y-2">
        <p className="text-xs text-gray-500 mb-2">Load sample data:</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <button
            onClick={() => handleLoadSample('legitimate')}
            disabled={isLoading}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed border ${
              selectedType === 'legitimate'
                ? 'bg-green-100 text-green-800 border-green-300 ring-2 ring-green-200'
                : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
            }`}
          >
            ✓ Legitimate
          </button>
          <button
            onClick={() => handleLoadSample('suspicious')}
            disabled={isLoading}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed border ${
              selectedType === 'suspicious'
                ? 'bg-yellow-100 text-yellow-800 border-yellow-300 ring-2 ring-yellow-200'
                : 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100'
            }`}
          >
            ⚠️ Suspicious
          </button>
          <button
            onClick={() => handleLoadSample('fraud')}
            disabled={isLoading}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed border ${
              selectedType === 'fraud'
                ? 'bg-red-100 text-red-800 border-red-300 ring-2 ring-red-200'
                : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
            }`}
          >
            ⛔ Fraudulent
          </button>
          <button
            onClick={() => handleLoadSample('mixed')}
            disabled={isLoading}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed border ${
              selectedType === 'mixed'
                ? 'bg-blue-100 text-blue-800 border-blue-300 ring-2 ring-blue-200'
                : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
            }`}
          >
            🔀 Mixed
          </button>
        </div>
      </div>

      {/* Transaction Count */}
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
        <p className="text-sm text-gray-700">
          <span className="font-semibold text-gray-900">{transactions.length}</span>
          {' '}transaction{transactions.length !== 1 ? 's' : ''} loaded
        </p>
      </div>

      {/* Cards Display */}
      <div className="flex-1 overflow-y-auto p-4 max-h-[60vh]">
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="text-6xl">📭</div>
            <p className="text-gray-700 text-lg font-medium">No Transactions</p>
            <p className="text-gray-500 text-sm max-w-md">
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
        <div className="mx-4 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm font-medium">
            {error instanceof Error ? error.message : 'An error occurred'}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="p-4 border-t border-gray-200 flex gap-3">
        <button
          onClick={handleAnalyze}
          disabled={isLoading || transactions.length === 0}
          className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
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
          className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Clear
        </button>
      </div>
    </div>
  );
}