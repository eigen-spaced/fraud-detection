"use client"

import { useState } from "react"
import type { TransactionData } from "@/lib/sampleData"

interface TransactionCardProps {
  transaction: TransactionData
  index: number
}

export default function TransactionCard({
  transaction,
  index,
}: TransactionCardProps) {
  const [showDetails, setShowDetails] = useState(false)

  const { transaction: txn, model_features } = transaction

  // Format date
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  // Format time
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  // Get category emoji
  // const emoji = categoryEmojis[txn.merchant.category] || categoryEmojis.Default;

  return (
    <div
      className="relative rounded-xl border transition-all duration-200 hover:shadow-lg overflow-hidden"
      style={{
        borderColor: "var(--border)",
        background: "var(--surface)",
        animationDelay: `${index * 100}ms`,
        animation: "fadeIn 0.5s ease-out forwards",
        opacity: 0,
        boxShadow:
          "0 1px 2px rgba(0, 0, 0, 0.04), 0 2px 4px rgba(0, 0, 0, 0.04)",
      }}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3
              className="font-semibold text-lg"
              style={{ color: "var(--text-primary)" }}
            >
              {txn.merchant.name}
            </h3>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {txn.merchant.category}
            </p>
          </div>
          <div className="text-right">
            <p
              className="text-2xl font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              ${txn.amount.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Date & Time */}
        <div
          className="flex items-center gap-2 text-sm mb-3"
          style={{ color: "var(--text-secondary)" }}
        >
          <span>{formatDate(txn.timestamp)}</span>
          <span style={{ color: "var(--text-tertiary)" }}>•</span>
          <span suppressHydrationWarning>{formatTime(txn.timestamp)}</span>
        </div>

        {/* Card & Account */}
        <div
          className="flex items-center gap-4 text-sm mb-3"
          style={{ color: "var(--text-secondary)" }}
        >
          <span>Card {txn.card.number}</span>
          <span style={{ color: "var(--text-tertiary)" }}>•</span>
          <span>Account {txn.account.number}</span>
        </div>

        {/* Location */}
        <div
          className="flex items-center gap-2 text-sm mb-4"
          style={{ color: "var(--text-secondary)" }}
        >
          <span>
            {txn.merchant.location.lat.toFixed(6)},{" "}
            {txn.merchant.location.lng.toFixed(6)}
          </span>
        </div>

        {/* Transaction Details Button */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
          style={{
            background: "var(--surface-hover)",
            color: "var(--text-primary)",
          }}
        >
          {showDetails ? "▲" : "▼"} Transaction Details
        </button>

        {/* Expandable Details */}
        {showDetails && (
          <div
            className="mt-4 pt-4 border-t space-y-3 transition-all duration-300"
            style={{ borderColor: "var(--border)" }}
          >
            {/* Transaction ID */}
            <div>
              <p
                className="text-xs mb-1"
                style={{ color: "var(--text-tertiary)" }}
              >
                Transaction ID
              </p>
              <p
                className="text-xs font-mono p-2 rounded"
                style={{
                  color: "var(--text-primary)",
                  background: "var(--surface-hover)",
                }}
              >
                {txn.id}
              </p>
            </div>

            {/* Temporal Features */}
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                Temporal Analysis
              </p>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 rounded" style={{ background: 'var(--surface-hover)' }}>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Last 1h</p>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {model_features.temporal.trans_in_last_1h.toFixed(2)}
                  </p>
                </div>
                <div className="p-2 rounded" style={{ background: 'var(--surface-hover)' }}>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Last 24h</p>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {model_features.temporal.trans_in_last_24h.toFixed(2)}
                  </p>
                </div>
                <div className="p-2 rounded" style={{ background: 'var(--surface-hover)' }}>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Last 7d</p>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {model_features.temporal.trans_in_last_7d.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Amount Ratios */}
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                Amount Ratios (Card Avg)
              </p>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 rounded" style={{ background: 'var(--surface-hover)' }}>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>1h</p>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {model_features.amount_ratios.amt_per_card_avg_ratio_1h.toFixed(
                      2
                    )}
                    x
                  </p>
                </div>
                <div className="p-2 rounded" style={{ background: 'var(--surface-hover)' }}>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>24h</p>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {model_features.amount_ratios.amt_per_card_avg_ratio_24h.toFixed(
                      2
                    )}
                    x
                  </p>
                </div>
                <div className="p-2 rounded" style={{ background: 'var(--surface-hover)' }}>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>7d</p>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {model_features.amount_ratios.amt_per_card_avg_ratio_7d.toFixed(
                      2
                    )}
                    x
                  </p>
                </div>
              </div>
            </div>

            {/* Deviations */}
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                Deviation Analysis
              </p>
              <div className="p-3 rounded" style={{ background: 'var(--surface-hover)' }}>
                <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Amount diff from card median (7d)
                </p>
                <p
                  className="text-lg font-bold"
                  style={{
                    color: model_features.deviations.amt_diff_from_card_median_7d > 0
                      ? 'var(--error)'
                      : 'var(--success)'
                  }}
                >
                  {model_features.deviations.amt_diff_from_card_median_7d > 0
                    ? "+"
                    : ""}
                  $
                  {model_features.deviations.amt_diff_from_card_median_7d.toFixed(
                    2
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
