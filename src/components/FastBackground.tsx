'use client';

import React from 'react';

interface FastBackgroundProps {
  children?: React.ReactNode;
}

export default function FastBackground({ children }: FastBackgroundProps) {
  return (
    <div className="fast-background-container">
      <div className="gradient-background"></div>
      <div className="animated-overlay"></div>

      {/* Content overlay */}
      <div className="content-overlay">
        {children}
      </div>

      <style jsx>{`
        .fast-background-container {
          position: relative;
          width: 100%;
          min-height: 100vh;
        }

        .gradient-background {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            135deg,
            #190f3c 0%,
            #281950 25%,
            #1f1145 50%,
            #251851 75%,
            #190f3c 100%
          );
          z-index: 0;
        }

        .animated-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background:
            radial-gradient(circle at 20% 80%, rgba(96, 64, 192, 0.12) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(128, 96, 255, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(72, 48, 144, 0.15) 0%, transparent 50%);
          z-index: 1;
          /* Keep the background static; rotating the full-screen layer creates
             a visible rectangular edge over the page. */
          animation: none;
        }

        .animated-overlay::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background:
            radial-gradient(circle at 60% 30%, rgba(147, 51, 234, 0.06) 0%, transparent 40%),
            radial-gradient(circle at 30% 70%, rgba(59, 7, 100, 0.08) 0%, transparent 40%);
          animation: none;
        }

        .animated-overlay::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background:
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 2px,
              rgba(255, 255, 255, 0.003) 2px,
              rgba(255, 255, 255, 0.003) 4px
            );
          animation: grain 8s steps(10) infinite;
        }

        @keyframes floatingGradients {
          0%, 100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
          25% {
            transform: scale(1.1) rotate(90deg);
            opacity: 0.8;
          }
          50% {
            transform: scale(0.95) rotate(180deg);
            opacity: 0.9;
          }
          75% {
            transform: scale(1.05) rotate(270deg);
            opacity: 0.7;
          }
        }

        @keyframes grain {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-5%, -10%); }
          20% { transform: translate(-15%, 5%); }
          30% { transform: translate(7%, -25%); }
          40% { transform: translate(-5%, 25%); }
          50% { transform: translate(-15%, 10%); }
          60% { transform: translate(15%, 0%); }
          70% { transform: translate(0%, 15%); }
          80% { transform: translate(3%, 35%); }
          90% { transform: translate(-10%, 10%); }
        }

        .content-overlay {
          position: relative;
          z-index: 2;
          width: 100%;
          min-height: 100vh;
          pointer-events: auto;
        }

        /* Performance optimizations for mobile */
        @media (max-width: 768px) {
          .animated-overlay {
            animation-duration: 40s;
          }

          .animated-overlay::before {
            animation-duration: 50s;
          }

          .animated-overlay::after {
            display: none; /* Remove grain on mobile for better performance */
          }
        }

        /* Reduce motion for users who prefer it */
        @media (prefers-reduced-motion: reduce) {
          .animated-overlay,
          .animated-overlay::before,
          .animated-overlay::after {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
