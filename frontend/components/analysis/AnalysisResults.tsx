import type {
  FraudAnalysis,
  FraudDetectionResponse,
  RefusalResponse,
} from "@/lib/api"
import FormattedExplanation from "./FormattedExplanation"

interface AnalysisResultsProps {
  result: FraudDetectionResponse | RefusalResponse | null
  isLoading: boolean
  error: Error | null
}

function isRefusalResponse(result: unknown): result is RefusalResponse {
  return result !== null && typeof result === "object" && "refused" in result
}

function AnalysisCard({ analysis }: { analysis: FraudAnalysis }) {
  const riskPercentage = (analysis.risk_score * 100).toFixed(1)

  // Map classification to CSS variables
  const getClassificationStyles = (classification: string) => {
    switch (classification) {
      case 'legitimate':
        return {
          borderColor: 'var(--success)',
          accentColor: 'var(--success)',
          badgeBg: 'var(--success-bg)',
        }
      case 'suspicious':
        return {
          borderColor: 'var(--warning)',
          accentColor: 'var(--warning)',
          badgeBg: 'var(--warning-bg)',
        }
      case 'fraudulent':
        return {
          borderColor: 'var(--error)',
          accentColor: 'var(--error)',
          badgeBg: 'var(--error-bg)',
        }
      default:
        return {
          borderColor: 'var(--border)',
          accentColor: 'var(--text-secondary)',
          badgeBg: 'var(--surface-hover)',
        }
    }
  }

  const styles = getClassificationStyles(analysis.classification)

  return (
    <div
      className='p-4 rounded-lg border-l-4'
      style={{
        background: 'var(--surface)',
        borderLeftColor: styles.borderColor,
        border: '1px solid var(--border)',
        borderLeftWidth: '4px',
        borderLeftStyle: 'solid'
      }}
    >
      <div className='flex items-start justify-between mb-3'>
        <div>
          <p className='font-semibold text-sm' style={{ color: 'var(--text-primary)' }}>
            {analysis.transaction_id}
          </p>
          <span
            className='inline-block px-2 py-1 rounded-md text-xs font-medium mt-1'
            style={{ background: styles.badgeBg, color: styles.accentColor }}
          >
            {analysis.classification.toUpperCase()}
          </span>
        </div>
        <div className='text-right'>
          <p className='text-xs' style={{ color: 'var(--text-tertiary)' }}>Risk Score</p>
          <p className='text-2xl font-bold' style={{ color: styles.accentColor }}>
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
          <p className='text-xs mb-1' style={{ color: 'var(--text-secondary)' }}>Risk Factors:</p>
          <ul className='space-y-1'>
            {analysis.risk_factors.map((factor, idx) => (
              <li
                key={idx}
                className='text-xs flex items-start gap-2'
                style={{ color: 'var(--text-secondary)' }}
              >
                <span style={{ color: styles.accentColor }}>•</span>
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
            className='animate-spin h-12 w-12'
            style={{ color: 'var(--primary)' }}
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
          <p className='text-lg font-medium' style={{ color: 'var(--text-primary)' }}>
            Analyzing transactions...
          </p>
          <p className='text-sm' style={{ color: 'var(--text-secondary)' }}>
            Running ML models and generating explanations
          </p>
        </div>
      ) : error ? (
        <div className='flex flex-col items-center justify-center h-full gap-4'>
          <div style={{ color: 'var(--error)' }}>
            <svg className='w-16 h-16' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' />
            </svg>
          </div>
          <p className='text-lg font-medium' style={{ color: 'var(--error)' }}>Analysis Failed</p>
          <p className='text-sm text-center max-w-md' style={{ color: 'var(--text-secondary)' }}>
            {error instanceof Error
              ? error.message
              : "An unexpected error occurred"}
          </p>
        </div>
      ) : !result ? (
        <div className='flex flex-col items-center justify-center h-full gap-4 text-center'>
          <div style={{ color: 'var(--text-tertiary)' }}>
            <svg className='w-16 h-16' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
            </svg>
          </div>
          <p className='text-lg font-medium' style={{ color: 'var(--text-primary)' }}>Ready to Analyze</p>
          <p className='text-sm max-w-md' style={{ color: 'var(--text-secondary)' }}>
            Paste your transaction JSON in the input panel and click
            &ldquo;Analyze Transactions&rdquo; to get started
          </p>
        </div>
      ) : isRefusalResponse(result) ? (
        <div className='flex flex-col items-center justify-center h-full gap-4'>
          <div style={{ color: 'var(--error)' }}>
            <svg className='w-16 h-16' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' />
            </svg>
          </div>
          <p className='text-xl font-semibold' style={{ color: 'var(--error)' }}>
            Request Refused
          </p>
          <div className='max-w-md space-y-3'>
            <div className='p-4 rounded-lg border' style={{ background: 'var(--error-bg)', borderColor: 'var(--error)' }}>
              <p className='font-medium mb-2' style={{ color: 'var(--error)' }}>{result.reason}</p>
              {result.details && (
                <p className='text-sm' style={{ color: 'var(--text-primary)' }}>{result.details}</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className='space-y-6'>
          {/* Summary */}
          <div className='p-4 rounded-lg border' style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <h3 className='text-lg font-semibold mb-2' style={{ color: 'var(--text-primary)' }}>
              Summary
            </h3>
            <p style={{ color: 'var(--text-secondary)' }}>{result.summary}</p>
          </div>

          {/* Statistics */}
          <div className='grid grid-cols-2 lg:grid-cols-4 gap-3'>
            <div className='p-3 rounded-lg border' style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <p className='text-xs mb-1' style={{ color: 'var(--text-secondary)' }}>Total</p>
              <p className='text-2xl font-bold' style={{ color: 'var(--text-primary)' }}>
                {result.total_transactions}
              </p>
            </div>
            <div className='p-3 rounded-lg border' style={{ background: 'var(--success-bg)', borderColor: 'var(--success)' }}>
              <p className='text-xs mb-1' style={{ color: 'var(--success)' }}>Legitimate</p>
              <p className='text-2xl font-bold' style={{ color: 'var(--success)' }}>
                {result.legitimate_count}
              </p>
            </div>
            <div className='p-3 rounded-lg border' style={{ background: 'var(--warning-bg)', borderColor: 'var(--warning)' }}>
              <p className='text-xs mb-1' style={{ color: 'var(--warning)' }}>Suspicious</p>
              <p className='text-2xl font-bold' style={{ color: 'var(--warning)' }}>
                {result.suspicious_count}
              </p>
            </div>
            <div className='p-3 rounded-lg border' style={{ background: 'var(--error-bg)', borderColor: 'var(--error)' }}>
              <p className='text-xs mb-1' style={{ color: 'var(--error)' }}>Fraudulent</p>
              <p className='text-2xl font-bold' style={{ color: 'var(--error)' }}>
                {result.fraudulent_count}
              </p>
            </div>
          </div>

          {/* Average Risk Score */}
          <div className='p-4 rounded-lg border' style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <p className='text-sm mb-2' style={{ color: 'var(--text-secondary)' }}>Average Risk Score</p>
            <div className='flex items-center gap-4'>
              <div className='flex-1 rounded-full h-3 overflow-hidden' style={{ background: 'var(--border)' }}>
                <div
                  className='h-full transition-all duration-500'
                  style={{
                    width: `${result.average_risk_score * 100}%`,
                    background: 'linear-gradient(to right, var(--success), var(--warning), var(--error))'
                  }}
                />
              </div>
              <span className='text-2xl font-bold' style={{ color: 'var(--text-primary)' }}>
                {(result.average_risk_score * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Warnings */}
          {result.warnings && result.warnings.length > 0 && (
            <div className='p-4 border rounded-lg' style={{ background: 'var(--warning-bg)', borderColor: 'var(--warning)' }}>
              <h3 className='text-sm font-semibold mb-2' style={{ color: 'var(--warning)' }}>
                Warnings
              </h3>
              <ul className='space-y-1'>
                {result.warnings.map((warning) => (
                  <li key={warning} className='text-sm' style={{ color: 'var(--warning)' }}>
                    • {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Individual Analyses */}
          <div>
            <h3 className='text-lg font-semibold mb-3' style={{ color: 'var(--text-primary)' }}>
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
            <div className='p-4 rounded-lg border' style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <h3 className='text-sm font-semibold mb-2' style={{ color: 'var(--text-primary)' }}>
                Citations
              </h3>
              <ul className='space-y-2'>
                {result.citations.map((citation, idx) => (
                  <li key={idx} className='text-sm'>
                    <span style={{ color: 'var(--text-secondary)' }}>{citation.source}</span>
                    {citation.url && (
                      <a
                        href={citation.url}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='ml-2 text-xs underline hover:opacity-80 transition-opacity'
                        style={{ color: 'var(--primary)' }}
                      >
                        View Source →
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
