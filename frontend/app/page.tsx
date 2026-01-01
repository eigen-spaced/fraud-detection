'use client';

import { useState } from 'react';
import TransactionCardInput from '@/components/TransactionCardInput';
import TabbedResultsPanel from '@/components/TabbedResultsPanel';
import Header from '@/components/Header';
import { TransactionData } from '@/lib/sampleData';
import { FraudDetectionResponse, RefusalResponse, Transaction, api } from '@/lib/api';
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
      // Call the fraud detection API using the proper client
      const result = await api.analyzeTransactions({ transactions: convertedTransactions });
      setResult(result);

    } catch (err) {
      console.error('Fraud analysis error:', err);
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
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[35%_1fr] gap-6">
          {/* Left Panel - Transaction Input (Sidebar) */}
          <TransactionCardInput
            onAnalyze={handleAnalyze}
            onClear={handleClear}
            isLoading={isLoading}
            error={error}
          />

          {/* Right Panel - Analysis Results (Main Content) */}
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
