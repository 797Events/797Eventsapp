import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    console.log('🔍 Starting email debug for:', email);

    // Check environment variables
    const envVars = {
      SMTP_HOST: !!process.env.SMTP_HOST,
      SMTP_USER: !!process.env.SMTP_USER,
      SMTP_PASS: !!process.env.SMTP_PASS,
      SMTP_FROM: !!process.env.SMTP_FROM,
      SMTP_PORT: process.env.SMTP_PORT
    };
    console.log('Environment variables:', envVars);

    // ✅ FIXED: Import nodemailer correctly
    console.log('✅ Nodemailer imported successfully');
    const nodemailer = require('nodemailer');

    // ✅ FIXED: Use createTransport, not createTransporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    console.log('✅ Transporter created successfully');

    // Test email
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: '797 Events - Email Test',
      html: '<h1>Email working!</h1><p>This is a test email from 797 Events.</p>'
    });

    console.log('✅ Debug email sent:', info.messageId);

    // Generate test PDF
    const { generateTicketPDF, generateTicketId } = await import('@/lib/ticketGenerator');
    const testTicketData = {
      bookingId: 'test_123',
      ticketId: generateTicketId(1, 1),
      eventTitle: 'Test Event',
      eventDate: '2025-01-01',
      eventTime: '18:00',
      eventVenue: 'Test Venue',
      customerName: 'Test User',
      customerEmail: email,
      customerPhone: '1234567890',
      passType: 'Test Pass',
      quantity: 1,
      totalAmount: 100
    };

    const testPDF = await generateTicketPDF(testTicketData);
    console.log('✅ PDF generation working, size:', testPDF.size);

    return NextResponse.json({
      success: true,
      message: 'Email debug completed successfully',
      emailSent: true,
      pdfGenerated: true,
      messageId: info.messageId
    });

  } catch (error) {
    console.error('❌ Email debug failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}