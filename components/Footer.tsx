import Link from 'next/link';
import InstagramIcon from '@mui/icons-material/Instagram';
import FacebookIcon from '@mui/icons-material/Facebook';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import XIcon from '@mui/icons-material/X';

export default function Footer() {
  return (
    <footer className="bg-[#050505] border-t border-[#111] py-20 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-4 gap-12 lg:gap-24">

          {/* Brand Column */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white">Subscribe for Updates</h3>
            <p className="text-[#666]">Stay updated with the latest news in cryptocurrency.</p> {/* Copy from screenshot says cryptocurrency? Checking text... looks like 'cryptocurrency' in screenshot 15 but context is PRM. Will keep as per screenshot but potentially flag user. */}

            <div className="relative max-w-xs">
              <input
                type="email"
                placeholder="Enter your email"
                data-dark-input="true"
                className="w-full rounded-full py-3 pl-5 pr-20 focus:outline-none"
              />
              <button
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 px-5 rounded-full text-white text-sm font-medium hover:opacity-90 transition-colors"
                style={{ backgroundColor: '#E84C4C' }}
              >
                Send
              </button>
            </div>
          </div>

          {/* Links Columns */}
          <div className="lg:col-span-3 flex flex-col sm:flex-row justify-between gap-8">

            {/* Legal */}
            <div>
              <h4 className="text-white font-medium mb-6">Legal</h4>
              <ul className="space-y-4 text-[#888]">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>

            {/* Connect - Horizontal Icons */}
            <div>
              <h4 className="text-white font-medium mb-6">Connect</h4>
              <div className="flex items-center gap-4">
                <a
                  href="https://instagram.com/linkistnfc"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-[#111] text-[#888] hover:text-white hover:bg-[#E84C4C] transition-all hover:scale-110"
                >
                  <InstagramIcon className="w-5 h-5" />
                </a>
                <a
                  href="https://facebook.com/linkistnfc"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-[#111] text-[#888] hover:text-white hover:bg-[#E84C4C] transition-all hover:scale-110"
                >
                  <FacebookIcon className="w-5 h-5" />
                </a>
                <a
                  href="https://linkedin.com/company/linkistnfc"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-[#111] text-[#888] hover:text-white hover:bg-[#E84C4C] transition-all hover:scale-110"
                >
                  <LinkedInIcon className="w-5 h-5" />
                </a>
                <a
                  href="https://x.com/linkistnfc"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="X (Twitter)"
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-[#111] text-[#888] hover:text-white hover:bg-[#E84C4C] transition-all hover:scale-110"
                >
                  <XIcon className="w-5 h-5" />
                </a>
              </div>
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