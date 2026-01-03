import { cn } from '../utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
    size?: 'sm' | 'md' | 'lg'
    children: React.ReactNode
}

export function Button({
    variant = 'primary',
    size = 'md',
    className,
    children,
    disabled,
    ...props
}: ButtonProps) {
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed smooth-transition'

    const variants = {
        primary: 'bg-primary hover:bg-primary-hover text-white shadow-sm',
        secondary: 'bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-white',
        danger: 'bg-critical hover:bg-[#DC2626] text-white shadow-sm',
        ghost: 'bg-transparent hover:bg-surface text-text-primary'
    }

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2.5 text-base',
        lg: 'px-6 py-3 text-lg'
    }

    return (
        <button
            className={cn(baseStyles, variants[variant], sizes[size], className)}
            disabled={disabled}
            {...props}
        >
            {children}
        </button>
    )
}
