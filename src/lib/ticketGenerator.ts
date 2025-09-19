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

// Safe Text Handling
function addSafeText(pdf: any, text: string, x: number, y: number, maxWidth: number, options?: any) {
  try {
    const lines = pdf.splitTextToSize(text, maxWidth);
    pdf.text(lines, x, y, options);
    return lines.length * 12;
  } catch (error) {
    console.error('Text rendering error:', error);
    pdf.text('Text Error', x, y, options);
    return 12;
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

// Improved PDF Generation - 2 Pages for Full Information
export async function generateTicketPDF(ticketData: TicketData): Promise<Blob> {
  // Validate data first
  const errors = validateTicketData(ticketData);
  if (errors.length > 0) {
    console.error('Cannot generate PDF - validation errors:', errors);
    throw new Error(`Invalid ticket data: ${errors.join(', ')}`);
  }

  try {
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

    // Create PDF in portrait mode (A4)
    const pdf = new jsPDF('portrait', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Colors
    const primaryColor = [139, 92, 246]; // #8b5cf6 purple
    const textColor = [31, 41, 55]; // #1f2937 dark gray
    const lightBg = [248, 250, 252]; // #f8fafc
    const redColor = [220, 38, 38]; // #dc2626
    const greenColor = [5, 150, 105]; // #059669

    const margin = 20;
    const contentWidth = pageWidth - (2 * margin);
    let currentY = 20;

    // ========== PAGE 1 - MAIN TICKET ==========

    // Header Section
    pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.rect(0, 0, pageWidth, 55, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(32);
    pdf.setTextColor(255, 255, 255);
    addSafeText(pdf, '797 EVENTS', pageWidth / 2, 25, contentWidth, { align: 'center' });

    pdf.setFontSize(14);
    pdf.setTextColor(220, 220, 255);
    addSafeText(pdf, 'Your Vision... Our Innovation', pageWidth / 2, 38, contentWidth, { align: 'center' });

    pdf.setFontSize(24);
    pdf.setTextColor(255, 255, 255);
    addSafeText(pdf, 'EVENT TICKET', pageWidth / 2, 50, contentWidth, { align: 'center' });

    currentY = 75;

    // QR Code Section - Large and Prominent
    pdf.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    pdf.rect(margin, currentY, contentWidth, 90, 'F');

    // Border
    pdf.setDrawColor(229, 231, 235);
    pdf.setLineWidth(1);
    pdf.rect(margin, currentY, contentWidth, 90, 'D');

    currentY += 15;

    // QR Title (No emoji)
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    addSafeText(pdf, 'SCAN TO VERIFY TICKET', pageWidth / 2, currentY, contentWidth, { align: 'center' });

    currentY += 20;

    // Large QR Code
    if (qrCodeDataURL && qrCodeDataURL.length > 0) {
      const qrSize = 40; // Large QR code
      const qrX = (pageWidth - qrSize) / 2;

      // White background with thick border
      pdf.setFillColor(255, 255, 255);
      pdf.rect(qrX - 5, currentY - 5, qrSize + 10, qrSize + 10, 'F');

      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(3);
      pdf.rect(qrX - 5, currentY - 5, qrSize + 10, qrSize + 10, 'D');

      // Add QR code
      pdf.addImage(qrCodeDataURL, 'PNG', qrX, currentY, qrSize, qrSize);

      currentY += qrSize + 10;
    } else {
      // Fallback
      const qrSize = 40;
      const qrX = (pageWidth - qrSize) / 2;

      pdf.setFillColor(255, 255, 255);
      pdf.rect(qrX - 5, currentY - 5, qrSize + 10, qrSize + 10, 'F');
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(3);
      pdf.rect(qrX - 5, currentY - 5, qrSize + 10, qrSize + 10, 'D');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.setTextColor(102, 102, 102);
      addSafeText(pdf, 'QR CODE', pageWidth / 2, currentY + 15, contentWidth, { align: 'center' });
      addSafeText(pdf, 'PLACEHOLDER', pageWidth / 2, currentY + 25, contentWidth, { align: 'center' });

      currentY += qrSize + 10;
    }

    // QR Instructions
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);
    pdf.setTextColor(107, 114, 128);
    addSafeText(pdf, 'Present this QR code at venue entrance for entry', pageWidth / 2, currentY, contentWidth, { align: 'center' });

    currentY += 35;

    // Event Title Section
    pdf.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    pdf.rect(margin, currentY, contentWidth, 45, 'F');

    currentY += 15;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(22);
    pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
    const titleLines = pdf.splitTextToSize(ticketData.eventTitle, contentWidth - 20);
    addSafeText(pdf, titleLines, pageWidth / 2, currentY, contentWidth, { align: 'center' });

    currentY += (titleLines.length * 10) + 5;

    if (ticketData.isMultiDay && ticketData.eventDuration) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      addSafeText(pdf, `Multi-Day Event (${ticketData.eventDuration})`, pageWidth / 2, currentY, contentWidth, { align: 'center' });
    }

    currentY += 30;

    // Ticket Information
    pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.rect(margin, currentY, contentWidth, 22, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.setTextColor(255, 255, 255);
    addSafeText(pdf, 'TICKET INFORMATION', margin + 10, currentY + 15, contentWidth);

    currentY += 22;

    // Ticket Details
    pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.rect(margin, currentY, contentWidth, 40, 'F');

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);
    pdf.setTextColor(255, 255, 255);

    currentY += 12;

    // Row 1
    addSafeText(pdf, `Ticket ID: ${ticketData.ticketId || ticketData.bookingId}`, margin + 10, currentY, contentWidth / 2);
    addSafeText(pdf, `Quantity: ${ticketData.quantity}`, pageWidth / 2 + 10, currentY, contentWidth / 2);

    currentY += 12;

    // Row 2
    addSafeText(pdf, `Customer: ${ticketData.customerName}`, margin + 10, currentY, contentWidth);

    currentY += 12;

    // Row 3 - Pass Type
    let passDisplayName = ticketData.passType;
    if (ticketData.passDetails && ticketData.passDetails.dayNumber && ticketData.passDetails.dayTitle) {
      passDisplayName = `Day ${ticketData.passDetails.dayNumber}: ${ticketData.passDetails.dayTitle}`;
    }
    addSafeText(pdf, `Pass Type: ${passDisplayName}`, margin + 10, currentY, contentWidth);

    // ========== PAGE 2 - DETAILED INFORMATION ==========
    pdf.addPage();
    currentY = 30;

    // Page 2 Header
    pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.rect(0, 0, pageWidth, 45, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(24);
    pdf.setTextColor(255, 255, 255);
    addSafeText(pdf, '797 EVENTS - DETAILED INFORMATION', pageWidth / 2, 20, contentWidth, { align: 'center' });

    pdf.setFontSize(14);
    pdf.setTextColor(220, 220, 255);
    addSafeText(pdf, 'Complete Ticket Details', pageWidth / 2, 35, contentWidth, { align: 'center' });

    currentY = 65;

    // Event Details Section
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    addSafeText(pdf, 'EVENT DETAILS', margin, currentY, contentWidth);

    currentY += 25;

    // Event details with enhanced formatting
    let eventDate = ticketData.eventDate;
    let eventTime = ticketData.eventTime || 'Time TBD';
    let eventVenue = ticketData.eventVenue || 'Venue TBD';

    if (ticketData.passDetails) {
      if (ticketData.passDetails.specificDate) eventDate = ticketData.passDetails.specificDate;
      if (ticketData.passDetails.specificTime) eventTime = ticketData.passDetails.specificTime;
      if (ticketData.passDetails.specificVenue) eventVenue = ticketData.passDetails.specificVenue;
    }

    const formattedDate = eventDate ? new Date(eventDate).toLocaleDateString('en-IN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    }) : 'Date TBD';

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(13);
    pdf.setTextColor(textColor[0], textColor[1], textColor[2]);

    const eventDetails = [
      { label: 'Date:', value: formattedDate },
      ...(ticketData.isMultiDay && ticketData.eventDuration ? [{ label: 'Duration:', value: ticketData.eventDuration }] : []),
      { label: 'Time:', value: eventTime },
      { label: 'Venue:', value: eventVenue }
    ];

    eventDetails.forEach(detail => {
      pdf.setFont('helvetica', 'bold');
      addSafeText(pdf, detail.label, margin, currentY, 40);
      pdf.setFont('helvetica', 'normal');
      const valueLines = pdf.splitTextToSize(detail.value, contentWidth - 45);
      addSafeText(pdf, valueLines, margin + 45, currentY, contentWidth - 45);
      currentY += Math.max(18, valueLines.length * 18);
    });

    currentY += 20;

    // Customer Details Section
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    addSafeText(pdf, 'CUSTOMER INFORMATION', margin, currentY, contentWidth);

    currentY += 25;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(13);
    pdf.setTextColor(textColor[0], textColor[1], textColor[2]);

    const customerDetails = [
      { label: 'Full Name:', value: ticketData.customerName },
      { label: 'Email Address:', value: ticketData.customerEmail },
      { label: 'Phone Number:', value: ticketData.customerPhone || 'Not Provided' },
      { label: 'Pass Type:', value: passDisplayName }
    ];

    customerDetails.forEach(detail => {
      pdf.setFont('helvetica', 'bold');
      addSafeText(pdf, detail.label, margin, currentY, 40);
      pdf.setFont('helvetica', 'normal');
      const valueLines = pdf.splitTextToSize(detail.value, contentWidth - 45);
      addSafeText(pdf, valueLines, margin + 45, currentY, contentWidth - 45);
      currentY += Math.max(18, valueLines.length * 18);
    });

    currentY += 20;

    // Payment Details Section
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    addSafeText(pdf, 'PAYMENT INFORMATION', margin, currentY, contentWidth);

    currentY += 25;

    // Add background for payment section
    pdf.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    const paymentSectionHeight = ticketData.originalAmount && ticketData.discountAmount ? 60 : 35;
    pdf.rect(margin, currentY - 10, contentWidth, paymentSectionHeight, 'F');

    currentY += 5;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(13);
    pdf.setTextColor(textColor[0], textColor[1], textColor[2]);

    if (ticketData.originalAmount && ticketData.discountAmount) {
      pdf.setFont('helvetica', 'bold');
      addSafeText(pdf, 'Original Amount:', margin + 10, currentY, 50);
      pdf.setFont('helvetica', 'normal');
      addSafeText(pdf, `₹${ticketData.originalAmount.toLocaleString()}`, margin + 65, currentY, contentWidth - 65);
      currentY += 18;

      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(greenColor[0], greenColor[1], greenColor[2]);
      addSafeText(pdf, 'Discount Applied:', margin + 10, currentY, 50);
      pdf.setFont('helvetica', 'normal');
      addSafeText(pdf, `-₹${ticketData.discountAmount.toLocaleString()}`, margin + 65, currentY, contentWidth - 65);
      currentY += 18;
      pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
    }

    // Total amount (prominent)
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    addSafeText(pdf, 'Total Amount Paid:', margin + 10, currentY, 70);
    addSafeText(pdf, `₹${ticketData.totalAmount.toLocaleString()}`, margin + 85, currentY, contentWidth - 85);

    currentY += 35;

    // Booking Reference
    pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.rect(margin, currentY, contentWidth, 45, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(255, 255, 255);

    currentY += 15;

    addSafeText(pdf, `Booking ID: ${ticketData.bookingId}`, margin + 10, currentY, contentWidth);
    currentY += 12;

    if (ticketData.ticketId) {
      addSafeText(pdf, `Ticket ID: ${ticketData.ticketId}`, margin + 10, currentY, contentWidth);
      currentY += 12;
    }

    const additionalInfo = [];
    if (ticketData.referralCode) {
      additionalInfo.push(`Referral Code: ${ticketData.referralCode}`);
    }
    const generatedAt = new Date().toLocaleString('en-IN');
    additionalInfo.push(`Generated: ${generatedAt}`);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    additionalInfo.forEach(info => {
      addSafeText(pdf, info, margin + 10, currentY, contentWidth);
      currentY += 10;
    });

    currentY += 20;

    // Instructions Section
    pdf.setFillColor(254, 242, 242);
    pdf.rect(margin, currentY, contentWidth, 80, 'F');

    // Red left border
    pdf.setFillColor(redColor[0], redColor[1], redColor[2]);
    pdf.rect(margin, currentY, 4, 80, 'F');

    currentY += 15;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(redColor[0], redColor[1], redColor[2]);
    addSafeText(pdf, 'IMPORTANT INSTRUCTIONS', margin + 15, currentY, contentWidth - 20);

    currentY += 20;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);
    pdf.setTextColor(textColor[0], textColor[1], textColor[2]);

    const instructions = [
      'Present this ticket (digital or printed) at the venue entrance',
      'Ticket is non-transferable and non-refundable',
      'Entry subject to venue terms and conditions',
      'Keep this ticket safe until the event concludes',
      'For support contact: the797events@gmail.com or +91 9028530343'
    ];

    instructions.forEach(instruction => {
      addSafeText(pdf, `• ${instruction}`, margin + 20, currentY, contentWidth - 25);
      currentY += 15;
    });

    // Footer on both pages
    [1, 2].forEach(pageNum => {
      pdf.setPage(pageNum);
      const footerY = pageHeight - 35;
      pdf.setFillColor(156, 163, 175);
      pdf.rect(0, footerY, pageWidth, 35, 'F');

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(102, 102, 102);
      addSafeText(pdf, 'Generated by 797events.com', pageWidth / 2, footerY + 10, contentWidth, { align: 'center' });
      addSafeText(pdf, 'Contact: the797events@gmail.com • +91 9028530343', pageWidth / 2, footerY + 20, contentWidth, { align: 'center' });

      const currentDate = new Date().toLocaleString('en-IN');
      addSafeText(pdf, `Generated on: ${currentDate} • Page ${pageNum} of 2`, pageWidth / 2, footerY + 30, contentWidth, { align: 'center' });
    });

    console.log('PDF generation completed: 2 pages with full information visibility');

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

export function generateTicketId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `TKT-${timestamp}-${random}`.toUpperCase();
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