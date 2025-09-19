'use client';

import React from 'react';
import Image from 'next/image';
import SocialLinks from './SocialLinks';

export default function Footer() {
  return (
    <>
      <footer className="footer">
        <div className="footer-content">
          {/* Left: 797 Events Section */}
          <div className="footer-section company-section left-aligned">
            {/* 797 Logo (moved from right) */}
            <div className="footer-logo">
              <div className="relative w-40 h-40 mb-4">
                <Image
                  src="/797logo.png"
                  alt="797 Events Logo"
                  fill
                  className="object-contain"
                />
              </div>
            </div>

            <div className="contact-info">
              <div className="address">
                <p>F NO18-B, SURYALOKNAGRI CO OP HSG SOC,</p>
                <p>S NO:106A/3 PT-C, HADAPSAR,</p>
                <p>Pune, Maharashtra, 411028</p>
              </div>
              <p className="email">
                <a href="mailto:the797events@gmail.com">the797events@gmail.com</a>
              </p>
              <p className="phone">
                <a href="tel:+919028530343">+91 9028530343</a>
              </p>
            </div>

            {/* Social links moved below address - using same style */}
            <div className="social-section">
              <SocialLinks />
            </div>
          </div>


          {/* Right: The Wedding Xpert Section */}
          <div className="footer-section company-section right-aligned">
            {/* Wedding Xpert Logo */}
            <div className="footer-logo">
              <div className="relative w-40 h-40 mb-4">
                <Image
                  src="/TheWeddingXpert.png"
                  alt="The Wedding Xpert Logo"
                  fill
                  className="object-contain"
                />
              </div>
            </div>

            <div className="contact-info">
              <div className="address">
                <p>F NO18-B, SURYALOKNAGRI CO OP HSG SOC,</p>
                <p>S NO:106A/3 PT-C, HADAPSAR,</p>
                <p>Pune, Maharashtra, 411028</p>
              </div>
              <p className="email">
                <a href="mailto:weddingxpert28@gmail.com">weddingxpert28@gmail.com</a>
              </p>
              <p className="phone">
                <a href="tel:+918446800797">+91 84468 00797</a>
              </p>
            </div>

            {/* Wedding Xpert Social links - using same style */}
            <div className="social-section">
              <ul className="social-links">
                <li>
                  <a className="instagram" href="https://www.instagram.com/the.weddingxpert?igsh=MWMzemxidzY5cXM5MQ==" target="_blank" rel="noopener noreferrer">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <i className="fa fa-instagram" aria-hidden="true"></i>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Section: Legal Links + Copyright */}
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <div className="legal-links">
              <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
              <span className="separator">|</span>
              <a href="/terms-and-conditions" target="_blank" rel="noopener noreferrer">Terms & Conditions</a>
            </div>
            <p className="copyright">© 2025 797 Events & The Wedding Xpert. All rights reserved.</p>
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
          grid-template-columns: 1fr 1fr;
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

        .address {
          margin-bottom: 12px;
        }

        .address p {
          margin: 0;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.4;
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



        .company-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .left-aligned {
          align-items: flex-start;
          text-align: left;
        }

        .right-aligned {
          align-items: flex-end;
          text-align: right;
        }

        .footer-logo {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }


        .social-section {
          margin-top: 20px;
        }



        /* Copy social links styles from SocialLinks component */
        .social-links {
          margin: 0;
          padding: 0;
          display: flex;
          align-items: flex-end;
          justify-content: inherit;
          margin-top: auto;
          list-style: none;
        }

        .social-links li {
          list-style: none;
        }

        .social-links li a {
          display: block;
          position: relative;
          width: 50px;
          height: 50px;
          line-height: 50px;
          font-size: 20px;
          text-align: center;
          text-decoration: none;
          color: rgba(255, 255, 255, 0.7);
          margin: 0 8px;
          transition: 0.5s;
        }

        .social-links li a span {
          position: absolute;
          transition: transform 0.5s;
        }

        .social-links li a span:nth-child(1),
        .social-links li a span:nth-child(3) {
          width: 100%;
          height: 2px;
          background: rgba(255, 255, 255, 0.7);
        }

        .social-links li a span:nth-child(1) {
          top: 0;
          left: 0;
          transform-origin: right;
        }

        .social-links li a:hover span:nth-child(1) {
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.5s;
        }

        .social-links li a span:nth-child(3) {
          bottom: 0;
          left: 0;
          transform-origin: left;
        }

        .social-links li a:hover span:nth-child(3) {
          transform: scaleX(0);
          transform-origin: right;
          transition: transform 0.5s;
        }

        .social-links li a span:nth-child(2),
        .social-links li a span:nth-child(4) {
          width: 2px;
          height: 100%;
          background: rgba(255, 255, 255, 0.7);
        }

        .social-links li a span:nth-child(2) {
          top: 0;
          left: 0;
          transform: scale(0);
          transform-origin: bottom;
        }

        .social-links li a:hover span:nth-child(2) {
          transform: scale(1);
          transform-origin: top;
          transition: transform 0.5s;
        }

        .social-links li a span:nth-child(4) {
          top: 0;
          right: 0;
          transform: scale(0);
          transform-origin: top;
        }

        .social-links li a:hover span:nth-child(4) {
          transform: scale(1);
          transform-origin: bottom;
          transition: transform 0.5s;
        }

        .instagram:hover {
          color: #c32aa3;
        }

        .instagram:hover span {
          background: #c32aa3;
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

        .legal-links {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 8px 0;
        }

        .legal-links a {
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          font-size: 14px;
          transition: color 0.3s ease;
        }

        .legal-links a:hover {
          color: #ffffff;
        }

        .separator {
          color: rgba(255, 255, 255, 0.4);
          font-size: 14px;
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

          .center-image {
            order: -1;
            padding: 10px 0;
          }

          .image-2-container .relative {
            max-width: 90%;
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

        .footer-image-section {
          margin-top: 40px;
          padding: 20px 0;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          justify-content: center;
          align-items: center;
        }

        @media (max-width: 768px) {
          .footer-image-section {
            margin-top: 24px;
            padding: 16px 0;
          }
        }
      `}</style>
    </>
  );
}