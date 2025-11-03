/**
 * Transaction data conversion utilities
 */

import { TransactionData } from '@/lib/sampleData';
import { Transaction } from '@/lib/api';

/**
 * Convert TransactionData from sample data format to API Transaction format
 * @param txData Transaction data in sample format
 * @returns Transaction data in API format
 */
export function convertToTransaction(txData: TransactionData): Transaction {
  return {
    transaction_id: txData.transaction.id,
    timestamp: txData.transaction.timestamp,
    amount: txData.transaction.amount,
    merchant_name: txData.transaction.merchant.name,
    merchant_category: txData.transaction.merchant.category,
    card_number: txData.transaction.card.number.replace(/•/g, '').slice(-4) || '0000',
    location: `${txData.transaction.merchant.location.lat}, ${txData.transaction.merchant.location.lng}`,
  };
}

/**
 * Convert multiple TransactionData items to Transaction format
 * @param transactionData Array of transaction data in sample format
 * @returns Array of transaction data in API format
 */
export function convertTransactionBatch(transactionData: TransactionData[]): Transaction[] {
  return transactionData.map(convertToTransaction);
}