'use client';

import { newSampleTransactions, TransactionData } from '@/lib/newSampleData';
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
  const [selectedType, setSelectedType] = useState<'legitimate' | 'suspicious' | 'fraudulent' | 'mixed'>('legitimate');
  const [transactions, setTransactions] = useState<TransactionData[]>(newSampleTransactions.legitimate.transactions);

  const handleLoadSample = (type: 'legitimate' | 'suspicious' | 'fraudulent' | 'mixed') => {
    setSelectedType(type);
    setTransactions(newSampleTransactions[type].transactions);
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
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-2xl border border-slate-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <span>💳</span>
          Transaction Cards
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          View transactions in an intuitive card format
        </p>
      </div>

      {/* Sample Data Buttons */}
      <div className="p-4 border-b border-slate-700 space-y-2">
        <p className="text-xs text-slate-400 mb-2">Load sample data:</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <button
            onClick={() => handleLoadSample('legitimate')}
            disabled={isLoading}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed border ${
              selectedType === 'legitimate'
                ? 'bg-green-600/30 text-green-300 border-green-600/50 ring-2 ring-green-600/30'
                : 'bg-green-600/20 text-green-400 border-green-600/30 hover:bg-green-600/30'
            }`}
          >
            ✓ Legitimate
          </button>
          <button
            onClick={() => handleLoadSample('suspicious')}
            disabled={isLoading}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed border ${
              selectedType === 'suspicious'
                ? 'bg-yellow-600/30 text-yellow-300 border-yellow-600/50 ring-2 ring-yellow-600/30'
                : 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30 hover:bg-yellow-600/30'
            }`}
          >
            ⚠️ Suspicious
          </button>
          <button
            onClick={() => handleLoadSample('fraudulent')}
            disabled={isLoading}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed border ${
              selectedType === 'fraudulent'
                ? 'bg-red-600/30 text-red-300 border-red-600/50 ring-2 ring-red-600/30'
                : 'bg-red-600/20 text-red-400 border-red-600/30 hover:bg-red-600/30'
            }`}
          >
            ⛔ Fraudulent
          </button>
          <button
            onClick={() => handleLoadSample('mixed')}
            disabled={isLoading}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed border ${
              selectedType === 'mixed'
                ? 'bg-blue-600/30 text-blue-300 border-blue-600/50 ring-2 ring-blue-600/30'
                : 'bg-blue-600/20 text-blue-400 border-blue-600/30 hover:bg-blue-600/30'
            }`}
          >
            🔀 Mixed
          </button>
        </div>
      </div>

      {/* Transaction Count */}
      <div className="px-4 py-2 bg-slate-900/30 border-b border-slate-700">
        <p className="text-sm text-slate-300">
          <span className="font-semibold text-white">{transactions.length}</span> 
          {' '}transaction{transactions.length !== 1 ? 's' : ''} loaded
        </p>
      </div>

      {/* Cards Display */}
      <div className="flex-1 overflow-y-auto p-4">
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="text-6xl">📭</div>
            <p className="text-slate-300 text-lg font-medium">No Transactions</p>
            <p className="text-slate-500 text-sm max-w-md">
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
        <div className="mx-4 mb-4 p-3 bg-red-900/20 border border-red-700/50 rounded-lg">
          <p className="text-red-400 text-sm font-medium">
            {error instanceof Error ? error.message : 'An error occurred'}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="p-4 border-t border-slate-700 flex gap-3">
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
          className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Clear
        </button>
      </div>
    </div>
  );
}