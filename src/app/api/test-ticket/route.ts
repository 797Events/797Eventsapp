import { NextRequest, NextResponse } from 'next/server';
import { generateTicketPDF } from '@/lib/ticketGenerator';

export async function GET(request: NextRequest) {
  try {
    // Sample ticket data to test the PDF generation
    const sampleTicketData = {
      bookingId: 'booking_1702123456_abc123',
      ticketId: 'TKT12345ABC',
      eventTitle: 'Sample Music Festival 2024',
      eventDate: '2024-03-15',
      eventTime: '18:00',
      eventVenue: 'Phoenix Marketcity Mall, Bangalore',
      eventImage: '/Assets/Passes_outlet design.jpg',
      customerName: 'John Doe',
      customerEmail: 'john.doe@example.com',
      customerPhone: '+91 9876543210',
      passType: 'VIP Pass',
      quantity: 2,
      totalAmount: 1800,
      originalAmount: 2000,
      discountAmount: 200,
      referralCode: 'FRIEND20',
      eventId: 'event_123',
      passId: 'pass_456',
      isMultiDay: false
    };

    console.log('Generating sample ticket PDF...');
    const pdfBlob = await generateTicketPDF(sampleTicketData);

    // Convert blob to buffer
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log('✅ Sample ticket generated successfully');
    console.log('📁 File size:', buffer.length, 'bytes');

    // Return the PDF as a downloadable file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="sample_ticket.pdf"',
        'Content-Length': buffer.length.toString()
      }
    });

  } catch (error: any) {
    console.error('❌ Error generating ticket:', error);
    return NextResponse.json(
      { error: 'Failed to generate ticket', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}