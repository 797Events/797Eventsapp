'use client';

import React from 'react';

interface FooterSocialLinksProps {
  instagramUrl?: string;
  facebookUrl?: string;
}

export default function FooterSocialLinks({ 
  instagramUrl = "https://instagram.com/797events",
  facebookUrl = "https://facebook.com/797events" 
}: FooterSocialLinksProps) {
  return (
    <>
      <div className="social-links-container">
        <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="social-link instagram">
          <i className="fab fa-instagram"></i>
        </a>
        <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="social-link facebook">
          <i className="fab fa-facebook-f"></i>
        </a>
      </div>

      <style jsx>{`
        /* Placeholder styles - will be replaced with exact CodePen implementation */
        .social-links-container {
          display: flex;
          gap: 20px;
          justify-content: center;
          align-items: center;
          padding: 20px 0;
        }

        .social-link {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          text-decoration: none;
          color: white;
          font-size: 24px;
          transition: all 0.3s ease;
          border: 2px solid rgba(255, 255, 255, 0.3);
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
        }

        .social-link:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
        }

        .social-link.instagram:hover {
          background: linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%);
          border-color: #bc1888;
        }

        .social-link.facebook:hover {
          background: #1877f2;
          border-color: #1877f2;
        }
      `}</style>
      
      {/* Font Awesome for icons */}
      <link 
        rel="stylesheet" 
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" 
      />
    </>
  );
}