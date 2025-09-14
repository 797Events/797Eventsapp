'use client';

import React from 'react';
import ShaderBackground from '@/components/ShaderBackground';

export default function TermsAndConditions() {
  return (
    <ShaderBackground>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="glassmorphism-card p-8 rounded-2xl">
            <h1 className="text-4xl font-bold mb-8 text-center">Terms & Conditions – 797 Events</h1>
            <p className="text-lg mb-8 text-center opacity-80">Effective Date: January 2025</p>

            <div className="space-y-8">
              <p className="text-lg leading-relaxed opacity-90">
                Please read these Terms & Conditions carefully before booking tickets through 797 Events. By booking tickets, you agree to be bound by these terms.
              </p>

              <section>
                <h2 className="text-2xl font-semibold mb-4">1. Ticket Policy</h2>
                <ul className="space-y-2 pl-6 opacity-90">
                  <li>• Tickets once booked cannot be exchanged or refunded, except as specified under our Refund & Cancellation Policy.</li>
                  <li>• An Internet handling fee per ticket may be charged. Please check the total amount before making payment.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">2. Arrival & Entry</h2>
                <ul className="space-y-2 pl-6 opacity-90">
                  <li>• We recommend arriving at the venue at least 30 minutes prior to the event for a smooth entry.</li>
                  <li>• Entry will only be permitted with a valid ticket and ID proof, subject to security verification and frisking.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">3. Venue Rules & Safety</h2>
                <ul className="space-y-2 pl-6 opacity-90">
                  <li>• Masks and/or safety measures may be mandatory if required by local authorities or event organizers.</li>
                  <li>• Outside food, beverages, alcohol, or prohibited items are not allowed inside the venue.</li>
                  <li>• Carrying dangerous or hazardous objects (including but not limited to weapons, knives, fireworks, bottles, or sharp objects) is strictly prohibited.</li>
                  <li>• People found in an inebriated state may be denied entry without refund.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">4. Resale & Misuse</h2>
                <p className="opacity-90">
                  Unlawful resale (or attempted resale) of a ticket may result in cancellation without refund.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">5. Organizer Rights</h2>
                <ul className="space-y-2 pl-6 opacity-90">
                  <li>• Rights of admission are reserved.</li>
                  <li>• The organizer reserves the right to make changes to the event schedule, lineup, or venue if required.</li>
                  <li>• The organizer's decision on all matters related to the event will be final and binding.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">6. No-Show & Late Entry</h2>
                <p className="opacity-90">
                  Late entry may be denied if it disrupts the event. No refund will be provided in such cases.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">7. Liability Disclaimer</h2>
                <ul className="space-y-2 pl-6 opacity-90">
                  <li>• The organizer, sponsors, or venue management are not responsible for personal loss, theft, injury, or damages during the event.</li>
                  <li>• Any disputes will be subject to courts in Pune, Maharashtra.</li>
                </ul>
              </section>

              <section className="mt-12 pt-8 border-t border-white/20">
                <h2 className="text-2xl font-semibold mb-4">📄 Refund & Cancellation Policy – 797 Events</h2>
                <p className="text-lg mb-6 opacity-80">Effective Date: January 2025</p>
                <p className="opacity-90 mb-6">At 797 Events, we aim to provide a seamless booking experience.</p>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-3">1. Customer Cancellations</h3>
                    <p className="pl-6 opacity-90">
                      No cancellation can be done. If otherwise, you need to contact us on the following number: +91 9028530343.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3">2. Refund Process</h3>
                    <p className="pl-6 opacity-90">
                      Once booked, no refunds are possible unless and until the organizer decides to cancel it.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3">3. No Refund Situations</h3>
                    <p className="opacity-90 mb-3">No refunds will be provided for:</p>
                    <ul className="space-y-2 pl-6 opacity-90">
                      <li>• No-shows or late arrivals</li>
                      <li>• Entry denied due to violation of venue rules</li>
                      <li>• Event interruptions due to natural calamities, bad weather, or force majeure situations</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3">4. Organizer Cancellations</h3>
                    <p className="opacity-90">
                      If an event is canceled or postponed by 797 Events, customers will receive a full refund or option to transfer the booking to a rescheduled date.
                    </p>
                  </div>
                </div>
              </section>

              <section className="mt-8 pt-8 border-t border-white/20">
                <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
                <div className="space-y-2">
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