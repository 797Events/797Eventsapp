'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import GrainyOverlay from '@/components/GrainyOverlay';
import ShimmerOverlay from '@/components/ShimmerOverlay';
import FastBackground from '@/components/FastBackground';
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
    <div className="min-h-screen flex flex-col relative">
      <FastBackground>
        <GrainyOverlay />
        <ShimmerOverlay />

      {/* Navigation */}
      <Navbar
        isAdmin={user?.isAdmin}
        userEmail={user?.email}
        userRole={user?.role}
        onSignOut={handleSignOut}
      />

      <main className="flex-1 relative z-10 pt-16">
        {/* Hero Section */}
        <section className="min-h-screen flex items-center px-6 md:px-12 lg:px-20">
          <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 items-center gap-8 lg:gap-16">
            <div className="order-2 lg:order-1 text-center lg:text-left">
              <p className="mb-5 text-sm md:text-base font-semibold tracking-[0.3em] text-purple-200 uppercase">
                797 Events
              </p>
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[0.98] text-white opacity-0 animate-fade-slide-up" style={{ fontFamily: 'Arial, sans-serif' }}>
                Your Vision…<br />
                <span className="text-purple-200">Our Innovation</span>
              </h1>
            </div>

            <div className="order-1 lg:order-2 relative flex justify-center">
              <div className="relative w-[min(720px,88vw)] h-[min(720px,68vh)] min-h-[360px]">
                <Image
                  src="/797logo.png"
                  alt="797 Events Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
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

        {/* Featured announcement */}
        <section className="px-4 py-12 md:py-20" aria-labelledby="navaratri-heading">
          <div className="relative max-w-6xl mx-auto overflow-hidden rounded-[2rem] border border-purple-300/25 bg-gradient-to-br from-purple-900/70 via-violet-900/60 to-indigo-950/70 px-6 py-14 text-center shadow-2xl shadow-purple-950/30 md:px-12">
            <div className="absolute -left-20 -top-24 h-56 w-56 rounded-full bg-fuchsia-500/20 blur-3xl" aria-hidden="true" />
            <div className="absolute -bottom-28 -right-16 h-64 w-64 rounded-full bg-indigo-400/20 blur-3xl" aria-hidden="true" />
            <div className="relative z-10">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-purple-200">Coming Soon · 2026</p>
              <h2 id="navaratri-heading" className="text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl font-montserrat">
                The Great Indian Navaratri
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/75 sm:text-lg">
                Get ready for an unforgettable celebration of music, dance, culture, and togetherness.
              </p>
              <span className="mt-8 inline-flex rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm">
                Event details coming soon
              </span>
            </div>
          </div>
        </section>

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
      </FastBackground>
    </div>
  );
}
