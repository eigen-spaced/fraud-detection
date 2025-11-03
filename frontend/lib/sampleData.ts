// TypeScript interfaces for transaction data structure
export interface TransactionData {
  transaction: {
    id: string;
    timestamp: string;
    merchant: {
      name: string;
      category: string;
      location: {
        lat: number;
        lng: number;
      };
    };
    amount: number;
    card: {
      number: string;
      full: string;
    };
    account: {
      number: string;
      full: string;
    };
  };
  model_features: {
    temporal: {
      trans_in_last_1h: number;
      trans_in_last_24h: number;
      trans_in_last_7d: number;
    };
    amount_ratios: {
      amt_per_card_avg_ratio_1h: number;
      amt_per_card_avg_ratio_24h: number;
      amt_per_card_avg_ratio_7d: number;
      amt_per_category_avg_ratio_1h: number;
      amt_per_category_avg_ratio_24h: number;
      amt_per_category_avg_ratio_7d: number;
    };
    deviations: {
      amt_diff_from_card_median_7d: number;
    };
  };
  ground_truth: {
    is_fraud: boolean;
  };
}

export interface TransactionBatch {
  transactions: TransactionData[];
}

// Category emoji mapping
export const categoryEmojis: Record<string, string> = {
  "Gas & Transport": "⛽",
  "Grocery": "🛒",
  "Restaurant": "🍽️",
  "Shopping": "🛍️",
  "Entertainment": "🎬",
  "Healthcare": "🏥",
  "Travel": "✈️",
  "Electronics": "💻",
  "Jewelry": "💎",
  "Gambling": "🎰",
  "Crypto": "₿",
  "Wire Transfer": "💸",
  "ATM Withdrawal": "🏧",
  "Online Shopping": "📱",
  "Personal Care": "💄",
  "Home & Garden": "🏡",
  "Family & Pets": "👶",
  "Miscellaneous": "📦",
  "Default": "💳"
};

// Import JSON data files generated from backend model data
import legitimateData from "@/data/legitimate_transactions.json";
import suspiciousData from "@/data/suspicious_transactions.json";
import fraudData from "@/data/fraud_transactions.json";
import mixedData from "@/data/mixed_transactions.json";

// Export sample transactions - mapped to match frontend naming conventions
export const sampleTransactions = {
  legitimate: legitimateData as TransactionBatch,
  suspicious: suspiciousData as TransactionBatch,
  fraudulent: fraudData as TransactionBatch,
  mixed: mixedData as TransactionBatch,
};

// Backward compatibility: export with old name
export const newSampleTransactions = sampleTransactions;
