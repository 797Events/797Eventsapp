'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface RealTimeSyncProps {
  children: React.ReactNode;
}

export default function RealTimeSync({ children }: RealTimeSyncProps) {
  useEffect(() => {
    // Subscribe to events table changes
    const eventsSubscription = supabase
      .channel('events-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events'
        },
        (payload) => {
          console.log('Events table change detected:', payload);
          // Dispatch custom event to notify components
          window.dispatchEvent(new CustomEvent('events-updated', { detail: payload }));
        }
      )
      .subscribe();

    // Subscribe to passes table changes
    const passesSubscription = supabase
      .channel('passes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'passes'
        },
        (payload) => {
          console.log('Passes table change detected:', payload);
          // Dispatch custom event to notify components
          window.dispatchEvent(new CustomEvent('passes-updated', { detail: payload }));
        }
      )
      .subscribe();

    // Subscribe to bookings table changes
    const bookingsSubscription = supabase
      .channel('bookings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        (payload) => {
          console.log('Bookings table change detected:', payload);
          // Dispatch custom event to notify components
          window.dispatchEvent(new CustomEvent('bookings-updated', { detail: payload }));
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      eventsSubscription.unsubscribe();
      passesSubscription.unsubscribe();
      bookingsSubscription.unsubscribe();
    };
  }, []);

  // Handle connection state changes
  useEffect(() => {
    const handleOnline = () => {
      console.log('Connection restored, syncing data...');
      // Trigger data refresh when coming back online
      window.dispatchEvent(new CustomEvent('connection-restored'));
    };

    const handleOffline = () => {
      console.log('Connection lost...');
      // Could show offline indicator
      window.dispatchEvent(new CustomEvent('connection-lost'));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return <>{children}</>;
}