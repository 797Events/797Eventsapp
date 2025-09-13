'use client';

import React, { useState } from 'react';
import GlassmorphModal from './GlassmorphModal';
import Button from './Button';
import { EventData, PassType } from '@/lib/data';

interface BookingModalProps {
  event: EventData | null;
  isOpen: boolean;
  onClose: () => void;
  onBooked: () => void;
}

interface BookingForm {
  passType: string;
  quantity: number;
  name: string;
  email: string;
  phone: string;
}

// Helper function to format 24-hour time to 12-hour format
const formatTime12Hour = (time24: string): string => {
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

export default function BookingModal({ event, isOpen, onClose, onBooked }: BookingModalProps) {
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    passType: '',
    quantity: 1,
    name: '',
    email: '',
    phone: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!event || !event.passes.length) return null;

  // Set default pass type if not set
  if (!bookingForm.passType && event.passes.length > 0) {
    setBookingForm(prev => ({ ...prev, passType: event.passes[0].id }));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Get selected pass details
      const selectedPass = event.passes.find(pass => pass.id === bookingForm.passType);
      if (!selectedPass) {
        throw new Error('Please select a valid pass type');
      }

      const totalAmount = selectedPass.price * bookingForm.quantity;
      
      // Create Razorpay payment parameters
      const paymentData = {
        amount: totalAmount * 100, // Razorpay expects amount in paise
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
        notes: {
          event_id: event.id,
          event_title: event.title,
          pass_type: selectedPass.name,
          quantity: bookingForm.quantity,
          customer_name: bookingForm.name,
          customer_email: bookingForm.email,
          customer_phone: bookingForm.phone
        }
      };

      // Generate Razorpay payment link (in a real app, this would be done through backend)
      const razorpayLink = `https://rzp.io/l/paymentlink?amount=${paymentData.amount}&currency=${paymentData.currency}&description=${encodeURIComponent(`${event.title} - ${selectedPass.name} x${bookingForm.quantity}`)}&customer[name]=${encodeURIComponent(bookingForm.name)}&customer[email]=${encodeURIComponent(bookingForm.email)}&customer[contact]=${encodeURIComponent(bookingForm.phone)}`;
      
      // Redirect to Razorpay payment link
      window.open(razorpayLink, '_blank');
      
      // Show success message and close modal
      alert(`Redirecting to payment for ₹${totalAmount}. Complete your payment to confirm your booking.`);
      onClose();
      
      // Reset form
      setBookingForm({
        passType: event.passes[0]?.id || '',
        quantity: 1,
        name: '',
        email: '',
        phone: ''
      });
    } catch (error) {
      console.error('Booking error:', error);
      alert(`Booking failed: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof BookingForm, value: string | number) => {
    setBookingForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const selectedPass = event.passes.find(p => p.id === bookingForm.passType) || event.passes[0];
  const total = selectedPass ? selectedPass.price * bookingForm.quantity : 0;

  const incrementQuantity = () => {
    if (bookingForm.quantity < (selectedPass?.available || 10)) {
      handleInputChange('quantity', bookingForm.quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (bookingForm.quantity > 1) {
      handleInputChange('quantity', bookingForm.quantity - 1);
    }
  };

  return (
    <GlassmorphModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Book ${event.title}`}
      width="700px"
    >
      {/* Single scrollable container for mobile, 2-column for desktop */}
      <div className="booking-panel w-full max-w-7xl mx-auto overflow-y-auto" style={{ maxHeight: '70vh' }}>
        {/* Mobile Layout - Single Column Stack */}
        <div className="lg:hidden space-y-6">
          {/* Event Banner */}
          <div className="h-48 overflow-hidden rounded-xl">
            <img
              src={event.image}
              alt={event.title}
              className="w-full h-full object-cover rounded-xl"
              loading="lazy"
              decoding="async"
            />
          </div>

          {/* Event Info */}
          <div>
            <h3 className="text-lg font-bold text-white mb-2 font-montserrat">{event.title}</h3>
            <div className="text-white/80 text-sm space-y-1">
              <p className="flex items-center gap-2">
                <span>📅</span> {new Date(event.date).toLocaleDateString()} at {formatTime12Hour(event.time)}
              </p>
              <p className="flex items-center gap-2">
                <span>📍</span> {event.venue}
              </p>
            </div>
          </div>

          {/* Pass Types */}
          <div>
            <label className="block text-white/90 text-sm font-medium mb-3">Select Pass Type</label>
            <div className="space-y-2">
              {event.passes.map((pass) => (
                <button
                  key={pass.id}
                  type="button"
                  className={`w-full p-3 rounded-lg border text-left transition-all duration-200 ${
                    bookingForm.passType === pass.id
                      ? 'bg-purple-600/20 border-purple-500/50 shadow-[0_0_10px_rgba(138,43,226,0.3)]'
                      : 'bg-white/5 border-white/20 hover:bg-white/10'
                  }`}
                  onClick={() => handleInputChange('passType', pass.id)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-white font-medium text-sm font-poppins">{pass.name}</div>
                      <div className="text-white/60 text-xs">{pass.available} available</div>
                    </div>
                    <div className="text-yellow-400 font-bold font-montserrat">₹{pass.price}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Booking Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Quantity and Total */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white/90 text-sm font-medium mb-2">Quantity</label>
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={decrementQuantity}
                    disabled={bookingForm.quantity <= 1}
                    className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    -
                  </button>
                  <span className="text-white font-semibold w-8 text-center">
                    {bookingForm.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={incrementQuantity}
                    disabled={bookingForm.quantity >= (selectedPass?.available || 10)}
                    className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-white/90 text-sm font-medium mb-2">Total</label>
                <div className="bg-white/5 rounded-lg p-3 border border-white/10 text-center">
                  <span className="text-white font-bold text-lg font-montserrat">₹{total}</span>
                </div>
              </div>
            </div>

            {/* Personal Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-white/90 text-sm font-medium mb-2">Full Name</label>
                <input
                  type="text"
                  value={bookingForm.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all duration-200"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label className="block text-white/90 text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={bookingForm.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all duration-200"
                  placeholder="Enter your email address"
                  required
                />
              </div>

              <div>
                <label className="block text-white/90 text-sm font-medium mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={bookingForm.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all duration-200"
                  placeholder="Enter your phone number"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 text-base bg-purple-600 hover:bg-purple-700 border-purple-700"
            >
              {isSubmitting ? 'Processing...' : 'Book Now'}
            </Button>
          </form>
        </div>

        {/* Desktop Layout - 2 Column Grid */}
        <div className="hidden lg:grid lg:grid-cols-2 gap-10">
          {/* Left Column - Event Info + Pass Types */}
          <div className="space-y-6">
            {/* Event Banner */}
            <div className="h-48 overflow-hidden rounded-xl">
              <img
                src={event.image}
                alt={event.title}
                className="w-full h-full object-cover rounded-xl"
                loading="lazy"
                decoding="async"
              />
            </div>

            {/* Event Info */}
            <div>
              <h3 className="text-lg font-bold text-white mb-2 font-montserrat">{event.title}</h3>
              <div className="text-white/80 text-sm space-y-1">
                <p className="flex items-center gap-2">
                  <span>📅</span> {new Date(event.date).toLocaleDateString()} at {formatTime12Hour(event.time)}
                </p>
                <p className="flex items-center gap-2">
                  <span>📍</span> {event.venue}
                </p>
              </div>
            </div>

            {/* Pass Types */}
            <div>
              <label className="block text-white/90 text-sm font-medium mb-2">Select Pass Type</label>
              <div className="space-y-2">
                {event.passes.map((pass) => (
                  <button
                    key={pass.id}
                    type="button"
                    className={`w-full p-3 rounded-lg border text-left transition-all duration-200 ${
                      bookingForm.passType === pass.id
                        ? 'bg-purple-600/20 border-purple-500/50 shadow-[0_0_10px_rgba(138,43,226,0.3)]'
                        : 'bg-white/5 border-white/20 hover:bg-white/10'
                    }`}
                    onClick={() => handleInputChange('passType', pass.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-white font-medium text-sm font-poppins">{pass.name}</div>
                        <div className="text-white/60 text-xs">{pass.available} available</div>
                      </div>
                      <div className="text-yellow-400 font-bold font-montserrat">₹{pass.price}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Booking Form */}
          <div>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Quantity and Total Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/90 text-sm font-medium mb-2">Quantity</label>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={decrementQuantity}
                      disabled={bookingForm.quantity <= 1}
                      className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                      -
                    </button>
                    <span className="text-white font-semibold w-8 text-center">
                      {bookingForm.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={incrementQuantity}
                      disabled={bookingForm.quantity >= (selectedPass?.available || 10)}
                      className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-white/90 text-sm font-medium mb-2">Total Amount</label>
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10 text-center">
                    <span className="text-white font-bold text-lg font-montserrat">₹{total}</span>
                  </div>
                </div>
              </div>

              {/* Personal Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-white/90 text-sm font-medium mb-2">Full Name</label>
                  <input
                    type="text"
                    value={bookingForm.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all duration-200"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white/90 text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={bookingForm.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all duration-200"
                    placeholder="Enter your email address"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white/90 text-sm font-medium mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={bookingForm.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all duration-200"
                    placeholder="Enter your phone number"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2 text-sm bg-purple-600 hover:bg-purple-700 border-purple-700"
              >
                {isSubmitting ? 'Processing...' : 'Book Now'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </GlassmorphModal>
  );
}
