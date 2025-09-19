'use client';

import React, { useState } from 'react';
import { X, Download, Mail, CheckCircle, FileText } from 'lucide-react';

interface BookingSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingData: {
    booking_id: string;
    ticket_id: string;
    amount: number;
    email_sent: boolean;
    ticket_pdf?: {
      data: string;
      filename: string;
      mimeType: string;
    };
  };
  customerEmail: string;
}

export default function BookingSuccessModal({
  isOpen,
  onClose,
  bookingData,
  customerEmail
}: BookingSuccessModalProps) {
  const [isPdfViewVisible, setIsPdfViewVisible] = useState(false);

  if (!isOpen) return null;

  const downloadPDF = () => {
    if (!bookingData.ticket_pdf) return;

    try {
      const binaryString = atob(bookingData.ticket_pdf.data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = bookingData.ticket_pdf.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Error downloading ticket. Please check your email for the ticket.');
    }
  };

  const viewPDF = () => {
    if (!bookingData.ticket_pdf) return;

    try {
      const binaryString = atob(bookingData.ticket_pdf.data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      // Open in new tab
      window.open(url, '_blank');

      // Clean up the URL after a delay
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error('Error viewing PDF:', error);
      alert('Error viewing ticket. Please download it instead or check your email.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-purple-900/90 to-violet-900/90 backdrop-blur-xl rounded-2xl border border-white/20 p-8 max-w-2xl w-full shadow-2xl">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="text-green-400" size={32} />
            <div>
              <h2 className="text-2xl font-bold text-white">Booking Confirmed!</h2>
              <p className="text-white/70">Your payment was successful</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
          >
            <X size={24} />
          </button>
        </div>

        {/* Booking Details */}
        <div className="bg-white/5 rounded-xl p-6 mb-6 border border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-white/70 text-sm">Booking ID</p>
              <p className="text-white font-mono font-semibold">{bookingData.booking_id}</p>
            </div>
            <div>
              <p className="text-white/70 text-sm">Ticket ID</p>
              <p className="text-white font-mono font-semibold">{bookingData.ticket_id}</p>
            </div>
            <div>
              <p className="text-white/70 text-sm">Amount Paid</p>
              <p className="text-white font-semibold text-lg">₹{bookingData.amount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-white/70 text-sm">Email Status</p>
              <p className={`font-semibold ${bookingData.email_sent ? 'text-green-400' : 'text-yellow-400'}`}>
                {bookingData.email_sent ? '✅ Sent' : '⏳ Sending...'}
              </p>
            </div>
          </div>
        </div>

        {/* Email Notification */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Mail className="text-blue-400" size={20} />
            <span className="text-blue-200 font-medium">Email Confirmation</span>
          </div>
          <p className="text-blue-200/80 text-sm">
            {bookingData.email_sent
              ? `Your ticket has been sent to ${customerEmail}`
              : `Your ticket will be sent to ${customerEmail} shortly`
            }
          </p>
        </div>

        {/* PDF Actions */}
        {bookingData.ticket_pdf && (
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="text-purple-400" size={20} />
              <span className="text-purple-200 font-medium">Your Ticket</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={viewPDF}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2"
              >
                <FileText size={18} />
                View Ticket
              </button>

              <button
                onClick={downloadPDF}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2 border border-white/20"
              >
                <Download size={18} />
                Download PDF
              </button>
            </div>

            <p className="text-white/60 text-xs mt-3 text-center">
              Save this ticket on your device and present it at the event entrance
            </p>
          </div>
        )}

        {/* Close Button */}
        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 border border-white/20"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}