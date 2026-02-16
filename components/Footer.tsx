'use client';

import { useState } from 'react';
import Link from 'next/link';
import InstagramIcon from '@mui/icons-material/Instagram';
import FacebookIcon from '@mui/icons-material/Facebook';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import XIcon from '@mui/icons-material/X';
import PhoneIcon from '@mui/icons-material/Phone';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';

interface FooterProps {
  variant?: 'full' | 'minimal';
}

export default function Footer({ variant = 'minimal' }: FooterProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Thanks for subscribing!' });
        setFirstName('');
        setLastName('');
        setEmail('');
      } else {
        setMessage({ type: 'error', text: data.error || 'Something went wrong' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to subscribe. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };
  // Minimal footer - just copyright
  if (variant === 'minimal') {
    return (
      <footer className="bg-[#050505] border-t border-[#111] py-6 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-[#444]">
            © 2026 Ratioxlabs. All Rights Reserved.
          </div>
        </div>
      </footer>
    );
  }

  // Full footer - only for landing page
  return (
    <footer className="bg-[#050505] border-t border-[#111] pt-8 pb-20 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-4 gap-12 lg:gap-24">

          {/* Brand Column */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white">Join Our Linkist Community For Free</h3>
            <p className="text-[#666]">Stay updated with the latest news about Linkist.</p>

            <form onSubmit={handleSubscribe} className="space-y-3 max-w-xs">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-1/2 rounded-full py-3 px-4 bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-[#888] focus:outline-none focus:border-[#E02424]/60 focus:bg-white/15 transition-all text-sm"
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="w-1/2 rounded-full py-3 px-4 bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-[#888] focus:outline-none focus:border-[#E02424]/60 focus:bg-white/15 transition-all text-sm"
                />
              </div>
              <div className="relative">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-full py-3 pl-5 pr-20 bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-[#888] focus:outline-none focus:border-[#E02424]/60 focus:bg-white/15 transition-all"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 px-5 rounded-full text-white text-sm font-medium hover:opacity-90 transition-colors disabled:opacity-50"
                  style={{ backgroundColor: '#E02424' }}
                >
                  {isSubmitting ? '...' : 'Send'}
                </button>
              </div>
              {message && (
                <p className={`text-sm ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                  {message.text}
                </p>
              )}
            </form>
          </div>

          {/* Links Columns */}
          <div className="lg:col-span-3 flex flex-col sm:flex-row justify-between gap-8">

            {/* Legal */}
            <div>
              <h4 className="text-white font-medium mb-6">Legal</h4>
              <div className="flex items-center gap-5 text-[#888]">
                <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              </div>
            </div>

            {/* Connect - Horizontal Icons */}
            <div>
              <h4 className="text-white font-medium mb-6">Follow Linkist</h4>
              <div className="flex items-center gap-4">
                <a
                  href="https://www.instagram.com/linkist.ai/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-[#111] text-[#888] hover:text-white hover:bg-[#E84C4C] transition-all hover:scale-110"
                >
                  <InstagramIcon className="w-5 h-5" />
                </a>
                <a
                  href="https://www.facebook.com/share/p/17juDWRqcQ/?mibextid=wwXIfr"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-[#111] text-[#888] hover:text-white hover:bg-[#E84C4C] transition-all hover:scale-110"
                >
                  <FacebookIcon className="w-5 h-5" />
                </a>
                <a
                  href="https://www.linkedin.com/company/linkist-ai/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-[#111] text-[#888] hover:text-white hover:bg-[#E84C4C] transition-all hover:scale-110"
                >
                  <LinkedInIcon className="w-5 h-5" />
                </a>
                <a
                  href="https://x.com/Linkist_ai/status/1997236781612421201?s=20"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="X (Twitter)"
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-[#111] text-[#888] hover:text-white hover:bg-[#E84C4C] transition-all hover:scale-110"
                >
                  <XIcon className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Contact Us */}
            <div>
              <h4 className="text-white font-medium mb-6">Contact Us For Help</h4>
              <ul className="space-y-4 text-[#888]">
                <li>
                  <a
                    href="mailto:support@linkist.ai"
                    className="flex items-center gap-2 hover:text-white transition-colors"
                  >
                    <EmailIcon className="w-5 h-5" />
                    <span>support@linkist.ai</span>
                  </a>
                </li>

                <li>
                  <a
                    href="tel:+971504408656"
                    className="flex items-center gap-2 hover:text-white transition-colors"
                  >
                    <PhoneIcon className="w-5 h-5" />
                    <span>+971 50 440 8656</span>
                  </a>
                </li>
                <li>
                  <a
                    href="https://wa.me/971504408656"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-green-400 transition-colors"
                  >
                    <WhatsAppIcon className="w-5 h-5" />
                    <span>+971 50 440 8656</span>
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <LocationOnIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span>RatioX Labs DWC-LLC, A3, Business Park, Dubai South, Dubai, UAE</span>

                </li>

              </ul>
            </div>

          </div>
        </div>

        <div className="border-t border-[#111] mt-20 pt-8 text-center text-[#444]">
          © 2026 Ratioxlabs. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}
