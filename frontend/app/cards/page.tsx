'use client';

import { useState } from 'react';
import TransactionCardInput from '@/components/TransactionCardInput';
import ResultsPanel from '@/components/ResultsPanel';
import Header from '@/components/Header';
import { TransactionData } from '@/lib/newSampleData';

export default function CardsPage() {
  const [result, setResult] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleAnalyze = async (transactions: TransactionData[]) => {
    setIsLoading(true);
    setError(null);
    
    // Simulate API call
    try {
      // In a real implementation, you'd convert the new format to the old format
      // or update the backend to accept the new format
      setTimeout(() => {
        // Mock response for demonstration
        setResult({
          summary: `Analyzed ${transactions.length} transactions with new card format!`,
          total_transactions: transactions.length,
          fraudulent_count: transactions.filter(t => t.ground_truth.is_fraud).length,
          suspicious_count: 0,
          legitimate_count: transactions.filter(t => !t.ground_truth.is_fraud).length,
          average_risk_score: 0.35,
          analyses: transactions.map(t => ({
            transaction_id: t.transaction.id,
            classification: t.ground_truth.is_fraud ? 'fraudulent' : 'legitimate',
            risk_score: t.ground_truth.is_fraud ? 0.85 : 0.15,
            risk_factors: ['New card format detected'],
            explanation: `Transaction at ${t.transaction.merchant.name} for $${t.transaction.amount.toFixed(2)} has been analyzed.`
          })),
          citations: [{
            source: 'New Card Format Analysis',
            url: 'https://example.com/card-format'
          }],
          warnings: []
        });
        setIsLoading(false);
      }, 1500);
    } catch (err) {
      setError(err as Error);
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50">
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
          <ResultsPanel
            result={result}
            isLoading={isLoading}
            error={error}
          />
        </div>
      </main>
    </div>
  );
}