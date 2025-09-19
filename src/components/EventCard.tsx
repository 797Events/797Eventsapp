import React from 'react';
import Image from 'next/image';
import { EventData } from '@/lib/data';
import Button from './Button';
import { Calendar, Clock } from 'lucide-react';

interface EventCardProps {
  event: EventData;
  onBookNow: (event: EventData) => void;
}

// Helper function to format 24-hour time to 12-hour format
const formatTime12Hour = (time24: string): string => {
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

export default React.memo(function EventCard({ event, onBookNow }: EventCardProps) {
  const isMultiDay = event.isMultiDay && event.eventDays && event.eventDays.length > 0;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDateRange = () => {
    if (!isMultiDay || !event.eventDays) return formatDate(event.date);
    const firstDay = event.eventDays[0];
    const lastDay = event.eventDays[event.eventDays.length - 1];
    return `${formatDate(firstDay.date)} - ${formatDate(lastDay.date)}`;
  };

  const getLowestPrice = () => {
    if (!isMultiDay || !event.eventDays) return event.price;
    const allPasses = event.eventDays.flatMap(day => day.passes || []);
    if (allPasses.length === 0) return event.price;
    return Math.min(...allPasses.map(pass => pass.price));
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden hover:border-yellow-500 transition-all duration-300 hover:scale-105
                    w-full max-w-[850px] h-auto min-h-[600px] mx-auto flex-shrink-0 flex flex-col">
      {/* Banner Image */}
      <div className="relative h-[250px] sm:h-[300px] md:h-[350px] overflow-hidden flex-shrink-0">
        <Image
          src={event.image}
          alt={event.title}
          fill
          className="object-cover object-center"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

        {/* Multi-Day Badge */}
        {isMultiDay && (
          <div className="absolute top-4 left-4">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm border border-white/20">
              🗓️ {event.eventDays?.length} Days Event
            </div>
          </div>
        )}
      </div>

      {/* Event Info */}
      <div className="p-4 sm:p-6 flex-1 flex flex-col">
        {/* Title */}
        <h3 className="text-xl font-bold text-white mb-3 line-clamp-2 font-montserrat">
          {event.title}
        </h3>

        {/* Description */}
        <p className="text-white/80 text-sm mb-4 line-clamp-2 flex-shrink-0">
          {event.description}
        </p>

        {/* Date & Time */}
        <div className="flex items-center gap-4 mb-3 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-white/60" />
            <span className="text-white/80">{getDateRange()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-white/60" />
            <span className="text-white/80">{formatTime12Hour(event.time)}</span>
          </div>
        </div>

        {/* Venue */}
        <div className="flex items-center gap-2 mb-3 text-sm">
          <span className="text-lg">{event.venueIcon || '📍'}</span>
          <span className="text-white/80 line-clamp-1">{event.venue}</span>
        </div>


        {/* Price & Booking Button */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10 mt-auto">
          <div>
            <span className="text-white/60 text-xs">Starting from</span>
            <div className="text-white text-xl font-bold font-montserrat">₹{getLowestPrice().toLocaleString()}</div>
            {isMultiDay && (
              <span className="text-white/50 text-xs">
                {event.eventDays?.length} day event
              </span>
            )}
          </div>

          <Button
            onClick={() => onBookNow(event)}
            className="px-6 py-2 text-base"
          >
            {isMultiDay ? 'Choose Passes' : 'Book Now'}
          </Button>
        </div>
      </div>
    </div>
  );
});