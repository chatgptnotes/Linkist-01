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
          <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-8">

            {/* Column 1 */}
            <div>
              <h4 className="text-white font-medium mb-6">Company</h4>
              <ul className="space-y-4 text-[#888]">
                <li><Link href="#" className="hover:text-white transition-colors">Company Details</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Mission</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Values</Link></li>
              </ul>
            </div>

            {/* Column 2 */}
            <div>
              <h4 className="text-white font-medium mb-6">Resources</h4>
              <ul className="space-y-4 text-[#888]">
                <li><Link href="#" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">FAQs</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Support Center</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contact Us</Link></li>
              </ul>
            </div>

            {/* Column 3 */}
            <div>
              <h4 className="text-white font-medium mb-6">Legal</h4>
              <ul className="space-y-4 text-[#888]">
                <li><Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>

            {/* Column 4 */}
            <div>
              <h4 className="text-white font-medium mb-6">Connect</h4>
              <ul className="space-y-4 text-[#888]">
                <li><Link href="#" className="hover:text-white transition-colors">Instagram</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Facebook</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">LinkedIn</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Twitter/X</Link></li>
              </ul>
            </div>

          </div>
        </div>

        <div className="border-t border-[#111] mt-20 pt-8 text-center text-[#444]">
          © 2025 Linkist. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}