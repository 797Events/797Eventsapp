'use client';

import React from 'react';
import ShaderBackground from '@/components/ShaderBackground';

export default function PrivacyPolicy() {
  return (
    <ShaderBackground>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="glassmorphism-card p-8 rounded-2xl">
            <h1 className="text-4xl font-bold mb-8 text-center">Privacy Policy – 797 Events</h1>
            <p className="text-lg mb-8 text-center opacity-80">Effective Date: January 2025</p>

            <div className="space-y-8">
              <p className="text-lg leading-relaxed opacity-90">
                At 797 Events, we respect your privacy and are committed to protecting the personal information you share with us.
              </p>

              <section>
                <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
                <ul className="space-y-3 pl-6">
                  <li className="opacity-90">
                    <strong>Personal Details</strong> – Name, email address, phone number, billing information, and event preferences.
                  </li>
                  <li className="opacity-90">
                    <strong>Transaction Details</strong> – Payment history, booking details.
                  </li>
                  <li className="opacity-90">
                    <strong>Technical Data</strong> – Browser type, device information, IP address (used to improve site performance).
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
                <ul className="space-y-2 pl-6 opacity-90">
                  <li>• To process event ticket bookings and payments.</li>
                  <li>• To send booking confirmations, reminders, or event updates.</li>
                  <li>• To respond to your inquiries and provide customer support.</li>
                  <li>• To improve our services and website experience.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">3. Sharing of Data</h2>
                <p className="opacity-90 mb-4">We do not sell or rent your data. We may share limited data with:</p>
                <ul className="space-y-2 pl-6 opacity-90">
                  <li>• Payment Gateways (e.g., Razorpay) for secure payments.</li>
                  <li>• Event Organizers (only when needed to confirm bookings).</li>
                  <li>• Legal Authorities (only if required by law).</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">4. Cookies</h2>
                <p className="opacity-90">
                  We may use cookies to improve website functionality and analytics. You can manage cookies through your browser settings.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
                <p className="opacity-90">
                  We use SSL encryption and secure servers to protect your information.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
                <p className="opacity-90">
                  You may request to update or delete your data by contacting us at the797events@gmail.com.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">7. Contact Us</h2>
                <p className="opacity-90">
                  For any privacy-related questions, contact:
                </p>
                <div className="mt-4 space-y-2">
                  <p className="opacity-90">
                    📧 <a href="mailto:the797events@gmail.com" className="text-purple-300 hover:text-white transition-colors">the797events@gmail.com</a>
                  </p>
                  <p className="opacity-90">
                    📞 <a href="tel:+919028530343" className="text-purple-300 hover:text-white transition-colors">+91 9028530343</a>
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .glassmorphism-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          position: relative;
          z-index: 10;
        }
      `}</style>
    </ShaderBackground>
  );
}