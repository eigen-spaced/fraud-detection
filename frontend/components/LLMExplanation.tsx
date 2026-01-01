"use client"

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { BarChart3, Sparkles } from "lucide-react"
import {
  api,
  LLMExplanationResponse,
  FraudAnalysis,
  Transaction,
} from "@/lib/api"

interface LLMExplanationProps {
  className?: string
  transactions?: Transaction[]
  analyses?: FraudAnalysis[]
}

export default function LLMExplanation({
  className = "",
  transactions,
  analyses,
}: LLMExplanationProps) {
  const [explanation, setExplanation] = useState<LLMExplanationResponse | null>(
    null
  )
  const [selectedTransactionId, setSelectedTransactionId] = useState<string>("")

  const llmMutation = useMutation({
    mutationFn: (transactionId: string) => {
      const transaction = transactions?.find(
        (t) => t.transaction_id === transactionId
      )
      const analysis = analyses?.find((a) => a.transaction_id === transactionId)

      if (!transaction || !analysis) {
        throw new Error("Transaction or analysis not found")
      }

      return api.explainTransaction({
        transaction_data: {
          transaction_id: transaction.transaction_id,
          amount: transaction.amount,
          merchant_name: transaction.merchant_name,
          merchant_category: transaction.merchant_category,
          location: transaction.location,
          timestamp: transaction.timestamp,
          card_number: transaction.card_number,
          cardholder_name: transaction.cardholder_name || null,
          device_fingerprint: transaction.device_fingerprint || null,
          ip_address: transaction.ip_address || null,
        },
        fraud_probability: analysis.risk_score,
        risk_factors: analysis.risk_factors,
        model_features: {
          classification: analysis.classification,
          risk_score: analysis.risk_score,
        },
      })
    },
    onSuccess: (data) => {
      setExplanation(data)
    },
    onError: (error) => {
      console.error("LLM explanation failed:", error)
    },
  })

  const handleExplainTransaction = () => {
    if (selectedTransactionId) {
      llmMutation.mutate(selectedTransactionId)
    }
  }

  const handleClear = () => {
    setExplanation(null)
    llmMutation.reset()
  }

  // Show message if no data available
  if (!transactions || !analyses || transactions.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="p-6 border rounded-lg text-center" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <BarChart3 className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>
            Analyze transactions first to get LLM explanations
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Transaction Selection */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedTransactionId}
            onChange={(e) => setSelectedTransactionId(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 text-sm"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
              '--tw-ring-color': 'var(--primary)'
            } as React.CSSProperties}
            disabled={llmMutation.isPending}
          >
            <option value="">Select a transaction to explain...</option>
            {analyses.map((analysis) => {
              const transaction = transactions.find(
                (t) => t.transaction_id === analysis.transaction_id
              )
              return (
                <option
                  key={analysis.transaction_id}
                  value={analysis.transaction_id}
                >
                  {transaction?.transaction_id} - ${transaction?.amount} -{" "}
                  {analysis.classification.toUpperCase()}
                </option>
              )
            })}
          </select>

          <button
            type="button"
            onClick={handleExplainTransaction}
            disabled={!selectedTransactionId || llmMutation.isPending}
            className="px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap"
            style={{ background: 'var(--primary)' }}
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
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Explain
              </>
            )}
          </button>
          {(explanation || llmMutation.error) && (
            <button
              onClick={handleClear}
              className="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ background: 'var(--surface-hover)', color: 'var(--text-primary)' }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {llmMutation.isPending && (
        <div className="p-6 border rounded-lg" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <svg
              className="animate-spin h-6 w-6"
              style={{ color: 'var(--primary)' }}
              viewBox="0 0 24 24"
            >
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
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <div>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                Generating LLM Explanation...
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                This may take a few seconds
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {llmMutation.error && (
        <div className="p-4 border rounded-lg" style={{ background: 'var(--error-bg)', borderColor: 'var(--error)' }}>
          <div className="flex items-start gap-3">
            <div className="text-xl" style={{ color: 'var(--error)' }}>⚠️</div>
            <div>
              <p className="font-medium" style={{ color: 'var(--error)' }}>
                Failed to Generate Explanation
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                {llmMutation.error instanceof Error
                  ? llmMutation.error.message
                  : "An unexpected error occurred"}
              </p>
              <details className="mt-2">
                <summary className="text-xs cursor-pointer hover:underline" style={{ color: 'var(--text-secondary)' }}>
                  View Details
                </summary>
                <pre className="mt-1 text-xs p-2 rounded overflow-x-auto" style={{ color: 'var(--error)', background: 'var(--error-bg)' }}>
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
          <div className="p-4 border rounded-lg" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                Transaction Analysis
              </h4>
              <span
                className="px-2 py-1 rounded text-xs font-medium border"
                style={{
                  background: explanation.risk_level === "HIGH"
                    ? 'var(--error-bg)'
                    : explanation.risk_level === "MEDIUM"
                      ? 'var(--warning-bg)'
                      : 'var(--success-bg)',
                  color: explanation.risk_level === "HIGH"
                    ? 'var(--error)'
                    : explanation.risk_level === "MEDIUM"
                      ? 'var(--warning)'
                      : 'var(--success)',
                  borderColor: explanation.risk_level === "HIGH"
                    ? 'var(--error)'
                    : explanation.risk_level === "MEDIUM"
                      ? 'var(--warning)'
                      : 'var(--success)'
                }}
              >
                {explanation.risk_level} RISK
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>Transaction ID</p>
                <p style={{ color: 'var(--text-primary)' }}>{explanation.transaction_id}</p>
              </div>
              <div>
                <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>Fraud Probability</p>
                <p className="font-bold" style={{ color: 'var(--text-primary)' }}>
                  {(explanation.fraud_probability * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* LLM Explanation */}
          <div className="p-4 border rounded-lg shadow-sm" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <h4 className="font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Sparkles className="w-5 h-5" />
              AI Explanation
            </h4>
            <div className="prose prose-sm max-w-none">
              <p className="leading-relaxed whitespace-pre-line" style={{ color: 'var(--text-secondary)' }}>
                {explanation.explanation}
              </p>
            </div>
          </div>

          {/* Metadata */}
          <div className="p-3 border rounded-lg" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="grid grid-cols-2 gap-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
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
  )
}
