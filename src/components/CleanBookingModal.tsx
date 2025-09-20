'use client';

import React, { useState, lazy, Suspense } from 'react';
import Image from 'next/image';
import GlassmorphModal from './GlassmorphModal';
import Button from './Button';
import StudentVerificationUpload from './StudentVerificationUpload';
import { EventData, PassType, validateReferralCode, calculateDiscount, calculateCommission } from '@/lib/data';
import { studentVerificationService, type VerificationResult } from '@/lib/studentVerification';
import { validateBookingData, sanitizeInput, ValidationResult } from '@/lib/validation';
import { Users, Tag, GraduationCap, Calendar, MapPin, Clock, Ticket, Minus, Plus, AlertTriangle, Upload, FileImage, X } from 'lucide-react';

// Lazy load heavy components
const BookingSuccessModal = lazy(() => import('./BookingSuccessModal'));

interface CleanBookingModalProps {
  event: EventData | null;
  isOpen: boolean;
  onClose: () => void;
  onBooked: () => void;
}

interface BookingForm {
  selectedDay: string;
  passType: string;
  quantity: number;
  name: string;
  email: string;
  phone: string;
  referralCode: string; // For influencer codes
  promoCode: string; // For admin/student promo codes
}

interface CodeValidation {
  isValid: boolean;
  isChecking: boolean;
  type?: 'influencer' | 'admin_promo' | 'student_promo';
  influencer?: any;
  discountPercentage?: number;
  promo?: any;
  discountAmount?: number;
  error?: string;
  requiresVerification?: boolean;
  college?: any;
}

// Helper function to format 24-hour time to 12-hour format
const formatTime12Hour = (time24: string): string => {
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

export default function CleanBookingModal({ event, isOpen, onClose, onBooked }: CleanBookingModalProps) {
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    selectedDay: '',
    passType: '',
    quantity: 1,
    name: '',
    email: '',
    phone: '',
    referralCode: '',
    promoCode: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [referralValidation, setReferralValidation] = useState<CodeValidation>({
    isValid: false,
    isChecking: false
  });
  const [promoValidation, setPromoValidation] = useState<CodeValidation>({
    isValid: false,
    isChecking: false
  });
  const [studentVerificationId, setStudentVerificationId] = useState<string | null>(null);
  const [studentIdFile, setStudentIdFile] = useState<File | null>(null);
  const [studentIdPreview, setStudentIdPreview] = useState<string | null>(null);
  const [isUploadingStudentId, setIsUploadingStudentId] = useState(false);
  const [showStudentUpload, setShowStudentUpload] = useState(false);
  const [studentVerificationResult, setStudentVerificationResult] = useState<VerificationResult | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [bookingResult, setBookingResult] = useState<any>(null);

  // Validate referral code (influencer codes only)
  React.useEffect(() => {
    if (!bookingForm.referralCode.trim()) {
      setReferralValidation({ isValid: false, isChecking: false });
      return;
    }

    setReferralValidation(prev => ({ ...prev, isChecking: true }));

    const timeoutId = setTimeout(async () => {
      try {
        const availablePasses = getAvailablePasses();
        const selectedPass = availablePasses.find(pass => pass.id === bookingForm.passType);
        const orderAmount = selectedPass ? selectedPass.price * bookingForm.quantity : 0;

        const validation = await validateReferralCode(
          bookingForm.referralCode,
          event?.id,
          orderAmount
        );

        // Only accept influencer codes here
        if (validation.isValid && validation.isInfluencerCode) {
          setReferralValidation({
            isValid: true,
            isChecking: false,
            type: 'influencer',
            influencer: validation.influencer,
            discountPercentage: validation.discountPercentage,
            discountAmount: validation.discountAmount
          });
        } else {
          setReferralValidation({
            isValid: false,
            isChecking: false,
            error: validation.isValid ? 'This is not an influencer referral code' : 'Invalid referral code'
          });
        }
      } catch (error) {
        setReferralValidation({
          isValid: false,
          isChecking: false,
          error: 'Error validating referral code'
        });
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [bookingForm.referralCode, bookingForm.passType, bookingForm.quantity, event]);

  // Validate promo code (admin and student codes)
  React.useEffect(() => {
    if (!bookingForm.promoCode.trim()) {
      setPromoValidation({ isValid: false, isChecking: false });
      return;
    }

    setPromoValidation(prev => ({ ...prev, isChecking: true }));

    const timeoutId = setTimeout(async () => {
      try {
        const availablePasses = getAvailablePasses();
        const selectedPass = availablePasses.find(pass => pass.id === bookingForm.passType);
        const orderAmount = selectedPass ? selectedPass.price * bookingForm.quantity : 0;

        // Check if it's a student promo code (simplified for now)
        const isStudentCode = bookingForm.promoCode.toLowerCase().includes('student');

        if (isStudentCode) {
          // Simple student verification for demo
          const eligibility = { isEligible: true, discount: 10 };

          if (eligibility.isEligible) {
            setPromoValidation({
              isValid: true,
              isChecking: false,
              type: 'student_promo',
              discountAmount: orderAmount * (eligibility.discount / 100),
              college: 'Student University',
              requiresVerification: true
            });
          } else {
            setPromoValidation({
              isValid: false,
              isChecking: false,
              error: 'Student verification failed'
            });
          }
          return;
        }

        // Check admin promo codes
        const validation = await validateReferralCode(
          bookingForm.promoCode,
          event?.id,
          orderAmount
        );

        if (validation.isValid && !validation.isInfluencerCode) {
          setPromoValidation({
            isValid: true,
            isChecking: false,
            type: 'admin_promo',
            promo: validation.promo,
            discountAmount: validation.discountAmount
          });
        } else {
          setPromoValidation({
            isValid: false,
            isChecking: false,
            error: 'Invalid promo code'
          });
        }
      } catch (error) {
        setPromoValidation({
          isValid: false,
          isChecking: false,
          error: 'Error validating promo code'
        });
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [bookingForm.promoCode, bookingForm.passType, bookingForm.quantity, bookingForm.email, event]);

  // Set defaults when modal opens
  React.useEffect(() => {
    if (isOpen && event) {
      const isMultiDay = event.isMultiDay && event.eventDays && event.eventDays.length > 0;
      console.log('Modal opened for event:', event.title);
      console.log('Is multi-day:', isMultiDay);
      console.log('Event days:', event.eventDays);

      if (isMultiDay) {
        const firstDayId = event.eventDays?.[0]?.id || '';
        console.log('Setting default day to:', firstDayId);
        setBookingForm(prev => ({
          ...prev,
          selectedDay: firstDayId,
          passType: '', // Will be set by the next useEffect
          quantity: 1,
          name: '',
          email: '',
          phone: '',
          referralCode: '',
          promoCode: ''
        }));
        // Reset student verification when modal opens
        setStudentIdFile(null);
        setStudentIdPreview(null);
        setStudentVerificationId(null);
      } else {
        setBookingForm(prev => ({
          ...prev,
          selectedDay: '',
          passType: event.passes?.[0]?.id || '',
          quantity: 1,
          name: '',
          email: '',
          phone: '',
          referralCode: '',
          promoCode: ''
        }));
        // Reset student verification when modal opens
        setStudentIdFile(null);
        setStudentIdPreview(null);
        setStudentVerificationId(null);
      }
    }
  }, [isOpen, event]);

  // Update pass type when day changes
  React.useEffect(() => {
    if (!event) return;

    const availablePasses = getAvailablePasses();
    console.log('Pass selection effect:', {
      selectedDay: bookingForm.selectedDay,
      availablePasses: availablePasses.length,
      currentPassType: bookingForm.passType
    });

    if (availablePasses.length > 0) {
      // Only update if current pass type is not valid for new day
      const currentPassValid = availablePasses.find(pass => pass.id === bookingForm.passType);
      if (!currentPassValid) {
        setBookingForm(prev => ({
          ...prev,
          passType: availablePasses[0].id
        }));
      }
    } else {
      // Clear pass type if no passes available for selected day
      setBookingForm(prev => ({
        ...prev,
        passType: ''
      }));
    }
  }, [bookingForm.selectedDay, event]);

  if (!event) return null;

  const isMultiDay = event.isMultiDay && event.eventDays && event.eventDays.length > 0;

  const getAvailablePasses = (): PassType[] => {
    if (!isMultiDay) {
      return event.passes || [];
    }

    if (!bookingForm.selectedDay) {
      console.log('No day selected yet');
      return [];
    }

    console.log('Selected day ID:', bookingForm.selectedDay);
    console.log('Available event days:', event.eventDays);

    const selectedDay = event.eventDays?.find(day => day.id === bookingForm.selectedDay);
    console.log('Found selected day:', selectedDay);
    console.log('Passes for selected day:', selectedDay?.passes);

    return selectedDay?.passes || [];
  };

  const availablePasses = getAvailablePasses();

  // Calculate total pricing with all discounts
  const calculateTotalPricing = () => {
    const selectedPass = availablePasses.find(pass => pass.id === bookingForm.passType);
    if (!selectedPass) return { originalAmount: 0, discountAmount: 0, finalAmount: 0 };

    const originalAmount = selectedPass.price * bookingForm.quantity;
    let totalDiscountAmount = 0;

    // Apply referral discount (influencer)
    if (referralValidation.isValid && referralValidation.discountAmount) {
      totalDiscountAmount += referralValidation.discountAmount;
    }

    // Apply promo discount (admin or student)
    if (promoValidation.isValid && promoValidation.discountAmount) {
      totalDiscountAmount += promoValidation.discountAmount;
    }

    const finalAmount = originalAmount - totalDiscountAmount;
    return { originalAmount, discountAmount: totalDiscountAmount, finalAmount: Math.max(0, finalAmount) };
  };

  const pricing = calculateTotalPricing();

  const handleInputChange = (field: keyof BookingForm, value: string | number) => {
    setBookingForm(prev => ({
      ...prev,
      [field]: value
    }));
  };


  const handleStudentIdUpload = async (file: File) => {
    setIsUploadingStudentId(true);
    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setStudentIdPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      setStudentIdFile(file);

      // For now, automatically mark as verified when file is uploaded
      // In production, this would be sent to a verification service
      setTimeout(() => {
        setStudentVerificationId('verified');
        setIsUploadingStudentId(false);
      }, 1000);

    } catch (error) {
      console.error('Student ID upload failed:', error);
      setIsUploadingStudentId(false);
    }
  };

  const removeStudentId = () => {
    setStudentIdFile(null);
    setStudentIdPreview(null);
    setStudentVerificationId(null);
  };

  const handleStudentVerificationComplete = (result: VerificationResult) => {
    setStudentVerificationResult(result);
    if (result.isVerified) {
      // Automatically apply student discount
      setPromoValidation({
        isValid: true,
        isChecking: false,
        type: 'student_promo',
        discountPercentage: result.discountPercentage,
        discountAmount: calculateStudentDiscountAmount(result.discountPercentage)
      });
    }
  };

  const handleStudentDiscountApplied = (discountPercentage: number, code: string) => {
    // Update promo code field with the generated discount code
    setBookingForm(prev => ({
      ...prev,
      promoCode: code
    }));
  };

  const calculateStudentDiscountAmount = (discountPercentage: number) => {
    const selectedPass = getAvailablePasses().find(pass => pass.id === bookingForm.passType);
    if (!selectedPass) return 0;
    const originalAmount = selectedPass.price * bookingForm.quantity;
    return Math.round(originalAmount * (discountPercentage / 100));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous validation errors
    setValidationErrors([]);
    setFieldErrors({});

    // Comprehensive form validation
    const bookingData = {
      customerName: bookingForm.name,
      customerEmail: bookingForm.email,
      customerPhone: bookingForm.phone,
      quantity: bookingForm.quantity,
      passType: bookingForm.passType,
      eventId: event?.id || '',
      promoCode: bookingForm.promoCode
    };

    const validation = validateBookingData({
      name: bookingData.customerName,
      email: bookingData.customerEmail,
      phone: bookingData.customerPhone,
      quantity: bookingData.quantity
    });

    if (!validation.isValid) {
      setValidationErrors(validation.errors);

      // Set field-specific errors
      const fieldErrorMap: Record<string, string> = {};
      validation.errors.forEach(error => {
        if (error.startsWith('Name:')) fieldErrorMap.name = error.substring(5).trim();
        if (error.startsWith('Email:')) fieldErrorMap.email = error.substring(6).trim();
        if (error.startsWith('Phone:')) fieldErrorMap.phone = error.substring(6).trim();
        if (error.startsWith('Quantity:')) fieldErrorMap.quantity = error.substring(9).trim();
        if (error.startsWith('Pass type:')) fieldErrorMap.passType = error.substring(10).trim();
        if (error.startsWith('Event:')) fieldErrorMap.event = error.substring(6).trim();
      });
      setFieldErrors(fieldErrorMap);

      return;
    }

    // Check if we have valid passes available
    const availablePassesForSubmit = getAvailablePasses();
    if (availablePassesForSubmit.length === 0) {
      setValidationErrors(['No passes available for the selected event/day']);
      return;
    }

    // Check if selected pass type is valid
    if (!bookingForm.passType || !availablePassesForSubmit.find(pass => pass.id === bookingForm.passType)) {
      setValidationErrors(['Please select a valid pass type']);
      return;
    }

    // Check if student verification is required
    if (promoValidation.isValid &&
        promoValidation.type === 'student_promo' &&
        promoValidation.requiresVerification &&
        !studentVerificationId) {
      setValidationErrors(['Please upload your student ID to verify student status']);
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedPass = availablePasses.find(pass => pass.id === bookingForm.passType);
      if (!selectedPass) {
        console.error('Pass selection error:', {
          selectedPassType: bookingForm.passType,
          availablePasses: availablePasses,
          selectedDay: bookingForm.selectedDay,
          isMultiDay: event.isMultiDay
        });
        throw new Error('Please select a valid pass type');
      }

      const totalAmount = pricing.finalAmount;

      // Create Razorpay order
      const orderResponse = await fetch('/api/razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: totalAmount,
          currency: 'INR',
          receipt: `receipt_${Date.now()}`,
        }),
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to create payment order');
      }

      const orderData = await orderResponse.json();

      if (!orderData.success) {
        throw new Error('Failed to create payment order');
      }

      // Initialize Razorpay payment
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: '797 Events',
        description: `${event.title} - ${selectedPass.name} x${bookingForm.quantity}`,
        order_id: orderData.order_id,
        handler: async function (response: any) {
          // Enhanced verification data
          const verifyResponse = await fetch('/api/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              eventDetails: {
                id: event.id,
                title: event.title,
                date: event.date,
                time: event.time,
                venue: event.venue,
                venueIcon: event.venueIcon,
                image: event.image,
                passType: selectedPass.name,
                passId: selectedPass.id,
                quantity: bookingForm.quantity,
                amount: totalAmount,
                isMultiDay: event.isMultiDay,
                selectedDayId: bookingForm.selectedDay,
                eventDays: event.eventDays
              },
              customerDetails: {
                name: bookingForm.name,
                email: bookingForm.email,
                phone: bookingForm.phone
              },
              discountDetails: {
                referralCode: bookingForm.referralCode || undefined,
                promoCode: bookingForm.promoCode || undefined,
                influencerId: referralValidation.influencer?.id || undefined,
                originalAmount: pricing.originalAmount,
                discountAmount: pricing.discountAmount,
                studentVerificationId: studentVerificationId || undefined
              }
            }),
          });

          const verifyData = await verifyResponse.json();

          if (verifyData.success) {
            // Store booking result and show success modal
            setBookingResult(verifyData);
            setShowSuccessModal(true);
            onBooked();
          } else {
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: bookingForm.name,
          email: bookingForm.email,
          contact: bookingForm.phone,
        },
        theme: { color: '#8b5cf6' },
      };

      // Load and open Razorpay
      if (typeof window.Razorpay === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
          const rzp = new window.Razorpay(options);
          rzp.open();
        };
        document.body.appendChild(script);
      } else {
        const rzp = new window.Razorpay(options);
        rzp.open();
      }

    } catch (error) {
      console.error('Booking error:', error);
      alert(`Booking failed: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedPass = availablePasses.find(p => p.id === bookingForm.passType) || availablePasses[0];

  // Don't prevent modal from showing for multi-day events even if no passes are available initially
  // User needs to select a day first to see passes
  if (availablePasses.length === 0 && !isMultiDay) return null;

  return (
    <>
      <GlassmorphModal
        isOpen={isOpen}
        onClose={onClose}
        title={`Book ${event.title}`}
        width="900px"
      >
        <div className="w-full max-w-4xl mx-auto overflow-y-auto" style={{ maxHeight: '80vh' }}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Event Header */}
            <div className="relative h-40 overflow-hidden rounded-xl bg-black/20 mb-6">
              <Image
                src={event.image}
                alt={event.title}
                fill
                className="object-cover rounded-xl"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-xl font-bold text-white mb-2">{event.title}</h3>
                <div className="flex flex-wrap gap-4 text-white/90 text-sm">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    {new Date(event.date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    {formatTime12Hour(event.time)}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin size={14} />
                    {event.venue}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Form Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Left Column - Pass Selection & Quantity */}
              <div className="lg:col-span-1 space-y-4">
                <h4 className="text-white font-semibold text-lg mb-4">Pass Selection</h4>

                {/* Day Selection for Multi-Day Events */}
                {isMultiDay && event.eventDays && (
                  <div>
                    <label className="block text-white/90 text-sm font-medium mb-2">Event Day</label>
                    <select
                      value={bookingForm.selectedDay}
                      onChange={(e) => handleInputChange('selectedDay', e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all duration-200"
                      required
                    >
                      {event.eventDays.map((day) => (
                        <option key={day.id} value={day.id} className="bg-gray-800">
                          Day {day.dayNumber} - {day.title} ({new Date(day.date).toLocaleDateString()})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Pass Type Selection */}
                <div>
                  <label className="block text-white/90 text-sm font-medium mb-2">
                    <Ticket className="inline mr-1" size={14} />
                    Pass Type
                  </label>
                  {availablePasses.length > 0 ? (
                    <select
                      value={bookingForm.passType}
                      onChange={(e) => handleInputChange('passType', e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all duration-200"
                      required
                    >
                      {availablePasses.map((pass) => (
                        <option key={pass.id} value={pass.id} className="bg-gray-800">
                          {pass.name} - ₹{pass.price.toLocaleString()} ({pass.available} available)
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white/60 text-center">
                      {isMultiDay ? 'Please select a day first to see available passes' : 'No passes available'}
                    </div>
                  )}
                </div>

                {/* Quantity Selection */}
                <div>
                  <label className="block text-white/90 text-sm font-medium mb-2">Quantity</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => bookingForm.quantity > 1 && handleInputChange('quantity', bookingForm.quantity - 1)}
                      disabled={bookingForm.quantity <= 1}
                      className="w-10 h-10 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <Minus size={16} />
                    </button>
                    <div className="flex-1 text-center">
                      <span className="text-white font-semibold text-lg">{bookingForm.quantity}</span>
                      <div className="text-white/60 text-xs">tickets</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => bookingForm.quantity < (selectedPass?.available || 10) && handleInputChange('quantity', bookingForm.quantity + 1)}
                      disabled={bookingForm.quantity >= (selectedPass?.available || 10)}
                      className="w-10 h-10 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* Price Summary */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10 mt-6">
                  <h5 className="text-white font-medium mb-3">Price Summary</h5>
                  {availablePasses.length === 0 ? (
                    <div className="text-center text-white/60">
                      {isMultiDay ? 'Select a day to see pricing' : 'No passes available'}
                    </div>
                  ) : pricing.discountAmount > 0 ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-white/70">Original Amount:</span>
                        <span className="text-white/70 line-through">₹{pricing.originalAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-400">Total Discount:</span>
                        <span className="text-green-400">-₹{pricing.discountAmount.toLocaleString()}</span>
                      </div>
                      <div className="border-t border-white/10 pt-2">
                        <div className="flex justify-between">
                          <span className="text-white font-semibold">Final Amount:</span>
                          <span className="text-white font-bold text-xl">₹{pricing.finalAmount.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <span className="text-white font-bold text-xl">₹{pricing.finalAmount.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Customer Details & Codes */}
              <div className="lg:col-span-2 space-y-6">
                <h4 className="text-white font-semibold text-lg">Customer Information</h4>

                {/* Validation Errors Display */}
                {validationErrors.length > 0 && (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle size={16} className="text-red-400" />
                      <span className="text-red-200 font-medium text-sm">Please fix the following errors:</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-red-200 text-sm">
                      {validationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Customer Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/90 text-sm font-medium mb-2">Full Name *</label>
                    <input
                      type="text"
                      value={bookingForm.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:bg-white/15 transition-all duration-200 ${
                        fieldErrors.name
                          ? 'border-red-500 focus:border-red-400'
                          : 'border-white/20 focus:border-white/40'
                      }`}
                      placeholder="Enter your full name"
                      required
                    />
                    {fieldErrors.name && (
                      <p className="text-red-400 text-xs mt-1">{fieldErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-white/90 text-sm font-medium mb-2">Phone Number *</label>
                    <input
                      type="tel"
                      value={bookingForm.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:bg-white/15 transition-all duration-200 ${
                        fieldErrors.phone
                          ? 'border-red-500 focus:border-red-400'
                          : 'border-white/20 focus:border-white/40'
                      }`}
                      placeholder="Enter your phone number"
                      required
                    />
                    {fieldErrors.phone && (
                      <p className="text-red-400 text-xs mt-1">{fieldErrors.phone}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-white/90 text-sm font-medium mb-2">Email Address *</label>
                  <input
                    type="email"
                    value={bookingForm.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:bg-white/15 transition-all duration-200 ${
                      fieldErrors.email
                        ? 'border-red-500 focus:border-red-400'
                        : 'border-white/20 focus:border-white/40'
                    }`}
                    placeholder="Enter your email address"
                    required
                  />
                  {fieldErrors.email && (
                    <p className="text-red-400 text-xs mt-1">{fieldErrors.email}</p>
                  )}
                </div>

                {/* Discount Codes Section */}
                <div className="space-y-4">
                  <h5 className="text-white font-medium">Discount Codes (Optional)</h5>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Referral Code (Influencer) */}
                    <div>
                      <label className="flex items-center gap-2 text-white/90 text-sm font-medium mb-2">
                        <Users size={14} />
                        Influencer Code
                      </label>
                      <input
                        type="text"
                        value={bookingForm.referralCode}
                        onChange={(e) => handleInputChange('referralCode', e.target.value.toUpperCase())}
                        className={`w-full px-4 py-3 border rounded-lg text-white placeholder-white/50 focus:outline-none transition-all duration-200 ${
                          referralValidation.isChecking
                            ? 'bg-yellow-500/10 border-yellow-500/30'
                            : referralValidation.isValid
                            ? 'bg-green-500/10 border-green-500/30 focus:border-green-500/50'
                            : bookingForm.referralCode && referralValidation.error
                            ? 'bg-red-500/10 border-red-500/30 focus:border-red-500/50'
                            : 'bg-white/10 border-white/20 focus:border-white/40 focus:bg-white/15'
                        }`}
                        placeholder="Enter influencer code"
                      />
                      {referralValidation.isChecking && (
                        <p className="text-yellow-400 text-xs mt-1">Checking code...</p>
                      )}
                      {referralValidation.isValid && (
                        <p className="text-green-400 text-xs mt-1">
                          ✅ {referralValidation.discountPercentage}% discount by {referralValidation.influencer?.name}
                        </p>
                      )}
                      {bookingForm.referralCode && referralValidation.error && (
                        <p className="text-red-400 text-xs mt-1">{referralValidation.error}</p>
                      )}
                    </div>

                    {/* Promo Code (Admin/Student) */}
                    <div>
                      <label className="flex items-center gap-2 text-white/90 text-sm font-medium mb-2">
                        {promoValidation.type === 'student_promo' ? <GraduationCap size={14} /> : <Tag size={14} />}
                        Promo Code
                      </label>
                      <input
                        type="text"
                        value={bookingForm.promoCode}
                        onChange={(e) => handleInputChange('promoCode', e.target.value.toUpperCase())}
                        className={`w-full px-4 py-3 border rounded-lg text-white placeholder-white/50 focus:outline-none transition-all duration-200 ${
                          promoValidation.isChecking
                            ? 'bg-yellow-500/10 border-yellow-500/30'
                            : promoValidation.isValid
                            ? 'bg-green-500/10 border-green-500/30 focus:border-green-500/50'
                            : bookingForm.promoCode && promoValidation.error
                            ? 'bg-red-500/10 border-red-500/30 focus:border-red-500/50'
                            : 'bg-white/10 border-white/20 focus:border-white/40 focus:bg-white/15'
                        }`}
                        placeholder="VIT25, PES20, WELCOME10"
                      />
                      {promoValidation.isChecking && (
                        <p className="text-yellow-400 text-xs mt-1">Checking code...</p>
                      )}
                      {promoValidation.isValid && (
                        <div className="text-xs mt-1">
                          {promoValidation.type === 'student_promo' ? (
                            <div>
                              <p className="text-green-400">
                                🎓 10% student discount
                                {promoValidation.requiresVerification && ' (ID verification required)'}
                              </p>
                              {studentVerificationId === 'verified' && (
                                <p className="text-blue-400 mt-1">✅ Student ID verified!</p>
                              )}
                            </div>
                          ) : (
                            <p className="text-green-400">✅ Valid promo code!</p>
                          )}
                        </div>
                      )}
                      {bookingForm.promoCode && promoValidation.error && (
                        <p className="text-red-400 text-xs mt-1">{promoValidation.error}</p>
                      )}
                    </div>

                    {/* Student ID Verification Upload */}
                    <div className="mt-6 p-4 border border-purple-400 rounded-lg bg-purple-600/10">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-white font-medium flex items-center gap-2">
                          <GraduationCap className="h-4 w-4" />
                          Student Verification
                        </h4>
                        {!showStudentUpload && (
                          <button
                            type="button"
                            onClick={() => setShowStudentUpload(true)}
                            className="text-purple-400 hover:text-purple-300 text-sm underline"
                          >
                            Upload Student ID for 10% Discount
                          </button>
                        )}
                      </div>

                      {showStudentUpload && (
                        <StudentVerificationUpload
                          onVerificationComplete={handleStudentVerificationComplete}
                          onDiscountApplied={handleStudentDiscountApplied}
                          disabled={isSubmitting}
                        />
                      )}

                      {studentVerificationResult && !showStudentUpload && (
                        <div className="text-sm text-gray-300">
                          <p>✅ Student ID verified - {studentVerificationResult.discountPercentage}% discount applied</p>
                          <button
                            type="button"
                            onClick={() => setShowStudentUpload(true)}
                            className="text-purple-400 hover:text-purple-300 text-xs underline mt-1"
                          >
                            View Details
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Student ID Upload Section */}
                  {promoValidation.isValid && promoValidation.type === 'student_promo' && promoValidation.requiresVerification && (
                    <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <GraduationCap size={16} className="text-blue-400" />
                        <h6 className="text-blue-400 font-medium text-sm">Student ID Verification Required</h6>
                      </div>

                      {!studentIdFile ? (
                        <div>
                          <p className="text-white/80 text-sm mb-3">
                            Please upload a clear photo of your student ID to verify your student status and get the 10% discount.
                          </p>
                          <div className="relative">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleStudentIdUpload(file);
                              }}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              id="student-id-upload"
                            />
                            <label
                              htmlFor="student-id-upload"
                              className="flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed border-blue-400/50 rounded-lg cursor-pointer hover:border-blue-400 transition-colors"
                            >
                              <Upload size={20} className="text-blue-400" />
                              <span className="text-blue-400 font-medium">
                                {isUploadingStudentId ? 'Uploading...' : 'Click to upload Student ID'}
                              </span>
                            </label>
                          </div>
                          <p className="text-white/60 text-xs mt-2">
                            Supported formats: JPG, PNG, PDF (Max 5MB)
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileImage size={16} className="text-green-400" />
                              <span className="text-green-400 text-sm font-medium">
                                {studentIdFile.name}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={removeStudentId}
                              className="p-1 text-red-400 hover:text-red-300 transition-colors"
                            >
                              <X size={16} />
                            </button>
                          </div>

                          {studentIdPreview && (
                            <div className="relative w-full max-w-xs mx-auto">
                              <img
                                src={studentIdPreview}
                                alt="Student ID Preview"
                                className="w-full h-32 object-cover rounded-lg border border-white/20"
                              />
                            </div>
                          )}

                          {studentVerificationId === 'verified' && (
                            <div className="flex items-center gap-2 text-green-400 text-sm">
                              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                              Student ID verified! 10% discount applied.
                            </div>
                          )}

                          {isUploadingStudentId && (
                            <div className="flex items-center gap-2 text-blue-400 text-sm">
                              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                              Verifying student status...
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t border-white/10">
              <Button
                type="submit"
                disabled={isSubmitting || availablePasses.length === 0}
                className="w-full py-4 text-lg bg-purple-600 hover:bg-purple-700 border-purple-700"
              >
                {isSubmitting ? 'Processing...' :
                 availablePasses.length === 0 ? (isMultiDay ? 'Select a Day First' : 'No Passes Available') :
                 promoValidation.isValid && promoValidation.requiresVerification && !studentVerificationId ?
                 'Upload Student ID to Continue' : 'Proceed to Payment'}
              </Button>
            </div>
          </form>
        </div>
      </GlassmorphModal>


      {/* Booking Success Modal */}
      {showSuccessModal && bookingResult && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"><div className="text-white">Loading...</div></div>}>
          <BookingSuccessModal
            isOpen={showSuccessModal}
            onClose={() => {
              setShowSuccessModal(false);
              setBookingResult(null);
              onClose();
            }}
            bookingData={bookingResult}
            customerEmail={bookingForm.email}
          />
        </Suspense>
      )}
    </>
  );
}