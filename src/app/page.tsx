'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import GrainyOverlay from '@/components/GrainyOverlay';
import ShimmerOverlay from '@/components/ShimmerOverlay';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import EventShowcase from '@/components/EventShowcase';
import CleanBookingModal from '@/components/CleanBookingModal';
import { getEvents, EventData } from '@/lib/data';

export default function HomePage() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [user, setUser] = useState<{ email: string; isAdmin: boolean; role?: 'admin' | 'guard' | 'influencer' } | null>(null);

  const loadEventsAndSession = async () => {
    // Load session first
    const session = localStorage.getItem('session');
    if (session) {
      try {
        const sessionUser = JSON.parse(session);
        if (sessionUser && sessionUser.exp > Date.now()) {
          setUser({
            email: sessionUser.email,
            isAdmin: sessionUser.isAdmin,
            role: sessionUser.role
          });
        }
      } catch (error) {
        console.error('Error parsing session:', error);
        localStorage.removeItem('session');
      }
    }

    // Refresh events from data layer
    try {
      const eventsData = await getEvents();
      setEvents(eventsData);
    } catch (error) {
      console.error('Error refreshing events:', error);
    }
  };

  useEffect(() => {
    // Load events from data layer
    const loadEvents = async () => {
      try {
        const eventsData = await getEvents();
        setEvents(eventsData);
      } catch (error) {
        console.error('Error loading events:', error);
      }
    };

    loadEvents();

    // Load session
    loadEventsAndSession();

    // Listen for events-updated event from other tabs (main update mechanism)
    const handleEventsUpdated = async () => {
      console.log('Homepage: Events updated, refreshing data from data layer');
      try {
        const eventsData = await getEvents();
        setEvents(eventsData);
        console.log('Homepage: Events refreshed successfully:', eventsData.length);
      } catch (error) {
        console.error('Homepage: Error refreshing events:', error);
      }
    };

    // Only refresh on focus if user is admin (they might be making changes)
    const handleFocus = async () => {
      if (user?.isAdmin) {
        console.log('Homepage: Admin focused, refreshing events from data layer');
        try {
          const eventsData = await getEvents();
          setEvents(eventsData);
        } catch (error) {
          console.error('Homepage: Error refreshing events on focus:', error);
        }
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
    } else if (events.length > 0) {
      setSelectedEvent(events[0]);
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
    // Redirect to login page instead of showing modal
    window.location.href = '/login';
  };


  const handleSignOut = () => {
    localStorage.removeItem('session');
    localStorage.removeItem('temp_admin_session');
    setUser(null);
    window.location.href = '/login';
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
        userRole={user?.role}
        onSignOut={handleSignOut}
      />

      <main className="flex-1 relative z-10 pt-16">
        {/* Hero Section */}
        <section className="min-h-screen flex flex-col items-center justify-center px-4">
          {/* Hero Logos - Side by Side */}
          <div className="mb-8 flex items-start justify-center gap-8 flex-wrap">
            {/* 797 Events Logo with Text Below */}
            <div className="flex flex-col items-center">
              <div className="relative w-[600px] h-[600px] max-w-[45vw] max-h-[40vh] md:max-h-[50vh] mb-4">
                <Image
                  src="/797logo.png"
                  alt="797 Events Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              {/* Animated Text - Below 797 Logo with Bethaine Font */}
              <div className="text-center">
                <h1 className="text-[18px] font-bold text-white opacity-0 animate-fade-slide-up" style={{ fontFamily: 'Bethaine, serif' }}>
                  Your Vision… Our Innovation
                </h1>
              </div>
            </div>

            {/* Wedding Expert Logo */}
            <div className="relative w-[600px] h-[600px] max-w-[45vw] max-h-[40vh] md:max-h-[50vh]">
              <Image
                src="/TheWeddingXpert.png"
                alt="The Wedding Expert Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
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

        {/* Gallery Section */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-white text-center mb-16 font-montserrat">
              Gallery
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Gallery Images */}
              {[1, 2, 3, 4, 5, 6, 7, 8].map((imageNumber) => (
                <div
                  key={imageNumber}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20"
                >
                  <div className="relative aspect-square">
                    <Image
                      src={`/gallery/g${imageNumber}.jpeg`}
                      alt={`Gallery image ${imageNumber}`}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-purple-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Image number indicator */}
                    <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm rounded-full w-8 h-8 flex items-center justify-center text-white text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {imageNumber}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Gallery Description */}
            <div className="mt-12 text-center">
              <p className="text-white/70 text-lg max-w-2xl mx-auto">
                Explore moments from our previous events - where memories are made and celebrations come to life.
              </p>
            </div>
          </div>
        </section>

        {/* Admin controls removed for production */}
        {false && user?.isAdmin && (
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
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm"
                      >
                        🔄 Refresh Page
                      </button>
                      <button
                        onClick={() => {
                          const defaultEvents: EventData[] = [
                            {
                              id: '1',
                              title: 'Luxury Wedding Reception',
                              description: 'An elegant evening celebration with premium dining and entertainment',
                              date: '2024-02-15',
                              time: '18:00',
                              venue: 'Grand Ballroom, Five Star Hotel',
                              venueIcon: '🏰',
                              price: 5000,
                              image: 'https://via.placeholder.com/800x600/4c1d95/ffffff?text=Luxury+Wedding',
                              isActive: true,
                              passes: [
                                { id: '1', name: 'VIP Pass', price: 8000, available: 50 },
                                { id: '2', name: 'Regular Pass', price: 5000, available: 100 }
                              ]
                            },
                            {
                              id: '2',
                              title: 'Corporate Gala Night',
                              description: 'Professional networking event with dinner and awards ceremony',
                              date: '2024-02-20',
                              time: '19:00',
                              venue: 'Business Center, Downtown',
                              venueIcon: '🏢',
                              price: 3000,
                              image: 'https://via.placeholder.com/800x600/1e40af/ffffff?text=Corporate+Gala',
                              isActive: true,
                              passes: [
                                { id: '3', name: 'Executive Pass', price: 4000, available: 30 },
                                { id: '4', name: 'Standard Pass', price: 3000, available: 80 }
                              ]
                            }
                          ];
                          setEvents(defaultEvents);
                        }}
                        className="px-4 py-2 bg-blue-500/20 text-white rounded-lg hover:bg-blue-500/30 transition-colors text-sm"
                      >
                        🔄 Reset to Default (2)
                      </button>
                      <button
                        onClick={() => {
                          const newEvent: EventData = {
                            id: Date.now().toString(),
                            title: 'Grand Navratri Festival',
                            description: 'Celebrate the divine feminine with traditional Garba and Dandiya',
                            date: '2024-10-15',
                            time: '20:00',
                            venue: 'Cultural Center Stadium',
                            venueIcon: '🕺',
                            price: 2500,
                            image: 'https://via.placeholder.com/800x600/dc2626/ffffff?text=Navratri+Festival',
                            isActive: true,
                            passes: [
                              { id: Date.now().toString(), name: 'Festival Pass', price: 2500, available: 200 }
                            ]
                          };
                          setEvents(prev => [...prev, newEvent]);
                        }}
                        className="px-4 py-2 bg-green-500/20 text-white rounded-lg hover:bg-green-500/30 transition-colors text-sm"
                      >
                        ➕ Add Navratri Event
                      </button>
                      <button
                        onClick={() => {
                          const adminLink = document.createElement('a');
                          adminLink.href = '/admin';
                          adminLink.click();
                        }}
                        className="px-4 py-2 bg-purple-500/20 text-white rounded-lg hover:bg-purple-500/30 transition-colors text-sm"
                      >
                        🔧 Go to Admin
                      </button>
                    </div>
                  </div>

                  <div className="text-center pt-4 border-t border-white/10">
                    <p className="text-xs text-white/50">
                      Current events: {events.length} • Admin: {user?.email || 'Not logged in'}
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

      {/* Clean Booking Modal with Student Verification */}
      {selectedEvent && (
        <CleanBookingModal
          event={selectedEvent}
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          onBooked={handleBookingSuccess}
        />
      )}


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