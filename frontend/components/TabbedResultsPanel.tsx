'use client';

import { useState } from 'react';
import { FraudDetectionResponse, RefusalResponse, Transaction } from '@/lib/api';
import AnalysisResults from './AnalysisResults';
import LLMExplanation from './LLMExplanation';

interface TabbedResultsPanelProps {
  result: FraudDetectionResponse | RefusalResponse | null;
  transactions: Transaction[];
  isLoading: boolean;
  error: Error | null;
}

type TabId = 'analysis' | 'llm';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

const tabs: Tab[] = [
  { id: 'analysis', label: 'Analysis Results', icon: '📈' },
  { id: 'llm', label: 'LLM Explanation', icon: '🤖' }
];

export default function TabbedResultsPanel({ result, transactions, isLoading, error }: TabbedResultsPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>('analysis');

  // Helper function to check if we have valid results for LLM tab
  const hasValidResults = result && 
    !isLoading && 
    !error && 
    !('refused' in result) && 
    transactions.length > 0;

  return (
    <div className="bg-white backdrop-blur-sm rounded-xl shadow-2xl border border-navy-200 flex flex-col h-full">
      {/* Header with Tabs */}
      <div className="border-b border-navy-200">
        <div className="p-4 pb-0">
          <h2 className="text-xl font-semibold text-navy-900 mb-4">
            Fraud Detection Results
          </h2>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const isDisabled = tab.id === 'llm' && !hasValidResults;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                disabled={isDisabled}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                  ${isActive
                    ? 'border-ocean-500 text-ocean-600 bg-ocean-50'
                    : isDisabled
                    ? 'border-transparent text-navy-400 cursor-not-allowed'
                    : 'border-transparent text-navy-600 hover:text-navy-800 hover:border-navy-300'
                  }
                `}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'analysis' && (
          <AnalysisResults
            result={result}
            isLoading={isLoading}
            error={error}
          />
        )}
        {activeTab === 'llm' && (
          <div className="h-full overflow-y-auto p-4">
            <LLMExplanation
              transactions={transactions}
              analyses={result && !('refused' in result) ? result.analyses : []}
            />
          </div>
        )}
      </div>
    </div>
  );
}