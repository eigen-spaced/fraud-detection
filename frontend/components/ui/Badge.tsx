import React from 'react'
import { cn } from '../utils'

interface BadgeProps {
    variant: 'critical' | 'warning' | 'success' | 'info'
    children: React.ReactNode
    className?: string
}

export function Badge({ variant, children, className }: BadgeProps) {
    const variants = {
        critical: 'badge-critical',
        warning: 'badge-warning',
        success: 'badge-success',
        info: 'bg-info-bg text-info border border-info-border'
    }

    return (
        <span className={cn('badge', variants[variant], className)}>
            {children}
        </span>
    )
}
