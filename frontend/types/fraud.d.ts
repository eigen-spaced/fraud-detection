// Frontend type definitions for fraud detection
// These extend/override the types from lib/api.ts

export interface ShapExplanation {
    feature_name: string
    shap_value: number
    feature_value: number
    human_title: string
    human_detail: string
    icon: string
    severity: 'low' | 'medium' | 'high'
}

// Extend FraudAnalysis to include SHAP explanations
declare module '@/lib/api' {
    export interface FraudAnalysis {
        transaction_id: string
        classification: 'legitimate' | 'suspicious' | 'fraudulent' | 'unknown'
        risk_score: number
        risk_factors: string[]
        explanation: string
        shap_explanations?: ShapExplanation[]
    }
}

export { }
