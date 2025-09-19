'use client';

import { ReactNode, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface LuxuryCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'minimal' | 'accent';
  hover?: boolean;
  onClick?: () => void;
}

const LuxuryCard = forwardRef<HTMLDivElement, LuxuryCardProps>(
  ({ children, className, variant = 'default', hover = true, onClick, ...props }, ref) => {
    const baseClasses = "relative overflow-hidden transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) hover-lift";

    const variants = {
      default: `
        bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl
        ${hover ? 'hover:bg-white/[0.05] hover:border-white/20 hover:shadow-luxury-lg' : ''}
      `,
      elevated: `
        bg-white/[0.05] backdrop-blur-xl border border-white/15 rounded-3xl shadow-luxury-lg
        ${hover ? 'hover:bg-white/[0.08] hover:border-white/25 hover:shadow-luxury-xl' : ''}
      `,
      minimal: `
        bg-white/[0.01] backdrop-blur-sm border border-white/5 rounded-xl
        ${hover ? 'hover:bg-white/[0.03] hover:border-white/10 hover:shadow-luxury' : ''}
      `,
      accent: `
        bg-gradient-to-br from-white/[0.03] to-white/[0.01] backdrop-blur-xl
        border border-white/10 rounded-2xl animate-glow
        before:absolute before:inset-0 before:bg-gradient-to-br before:from-purple-500/5 before:to-orange-500/5 before:rounded-2xl before:opacity-0 before:transition-opacity before:duration-500
        ${hover ? 'hover:before:opacity-100 hover:border-purple-400/20 hover:shadow-luxury-lg' : ''}
      `
    };

    return (
      <div
        ref={ref}
        className={cn(baseClasses, variants[variant], className)}
        onClick={onClick}
        {...props}
      >
        {children}
      </div>
    );
  }
);

LuxuryCard.displayName = 'LuxuryCard';

export default LuxuryCard;