'use client';

import { useState, useEffect } from 'react';
import { EventData } from '@/lib/data';
import EventCard from './EventCard';

interface EventSliderProps {
  events: EventData[];
  onBookNow: (event: EventData) => void;
}

export default function EventSlider({ events, onBookNow }: EventSliderProps) {
  const [localEvents, setLocalEvents] = useState<EventData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    console.log('EventSlider: Received events update:', events.length);
    setLocalEvents([...events]);
    setCurrentIndex(0);
  }, [events]);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying || localEvents.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % localEvents.length);
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, [localEvents.length, isAutoPlaying]);

  if (localEvents.length === 0) {
    return (
      <div className="text-center text-white/60 py-16">
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 max-w-md mx-auto">
          <div className="text-4xl mb-4">🎪</div>
          <h3 className="text-xl font-semibold mb-2 text-white">No Events Available</h3>
          <p className="text-white/70">Check back soon for upcoming events!</p>
        </div>
      </div>
    );
  }

  // Single event - no slider needed
  if (localEvents.length === 1) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-white mb-2 font-montserrat">Featured Event</h3>
        </div>
        <EventCard event={localEvents[0]} onBookNow={onBookNow} />
      </div>
    );
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? localEvents.length - 1 : prev - 1));
    setIsAutoPlaying(false);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % localEvents.length);
    setIsAutoPlaying(false);
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-2xl font-bold text-white mb-2 font-montserrat">
            Event Spotlight
          </h3>
          <p className="text-white/60">
            {currentIndex + 1} of {localEvents.length} • {localEvents[currentIndex].title}
          </p>
        </div>

        {/* Auto-play Toggle */}
        <button
          onClick={toggleAutoPlay}
          className={`px-4 py-2 rounded-xl text-sm transition-all ${
            isAutoPlaying
              ? 'bg-green-500/20 text-green-300 border border-green-500/30'
              : 'bg-white/10 text-white/60 border border-white/20'
          }`}
        >
          {isAutoPlaying ? '⏸️ Auto' : '▶️ Manual'}
        </button>
      </div>

      {/* Main Slider */}
      <div className="relative">
        {/* Navigation Arrows */}
        <button
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 rounded-full p-3 transition-all duration-200 hover:scale-110"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 rounded-full p-3 transition-all duration-200 hover:scale-110"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Event Card Container */}
        <div className="overflow-hidden rounded-2xl">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {localEvents.map((event) => (
              <div key={event.id} className="w-full flex-shrink-0 px-4">
                <EventCard event={event} onBookNow={onBookNow} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Progress Indicators */}
      <div className="flex justify-center mt-8 space-x-3">
        {localEvents.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className="group relative"
          >
            {/* Progress Ring */}
            <div className={`w-12 h-12 rounded-full border-2 transition-all duration-300 ${
              index === currentIndex
                ? 'border-white bg-white/20'
                : 'border-white/30 hover:border-white/60'
            }`}>
              <div className="flex items-center justify-center h-full">
                <span className={`text-sm font-semibold transition-colors ${
                  index === currentIndex ? 'text-white' : 'text-white/60'
                }`}>
                  {index + 1}
                </span>
              </div>
            </div>

            {/* Auto-play Progress */}
            {index === currentIndex && isAutoPlaying && (
              <div className="absolute inset-0 rounded-full">
                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="white"
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray="125.6"
                    className="animate-pulse"
                    style={{
                      strokeDashoffset: 125.6,
                      animation: 'progress 5s linear infinite'
                    }}
                  />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Event Quick Info */}
      <div className="mt-6 text-center">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 max-w-md mx-auto">
          <p className="text-white/80 text-sm mb-2">
            📅 {new Date(localEvents[currentIndex].date).toLocaleDateString()}
          </p>
          <p className="text-white/60 text-xs">
            Tap indicators to jump to any event • Auto-advance every 5 seconds
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes progress {
          from {
            stroke-dashoffset: 125.6;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
}