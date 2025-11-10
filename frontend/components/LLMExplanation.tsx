"use client"

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
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
        <div className="p-6 bg-navy-50 border border-navy-200 rounded-lg text-center">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-navy-600">
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
            className="flex-1 px-3 py-2 border border-navy-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 text-sm"
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
            className="px-4 py-2 bg-ocean-600 hover:bg-ocean-700 disabled:bg-ocean-400 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:cursor-not-allowed whitespace-nowrap"
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
                Explain
              </>
            )}
          </button>
          {(explanation || llmMutation.error) && (
            <button
              onClick={handleClear}
              className="px-3 py-2 bg-navy-200 hover:bg-navy-300 text-navy-700 rounded-lg text-sm font-medium transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {llmMutation.isPending && (
        <div className="p-6 bg-ocean-50 border border-ocean-200 rounded-lg">
          <div className="flex items-center gap-3">
            <svg
              className="animate-spin h-6 w-6 text-ocean-600"
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
              <p className="text-ocean-800 font-medium">
                Generating LLM Explanation...
              </p>
              <p className="text-ocean-600 text-sm">
                This may take a few seconds
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {llmMutation.error && (
        <div className="p-4 bg-coral-50 border border-coral-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="text-coral-500 text-xl">⚠️</div>
            <div>
              <p className="text-coral-800 font-medium">
                Failed to Generate Explanation
              </p>
              <p className="text-coral-600 text-sm mt-1">
                {llmMutation.error instanceof Error
                  ? llmMutation.error.message
                  : "An unexpected error occurred"}
              </p>
              <details className="mt-2">
                <summary className="text-coral-600 text-xs cursor-pointer hover:underline">
                  View Details
                </summary>
                <pre className="mt-1 text-xs text-coral-500 bg-coral-100 p-2 rounded overflow-x-auto">
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
          <div className="p-4 bg-ocean-50 border border-ocean-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-ocean-900">
                Transaction Analysis
              </h4>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  explanation.risk_level === "HIGH"
                    ? "bg-coral-100 text-coral-800 border border-coral-200"
                    : explanation.risk_level === "MEDIUM"
                      ? "bg-golden-100 text-golden-800 border border-golden-200"
                      : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                }`}
              >
                {explanation.risk_level} RISK
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-ocean-600 font-medium">Transaction ID</p>
                <p className="text-ocean-800">{explanation.transaction_id}</p>
              </div>
              <div>
                <p className="text-ocean-600 font-medium">Fraud Probability</p>
                <p className="text-ocean-800 font-bold">
                  {(explanation.fraud_probability * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* LLM Explanation */}
          <div className="p-4 bg-white border border-navy-200 rounded-lg shadow-sm">
            <h4 className="font-semibold text-navy-900 mb-3 flex items-center gap-2">
              <span>🧠</span>
              AI Explanation
            </h4>
            <div className="prose prose-sm max-w-none">
              <p className="text-navy-700 leading-relaxed whitespace-pre-line">
                {explanation.explanation}
              </p>
            </div>
          </div>

          {/* Metadata */}
          <div className="p-3 bg-navy-50 border border-navy-200 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-xs text-navy-600">
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
