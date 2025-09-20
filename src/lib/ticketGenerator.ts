import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

export interface TicketData {
  bookingId: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventVenue: string;
  eventImage?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  passType: string;
  quantity: number;
  totalAmount: number;
  originalAmount?: number;
  discountAmount?: number;
  referralCode?: string;
  ticketId?: string;
  qrCode?: string;
  eventId?: string;
  passId?: string;
  passDetails?: {
    name: string;
    dayNumber?: number;
    dayTitle?: string;
    specificDate?: string;
    specificTime?: string;
    specificVenue?: string;
  };
  isMultiDay?: boolean;
  eventDuration?: string;
}

// Optimized QR Code Generation
async function generateQRCodeOptimized(ticketData: TicketData): Promise<string> {
  try {
    // Minimal essential data only
    const qrData = JSON.stringify({
      bid: ticketData.bookingId,
      tid: ticketData.ticketId,
      eid: ticketData.eventId || 'unk',
      sig: generateSecurityHash(ticketData.bookingId, ticketData.eventId || '', ticketData.customerEmail)
    });

    console.log('QR data size:', qrData.length, 'chars');

    // Use higher error correction for reliability
    const qrCodeUrl = await QRCode.toDataURL(qrData, {
      width: 200,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    return qrCodeUrl;
  } catch (error) {
    console.error('QR generation failed:', error);
    return '';
  }
}

// Safe Text Handling with proper line height calculation
function addSafeText(pdf: any, text: string, x: number, y: number, maxWidth: number, options?: any) {
  try {
    const lines = pdf.splitTextToSize(text, maxWidth);
    pdf.text(lines, x, y, options);
    // Return actual height used based on current font size
    const fontSize = pdf.internal.getFontSize();
    const lineHeight = fontSize * 1.2; // Better line spacing
    return lines.length * lineHeight;
  } catch (error) {
    console.error('Text rendering error:', error);
    pdf.text('Text Error', x, y, options);
    const fontSize = pdf.internal.getFontSize();
    return fontSize * 1.2;
  }
}

// Enhanced Data Validation
function validateTicketData(ticketData: TicketData): string[] {
  const errors: string[] = [];

  if (!ticketData.bookingId) errors.push('Missing booking ID');
  if (!ticketData.eventTitle) errors.push('Missing event title');
  if (!ticketData.customerName) errors.push('Missing customer name');
  if (!ticketData.customerEmail) errors.push('Missing customer email');
  if (!ticketData.passType) errors.push('Missing pass type');
  if (!ticketData.totalAmount && ticketData.totalAmount !== 0) errors.push('Missing total amount');

  return errors;
}

// Security hash function
function generateSecurityHash(bookingId: string, eventId: string = '', email: string = ''): string {
  const data = `${bookingId}-${eventId}-${email}-797events`;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// Custom Template-based PDF Generation using ticket-purple.pdf
export async function generateTicketPDF(ticketData: TicketData): Promise<Blob> {
  // Validate data first
  const errors = validateTicketData(ticketData);
  if (errors.length > 0) {
    console.error('Cannot generate PDF - validation errors:', errors);
    throw new Error(`Invalid ticket data: ${errors.join(', ')}`);
  }

  try {
    console.log('🎫 Using custom Ticket-purple.png template');

    // Generate QR code with timeout
    const qrCodePromise = generateQRCodeOptimized(ticketData);
    const timeoutPromise = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error('QR generation timeout')), 5000)
    );

    let qrCodeDataURL = '';
    try {
      qrCodeDataURL = await Promise.race([qrCodePromise, timeoutPromise]);
    } catch (qrError) {
      console.warn('QR code generation failed, continuing without:', qrError);
    }

    // Create PDF in landscape mode to match template
    const pdf = new jsPDF('landscape', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Load and add your PNG template as background
    try {
      const fs = await import('fs');
      const path = await import('path');

      const templatePath = path.join(process.cwd(), 'public', 'Ticket-purple.png');
      const templateBuffer = fs.readFileSync(templatePath);
      const templateBase64 = templateBuffer.toString('base64');

      // Add your PNG template as background - fit width only, maintain aspect ratio
      // Reduce height by 20% from previous: 0.4 * 0.8 = 0.32
      const templateHeight = pageWidth * 0.32; // Reduced by 20%
      pdf.addImage(`data:image/png;base64,${templateBase64}`, 'PNG', 0, 0, pageWidth, templateHeight, undefined, 'FAST');
    } catch (error) {
      console.error('Failed to load template:', error);
      // Fallback to purple background if template fails
      pdf.setFillColor(147, 51, 234);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    }

    // Now add only the specific data you requested, positioned for your template
    // Using more precise coordinates based on your landscape template layout
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255); // White text for visibility on purple background

    // Generate sequential ticket ID based on event and year
    const eventAbbr = 'TGIN'; // The Great Indian Navratri
    const year = '25'; // 2025
    // In production, this would come from database sequence
    const sequenceNumber = String(Math.floor(Math.random() * 9999) + 250001).padStart(6, '0');
    const formattedTicketId = `${eventAbbr}-${sequenceNumber}`;

    // Ticket ID - CORRECTED POSITION: down 0.25px and right 0.5px
    pdf.setFontSize(12);
    addSafeText(pdf, formattedTicketId, 22, 14.75, 100);
    console.log(`Ticket ID positioned at: (22, 14.75)`);

    // Customer Name - CORRECTED POSITION: left 2px and down 0.25px
    pdf.setFontSize(12);
    addSafeText(pdf, ticketData.customerName, 21.5, 22.75, 120);
    console.log(`Name positioned at: (21.5, 22.75)`);

    // Pass Type - CORRECTED POSITION: down 0.25px and left 2.25px
    pdf.setFontSize(12);
    let passDisplayName = ticketData.passType;
    if (ticketData.passDetails && ticketData.passDetails.dayNumber && ticketData.passDetails.dayTitle) {
      passDisplayName = `Day ${ticketData.passDetails.dayNumber}: ${ticketData.passDetails.dayTitle}`;
    }
    addSafeText(pdf, passDisplayName, 24.25, 30.75, 120);
    console.log(`Type positioned at: (24.25, 30.75)`);

    // QR Code - CORRECTED: moved left 1px and up 1px, increased size by 10%
    if (qrCodeDataURL && qrCodeDataURL.length > 0) {
      const qrSize = 33; // Increased by 10% (30 * 1.1 = 33)
      const qrX = 24; // MOVED LEFT by 1px from previous 25
      const qrY = 46.5; // MOVED UP by 1px from previous 47.5

      pdf.addImage(qrCodeDataURL, 'PNG', qrX, qrY, qrSize, qrSize);
      console.log(`QR positioned at: (${qrX}, ${qrY}) with size ${qrSize}`);
    } else {
      // Fallback if QR generation fails
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(0, 0, 0); // Black text for visibility in white square
      addSafeText(pdf, 'QR CODE', 39, 61.5, 50, { align: 'center' });
      addSafeText(pdf, 'ERROR', 39, 66.5, 50, { align: 'center' });
    }

    console.log('PDF generation completed using custom template');
    return pdf.output('blob');

  } catch (error) {
    console.error('Error generating PDF:', error);

    // Fallback PDF
    const pdf = new jsPDF();
    pdf.text('797 EVENTS - EVENT TICKET', 20, 20);
    pdf.text(`Event: ${ticketData.eventTitle}`, 20, 40);
    pdf.text(`Customer: ${ticketData.customerName}`, 20, 60);
    pdf.text(`Date: ${ticketData.eventDate}`, 20, 80);
    pdf.text(`Booking ID: ${ticketData.bookingId}`, 20, 100);

    return pdf.output('blob');
  }
}

export function generateTicketId(dayNumber: number = 1, sequenceNumber?: number): string {
  const currentYear = new Date().getFullYear().toString().slice(-2); // Get last 2 digits of year
  const day = `D${dayNumber}`; // D1, D2, etc.

  // If no sequence number provided, generate a random one for testing
  // In production, this should come from database counter
  const sequence = sequenceNumber ? sequenceNumber.toString().padStart(5, '0') :
                   Math.floor(Math.random() * 99999).toString().padStart(5, '0');

  return `TGIN-${currentYear}-${day}-${sequence}`;
}

// Helper function to get next sequence number from database
export async function getNextTicketSequence(dayNumber: number): Promise<number> {
  try {
    const { unifiedDb } = await import('./unifiedDatabase');

    // Get the count of existing tickets for this day
    // This would need to be implemented in your database
    // For now, return a placeholder
    const currentYear = new Date().getFullYear().toString().slice(-2);
    const dayPrefix = `TGIN-${currentYear}-D${dayNumber}-`;

    // Count existing tickets with this prefix
    // This is a placeholder - you'll need to implement the actual database query
    console.log(`Getting next sequence for day ${dayNumber} with prefix: ${dayPrefix}`);

    // Return next available number (starting from 1)
    return 1; // This should be replaced with actual database count + 1

  } catch (error) {
    console.error('Error getting ticket sequence:', error);
    return Math.floor(Math.random() * 99999) + 1; // Fallback to random
  }
}

// Safe Database Enhancement
export async function enhanceTicketData(basicTicketData: TicketData, eventId?: string, passId?: string): Promise<TicketData> {
  // Validate first
  const errors = validateTicketData(basicTicketData);
  if (errors.length > 0) {
    console.warn('Ticket data validation errors:', errors);
  }

  // Return basic data if no enhancement needed
  if (!eventId || !passId) {
    return basicTicketData;
  }

  try {
    const { unifiedDb } = await import('./unifiedDatabase');
    const event = await unifiedDb.getEventById(eventId);

    if (!event) {
      console.warn('Event not found:', eventId);
      return basicTicketData;
    }

    // Find the specific pass
    let specificPass = null;
    let dayInfo = null;

    if (event.isMultiDay && event.eventDays) {
      for (const day of event.eventDays) {
        const foundPass = day.passes?.find((p: any) => p.id === passId);
        if (foundPass) {
          specificPass = foundPass;
          dayInfo = day;
          break;
        }
      }
    }

    if (!specificPass && event.passes) {
      specificPass = event.passes.find((p: any) => p.id === passId);
    }

    const enhancedData: TicketData = {
      ...basicTicketData,
      eventId,
      passId,
      isMultiDay: event.isMultiDay,
      eventDuration: event.isMultiDay && event.eventDays ? `${event.eventDays.length} Days` : undefined
    };

    if (specificPass) {
      enhancedData.passDetails = {
        name: specificPass.name,
        dayNumber: dayInfo?.dayNumber,
        dayTitle: dayInfo?.title,
        specificDate: dayInfo?.date,
        specificTime: dayInfo?.time,
        specificVenue: dayInfo?.venue
      };

      if (dayInfo) {
        enhancedData.eventDate = dayInfo.date || basicTicketData.eventDate;
        enhancedData.eventTime = dayInfo.time || basicTicketData.eventTime;
        enhancedData.eventVenue = dayInfo.venue || basicTicketData.eventVenue;
      }
    }

    return enhancedData;

  } catch (error) {
    console.warn('Database enhancement failed:', error);
    return basicTicketData;
  }
}