import { FraudDetectionResponse, RefusalResponse, FraudAnalysis } from '@/lib/api';
import LLMExplanation from './LLMExplanation';

interface ResultsPanelProps {
  result: FraudDetectionResponse | RefusalResponse | null;
  isLoading: boolean;
  error: Error | null;
}

const classificationColors = {
  legitimate: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    badge: 'bg-green-100 text-green-800 border-green-300',
  },
  suspicious: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-700',
    badge: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  },
  fraudulent: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    badge: 'bg-red-100 text-red-800 border-red-300',
  },
  unknown: {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-700',
    badge: 'bg-gray-100 text-gray-800 border-gray-300',
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
          <p className="text-gray-900 font-semibold text-sm">
            {analysis.transaction_id}
          </p>
          <span className={`inline-block px-2 py-1 rounded-md text-xs font-medium mt-1 border ${colors.badge}`}>
            {analysis.classification.toUpperCase()}
          </span>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Risk Score</p>
          <p className={`text-2xl font-bold ${colors.text}`}>
            {riskPercentage}%
          </p>
        </div>
      </div>
      
      <p className="text-gray-700 text-sm mb-3">
        {analysis.explanation}
      </p>
      
      {analysis.risk_factors && analysis.risk_factors.length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-gray-500 mb-1">Risk Factors:</p>
          <ul className="space-y-1">
            {analysis.risk_factors.map((factor, idx) => (
              <li key={idx} className="text-xs text-gray-600 flex items-start gap-2">
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
    <div className="bg-white backdrop-blur-sm rounded-xl shadow-2xl border border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <span>📈</span>
          Analysis Results
        </h2>
        <p className="text-sm text-gray-600 mt-1">
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
            <p className="text-gray-700 text-lg font-medium">Analyzing transactions...</p>
            <p className="text-gray-500 text-sm">Running ML models and generating explanations</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="text-6xl">⚠️</div>
            <p className="text-red-600 text-lg font-medium">Analysis Failed</p>
            <p className="text-gray-600 text-sm text-center max-w-md">
              {error instanceof Error ? error.message : 'An unexpected error occurred'}
            </p>
          </div>
        ) : !result ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="text-6xl">🔍</div>
            <p className="text-gray-700 text-lg font-medium">Ready to Analyze</p>
            <p className="text-gray-500 text-sm max-w-md">
              Paste your transaction JSON in the input panel and click "Analyze Transactions" to get started
            </p>
          </div>
        ) : isRefusalResponse(result) ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="text-6xl">🚫</div>
            <p className="text-red-600 text-xl font-semibold">Request Refused</p>
            <div className="max-w-md space-y-3">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 font-medium mb-2">{result.reason}</p>
                {result.details && (
                  <p className="text-gray-700 text-sm">{result.details}</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Summary</h3>
              <p className="text-gray-700">{result.summary}</p>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Total</p>
                <p className="text-2xl font-bold text-gray-900">{result.total_transactions}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-xs text-green-600 mb-1">Legitimate</p>
                <p className="text-2xl font-bold text-green-700">{result.legitimate_count}</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-xs text-yellow-600 mb-1">Suspicious</p>
                <p className="text-2xl font-bold text-yellow-700">{result.suspicious_count}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-xs text-red-600 mb-1">Fraudulent</p>
                <p className="text-2xl font-bold text-red-700">{result.fraudulent_count}</p>
              </div>
            </div>

            {/* Average Risk Score */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Average Risk Score</p>
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-500"
                    style={{ width: `${result.average_risk_score * 100}%` }}
                  />
                </div>
                <span className="text-2xl font-bold text-gray-900">
                  {(result.average_risk_score * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Warnings */}
            {result.warnings && result.warnings.length > 0 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="text-sm font-semibold text-yellow-700 mb-2">⚠️ Warnings</h3>
                <ul className="space-y-1">
                  {result.warnings.map((warning, idx) => (
                    <li key={idx} className="text-yellow-700 text-sm">• {warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Individual Analyses */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Transaction Details</h3>
              <div className="space-y-3">
                {result.analyses.map((analysis) => (
                  <AnalysisCard key={analysis.transaction_id} analysis={analysis} />
                ))}
              </div>
            </div>

            {/* LLM Explanation Section */}
            <div className="border-t border-gray-200 pt-6">
              <LLMExplanation />
            </div>

            {/* Citations */}
            {result.citations && result.citations.length > 0 && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">📚 Citations</h3>
                <ul className="space-y-2">
                  {result.citations.map((citation, idx) => (
                    <li key={idx} className="text-sm">
                      <span className="text-gray-600">{citation.source}</span>
                      {citation.url && (
                        <a 
                          href={citation.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 ml-2 text-xs"
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