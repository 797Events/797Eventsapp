// Test script to generate demo ticket with custom template
const { generateTicketPDF } = require('./src/lib/ticketGenerator.ts');

// Sample ticket data
const demoTicketData = {
  bookingId: 'BOOK_797_12345',
  ticketId: 'TKT_DEMO_001',
  eventTitle: 'The Great Indian Navratri 2025',
  eventDate: '2025-09-27',
  eventTime: '5:00 PM',
  eventVenue: 'Moze College, Balewadi, Pune',
  customerName: 'John Doe',
  customerEmail: 'john.doe@example.com',
  customerPhone: '+91 9876543210',
  passType: 'VIP Pass',
  quantity: 1,
  totalAmount: 1500,
  eventId: 'evt_navratri_2025'
};

// Generate demo ticket
generateTicketPDF(demoTicketData)
  .then(blob => {
    console.log('Demo ticket generated successfully!');
    console.log('Blob size:', blob.size, 'bytes');
    // In a real environment, this would be downloaded or saved
  })
  .catch(error => {
    console.error('Error generating demo ticket:', error);
  });