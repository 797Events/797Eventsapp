'use client';

import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
}

export default function Button({ 
  children, 
  onClick, 
  type = 'button', 
  disabled = false,
  className = '',
  fullWidth = false
}: ButtonProps) {
  return (
    <>
      <button 
        className={`button ${fullWidth ? 'full-width' : ''} ${className}`}
        onClick={onClick}
        type={type}
        disabled={disabled}
      >
        <span>{children}</span>
      </button>
      
      <style jsx>{`
        *,
        *::before,
        *::after {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          transition: all 200ms ease-out;
        }

        button {
          appearance: none;
          background: transparent;
          border: none;
          cursor: pointer;
          isolation: isolate;
          z-index: 10;
        }

        .button {
          color: #ffffff;
          font-size: 14px;
          line-height: 1.5;
          font-weight: 600;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 12px 24px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          position: relative;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
          font-family: 'Inter', 'Poppins', sans-serif;
        }
        
        .button::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(45deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
          z-index: -1;
          transition: all 0.3s ease;
        }
        
        .button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3), 0 0 20px rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.3);
        }
        
        .button:hover::before {
          background: linear-gradient(45deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%);
        }
        
        .button:active {
          transform: translateY(0px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        }

        .button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .button:disabled:hover {
          transform: none;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        }

        .button.full-width {
          width: 100%;
          padding: 14px 24px;
        }
      `}</style>
    </>
  );
}