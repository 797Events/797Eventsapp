'use client';

import React from 'react';

interface GlassmorphModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: string;
}

export default function GlassmorphModal({
  isOpen,
  onClose,
  title,
  children,
  width = '400px'
}: GlassmorphModalProps) {
  if (!isOpen) return null;

  return (
    <>
      <div className="modal-backdrop" onClick={onClose}>
        <div className="background">
          <div className="shape"></div>
          <div className="shape"></div>
        </div>
        <div className="form-container" onClick={(e) => e.stopPropagation()}>
          <div className="form-header">
            <h3>{title}</h3>
            <button className="close-button" onClick={onClose}>×</button>
          </div>
          {children}
        </div>
      </div>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;500;600&display=swap');

        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(8, 7, 16, 0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          padding: 20px;
        }

        .background {
          width: 430px;
          height: 520px;
          position: absolute;
          transform: translate(-50%, -50%);
          left: 50%;
          top: 50%;
          pointer-events: none;
        }

        .background .shape {
          height: 200px;
          width: 200px;
          position: absolute;
          border-radius: 50%;
        }

        .shape:first-child {
          background: linear-gradient(#4c1d95, #6b21a8);
          left: -80px;
          top: -80px;
        }

        .shape:last-child {
          background: linear-gradient(to right, #581c87, #7c3aed);
          right: -30px;
          bottom: -80px;
        }

        .form-container {
          min-height: 400px;
          width: ${width};
          max-width: 90vw;
          background-color: rgba(255, 255, 255, 0.13);
          position: relative;
          border-radius: 10px;
          backdrop-filter: blur(10px);
          border: 2px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 0 40px rgba(8, 7, 16, 0.6);
          padding: 50px 35px;
          font-family: 'Poppins', sans-serif;
        }

        .form-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }

        .form-container h3 {
          font-size: 32px;
          font-weight: 500;
          line-height: 42px;
          color: #ffffff;
          letter-spacing: 0.5px;
          margin: 0;
        }

        .close-button {
          background: none;
          border: none;
          color: #ffffff;
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background-color 0.3s ease;
        }

        .close-button:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }

        .form-container :global(label) {
          display: block;
          margin-top: 30px;
          font-size: 16px;
          font-weight: 500;
          color: #ffffff;
          letter-spacing: 0.5px;
        }

        .form-container :global(input),
        .form-container :global(select),
        .form-container :global(textarea) {
          display: block;
          height: 50px;
          width: 100%;
          background-color: rgba(255, 255, 255, 0.07);
          border-radius: 3px;
          padding: 0 10px;
          margin-top: 8px;
          font-size: 14px;
          font-weight: 300;
          border: none;
          outline: none;
          color: #ffffff;
          font-family: 'Poppins', sans-serif;
          letter-spacing: 0.5px;
        }

        .form-container :global(textarea) {
          height: 100px;
          resize: vertical;
          padding: 10px;
        }

        .form-container :global(::placeholder) {
          color: #e5e5e5;
        }

        .form-container :global(button[type="submit"]) {
          margin-top: 30px;
          width: 100%;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #ffffff;
          padding: 15px 0;
          font-size: 18px;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          font-family: 'Poppins', sans-serif;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .form-container :global(button[type="submit"]:hover) {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.3);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
          transform: translateY(-1px);
        }

        .form-container :global(button[type="submit"]:disabled) {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .form-container :global(.form-group) {
          margin-bottom: 20px;
        }

        .form-container :global(.form-row) {
          display: flex;
          gap: 15px;
        }

        .form-container :global(.form-row > div) {
          flex: 1;
        }

        @media (max-width: 480px) {
          .form-container {
            width: 90vw;
            padding: 40px 25px;
          }
          
          .form-container h3 {
            font-size: 24px;
          }

          .form-container :global(.form-row) {
            flex-direction: column;
            gap: 0;
          }
        }
      `}</style>
    </>
  );
}