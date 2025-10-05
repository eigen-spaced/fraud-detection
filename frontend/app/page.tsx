'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api, FraudDetectionResponse, RefusalResponse } from '@/lib/api';
import { sampleTransactions } from '@/lib/sampleData';
import JsonInput from '@/components/JsonInput';
import ResultsPanel from '@/components/ResultsPanel';
import Header from '@/components/Header';

export default function Home() {
  const [jsonInput, setJsonInput] = useState('');
  const [result, setResult] = useState<FraudDetectionResponse | RefusalResponse | null>(null);

  const analyzeMutation = useMutation({
    mutationFn: (input: string) => {
      const parsed = JSON.parse(input);
      return api.analyzeTransactions(parsed);
    },
    onSuccess: (data) => {
      setResult(data);
    },
  });

  const handleAnalyze = () => {
    if (!jsonInput.trim()) {
      return;
    }
    analyzeMutation.mutate(jsonInput);
  };

  const handleClear = () => {
    setJsonInput('');
    setResult(null);
    analyzeMutation.reset();
  };

  const handleLoadSample = (sampleType: keyof typeof sampleTransactions) => {
    setJsonInput(sampleTransactions[sampleType]);
    setResult(null);
    analyzeMutation.reset();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-12rem)]">
          {/* Left Panel - Input */}
          <JsonInput
            value={jsonInput}
            onChange={setJsonInput}
            onAnalyze={handleAnalyze}
            onClear={handleClear}
            onLoadSample={handleLoadSample}
            isLoading={analyzeMutation.isPending}
            error={analyzeMutation.error}
          />

          {/* Right Panel - Results */}
          <ResultsPanel
            result={result}
            isLoading={analyzeMutation.isPending}
            error={analyzeMutation.error}
          />
        </div>
      </main>
    </div>
  );
}
