'use client';

import { useState } from 'react';
import Link from 'next/link';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Pricing', href: '/digital-business-card#pricing' },
  { label: 'Founding Member Offer', href: '/digital-business-card#founding-member' },
  { label: "FAQ's", href: '/digital-business-card#faq' },
];

export default function MarketingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/10 backdrop-blur-md border-b border-white/10">
      <div className="w-full lg:w-[90vw] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo1.png"
            alt="Linkist"
            className="h-8 w-auto object-contain"
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-white text-sm font-medium hover:text-white/70 transition-colors whitespace-nowrap"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Buttons */}
        <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
          <Link
            href="/login"
            className="px-5 py-2 rounded-full border border-white text-white text-sm font-medium hover:bg-white hover:text-black transition-all"
          >
            Login
          </Link>
          <Link
            href="/choose-plan"
            className="px-5 py-2 rounded-full bg-[#FF3A29] text-white text-sm font-medium hover:opacity-90 transition-all"
          >
            Register
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="lg:hidden text-white p-1"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-black/90 backdrop-blur-md border-t border-white/10 px-6 py-6 flex flex-col gap-5">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-white text-base font-medium hover:text-white/70 transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="flex flex-col gap-3 pt-2 border-t border-white/10">
            <Link
              href="/login"
              className="px-5 py-2.5 rounded-full border border-white text-white text-sm font-medium text-center hover:bg-white hover:text-black transition-all"
              onClick={() => setMobileOpen(false)}
            >
              Login
            </Link>
            <Link
              href="/choose-plan"
              className="px-5 py-2.5 rounded-full bg-[#FF3A29] text-white text-sm font-medium text-center hover:opacity-90 transition-all"
              onClick={() => setMobileOpen(false)}
            >
              Register
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
