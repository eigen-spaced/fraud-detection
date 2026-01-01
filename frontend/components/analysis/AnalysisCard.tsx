import { FraudAnalysis } from "@/lib/api"
import FormattedExplanation from "../FormattedExplanation"
import ShapWaterfall from "./ShapWaterfall"
import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

interface AnalysisCardProps {
  analysis: FraudAnalysis
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

export default function AnalysisCard({ analysis }: AnalysisCardProps) {
  const [showShap, setShowShap] = useState(false)
  const colors = classificationColors[analysis.classification]
  const riskPercentage = (analysis.risk_score * 100).toFixed(1)

  const hasShapData = analysis.shap_explanations && analysis.shap_explanations.length > 0

  return (
    <div className={`p-4 rounded-lg border ${colors.border} ${colors.bg}`}>
      <div className='flex items-start justify-between mb-3'>
        <div>
          <p className='text-navy-900 font-semibold text-sm font-mono'>
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

      {/* SHAP Explanations Section */}
      {hasShapData && (
        <div className='mt-4 pt-4 border-t border-navy-200'>
          <button
            onClick={() => setShowShap(!showShap)}
            className='flex items-center justify-between w-full text-left group'
          >
            <span className='text-sm font-semibold text-navy-700'>
              Model Feature Analysis
            </span>
            <div className='flex items-center gap-2'>
              <span className='text-xs text-navy-500'>
                {analysis.shap_explanations?.length || 0} features
              </span>
              {showShap ? (
                <ChevronUp className='w-4 h-4 text-navy-500 group-hover:text-navy-700 transition-colors' />
              ) : (
                <ChevronDown className='w-4 h-4 text-navy-500 group-hover:text-navy-700 transition-colors' />
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