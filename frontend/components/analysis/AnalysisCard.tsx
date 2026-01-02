import { ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"
import type { FraudAnalysis } from "@/lib/api"
import FormattedExplanation from "./FormattedExplanation"
import ShapWaterfall from "./ShapWaterfall"

interface AnalysisCardProps {
  analysis: FraudAnalysis
}

// Get CSS variable colors based on classification
const getClassificationStyles = (classification: string) => {
  const styleMap: Record<string, { bg: string; border: string; text: string }> = {
    legitimate: { bg: 'var(--success-bg)', border: 'var(--success-border)', text: 'var(--success)' },
    suspicious: { bg: 'var(--warning-bg)', border: 'var(--warning-border)', text: 'var(--warning)' },
    fraudulent: { bg: 'var(--critical-bg)', border: 'var(--critical-border)', text: 'var(--critical)' },
    unknown: { bg: 'var(--info-bg)', border: 'var(--info-border)', text: 'var(--info)' },
  }
  return styleMap[classification] || styleMap.unknown
}

export default function AnalysisCard({ analysis }: AnalysisCardProps) {
  const [showShap, setShowShap] = useState(false)
  const styles = getClassificationStyles(analysis.classification)
  const riskPercentage = (analysis.risk_score * 100).toFixed(1)

  const hasShapData = analysis.shap_explanations && analysis.shap_explanations.length > 0

  return (
    <div className="p-4 rounded-lg border" style={{ background: styles.bg, borderColor: styles.border }}>
      <div className='flex items-start justify-between mb-3'>
        <div>
          <p className='font-semibold text-sm font-mono' style={{ color: 'var(--text-primary)' }}>
            {analysis.transaction_id}
          </p>
          <span
            className="inline-block px-2 py-1 rounded-md text-xs font-medium mt-1 border"
            style={{ background: styles.bg, color: styles.text, borderColor: styles.border }}
          >
            {analysis.classification.toUpperCase()}
          </span>
        </div>
        <div className='text-right'>
          <p className='text-xs' style={{ color: 'var(--text-secondary)' }}>Risk Score</p>
          <p className='text-2xl font-bold' style={{ color: styles.text }}>
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
                <span style={{ color: styles.text }}>•</span>
                <span>{factor}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* SHAP Explanations Section */}
      {hasShapData && (
        <div className='mt-4 pt-4 border-t' style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={() => setShowShap(!showShap)}
            className='flex items-center justify-between w-full text-left group'
          >
            <span className='text-sm font-semibold' style={{ color: 'var(--text-primary)' }}>
              Model Feature Analysis
            </span>
            <div className='flex items-center gap-2'>
              <span className='text-xs' style={{ color: 'var(--text-secondary)' }}>
                {analysis.shap_explanations?.length || 0} features
              </span>
              {showShap ? (
                <ChevronUp className='w-4 h-4 transition-colors' style={{ color: 'var(--text-secondary)' }} />
              ) : (
                <ChevronDown className='w-4 h-4 transition-colors' style={{ color: 'var(--text-secondary)' }} />
              )}
            </div>
          </button>

          {showShap && (
            <div className='mt-3'>
              <ShapWaterfall
                explanations={analysis.shap_explanations || []}
                prediction={analysis.risk_score}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
