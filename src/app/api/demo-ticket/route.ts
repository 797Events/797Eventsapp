import { NextRequest, NextResponse } from 'next/server';
import { generateTicketPDF } from '@/lib/ticketGenerator';

export async function GET(request: NextRequest) {
  try {
    // Demo ticket data
    const demoTicketData = {
      bookingId: 'DEMO_797_001',
      ticketId: 'TKT_DEMO_001',
      eventTitle: 'The Great Indian Navratri 2025',
      eventDate: '2025-09-27',
      eventTime: '5:00 PM',
      eventVenue: 'Moze College, Balewadi, Pune',
      customerName: 'John Doe',
      customerEmail: 'demo@example.com',
      customerPhone: '+91 9876543210',
      passType: 'VIP Pass',
      quantity: 1,
      totalAmount: 1500,
      eventId: 'evt_demo'
    };

    console.log('Generating demo ticket with custom template...');

    // Generate the PDF
    const pdfBlob = await generateTicketPDF(demoTicketData);

    // Convert blob to buffer
    const buffer = Buffer.from(await pdfBlob.arrayBuffer());

    // Return PDF response
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="demo-ticket-custom.pdf"',
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error: any) {
    console.error('Error generating demo ticket:', error);
    return NextResponse.json(
      { error: 'Failed to generate demo ticket', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}