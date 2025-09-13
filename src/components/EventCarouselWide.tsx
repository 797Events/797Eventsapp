'use client';

import { useState, useEffect } from 'react';
import { EventData } from '@/lib/data';
import EventCard from './EventCard';

interface EventCarouselWideProps {
  events: EventData[];
  onBookNow: (event: EventData) => void;
}

export default function EventCarouselWide({ events, onBookNow }: EventCarouselWideProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [localEvents, setLocalEvents] = useState<EventData[]>([]);

  // Force update local events when props change
  useEffect(() => {
    console.log('EventCarouselWide: Received events update:', events.length);
    console.log('EventCarouselWide: Events data:', events.map(e => ({ id: e.id, title: e.title, isActive: e.isActive })));
    setLocalEvents([...events]);
    if (events.length > 0 && currentIndex >= events.length) {
      setCurrentIndex(0); // Reset to first event when events change or current index is invalid
    }
  }, [events, currentIndex]);

  // Navigation functions - with safety checks
  const goToPrevious = () => {
    if (localEvents.length <= 1) return;
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? localEvents.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    if (localEvents.length <= 1) return;
    setCurrentIndex((prevIndex) =>
      prevIndex === localEvents.length - 1 ? 0 : prevIndex + 1
    );
  };

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (localEvents.length <= 1) return;

      if (e.key === 'ArrowLeft') {
        setCurrentIndex((prevIndex) =>
          prevIndex === 0 ? localEvents.length - 1 : prevIndex - 1
        );
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex((prevIndex) =>
          prevIndex === localEvents.length - 1 ? 0 : prevIndex + 1
        );
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [localEvents.length]);

  // If no events, show placeholder
  if (localEvents.length === 0) {
    return (
      <div className="text-center text-white/60 py-16">
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 max-w-md mx-auto">
          <div className="text-4xl mb-4">🎪</div>
          <h3 className="text-xl font-semibold mb-2 text-white">No Events Available</h3>
          <p className="text-white/70">Check back soon for upcoming events!</p>
          <p className="text-white/50 text-sm mt-2">
            Events added in admin dashboard will appear here automatically.
          </p>
        </div>
      </div>
    );
  }

  // If only one event, show it centered without navigation
  if (localEvents.length === 1) {
    return (
      <div className="flex justify-center px-4">
        <EventCard event={localEvents[0]} onBookNow={onBookNow} />
      </div>
    );
  }

  // Multiple events - show carousel with external navigation

  return (
    <div className="relative w-full">
      {/* Debug Info - Remove in production */}
      <div className="text-center mb-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 max-w-md mx-auto">
          <p className="text-white/80 text-xs">
            Debug: {localEvents.length} events loaded | Current: {currentIndex + 1}
          </p>
          <p className="text-white/60 text-xs">
            Events: {localEvents.map(e => e.title.substring(0, 15)).join(', ')}
          </p>
        </div>
      </div>

      {/* Event counter */}
      <div className="text-center mb-6">
        <p className="text-white/60 text-sm">
          Event {currentIndex + 1} of {localEvents.length}
        </p>
      </div>

      {/* Main carousel container with external navigation */}
      <div className="relative flex items-center justify-center max-w-7xl mx-auto">

        {/* Left Navigation Arrow - Only show if multiple events */}
        {localEvents.length > 1 && (
          <button
            onClick={goToPrevious}
            className="absolute left-0 z-20 bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 rounded-full p-4 transition-all duration-200 hover:scale-110 shadow-xl hover:shadow-2xl"
            style={{ transform: 'translateX(-50%)' }}
            aria-label="Previous event"
          >
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Carousel Container - Fixed width to show one card */}
        <div className="overflow-hidden w-[800px] mx-16">
          <div
            className="flex transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {localEvents.map((event) => (
              <div key={`${event.id}-${event.title}`} className="w-full flex-shrink-0">
                <EventCard event={event} onBookNow={onBookNow} />
              </div>
            ))}
          </div>
        </div>

        {/* Right Navigation Arrow - Only show if multiple events */}
        {localEvents.length > 1 && (
          <button
            onClick={goToNext}
            className="absolute right-0 z-20 bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 rounded-full p-4 transition-all duration-200 hover:scale-110 shadow-xl hover:shadow-2xl"
            style={{ transform: 'translateX(50%)' }}
            aria-label="Next event"
          >
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Dots Indicator */}
      <div className="flex justify-center mt-8 space-x-3">
        {localEvents.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-3 h-3 rounded-full transition-all duration-200 ${
              index === currentIndex
                ? 'bg-white scale-110 shadow-lg'
                : 'bg-white/40 hover:bg-white/60'
            }`}
            aria-label={`Go to event ${index + 1}`}
          />
        ))}
      </div>

      {/* Keyboard Navigation Hint */}
      <div className="text-center mt-4">
        <p className="text-white/40 text-xs">
          Use ← → arrow keys to navigate
        </p>
      </div>
    </div>
  );
}