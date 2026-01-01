"use client"

import { FileText, Check, AlertTriangle, XCircle, Search } from 'lucide-react'
import { sampleTransactions } from '@/lib/sampleData';

interface JsonInputProps {
  value: string;
  onChange: (value: string) => void;
  onAnalyze: () => void;
  onClear: () => void;
  onLoadSample: (sampleType: keyof typeof sampleTransactions) => void;
  isLoading: boolean;
  error: Error | null;
}

export default function JsonInput({
  value,
  onChange,
  onAnalyze,
  onClear,
  onLoadSample,
  isLoading,
  error,
}: JsonInputProps) {
  return (
    <div className="rounded-xl shadow-2xl border flex flex-col h-full" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      {/* Header */}
      <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <h2 className="text-xl font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <FileText className="w-5 h-5" />
          Transaction Input
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Paste JSON transaction data below
        </p>
      </div>

      {/* Sample Data Buttons */}
      <div className="p-4 border-b space-y-2" style={{ borderColor: 'var(--border)' }}>
        <p className="text-xs mb-2" style={{ color: 'var(--text-tertiary)' }}>Load sample data:</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onLoadSample('legitimate')}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed border flex items-center gap-1.5"
            style={{ background: 'var(--success-bg)', color: 'var(--success)', borderColor: 'var(--success)' }}
          >
            <Check className="w-3.5 h-3.5" />
            Legitimate
          </button>
          <button
            onClick={() => onLoadSample('suspicious')}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed border flex items-center gap-1.5"
            style={{ background: 'var(--warning-bg)', color: 'var(--warning)', borderColor: 'var(--warning)' }}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Suspicious
          </button>
          <button
            onClick={() => onLoadSample('fraudulent')}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed border flex items-center gap-1.5"
            style={{ background: 'var(--error-bg)', color: 'var(--error)', borderColor: 'var(--error)' }}
          >
            <XCircle className="w-3.5 h-3.5" />
            Fraudulent
          </button>
        </div>
      </div>

      {/* JSON Editor */}
      <div className="flex-1 p-4 overflow-hidden">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={isLoading}
          placeholder={`{\n  "transactions": [\n    {\n      "transaction_id": "TXN001",\n      "timestamp": "2025-01-15T14:30:00Z",\n      "amount": 125.50,\n      "merchant_name": "Store Name",\n      "merchant_category": "retail",\n      "card_number": "1234",\n      "location": "City, State"\n    }\n  ]\n}`}
          className="w-full h-full font-mono text-sm p-4 rounded-lg border focus:ring-2 outline-none resize-none disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: 'var(--input-bg)',
            color: 'var(--text-primary)',
            borderColor: 'var(--border)',
            '--tw-ring-color': 'var(--primary)'
          } as React.CSSProperties}
          spellCheck={false}
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-4 mb-4 p-3 border rounded-lg" style={{ background: 'var(--error-bg)', borderColor: 'var(--error)' }}>
          <p className="text-sm font-medium" style={{ color: 'var(--error)' }}>
            {error instanceof Error ? error.message : 'An error occurred'}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="p-4 border-t flex gap-3" style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={onAnalyze}
          disabled={isLoading || !value.trim()}
          className="flex-1 font-semibold py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
          style={{
            background: 'var(--primary)',
            color: 'white',
            boxShadow: '0 4px 14px 0 rgba(var(--primary-rgb), 0.2)'
          }}
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
              <Search className="w-5 h-5" />
              Analyze Transactions
            </>
          )}
        </button>
        <button
          onClick={onClear}
          disabled={isLoading}
          className="px-6 py-3 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: 'var(--surface-hover)', color: 'var(--text-primary)' }}
        >
          Clear
        </button>
      </div>
    </div>
  );
}