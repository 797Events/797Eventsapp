'use client';

import React from 'react';
import { clsx } from 'clsx';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  className?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

// Loading spinner component
const LoadingSpinner = ({ size }: { size: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <svg
      className={clsx('animate-spin', sizeClasses[size])}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

export default function Button({
  children,
  onClick,
  type = 'button',
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  iconPosition = 'left',
  className = '',
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  ...props
}: ButtonProps) {

  // Base classes for all buttons
  const baseClasses = clsx(
    // Layout & positioning
    'relative inline-flex items-center justify-center gap-2',
    'font-semibold font-inter transition-all duration-200 ease-out',
    'rounded-xl border backdrop-blur-sm',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent',

    // Accessibility & interaction states
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
    'active:transform active:scale-[0.98]',

    // Full width option
    fullWidth && 'w-full',

    // Size variants - WCAG 2.1 AA compliant (44px+ touch targets)
    {
      // Small: 36px height (for secondary actions)
      'px-3 py-2 text-sm min-h-[36px]': size === 'sm',
      // Medium: 44px height (standard touch target)
      'px-4 py-3 text-base min-h-[44px]': size === 'md',
      // Large: 52px height (prominent CTAs)
      'px-6 py-4 text-lg min-h-[52px]': size === 'lg',
    }
  );

  // Variant-specific classes
  const variantClasses = {
    primary: clsx(
      'bg-gradient-to-r from-violet-600 to-purple-600',
      'border-violet-500/50 text-white shadow-lg',
      'hover:from-violet-500 hover:to-purple-500 hover:border-violet-400/60',
      'hover:shadow-xl hover:-translate-y-0.5',
      'focus:ring-violet-500/50',
      'active:from-violet-700 active:to-purple-700'
    ),

    secondary: clsx(
      'bg-white/10 border-white/20 text-white',
      'hover:bg-white/15 hover:border-white/30',
      'hover:shadow-lg hover:-translate-y-0.5',
      'focus:ring-white/50',
      'active:bg-white/5'
    ),

    outline: clsx(
      'bg-transparent border-white/40 text-white',
      'hover:bg-white/10 hover:border-white/60',
      'hover:shadow-md hover:-translate-y-0.5',
      'focus:ring-white/50',
      'active:bg-white/5'
    ),

    danger: clsx(
      'bg-gradient-to-r from-red-600 to-red-500',
      'border-red-500/50 text-white shadow-lg',
      'hover:from-red-500 hover:to-red-400 hover:border-red-400/60',
      'hover:shadow-xl hover:-translate-y-0.5',
      'focus:ring-red-500/50',
      'active:from-red-700 active:to-red-600'
    ),

    ghost: clsx(
      'bg-transparent border-transparent text-white/80',
      'hover:bg-white/5 hover:text-white',
      'hover:-translate-y-0.5',
      'focus:ring-white/30',
      'active:bg-white/10'
    )
  };

  const buttonClasses = clsx(
    baseClasses,
    variantClasses[variant],
    className
  );

  const isDisabled = disabled || loading;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isDisabled) {
      e.preventDefault();
      return;
    }
    onClick?.();
  };

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={handleClick}
      disabled={isDisabled}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-disabled={isDisabled}
      {...props}
    >
      {/* Left icon or loading spinner */}
      {loading ? (
        <LoadingSpinner size={size} />
      ) : (
        icon && iconPosition === 'left' && (
          <span className="flex-shrink-0" aria-hidden="true">
            {icon}
          </span>
        )
      )}

      {/* Button text */}
      <span className={clsx(loading && 'opacity-70')}>
        {children}
      </span>

      {/* Right icon */}
      {!loading && icon && iconPosition === 'right' && (
        <span className="flex-shrink-0" aria-hidden="true">
          {icon}
        </span>
      )}
    </button>
  );
}