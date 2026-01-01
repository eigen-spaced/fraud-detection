import React from 'react'
import { cn } from '../utils'

interface CardProps {
    children: React.ReactNode
    className?: string
    hover?: boolean
}

export function Card({ children, className, hover = false }: CardProps) {
    return (
        <div className={cn('card', hover && 'hover:shadow-lg', className)}>
            {children}
        </div>
    )
}
