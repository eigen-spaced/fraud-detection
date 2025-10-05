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
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-2xl border border-slate-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <span>📝</span>
          Transaction Input
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Paste JSON transaction data below
        </p>
      </div>

      {/* Sample Data Buttons */}
      <div className="p-4 border-b border-slate-700 space-y-2">
        <p className="text-xs text-slate-400 mb-2">Load sample data:</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onLoadSample('legitimate')}
            disabled={isLoading}
            className="px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-green-600/30"
          >
            ✓ Legitimate
          </button>
          <button
            onClick={() => onLoadSample('suspicious')}
            disabled={isLoading}
            className="px-3 py-1.5 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-yellow-600/30"
          >
            ⚠️ Suspicious
          </button>
          <button
            onClick={() => onLoadSample('fraudulent')}
            disabled={isLoading}
            className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-red-600/30"
          >
            ⛔ Fraudulent
          </button>
          <button
            onClick={() => onLoadSample('mixed')}
            disabled={isLoading}
            className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-blue-600/30"
          >
            🔀 Mixed
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
          className="w-full h-full bg-slate-900/50 text-slate-200 font-mono text-sm p-4 rounded-lg border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none disabled:opacity-50 disabled:cursor-not-allowed"
          spellCheck={false}
        />
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
          onClick={onAnalyze}
          disabled={isLoading || !value.trim()}
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
              Analyze Transactions
            </>
          )}
        </button>
        <button
          onClick={onClear}
          disabled={isLoading}
          className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Clear
        </button>
      </div>
    </div>
  );
}