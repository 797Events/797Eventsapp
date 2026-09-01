'use client';

import Image from 'next/image';
import SocialLinks from './SocialLinks';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-shell">
        <div className="footer-main">
          <div className="footer-brand">
            <div className="footer-logo"><Image src="/797logo.png" alt="797 Events" fill className="object-contain" /></div>
            <div>
              <p className="eyebrow">797 EVENTS</p>
              <h2>Creating experiences worth remembering.</h2>
              <p className="brand-copy">Premium events, thoughtfully planned and beautifully delivered.</p>
            </div>
          </div>
          <div className="footer-column">
            <p className="column-label">Visit us</p>
            <address>F NO18-B, Suryaloknagri Co Op HSG Soc,<br />S NO:106A/3 PT-C, Hadapsar,<br />Pune, Maharashtra, 411028</address>
          </div>
          <div className="footer-column">
            <p className="column-label">Get in touch</p>
            <a href="mailto:the797events@gmail.com">the797events@gmail.com</a>
            <a href="tel:+919028530343">+91 9028530343</a>
            <div className="footer-social"><p className="column-label">Follow us</p><SocialLinks /></div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2025 797 Events. All rights reserved.</p>
          <div className="legal-links"><a href="/privacy-policy">Privacy Policy</a><span aria-hidden="true">•</span><a href="/terms-and-conditions">Terms &amp; Conditions</a></div>
        </div>
      </div>
      <style jsx>{`
        .footer { position:relative; z-index:15; margin-top:72px; padding:24px 20px 20px; color:#fff; }
        .footer-shell { max-width:1180px; margin:0 auto; padding:46px 52px 22px; border:1px solid rgba(255,255,255,.18); border-radius:28px; background:linear-gradient(135deg,rgba(30,16,65,.94),rgba(14,22,56,.92)); box-shadow:0 24px 70px rgba(0,0,0,.28),inset 0 1px rgba(255,255,255,.08); }
        .footer-main { display:grid; grid-template-columns:minmax(260px,1.45fr) minmax(220px,1fr) minmax(220px,1fr); gap:52px; align-items:start; }
        .footer-brand { display:flex; align-items:center; gap:22px; }
        .footer-logo { position:relative; flex:0 0 112px; width:112px; height:112px; }
        .eyebrow,.column-label { margin:0 0 12px; color:#c4a7ff; font-size:11px; font-weight:700; letter-spacing:.18em; text-transform:uppercase; }
        h2 { max-width:300px; margin:0; color:#fff; font-size:clamp(1.35rem,2.3vw,1.85rem); line-height:1.2; font-weight:700; }
        .brand-copy,address,.footer-column a,.footer-bottom { color:rgba(255,255,255,.78); font-size:14px; line-height:1.75; }
        .brand-copy { max-width:290px; margin:12px 0 0; } address { margin:0; font-style:normal; }
        .footer-column { display:flex; flex-direction:column; align-items:flex-start; }
        .footer-column a { color:#fff; text-decoration:none; transition:color .2s ease; }
        .footer-column a:hover,.legal-links a:hover { color:#c4a7ff; }
        .footer-social { margin-top:22px; } .footer-social :global(.social-links) { justify-content:flex-start; }
        .footer-bottom { display:flex; justify-content:space-between; gap:20px; margin-top:42px; padding-top:18px; border-top:1px solid rgba(255,255,255,.14); }
        .footer-bottom p { margin:0; } .legal-links { display:flex; gap:12px; align-items:center; } .legal-links a { color:rgba(255,255,255,.78); text-decoration:none; }
        @media (max-width:800px) { .footer-shell { padding:34px 26px 20px; } .footer-main { grid-template-columns:1fr 1fr; gap:30px; } .footer-brand { grid-column:1 / -1; } }
        @media (max-width:520px) { .footer { padding:12px 12px 16px; } .footer-shell { padding:30px 20px 18px; border-radius:22px; } .footer-main { grid-template-columns:1fr; gap:28px; } .footer-brand { align-items:flex-start; gap:16px; } .footer-logo { flex-basis:82px; width:82px; height:82px; } .footer-bottom { flex-direction:column; gap:8px; margin-top:30px; } }
      `}</style>
    </footer>
  );
}
