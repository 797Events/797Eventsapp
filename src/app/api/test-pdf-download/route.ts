import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🎫 Generating sample ticket PDF for download...');

    const { generateTicketPDF, generateTicketId, getNextTicketSequence } = await import('@/lib/ticketGenerator');

    console.log('📄 Generating PDF with sample data...');

    // Generate TGIN ticket ID
    const dayNumber = 1;
    const sequenceNumber = await getNextTicketSequence(dayNumber);
    const ticketId = generateTicketId(dayNumber, sequenceNumber);

    // Sample ticket data
    const sampleTicketData = {
      bookingId: 'booking_1734567890_abc123def',
      ticketId: ticketId,
      eventTitle: 'The Grand Indie Night',
      eventDate: '2025-01-15',
      eventTime: '19:00',
      eventVenue: 'Koramangala Social',
      eventImage: '/Assets/Passes_outlet design.jpg',
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      customerPhone: '+91 98765 43210',
      passType: 'VIP Pass',
      quantity: 2,
      totalAmount: 2000,
      originalAmount: 2200,
      discountAmount: 200,
      referralCode: 'PROMO123',
      eventId: 'event_001',
      passId: 'pass_vip_001',
      isMultiDay: false
    };

    // Generate the PDF
    const pdfBlob = await generateTicketPDF(sampleTicketData);

    console.log('✅ PDF generated successfully, size:', pdfBlob.size, 'bytes');

    // Convert blob to buffer for response
    const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());

    // Return PDF as download
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Sample_Ticket_${ticketId}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}