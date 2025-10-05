import { FraudDetectionResponse, RefusalResponse, FraudAnalysis } from '@/lib/api';

interface ResultsPanelProps {
  result: FraudDetectionResponse | RefusalResponse | null;
  isLoading: boolean;
  error: Error | null;
}

const classificationColors = {
  legitimate: {
    bg: 'bg-green-900/20',
    border: 'border-green-700/50',
    text: 'text-green-400',
    badge: 'bg-green-600/30 text-green-300 border-green-600',
  },
  suspicious: {
    bg: 'bg-yellow-900/20',
    border: 'border-yellow-700/50',
    text: 'text-yellow-400',
    badge: 'bg-yellow-600/30 text-yellow-300 border-yellow-600',
  },
  fraudulent: {
    bg: 'bg-red-900/20',
    border: 'border-red-700/50',
    text: 'text-red-400',
    badge: 'bg-red-600/30 text-red-300 border-red-600',
  },
  unknown: {
    bg: 'bg-gray-900/20',
    border: 'border-gray-700/50',
    text: 'text-gray-400',
    badge: 'bg-gray-600/30 text-gray-300 border-gray-600',
  },
};

function isRefusalResponse(result: any): result is RefusalResponse {
  return result && 'refused' in result;
}

function AnalysisCard({ analysis }: { analysis: FraudAnalysis }) {
  const colors = classificationColors[analysis.classification];
  const riskPercentage = (analysis.risk_score * 100).toFixed(1);

  return (
    <div className={`p-4 rounded-lg border ${colors.border} ${colors.bg}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-white font-semibold text-sm">
            {analysis.transaction_id}
          </p>
          <span className={`inline-block px-2 py-1 rounded-md text-xs font-medium mt-1 border ${colors.badge}`}>
            {analysis.classification.toUpperCase()}
          </span>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Risk Score</p>
          <p className={`text-2xl font-bold ${colors.text}`}>
            {riskPercentage}%
          </p>
        </div>
      </div>
      
      <p className="text-slate-300 text-sm mb-3">
        {analysis.explanation}
      </p>
      
      {analysis.risk_factors && analysis.risk_factors.length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-slate-400 mb-1">Risk Factors:</p>
          <ul className="space-y-1">
            {analysis.risk_factors.map((factor, idx) => (
              <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                <span className={colors.text}>•</span>
                <span>{factor}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function ResultsPanel({ result, isLoading, error }: ResultsPanelProps) {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-2xl border border-slate-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <span>📊</span>
          Analysis Results
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          AI-powered fraud detection summary
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <svg className="animate-spin h-12 w-12 text-blue-500" viewBox="0 0 24 24">
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
            <p className="text-slate-300 text-lg font-medium">Analyzing transactions...</p>
            <p className="text-slate-500 text-sm">Running ML models and generating explanations</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="text-6xl">⚠️</div>
            <p className="text-red-400 text-lg font-medium">Analysis Failed</p>
            <p className="text-slate-400 text-sm text-center max-w-md">
              {error instanceof Error ? error.message : 'An unexpected error occurred'}
            </p>
          </div>
        ) : !result ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="text-6xl">🔍</div>
            <p className="text-slate-300 text-lg font-medium">Ready to Analyze</p>
            <p className="text-slate-500 text-sm max-w-md">
              Paste your transaction JSON in the input panel and click &quot;Analyze Transactions&quot; to get started
            </p>
          </div>
        ) : isRefusalResponse(result) ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="text-6xl">🚫</div>
            <p className="text-red-400 text-xl font-semibold">Request Refused</p>
            <div className="max-w-md space-y-3">
              <div className="p-4 bg-red-900/20 border border-red-700/50 rounded-lg">
                <p className="text-red-300 font-medium mb-2">{result.reason}</p>
                {result.details && (
                  <p className="text-slate-300 text-sm">{result.details}</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary */}
            <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
              <h3 className="text-lg font-semibold text-white mb-2">Summary</h3>
              <p className="text-slate-200">{result.summary}</p>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-700/30 rounded-lg border border-slate-600">
                <p className="text-xs text-slate-400 mb-1">Total</p>
                <p className="text-2xl font-bold text-white">{result.total_transactions}</p>
              </div>
              <div className="p-3 bg-green-900/20 rounded-lg border border-green-700/50">
                <p className="text-xs text-green-400 mb-1">Legitimate</p>
                <p className="text-2xl font-bold text-green-300">{result.legitimate_count}</p>
              </div>
              <div className="p-3 bg-yellow-900/20 rounded-lg border border-yellow-700/50">
                <p className="text-xs text-yellow-400 mb-1">Suspicious</p>
                <p className="text-2xl font-bold text-yellow-300">{result.suspicious_count}</p>
              </div>
              <div className="p-3 bg-red-900/20 rounded-lg border border-red-700/50">
                <p className="text-xs text-red-400 mb-1">Fraudulent</p>
                <p className="text-2xl font-bold text-red-300">{result.fraudulent_count}</p>
              </div>
            </div>

            {/* Average Risk Score */}
            <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
              <p className="text-sm text-slate-400 mb-2">Average Risk Score</p>
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-slate-600 rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-500"
                    style={{ width: `${result.average_risk_score * 100}%` }}
                  />
                </div>
                <span className="text-2xl font-bold text-white">
                  {(result.average_risk_score * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Warnings */}
            {result.warnings && result.warnings.length > 0 && (
              <div className="p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                <h3 className="text-sm font-semibold text-yellow-400 mb-2">⚠️ Warnings</h3>
                <ul className="space-y-1">
                  {result.warnings.map((warning, idx) => (
                    <li key={idx} className="text-yellow-300 text-sm">• {warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Individual Analyses */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Transaction Details</h3>
              <div className="space-y-3">
                {result.analyses.map((analysis) => (
                  <AnalysisCard key={analysis.transaction_id} analysis={analysis} />
                ))}
              </div>
            </div>

            {/* Citations */}
            {result.citations && result.citations.length > 0 && (
              <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                <h3 className="text-sm font-semibold text-slate-300 mb-2">📚 Citations</h3>
                <ul className="space-y-2">
                  {result.citations.map((citation, idx) => (
                    <li key={idx} className="text-sm">
                      <span className="text-slate-400">{citation.source}</span>
                      {citation.url && (
                        <a 
                          href={citation.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 ml-2 text-xs"
                        >
                          🔗 View Source
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}