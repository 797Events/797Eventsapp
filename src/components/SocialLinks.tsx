'use client';

import React from 'react';

interface SocialLinksProps {
  className?: string;
}

export default function SocialLinks({ className = '' }: SocialLinksProps) {
  return (
    <>
      <ul className={`social-links ${className}`}>
        <li>
          <a className="facebook" href="https://www.facebook.com/share/19xaRC3RQL/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <i className="fa fa-facebook" aria-hidden="true"></i>
          </a>
        </li>
        <li>
          <a className="instagram" href="https://www.instagram.com/797_events_?igsh=NDUyemYwMW93Yjg2&utm_source=qr" target="_blank" rel="noopener noreferrer">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <i className="fa fa-instagram" aria-hidden="true"></i>
          </a>
        </li>
      </ul>

      <style jsx>{`
        .social-links {
          margin: 0;
          padding: 0;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          margin-top: auto;
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

        .facebook:hover {
          color: #3b5998;
        }

        .facebook:hover span {
          background: #3b5998;
        }

        .instagram:hover {
          color: #c32aa3;
        }

        .instagram:hover span {
          background: #c32aa3;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .social-links li a {
            width: 40px;
            height: 40px;
            line-height: 40px;
            font-size: 16px;
            margin: 0 6px;
          }
        }
      `}</style>
    </>
  );
}