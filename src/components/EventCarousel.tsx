'use client';

import { useState } from 'react';
import { EventData } from '@/lib/data';
import EventCard from './EventCard';

interface EventCarouselProps {
  events: EventData[];
  onBookNow: (event: EventData) => void;
}

export default function EventCarousel({ events, onBookNow }: EventCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // If only one event, show it static without carousel controls
  if (events.length === 1) {
    return (
      <div className="flex justify-center">
        <EventCard event={events[0]} onBookNow={onBookNow} />
      </div>
    );
  }

  // Multiple events - show carousel
  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? events.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === events.length - 1 ? 0 : prevIndex + 1
    );
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Navigation Buttons */}
      {events.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 rounded-full p-3 transition-all duration-200 hover:scale-110"
            aria-label="Previous event"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 rounded-full p-3 transition-all duration-200 hover:scale-110"
            aria-label="Next event"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Carousel Container */}
      <div className="overflow-hidden rounded-2xl py-8">
        <div 
          className="flex transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {events.map((event) => (
            <div key={event.id} className="w-full flex-shrink-0 px-8">
              <EventCard event={event} onBookNow={onBookNow} />
            </div>
          ))}
        </div>
      </div>

      {/* Dots Indicator */}
      {events.length > 1 && (
        <div className="flex justify-center mt-6 space-x-2">
          {events.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                index === currentIndex 
                  ? 'bg-white scale-110' 
                  : 'bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`Go to event ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
