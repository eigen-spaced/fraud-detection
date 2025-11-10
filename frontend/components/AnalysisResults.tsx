import {
  FraudDetectionResponse,
  RefusalResponse,
  FraudAnalysis,
} from "@/lib/api"
import FormattedExplanation from "./FormattedExplanation"

interface AnalysisResultsProps {
  result: FraudDetectionResponse | RefusalResponse | null
  isLoading: boolean
  error: Error | null
}

const classificationColors = {
  legitimate: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-300",
  },
  suspicious: {
    bg: "bg-golden-50",
    border: "border-golden-200",
    text: "text-golden-700",
    badge: "bg-golden-100 text-golden-800 border-golden-300",
  },
  fraudulent: {
    bg: "bg-coral-50",
    border: "border-coral-200",
    text: "text-coral-700",
    badge: "bg-coral-100 text-coral-800 border-coral-300",
  },
  unknown: {
    bg: "bg-navy-50",
    border: "border-navy-200",
    text: "text-navy-700",
    badge: "bg-navy-100 text-navy-800 border-navy-300",
  },
}

function isRefusalResponse(result: unknown): result is RefusalResponse {
  return result !== null && typeof result === "object" && "refused" in result
}

function AnalysisCard({ analysis }: { analysis: FraudAnalysis }) {
  const colors = classificationColors[analysis.classification]
  const riskPercentage = (analysis.risk_score * 100).toFixed(1)

  return (
    <div className={`p-4 rounded-lg border ${colors.border} ${colors.bg}`}>
      <div className='flex items-start justify-between mb-3'>
        <div>
          <p className='text-navy-900 font-semibold text-sm'>
            {analysis.transaction_id}
          </p>
          <span
            className={`inline-block px-2 py-1 rounded-md text-xs font-medium mt-1 border ${colors.badge}`}
          >
            {analysis.classification.toUpperCase()}
          </span>
        </div>
        <div className='text-right'>
          <p className='text-xs text-gray-500'>Risk Score</p>
          <p className={`text-2xl font-bold ${colors.text}`}>
            {riskPercentage}%
          </p>
        </div>
      </div>

      <FormattedExplanation
        explanation={analysis.explanation}
        className='mb-3'
      />

      {analysis.risk_factors && analysis.risk_factors.length > 0 && (
        <div className='mt-2'>
          <p className='text-xs text-navy-500 mb-1'>Risk Factors:</p>
          <ul className='space-y-1'>
            {analysis.risk_factors.map((factor, idx) => (
              <li
                key={idx}
                className='text-xs text-navy-600 flex items-start gap-2'
              >
                <span className={colors.text}>•</span>
                <span>{factor}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default function AnalysisResults({
  result,
  isLoading,
  error,
}: AnalysisResultsProps) {
  return (
    <div className='flex-1 overflow-y-auto p-4'>
      {isLoading ? (
        <div className='flex flex-col items-center justify-center h-full gap-4'>
          <svg
            className='animate-spin h-12 w-12 text-ocean-500'
            viewBox='0 0 24 24'
          >
            <circle
              className='opacity-25'
              cx='12'
              cy='12'
              r='10'
              stroke='currentColor'
              strokeWidth='4'
              fill='none'
            />
            <path
              className='opacity-75'
              fill='currentColor'
              d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
            />
          </svg>
          <p className='text-navy-700 text-lg font-medium'>
            Analyzing transactions...
          </p>
          <p className='text-navy-500 text-sm'>
            Running ML models and generating explanations
          </p>
        </div>
      ) : error ? (
        <div className='flex flex-col items-center justify-center h-full gap-4'>
          <div className='text-6xl'>⚠️</div>
          <p className='text-coral-600 text-lg font-medium'>Analysis Failed</p>
          <p className='text-navy-600 text-sm text-center max-w-md'>
            {error instanceof Error
              ? error.message
              : "An unexpected error occurred"}
          </p>
        </div>
      ) : !result ? (
        <div className='flex flex-col items-center justify-center h-full gap-4 text-center'>
          <div className='text-6xl'>🔍</div>
          <p className='text-navy-700 text-lg font-medium'>Ready to Analyze</p>
          <p className='text-navy-500 text-sm max-w-md'>
            Paste your transaction JSON in the input panel and click
            &ldquo;Analyze Transactions&rdquo; to get started
          </p>
        </div>
      ) : isRefusalResponse(result) ? (
        <div className='flex flex-col items-center justify-center h-full gap-4'>
          <div className='text-6xl'>🚫</div>
          <p className='text-coral-600 text-xl font-semibold'>
            Request Refused
          </p>
          <div className='max-w-md space-y-3'>
            <div className='p-4 bg-coral-50 border border-coral-200 rounded-lg'>
              <p className='text-coral-700 font-medium mb-2'>{result.reason}</p>
              {result.details && (
                <p className='text-navy-700 text-sm'>{result.details}</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className='space-y-6'>
          {/* Summary */}
          <div className='p-4 bg-navy-50 rounded-lg border border-navy-200'>
            <h3 className='text-lg font-semibold text-navy-900 mb-2'>
              Summary
            </h3>
            <p className='text-navy-700'>{result.summary}</p>
          </div>

          {/* Statistics */}
          <div className='grid grid-cols-2 lg:grid-cols-4 gap-3'>
            <div className='p-3 bg-navy-50 rounded-lg border border-navy-200'>
              <p className='text-xs text-navy-500 mb-1'>Total</p>
              <p className='text-2xl font-bold text-navy-900'>
                {result.total_transactions}
              </p>
            </div>
            <div className='p-3 bg-emerald-50 rounded-lg border border-emerald-200'>
              <p className='text-xs text-emerald-600 mb-1'>Legitimate</p>
              <p className='text-2xl font-bold text-emerald-700'>
                {result.legitimate_count}
              </p>
            </div>
            <div className='p-3 bg-golden-50 rounded-lg border border-golden-200'>
              <p className='text-xs text-golden-600 mb-1'>Suspicious</p>
              <p className='text-2xl font-bold text-golden-700'>
                {result.suspicious_count}
              </p>
            </div>
            <div className='p-3 bg-coral-50 rounded-lg border border-coral-200'>
              <p className='text-xs text-coral-600 mb-1'>Fraudulent</p>
              <p className='text-2xl font-bold text-coral-700'>
                {result.fraudulent_count}
              </p>
            </div>
          </div>

          {/* Average Risk Score */}
          <div className='p-4 bg-navy-50 rounded-lg border border-navy-200'>
            <p className='text-sm text-navy-600 mb-2'>Average Risk Score</p>
            <div className='flex items-center gap-4'>
              <div className='flex-1 bg-navy-200 rounded-full h-3 overflow-hidden'>
                <div
                  className='h-full bg-gradient-to-r from-emerald-500 via-golden-500 to-coral-500 transition-all duration-500'
                  style={{ width: `${result.average_risk_score * 100}%` }}
                />
              </div>
              <span className='text-2xl font-bold text-navy-900'>
                {(result.average_risk_score * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Warnings */}
          {result.warnings && result.warnings.length > 0 && (
            <div className='p-4 bg-golden-50 border border-golden-200 rounded-lg'>
              <h3 className='text-sm font-semibold text-golden-700 mb-2'>
                ⚠️ Warnings
              </h3>
              <ul className='space-y-1'>
                {result.warnings.map((warning) => (
                  <li key={warning} className='text-golden-700 text-sm'>
                    • {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Individual Analyses */}
          <div>
            <h3 className='text-lg font-semibold text-navy-900 mb-3'>
              Transaction Details
            </h3>
            <div className='space-y-3'>
              {result.analyses.map((analysis) => (
                <AnalysisCard
                  key={analysis.transaction_id}
                  analysis={analysis}
                />
              ))}
            </div>
          </div>

          {/* Citations */}
          {result.citations && result.citations.length > 0 && (
            <div className='p-4 bg-navy-50 rounded-lg border border-navy-200'>
              <h3 className='text-sm font-semibold text-navy-700 mb-2'>
                📚 Citations
              </h3>
              <ul className='space-y-2'>
                {result.citations.map((citation, idx) => (
                  <li key={idx} className='text-sm'>
                    <span className='text-navy-600'>{citation.source}</span>
                    {citation.url && (
                      <a
                        href={citation.url}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-ocean-600 hover:text-ocean-700 ml-2 text-xs'
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
  )
}
