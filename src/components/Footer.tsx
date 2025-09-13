'use client';

import React from 'react';
import Image from 'next/image';
import SocialLinks from './SocialLinks';

export default function Footer() {
  return (
    <>
      <footer className="footer">
        <div className="footer-content">
          {/* Left: Office Details */}
          <div className="footer-section office-details">
            <h3 className="section-title font-montserrat">Office</h3>
            <div className="contact-info">
              <p className="address">
                123 Business Street, City, State 12345
              </p>
              <p className="email">
                <a href="mailto:the797events@gmail.com">the797events@gmail.com</a>
              </p>
              <p className="phone">
                <a href="tel:+1234567890">+1 (234) 567-8900</a>
              </p>
            </div>
          </div>

          {/* Center: Empty space for balance */}
          <div className="footer-section center-space">
          </div>

          {/* Right: Logo */}
          <div className="footer-section logo-section">
            <div className="footer-logo">
              <div className="relative w-48 h-48 mx-auto">
                <Image
                  src="/797logo.png"
                  alt="797 Events Logo"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Social Links + Copyright */}
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <SocialLinks />
            <p className="copyright">© 2025 797 Events. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .footer {
          background: transparent;
          padding: 40px 20px 20px;
          margin-top: 80px;
          position: relative;
          z-index: 15;
        }

        .footer-content {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 40px;
          align-items: start;
        }

        .footer-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .section-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #ffffff;
          margin: 0;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .contact-info {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .contact-info p {
          margin: 0;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.8);
        }

        .icon {
          font-size: 16px;
          opacity: 0.7;
        }

        .contact-info a {
          color: rgba(255, 255, 255, 0.9);
          text-decoration: none;
          transition: color 0.3s ease;
        }

        .contact-info a:hover {
          color: #ffffff;
        }



        .logo-section {
          align-items: center;
          text-align: center;
        }

        .footer-logo {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }


        .footer-bottom {
          margin-top: 32px;
          padding-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .footer-bottom-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .copyright {
          margin: 0;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
          text-align: center;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .footer-content {
            grid-template-columns: 1fr;
            gap: 32px;
            text-align: center;
          }


        }

        @media (max-width: 480px) {
          .footer {
            padding: 32px 16px 16px;
          }

          .footer-content {
            gap: 24px;
          }

          .social-btn {
            padding: 10px 20px;
            font-size: 13px;
            min-width: 120px;
          }

        }
      `}</style>
    </>
  );
}