'use client';

import { TransactionData, categoryEmojis } from '@/lib/newSampleData';
import { useState } from 'react';

interface TransactionCardProps {
  transaction: TransactionData;
  index: number;
}

export default function TransactionCard({ transaction, index }: TransactionCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  
  const { transaction: txn, model_features, ground_truth } = transaction;
  
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
  
  // Determine risk level from model features
  const getRiskLevel = () => {
    const avgRatio = (
      model_features.amount_ratios.amt_per_card_avg_ratio_1h +
      model_features.amount_ratios.amt_per_card_avg_ratio_24h +
      model_features.amount_ratios.amt_per_card_avg_ratio_7d
    ) / 3;
    
    if (ground_truth.is_fraud) return 'high';
    if (avgRatio > 10 || txn.amount > 1000) return 'medium';
    return 'low';
  };
  
  const riskLevel = getRiskLevel();
  const riskColors = {
    low: 'border-green-600/30 bg-green-900/10',
    medium: 'border-yellow-600/30 bg-yellow-900/10',
    high: 'border-red-600/30 bg-red-900/10'
  };
  
  const riskBadgeColors = {
    low: 'bg-green-600/20 text-green-300 border-green-600/50',
    medium: 'bg-yellow-600/20 text-yellow-300 border-yellow-600/50',
    high: 'bg-red-600/20 text-red-300 border-red-600/50'
  };

  return (
    <div 
      className={`relative rounded-xl border ${riskColors[riskLevel]} backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.02] overflow-hidden`}
      style={{ 
        animationDelay: `${index * 100}ms`,
        animation: 'fadeIn 0.5s ease-out forwards',
        opacity: 0
      }}
    >
      {/* Risk indicator stripe */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${
        riskLevel === 'high' ? 'bg-red-500' : 
        riskLevel === 'medium' ? 'bg-yellow-500' : 
        'bg-green-500'
      }`} />
      
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{emoji}</div>
            <div>
              <h3 className="text-white font-semibold text-lg">
                {txn.merchant.name}
              </h3>
              <p className="text-slate-400 text-sm">
                {txn.merchant.category}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">
              ${txn.amount.toFixed(2)}
            </p>
            <span className={`inline-block px-2 py-1 rounded-md text-xs font-medium mt-1 border ${riskBadgeColors[riskLevel]}`}>
              {ground_truth.is_fraud ? 'FRAUD' : riskLevel.toUpperCase()}
            </span>
          </div>
        </div>
        
        {/* Date & Time */}
        <div className="flex items-center gap-2 text-slate-300 text-sm mb-3">
          <span>📅</span>
          <span>{formatDate(txn.timestamp)}</span>
          <span className="text-slate-600">•</span>
          <span>🕐</span>
          <span>{formatTime(txn.timestamp)}</span>
        </div>
        
        {/* Card & Account */}
        <div className="flex items-center gap-4 text-slate-300 text-sm mb-3">
          <span className="flex items-center gap-1.5">
            <span>💳</span>
            Card {txn.card.number}
          </span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1.5">
            <span>🏦</span>
            Account {txn.account.number}
          </span>
        </div>
        
        {/* Location */}
        <div className="flex items-center gap-2 text-slate-400 text-sm mb-4">
          <span>📍</span>
          <span>
            {txn.merchant.location.lat.toFixed(6)}, {txn.merchant.location.lng.toFixed(6)}
          </span>
        </div>
        
        {/* Transaction Details Button */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full py-2 px-4 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          {showDetails ? '▲' : '▼'} Transaction Details
        </button>
        
        {/* Expandable Details */}
        {showDetails && (
          <div className="mt-4 pt-4 border-t border-slate-700 space-y-3 animate-fadeIn">
            {/* Transaction ID */}
            <div>
              <p className="text-xs text-slate-400 mb-1">Transaction ID</p>
              <p className="text-xs text-slate-300 font-mono bg-slate-900/50 p-2 rounded">
                {txn.id}
              </p>
            </div>
            
            {/* Temporal Features */}
            <div>
              <p className="text-xs text-slate-400 mb-2 font-semibold">⏱️ Temporal Analysis</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-900/50 p-2 rounded">
                  <p className="text-xs text-slate-500">Last 1h</p>
                  <p className="text-sm text-slate-200 font-medium">
                    {model_features.temporal.trans_in_last_1h.toFixed(2)}
                  </p>
                </div>
                <div className="bg-slate-900/50 p-2 rounded">
                  <p className="text-xs text-slate-500">Last 24h</p>
                  <p className="text-sm text-slate-200 font-medium">
                    {model_features.temporal.trans_in_last_24h.toFixed(2)}
                  </p>
                </div>
                <div className="bg-slate-900/50 p-2 rounded">
                  <p className="text-xs text-slate-500">Last 7d</p>
                  <p className="text-sm text-slate-200 font-medium">
                    {model_features.temporal.trans_in_last_7d.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Amount Ratios */}
            <div>
              <p className="text-xs text-slate-400 mb-2 font-semibold">💰 Amount Ratios (Card Avg)</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-900/50 p-2 rounded">
                  <p className="text-xs text-slate-500">1h</p>
                  <p className="text-sm text-slate-200 font-medium">
                    {model_features.amount_ratios.amt_per_card_avg_ratio_1h.toFixed(2)}x
                  </p>
                </div>
                <div className="bg-slate-900/50 p-2 rounded">
                  <p className="text-xs text-slate-500">24h</p>
                  <p className="text-sm text-slate-200 font-medium">
                    {model_features.amount_ratios.amt_per_card_avg_ratio_24h.toFixed(2)}x
                  </p>
                </div>
                <div className="bg-slate-900/50 p-2 rounded">
                  <p className="text-xs text-slate-500">7d</p>
                  <p className="text-sm text-slate-200 font-medium">
                    {model_features.amount_ratios.amt_per_card_avg_ratio_7d.toFixed(2)}x
                  </p>
                </div>
              </div>
            </div>
            
            {/* Deviations */}
            <div>
              <p className="text-xs text-slate-400 mb-2 font-semibold">📊 Deviation Analysis</p>
              <div className="bg-slate-900/50 p-3 rounded">
                <p className="text-xs text-slate-500 mb-1">Amount diff from card median (7d)</p>
                <p className={`text-lg font-bold ${
                  model_features.deviations.amt_diff_from_card_median_7d > 0 
                    ? 'text-red-400' 
                    : 'text-green-400'
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