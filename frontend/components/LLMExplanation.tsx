'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api, LLMExplanationResponse } from '@/lib/api';

interface LLMExplanationProps {
  className?: string;
}

export default function LLMExplanation({ className = '' }: LLMExplanationProps) {
  const [explanation, setExplanation] = useState<LLMExplanationResponse | null>(null);

  const llmMutation = useMutation({
    mutationFn: () => api.testLLMExplanation(),
    onSuccess: (data) => {
      setExplanation(data);
    },
    onError: (error) => {
      console.error('LLM explanation failed:', error);
    },
  });

  const handleTestLLM = () => {
    llmMutation.mutate();
  };

  const handleClear = () => {
    setExplanation(null);
    llmMutation.reset();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header and Test Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span>🤖</span>
          LLM Explanation
        </h3>
        <div className="flex gap-2">
          <button
            onClick={handleTestLLM}
            disabled={llmMutation.isPending}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:cursor-not-allowed"
          >
            {llmMutation.isPending ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
                Generating...
              </>
            ) : (
              <>
                <span>✨</span>
                Test LLM
              </>
            )}
          </button>
          {(explanation || llmMutation.error) && (
            <button
              onClick={handleClear}
              className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {llmMutation.isPending && (
        <div className="p-6 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center gap-3">
            <svg className="animate-spin h-6 w-6 text-purple-600" viewBox="0 0 24 24">
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
            <div>
              <p className="text-purple-800 font-medium">Generating LLM Explanation...</p>
              <p className="text-purple-600 text-sm">This may take a few seconds</p>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {llmMutation.error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="text-red-500 text-xl">⚠️</div>
            <div>
              <p className="text-red-800 font-medium">Failed to Generate Explanation</p>
              <p className="text-red-600 text-sm mt-1">
                {llmMutation.error instanceof Error 
                  ? llmMutation.error.message 
                  : 'An unexpected error occurred'}
              </p>
              <details className="mt-2">
                <summary className="text-red-600 text-xs cursor-pointer hover:underline">
                  View Details
                </summary>
                <pre className="mt-1 text-xs text-red-500 bg-red-100 p-2 rounded overflow-x-auto">
                  {JSON.stringify(llmMutation.error, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        </div>
      )}

      {/* Success State - Show Explanation */}
      {explanation && (
        <div className="space-y-4">
          {/* Transaction Info */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-blue-900">Transaction Analysis</h4>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                explanation.risk_level === 'HIGH' 
                  ? 'bg-red-100 text-red-800 border border-red-200' 
                  : explanation.risk_level === 'MEDIUM'
                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                  : 'bg-green-100 text-green-800 border border-green-200'
              }`}>
                {explanation.risk_level} RISK
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-blue-600 font-medium">Transaction ID</p>
                <p className="text-blue-800">{explanation.transaction_id}</p>
              </div>
              <div>
                <p className="text-blue-600 font-medium">Fraud Probability</p>
                <p className="text-blue-800 font-bold">{(explanation.fraud_probability * 100).toFixed(1)}%</p>
              </div>
            </div>
          </div>

          {/* LLM Explanation */}
          <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span>🧠</span>
              AI Explanation
            </h4>
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {explanation.explanation}
              </p>
            </div>
          </div>

          {/* Metadata */}
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
              <div>
                <p className="font-medium">Model Used</p>
                <p>{explanation.model_used}</p>
              </div>
              <div>
                <p className="font-medium">Generated At</p>
                <p>{new Date(explanation.generated_at).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}