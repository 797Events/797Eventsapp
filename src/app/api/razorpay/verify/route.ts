import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔹 Razorpay payment verification request:', body);

    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, eventDetails, customerDetails, discountDetails } = body;

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    // Verify payment signature
    const body_string = razorpay_order_id + "|" + razorpay_payment_id;
    const expected_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body_string.toString())
      .digest('hex');

    if (expected_signature !== razorpay_signature) {
      console.error('❌ Invalid payment signature');
      return NextResponse.json(
        { success: false, error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    // Fetch payment details from Razorpay
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    if (payment.status !== 'captured' && payment.status !== 'authorized') {
      console.error('❌ Payment not successful:', payment.status);
      return NextResponse.json(
        { success: false, error: 'Payment not successful' },
        { status: 400 }
      );
    }

    console.log('✅ Payment verified successfully:', razorpay_payment_id);

    // Generate unique booking and ticket IDs
    const booking_id = `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const ticket_id = `TKT${Date.now().toString().slice(-8)}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Save booking to database
    const { unifiedDb } = await import('@/lib/unifiedDatabase');

    try {
      // Get the event to find the pass ID
      const eventId = eventDetails?.id || 'unknown';
      const event = await unifiedDb.getEventById(eventId);

      // Find the correct pass ID from the event details or event data
      let passId = eventDetails?.passId || 'unknown';
      if (passId === 'unknown' && event?.passes?.[0]) {
        passId = event.passes[0].id; // Fallback to first pass
      }

      const booking = await unifiedDb.createBooking({
        eventId: eventId,
        passId: passId,
        customerName: customerDetails?.name || 'Unknown Customer',
        customerEmail: customerDetails?.email || 'unknown@email.com',
        customerPhone: customerDetails?.phone || 'N/A',
        quantity: eventDetails?.quantity || 1,
        totalAmount: Number(payment.amount) / 100,
        paymentId: razorpay_payment_id,
        bookingStatus: 'confirmed' as const,
        referralCode: discountDetails?.referralCode,
        discountAmount: discountDetails?.discountAmount,
        originalAmount: discountDetails?.originalAmount
      });

      if (booking) {
        console.log('✅ Booking saved successfully:', booking);

        // Add analytics tracking for this booking
        try {
          const { supabase } = await import('@/lib/supabase');

          await supabase
            .from('booking_analytics')
            .insert([{
              booking_id: booking,
              event_id: eventId,
              revenue: Number(payment.amount) / 100,
              commission: 0, // Can be calculated if there's a referral
              date: new Date().toISOString().split('T')[0]
            }]);

          console.log('📊 Analytics record created for booking:', booking);
        } catch (analyticsError) {
          console.error('📊 Warning: Analytics tracking failed:', analyticsError);
          // Don't fail the payment if analytics fails
        }

        // Generate PDF ticket with comprehensive data
        const { generateTicketPDF, generateTicketId, enhanceTicketData, getNextTicketSequence } = await import('@/lib/ticketGenerator');

        // Generate proper TGIN ticket ID format
        const dayNumber = eventDetails?.passDetails?.dayNumber || 1; // Get day from pass details
        const sequenceNumber = await getNextTicketSequence(dayNumber); // Get next sequence from database
        const ticketId = generateTicketId(dayNumber, sequenceNumber);

        // Create basic ticket data with all available information
        const basicTicketData: any = {
          bookingId: booking,
          ticketId: ticketId,
          eventTitle: eventDetails?.title || 'Event',
          eventDate: eventDetails?.date || new Date().toISOString().split('T')[0],
          eventTime: eventDetails?.time || '00:00',
          eventVenue: eventDetails?.venue || 'TBD',
          eventImage: eventDetails?.image || '/Assets/Passes_outlet design.jpg',
          customerName: customerDetails?.name || 'Customer',
          customerEmail: customerDetails?.email || 'unknown@email.com',
          customerPhone: customerDetails?.phone || '',
          passType: eventDetails?.passType || 'Standard',
          quantity: eventDetails?.quantity || 1,
          totalAmount: Number(payment.amount) / 100,
          originalAmount: discountDetails?.originalAmount || Number(payment.amount) / 100,
          discountAmount: discountDetails?.discountAmount || 0,
          referralCode: discountDetails?.referralCode || '',
          eventId: eventDetails?.id,
          passId: passId,
          isMultiDay: eventDetails?.isMultiDay || false
        };

        // For multi-day events, find the specific day details
        if (eventDetails?.isMultiDay && eventDetails?.selectedDayId && eventDetails?.eventDays) {
          const selectedDay = eventDetails.eventDays.find((day: any) => day.id === eventDetails.selectedDayId);
          if (selectedDay) {
            const selectedPass = selectedDay.passes?.find((pass: any) => pass.id === passId);
            if (selectedPass) {
              basicTicketData.passDetails = {
                name: selectedPass.name,
                dayNumber: selectedDay.dayNumber,
                dayTitle: selectedDay.title,
                specificDate: selectedDay.date,
                specificTime: selectedDay.time,
                specificVenue: selectedDay.venue || eventDetails.venue
              };
              // Override main event details with day-specific ones
              basicTicketData.eventDate = selectedDay.date || basicTicketData.eventDate;
              basicTicketData.eventTime = selectedDay.time || basicTicketData.eventTime;
              basicTicketData.eventVenue = selectedDay.venue || basicTicketData.eventVenue;
            }
          }
          basicTicketData.eventDuration = `${eventDetails.eventDays.length} Days`;
        }

        // Enhance ticket data with database information if available
        const enhancedTicketData = await enhanceTicketData(basicTicketData, eventDetails?.id, passId);

        console.log('🎫 Final ticket data for PDF generation:', {
          bookingId: enhancedTicketData.bookingId,
          ticketId: enhancedTicketData.ticketId,
          eventId: enhancedTicketData.eventId,
          eventTitle: enhancedTicketData.eventTitle,
          hasPassDetails: !!enhancedTicketData.passDetails,
          isMultiDay: enhancedTicketData.isMultiDay
        });

        const ticketPDFBuffer = await generateTicketPDF(enhancedTicketData);

        console.log('🎫 PDF ticket generated successfully, size:', ticketPDFBuffer.size, 'bytes');

        // Convert Blob to Buffer for base64 encoding
        const pdfArrayBuffer = await ticketPDFBuffer.arrayBuffer();
        const pdfBuffer = Buffer.from(pdfArrayBuffer);

        // Generate and send ticket email with PDF attachment
        let emailSent = false;
        try {
          const { sendBookingConfirmation } = await import('@/lib/emailService');
          emailSent = await sendBookingConfirmation({
            customerName: customerDetails?.name || 'Customer',
            customerEmail: customerDetails?.email || 'unknown@email.com',
            eventTitle: enhancedTicketData.eventTitle || 'Event',
            eventDate: enhancedTicketData.eventDate || new Date().toISOString().split('T')[0],
            eventTime: enhancedTicketData.eventTime || '00:00',
            eventVenue: enhancedTicketData.eventVenue || 'TBD',
            passType: enhancedTicketData.passType || 'Standard',
            quantity: enhancedTicketData.quantity || 1,
            totalAmount: Number(payment.amount) / 100,
            bookingId: booking
          }, ticketPDFBuffer);
          console.log('📧 Ticket email sent successfully');
        } catch (emailError) {
          console.error('📧 Email sending failed:', emailError);
        }

        return NextResponse.json({
          success: true,
          message: 'Payment verified and booking created successfully',
          booking_id: booking,
          ticket_id: ticket_id,
          payment_id: razorpay_payment_id,
          order_id: razorpay_order_id,
          amount: Number(payment.amount) / 100,
          currency: payment.currency,
          email_sent: emailSent,
          pdf_generated: true,
          pdf_size: ticketPDFBuffer.size,
          ticket_pdf: {
            data: pdfBuffer.toString('base64'),
            filename: `Ticket_${booking}_${ticket_id}.pdf`,
            mimeType: 'application/pdf'
          }
        });
      } else {
        throw new Error('Failed to create booking record');
      }
    } catch (bookingError) {
      console.error('❌ Booking creation failed:', bookingError);

      // Return success for payment but indicate booking issue
      return NextResponse.json({
        success: true,
        message: 'Payment verified but booking creation failed',
        booking_id: booking_id,
        ticket_id: ticket_id,
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
        amount: Number(payment.amount) / 100,
        currency: payment.currency,
        email_sent: false,
        warning: 'Booking not saved to database'
      });
    }
  } catch (error) {
    console.error('❌ Payment verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}