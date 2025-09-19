export interface EmailData {
  to: string;
  subject: string;
  html: string;
  attachments?: {
    filename: string;
    content: Blob;
    contentType: string;
  }[];
}

export interface BookingConfirmationData {
  customerName: string;
  customerEmail: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventVenue: string;
  passType: string;
  quantity: number;
  totalAmount: number;
  bookingId: string;
}

export async function sendBookingConfirmation(data: BookingConfirmationData, ticketPDF?: Blob): Promise<boolean> {
  try {
    console.log('📧 Preparing to send booking confirmation email to:', data.customerEmail);

    const emailHtml = generateBookingConfirmationHTML(data);

    // Convert Blob to Buffer for nodemailer if PDF exists
    let pdfBuffer: Buffer | undefined;
    if (ticketPDF) {
      const arrayBuffer = await ticketPDF.arrayBuffer();
      pdfBuffer = Buffer.from(arrayBuffer);
      console.log('🎫 PDF converted to buffer, size:', pdfBuffer.length, 'bytes');
    }

    // Use real SMTP service
    const nodemailer = require('nodemailer');

    // Create transporter with Gmail SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // Email options
    const mailOptions = {
      from: `"797 Events" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: data.customerEmail,
      subject: `🎫 Booking Confirmation - ${data.eventTitle}`,
      html: emailHtml,
      attachments: pdfBuffer ? [{
        filename: `ticket-${data.bookingId}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }] : []
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    console.log('📧 Email sent to:', data.customerEmail);

    return true;
  } catch (error) {
    console.error('❌ Error sending booking confirmation email:', error);

    // Fallback: log the email data for manual sending
    console.log('📧 Email that failed to send:', {
      to: data.customerEmail,
      subject: `Booking Confirmation - ${data.eventTitle}`,
      bookingId: data.bookingId,
      hasPDF: !!ticketPDF
    });

    return false;
  }
}

function generateBookingConfirmationHTML(data: BookingConfirmationData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Booking Confirmation</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .booking-details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        .button { background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>797 EVENTS</h1>
          <h2>Booking Confirmation</h2>
        </div>

        <div class="content">
          <p>Dear ${data.customerName},</p>

          <p>Thank you for your booking! Your tickets have been confirmed.</p>

          <div class="booking-details">
            <h3>Event Details</h3>
            <p><strong>Event:</strong> ${data.eventTitle}</p>
            <p><strong>Date:</strong> ${new Date(data.eventDate).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${data.eventTime}</p>
            <p><strong>Venue:</strong> ${data.eventVenue}</p>

            <h3>Booking Details</h3>
            <p><strong>Booking ID:</strong> ${data.bookingId}</p>
            <p><strong>Pass Type:</strong> ${data.passType}</p>
            <p><strong>Quantity:</strong> ${data.quantity}</p>
            <p><strong>Total Amount:</strong> ₹${data.totalAmount}</p>
          </div>

          <p>Your ticket(s) are attached to this email. Please present your ticket(s) at the venue for entry.</p>

          <p>If you have any questions, please contact us at info@797events.com</p>

          <p>Thank you for choosing 797 Events!</p>
        </div>

        <div class="footer">
          <p>797 Events | www.797events.com</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function sendEmail(emailData: EmailData): Promise<boolean> {
  try {
    // In production, integrate with email service provider
    console.log('Email would be sent:', {
      to: emailData.to,
      subject: emailData.subject,
      hasAttachments: emailData.attachments ? emailData.attachments.length : 0
    });

    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}