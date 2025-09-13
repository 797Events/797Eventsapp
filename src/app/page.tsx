'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import GrainyOverlay from '@/components/GrainyOverlay';
import ShimmerOverlay from '@/components/ShimmerOverlay';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import EventShowcase from '@/components/EventShowcase';
import BookingModal from '@/components/BookingModal';
import LoginModal from '@/components/LoginModal';
import { getEvents, EventData, resetEventsToDefault, addTestEvents } from '@/lib/data';
import { isValidSession } from '@/lib/auth';

export default function HomePage() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [user, setUser] = useState<{ email: string; isAdmin: boolean } | null>(null);

  const loadEventsAndSession = () => {
    const loadedEvents = getEvents();
    console.log('Homepage: Loading events, found:', loadedEvents.length);

    setEvents([...loadedEvents]);

    const session = localStorage.getItem('session');
    if (session && isValidSession(session)) {
      const decoded = JSON.parse(atob(session));
      setUser({ email: decoded.email, isAdmin: decoded.isAdmin });
    }
  };

  useEffect(() => {
    loadEventsAndSession();

    // Listen for events-updated event from other tabs (main update mechanism)
    const handleEventsUpdated = () => {
      console.log('Homepage: Events updated in another tab, refreshing');
      loadEventsAndSession();
    };

    // Only refresh on focus if user is admin (they might be making changes)
    const handleFocus = () => {
      if (user?.isAdmin) {
        console.log('Homepage: Admin focused, refreshing events');
        loadEventsAndSession();
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('events-updated', handleEventsUpdated);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('events-updated', handleEventsUpdated);
    };
  }, [user?.isAdmin]);

  const handleBookNow = (event?: EventData) => {
    if (event) {
      setSelectedEvent(event);
    } else {
      if (events.length > 0) {
        setSelectedEvent(events[0]);
      }
    }
    setShowBookingModal(true);
  };

  const scrollToEvents = () => {
    const eventsSection = document.getElementById('events');
    if (eventsSection) {
      eventsSection.scrollIntoView({ behavior: 'smooth' });
    } else if (events.length > 0) {
      window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
    }
  };

  const handleLogin = () => {
    setShowLoginModal(true);
  };

  const handleLoginSuccess = (loggedInUser: { email: string; isAdmin: boolean }) => {
    setUser(loggedInUser);
  };

  const handleSignOut = () => {
    localStorage.removeItem('session');
    setUser(null);
    window.location.reload();
  };

  const handleBookingSuccess = () => {
    alert('Booking submitted successfully! You will receive a confirmation email shortly.');
    setShowBookingModal(false);
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-gradient-to-br from-purple-950 via-violet-950 via-purple-900 to-indigo-950">
      <GrainyOverlay />
      <ShimmerOverlay />
      
      {/* Navigation */}
      <Navbar 
        onBookNowClick={scrollToEvents}
        onLoginClick={handleLogin}
        isAdmin={user?.isAdmin}
        userEmail={user?.email}
        onSignOut={handleSignOut}
      />
      
      <main className="flex-1 relative z-10 pt-16">
        {/* Hero Section */}
        <section className="min-h-screen flex flex-col items-center justify-center px-4">
          {/* Hero Logo */}
          <div className="mb-8">
            <div className="relative w-[600px] h-[600px] max-w-[90vw] max-h-[50vh] md:max-h-[60vh] mx-auto">
              <Image
                src="/797logo.png"
                alt="797 Events Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
          
          {/* Animated Text */}
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-white mb-4 opacity-0 animate-fade-slide-up font-montserrat">
              Your Vision… Our Innovation
            </h1>
          </div>
        </section>

        {/* Events Section */}
        {events.length > 0 && (
          <section id="events" className="py-20 px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-4xl font-bold text-white text-center mb-16 font-montserrat">
                Upcoming Events
              </h2>
              <EventShowcase
                events={events}
                onBookNow={handleBookNow}
              />
            </div>
          </section>
        )}

        {/* Admin Debug Controls Section - Below Events */}
        {user?.isAdmin && (
          <section className="py-12 px-4">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2 font-montserrat">
                    🔧 Admin Debug Controls
                  </h3>
                  <p className="text-white/60 text-sm">Tools for testing and managing events</p>
                </div>

                <div className="space-y-6">
                  {/* Display Mode Selector */}
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-3">Display Modes</h4>
                    <div className="flex justify-center">
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 flex items-center space-x-2">
                        <button
                          onClick={() => {
                            const showcase = document.querySelector('[data-display-mode]');
                            if (showcase) showcase.setAttribute('data-display-mode', 'showcase');
                            window.location.href = '#events';
                          }}
                          className="px-4 py-2 rounded-lg text-sm text-white/80 hover:text-white hover:bg-white/10 transition-all"
                        >
                          🎯 Smart Showcase
                        </button>
                        <button
                          onClick={() => window.location.href = '/timeline'}
                          className="px-4 py-2 rounded-lg text-sm text-white/80 hover:text-white hover:bg-white/10 transition-all"
                        >
                          📅 Timeline View
                        </button>
                        <button
                          onClick={() => window.location.href = '/slider'}
                          className="px-4 py-2 rounded-lg text-sm text-white/80 hover:text-white hover:bg-white/10 transition-all"
                        >
                          🎬 Auto Slider
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Test Data Controls */}
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-3">Test Data Management</h4>
                    <div className="flex flex-wrap gap-3 justify-center">
                      <button
                        onClick={loadEventsAndSession}
                        className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm"
                      >
                        🔄 Refresh Events
                      </button>
                      <button
                        onClick={() => {
                          resetEventsToDefault();
                          loadEventsAndSession();
                        }}
                        className="px-4 py-2 bg-blue-500/20 text-white rounded-lg hover:bg-blue-500/30 transition-colors text-sm"
                      >
                        🔄 Reset to Default (2)
                      </button>
                      <button
                        onClick={() => {
                          addTestEvents(3);
                          loadEventsAndSession();
                        }}
                        className="px-4 py-2 bg-green-500/20 text-white rounded-lg hover:bg-green-500/30 transition-colors text-sm"
                      >
                        ➕ Add 3 Test Events
                      </button>
                      <button
                        onClick={() => {
                          addTestEvents(8);
                          loadEventsAndSession();
                        }}
                        className="px-4 py-2 bg-purple-500/20 text-white rounded-lg hover:bg-purple-500/30 transition-colors text-sm"
                      >
                        ➕ Add 8 Test Events
                      </button>
                    </div>
                  </div>

                  <div className="text-center pt-4 border-t border-white/10">
                    <p className="text-xs text-white/50">
                      Current events: {events.length} • Admin: {user.email}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
        
      {/* Footer */}
      <Footer />
      
      {/* Booking Modal */}
      {selectedEvent && (
        <BookingModal
          event={selectedEvent}
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          onBooked={handleBookingSuccess}
        />
      )}

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      <style jsx>{`
        @keyframes fade-slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-slide-up {
          animation: fade-slide-up 1s ease-out 0.5s forwards;
        }

        @media (max-width: 768px) {
          h1 {
            font-size: 3rem;
          }
          
          .w-96 {
            width: 20rem;
          }
          
          .h-72 {
            height: 15rem;
          }
        }

        @media (max-width: 480px) {
          h1 {
            font-size: 2.5rem;
          }
          
          .w-96 {
            width: 16rem;
          }
          
          .h-72 {
            height: 12rem;
          }
        }
      `}</style>
    </div>
  );
}