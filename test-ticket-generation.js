const { generateTicketPDF } = require('./src/lib/ticketGenerator.ts');
const fs = require('fs');

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

async function generateSampleTicket() {
  try {
    console.log('Generating sample ticket PDF...');
    const pdfBlob = await generateTicketPDF(sampleTicketData);

    // Convert blob to buffer
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save to file
    fs.writeFileSync('./sample_ticket.pdf', buffer);
    console.log('✅ Sample ticket saved as: sample_ticket.pdf');
    console.log('📁 File size:', buffer.length, 'bytes');

  } catch (error) {
    console.error('❌ Error generating ticket:', error);
  }
}

generateSampleTicket();