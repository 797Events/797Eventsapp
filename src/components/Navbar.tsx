'use client';

import React, { useState, useEffect } from 'react';
import Button from './Button';

interface NavbarProps {
  onBookNowClick: () => void;
  onLoginClick: () => void;
  isAdmin?: boolean;
  userEmail?: string;
  onSignOut?: () => void;
}

export default function Navbar({ onBookNowClick, onLoginClick, isAdmin, userEmail, onSignOut }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isLoggedIn = !!userEmail;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Book Now Button - Left (Desktop Only) */}
          <div className="flex-shrink-0 hidden md:block">
            <Button 
              onClick={onBookNowClick}
              className="px-4 lg:px-6 py-2 text-sm lg:text-base bg-purple-600/20 hover:bg-purple-600/30 border-purple-500/50 hover:shadow-[0_0_20px_rgba(138,43,226,0.3)]"
            >
              Book Now
            </Button>
          </div>

          {/* Desktop Navigation - Right */}
          <div className="hidden md:flex items-center space-x-4">
            
            {isLoggedIn ? (
              <>
                <span className="text-white/80 text-sm hidden lg:block">
                  Hey, {userEmail?.split('@')[0]}
                </span>
                {isAdmin && (
                  <Button 
                    onClick={() => window.location.href = '/admin'}
                    className="px-3 lg:px-4 py-2 text-sm lg:text-base"
                  >
                    Admin
                  </Button>
                )}
                <Button 
                  onClick={onSignOut}
                  className="px-3 lg:px-4 py-2 text-sm lg:text-base"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <Button 
                onClick={onLoginClick}
                className="px-4 lg:px-6 py-2 text-sm lg:text-base"
              >
                Login
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white hover:text-white/80 focus:outline-none focus:text-white/80 p-2"
            >
              <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path d="M18.278 16.864a1 1 0 0 1-1.414 1.414l-4.829-4.828-4.828 4.828a1 1 0 0 1-1.414-1.414l4.828-4.829-4.828-4.828a1 1 0 0 1 1.414-1.414l4.829 4.828 4.828-4.828a1 1 0 1 1 1.414 1.414l-4.828 4.829 4.828 4.828z"/>
                ) : (
                  <path d="M4 5h16a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2z"/>
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-black/30 backdrop-blur-xl border-t border-white/10">
            <div className="px-2 pt-2 pb-3 space-y-3">
              {/* Book Now Button - Always at top */}
              <Button 
                onClick={() => {
                  onBookNowClick();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full px-4 py-2 text-left bg-purple-600/20 hover:bg-purple-600/30 border-purple-500/50"
              >
                Book Now
              </Button>
              
              {/* Login/User Section - Stacked below */}
              {isLoggedIn ? (
                <>
                  <div className="text-white/80 text-sm px-4 py-2">
                    Hey, {userEmail?.split('@')[0]}
                  </div>
                  {isAdmin && (
                    <Button 
                      onClick={() => {
                        window.location.href = '/admin';
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left"
                    >
                      Admin Dashboard
                    </Button>
                  )}
                  <Button 
                    onClick={() => {
                      onSignOut?.();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left"
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={() => {
                    onLoginClick();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left"
                >
                  Login
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}