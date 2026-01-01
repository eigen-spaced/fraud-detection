"use client"

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface ShapExplanation {
    feature_name: string
    shap_value: number
    feature_value: number
    human_title: string
    human_detail: string
    icon: string
    severity: 'low' | 'medium' | 'high'
}

interface ShapWaterfallProps {
    explanations: ShapExplanation[]
    baseValue?: number
    prediction?: number
}

export default function ShapWaterfall({
    explanations,
    baseValue = 0.5,
    prediction
}: ShapWaterfallProps) {
    const [isExpanded, setIsExpanded] = useState(false)

    // Sort by absolute SHAP value (most important first)
    const sortedExplanations = [...explanations].sort(
        (a, b) => Math.abs(b.shap_value) - Math.abs(a.shap_value)
    )

    // Show top 4 by default, all when expanded
    const displayedExplanations = isExpanded
        ? sortedExplanations
        : sortedExplanations.slice(0, 4)

    const maxAbsValue = Math.max(...explanations.map(e => Math.abs(e.shap_value)))

    return (
        <div className='space-y-3'>
            <div className='flex items-center justify-between'>
                <h4 className='text-sm font-semibold' style={{ color: 'var(--text-primary)' }}>
                    Feature Importance
                </h4>
                {explanations.length > 4 && (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className='text-xs flex items-center gap-1 px-2 py-1 rounded hover:bg-opacity-10 transition-colors'
                        style={{ color: 'var(--primary)', background: 'var(--border)' }}
                    >
                        {isExpanded ? (
                            <>
                                <ChevronUp className='w-3 h-3' />
                                Show Less
                            </>
                        ) : (
                            <>
                                <ChevronDown className='w-3 h-3' />
                                Show All ({explanations.length})
                            </>
                        )}
                    </button>
                )}
            </div>

            <div className='space-y-2'>
                {displayedExplanations.map((exp, idx) => {
                    const isPositive = exp.shap_value > 0
                    const barWidth = (Math.abs(exp.shap_value) / maxAbsValue) * 100

                    return (
                        <div key={idx} className='group'>
                            <div className='flex items-center justify-between text-xs mb-1'>
                                <span className='font-medium' style={{ color: 'var(--text-primary)' }}>
                                    {exp.human_title}
                                </span>
                                <span
                                    className='font-mono font-semibold'
                                    style={{ color: isPositive ? 'var(--critical)' : 'var(--success)' }}
                                >
                                    {isPositive ? '+' : ''}{exp.shap_value.toFixed(3)}
                                </span>
                            </div>

                            {/* Bar Chart */}
                            <div className='relative h-6 rounded overflow-hidden' style={{ background: 'var(--border)' }}>
                                <div
                                    className='h-full transition-all duration-300'
                                    style={{
                                        width: `${barWidth}%`,
                                        background: isPositive
                                            ? 'linear-gradient(90deg, var(--critical) 0%, #DC2626 100%)'
                                            : 'linear-gradient(90deg, var(--success) 0%, #059669 100%)'
                                    }}
                                />
                            </div>

                            {/* Tooltip on hover */}
                            <div className='text-xs mt-1 opacity-0 group-hover:opacity-100 transition-opacity' style={{ color: 'var(--text-secondary)' }}>
                                {exp.human_detail}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Summary */}
            {prediction !== undefined && (
                <div className='pt-3 border-t' style={{ borderColor: 'var(--border)' }}>
                    <div className='flex items-center justify-between text-xs'>
                        <span style={{ color: 'var(--text-secondary)' }}>Base Value</span>
                        <span className='font-mono' style={{ color: 'var(--text-primary)' }}>{baseValue.toFixed(2)}</span>
                    </div>
                    <div className='flex items-center justify-between text-xs mt-1'>
                        <span style={{ color: 'var(--text-secondary)' }}>Final Prediction</span>
                        <span className='font-mono font-semibold' style={{ color: 'var(--text-primary)' }}>{prediction.toFixed(2)}</span>
                    </div>
                </div>
            )}
        </div>
    )
}
