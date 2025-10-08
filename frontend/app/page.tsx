'use client';

import { useState } from 'react';
import TransactionCardInput from '@/components/TransactionCardInput';
import ResultsPanel from '@/components/ResultsPanel';
import Header from '@/components/Header';
import { TransactionData } from '@/lib/convertedSampleData';
import { FraudDetectionResponse, RefusalResponse } from '@/lib/api';

export default function Home() {
  const [result, setResult] = useState<FraudDetectionResponse | RefusalResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleAnalyze = async (transactions: TransactionData[]) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Call the real ML model API
      const response = await fetch('http://localhost:8000/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactions: transactions
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Prediction failed: ${errorData.detail || response.statusText}`);
      }
      
      const result = await response.json();
      setResult(result);
      setIsLoading(false);
      
    } catch (err) {
      console.error('Model prediction error:', err);
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
