'use client';

import { TransactionData, categoryEmojis } from '@/lib/sampleData';
import { useState } from 'react';

interface TransactionCardProps {
  transaction: TransactionData;
  index: number;
}

export default function TransactionCard({ transaction, index }: TransactionCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  
  const { transaction: txn, model_features } = transaction;
  
  // Format date
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };
  
  // Format time
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };
  
  // Get category emoji
  const emoji = categoryEmojis[txn.merchant.category] || categoryEmojis.Default;
  

  return (
    <div 
      className="relative rounded-xl border border-navy-200 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.02] overflow-hidden bg-white"
      style={{ 
        animationDelay: `${index * 100}ms`,
        animation: 'fadeIn 0.5s ease-out forwards',
        opacity: 0
      }}
    >
      
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{emoji}</div>
            <div>
              <h3 className="text-navy-900 font-semibold text-lg">
                {txn.merchant.name}
              </h3>
              <p className="text-navy-600 text-sm">
                {txn.merchant.category}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-navy-900">
              ${txn.amount.toFixed(2)}
            </p>
          </div>
        </div>
        
        {/* Date & Time */}
        <div className="flex items-center gap-2 text-navy-600 text-sm mb-3">
          <span>📅</span>
          <span>{formatDate(txn.timestamp)}</span>
          <span className="text-navy-400">•</span>
          <span>🕐</span>
          <span>{formatTime(txn.timestamp)}</span>
        </div>
        
        {/* Card & Account */}
        <div className="flex items-center gap-4 text-navy-600 text-sm mb-3">
          <span className="flex items-center gap-1.5">
            <span>💳</span>
            Card {txn.card.number}
          </span>
          <span className="text-navy-400">•</span>
          <span className="flex items-center gap-1.5">
            <span>🏦</span>
            Account {txn.account.number}
          </span>
        </div>
        
        {/* Location */}
        <div className="flex items-center gap-2 text-navy-600 text-sm mb-4">
          <span>📍</span>
          <span>
            {txn.merchant.location.lat.toFixed(6)}, {txn.merchant.location.lng.toFixed(6)}
          </span>
        </div>
        
        {/* Transaction Details Button */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full py-2 px-4 bg-navy-100 hover:bg-navy-200 text-navy-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          {showDetails ? '▲' : '▼'} Transaction Details
        </button>
        
        {/* Expandable Details */}
        {showDetails && (
          <div className="mt-4 pt-4 border-t border-navy-200 space-y-3 animate-fadeIn">
            {/* Transaction ID */}
            <div>
              <p className="text-xs text-navy-500 mb-1">Transaction ID</p>
              <p className="text-xs text-navy-700 font-mono bg-navy-100 p-2 rounded">
                {txn.id}
              </p>
            </div>
            
            {/* Temporal Features */}
            <div>
              <p className="text-xs text-navy-500 mb-2 font-semibold">⏱️ Temporal Analysis</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-navy-100 p-2 rounded">
                  <p className="text-xs text-navy-500">Last 1h</p>
                  <p className="text-sm text-navy-800 font-medium">
                    {model_features.temporal.trans_in_last_1h.toFixed(2)}
                  </p>
                </div>
                <div className="bg-navy-100 p-2 rounded">
                  <p className="text-xs text-navy-500">Last 24h</p>
                  <p className="text-sm text-navy-800 font-medium">
                    {model_features.temporal.trans_in_last_24h.toFixed(2)}
                  </p>
                </div>
                <div className="bg-navy-100 p-2 rounded">
                  <p className="text-xs text-navy-500">Last 7d</p>
                  <p className="text-sm text-navy-800 font-medium">
                    {model_features.temporal.trans_in_last_7d.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Amount Ratios */}
            <div>
              <p className="text-xs text-navy-500 mb-2 font-semibold">💰 Amount Ratios (Card Avg)</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-navy-100 p-2 rounded">
                  <p className="text-xs text-navy-500">1h</p>
                  <p className="text-sm text-navy-800 font-medium">
                    {model_features.amount_ratios.amt_per_card_avg_ratio_1h.toFixed(2)}x
                  </p>
                </div>
                <div className="bg-navy-100 p-2 rounded">
                  <p className="text-xs text-navy-500">24h</p>
                  <p className="text-sm text-navy-800 font-medium">
                    {model_features.amount_ratios.amt_per_card_avg_ratio_24h.toFixed(2)}x
                  </p>
                </div>
                <div className="bg-navy-100 p-2 rounded">
                  <p className="text-xs text-navy-500">7d</p>
                  <p className="text-sm text-navy-800 font-medium">
                    {model_features.amount_ratios.amt_per_card_avg_ratio_7d.toFixed(2)}x
                  </p>
                </div>
              </div>
            </div>
            
            {/* Deviations */}
            <div>
              <p className="text-xs text-navy-500 mb-2 font-semibold">📈 Deviation Analysis</p>
              <div className="bg-navy-100 p-3 rounded">
                <p className="text-xs text-navy-500 mb-1">Amount diff from card median (7d)</p>
                <p className={`text-lg font-bold ${
                  model_features.deviations.amt_diff_from_card_median_7d > 0 
                    ? 'text-coral-600' 
                    : 'text-emerald-600'
                }`}>
                  {model_features.deviations.amt_diff_from_card_median_7d > 0 ? '+' : ''}
                  ${model_features.deviations.amt_diff_from_card_median_7d.toFixed(2)}
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
  );
}