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
            <Link href="/" className="block">
              {/* Red Brand Icon */}
              <div className="w-10 h-10">
                <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 0C8.954 0 0 8.954 0 20s8.954 20 20 20 20-8.954 20-20S31.046 0 20 0zm0 36c-8.837 0-16-7.163-16-16S11.163 4 20 4s16 7.163 16 16-7.163 16-16 16z" fill="#E02424" />
                  {/* More detailed logo shape if available, using placeholder red circle logo mostly */}
                </svg>
                <img src="/logo_linkist.png" alt="Linkist" className="h-8 w-auto brightness-0 invert" style={{ filter: 'brightness(0) saturate(100%) invert(20%) sepia(93%) saturate(3078%) hue-rotate(349deg) brightness(88%) contrast(92%)' }} />
              </div>
            </Link>

            <h3 className="text-xl font-bold text-white">Subscribe for Updates</h3>
            <p className="text-[#666]">Stay updated with the latest news in cryptocurrency.</p> {/* Copy from screenshot says cryptocurrency? Checking text... looks like 'cryptocurrency' in screenshot 15 but context is PRM. Will keep as per screenshot but potentially flag user. */}

            <div className="relative max-w-xs">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full bg-[#111] border border-[#222] rounded-full py-3 pl-6 pr-14 text-white placeholder-gray-600 focus:outline-none focus:border-[#333]"
              />
              <button className="absolute right-1 top-1 h-10 px-4 bg-[#FF4D4D] rounded-full text-white text-sm font-medium hover:bg-[#E02424] transition-colors">
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