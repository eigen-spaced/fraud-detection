'use client';

import { useState } from 'react';
import TransactionCardInput from '@/components/TransactionCardInput';
import TabbedResultsPanel from '@/components/TabbedResultsPanel';
import Header from '@/components/Header';
import { TransactionData } from '@/lib/newSampleData';
import { FraudDetectionResponse, RefusalResponse, Transaction } from '@/lib/api';
import { convertTransactionBatch } from '@/lib/transactionUtils';

export default function Home() {
  const [result, setResult] = useState<FraudDetectionResponse | RefusalResponse | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleAnalyze = async (transactionData: TransactionData[]) => {
    setIsLoading(true);
    setError(null);
    
    // Convert to Transaction format and store
    const convertedTransactions = convertTransactionBatch(transactionData);
    setTransactions(convertedTransactions);
    
    try {
      // Call the fraud detection API
      const response = await fetch('http://localhost:8000/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactions: convertedTransactions
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Prediction failed: ${errorData.detail || response.statusText}`);
      }
      
      const result = await response.json();
      setResult(result);
      
    } catch (err) {
      console.error('Model prediction error:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setResult(null);
    setTransactions([]);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-50 via-white to-emerald-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Card Input */}
          <TransactionCardInput
            onAnalyze={handleAnalyze}
            onClear={handleClear}
            isLoading={isLoading}
            error={error}
          />

          {/* Right Panel - Results */}
          <TabbedResultsPanel
            result={result}
            transactions={transactions}
            isLoading={isLoading}
            error={error}
          />
        </div>
      </main>
    </div>
  );
}
