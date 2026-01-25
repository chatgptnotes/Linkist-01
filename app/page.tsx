'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HeroSection from '@/components/landing/HeroSection';
import RealityCheckSection from '@/components/landing/RealityCheckSection';
import WhyTimelineSection from '@/components/landing/WhyTimelineSection';
import SuperpowerSection from '@/components/landing/SuperpowerSection';
import StatsSection from '@/components/landing/StatsSection';
import InviteOnlySection from '@/components/landing/InviteOnlySection';
import IdentitySection from '@/components/landing/IdentitySection';

import FAQSection from '@/components/landing/FAQSection';
import FinalCTASection from '@/components/landing/FinalCTASection';

export default function HomePage() {
  return (
    <div className="bg-[#050505] text-[#F5F7FA] min-h-screen font-sans">
      <Navbar /> {/* Reusing existing Navbar for now, might need update */}

      <main>
        <HeroSection />
        {/* Grid background wrapper for RealityCheck and WhyTimeline sections */}
        <div
          className="relative overflow-hidden bg-[#050505]"
        >
          <img
            src="/Vector (1).png"
            alt=""
            className="absolute left-0 right-0 w-full h-full object-cover pointer-events-none md:hidden"
            style={{
              top: '15%',
              opacity: 0.6,
              filter: 'brightness(0.5) sepia(1) hue-rotate(-30deg) saturate(4)'
            }}
          />
          <RealityCheckSection />
          <WhyTimelineSection />
        </div>
        <SuperpowerSection />
        <StatsSection />
        <InviteOnlySection />
        <IdentitySection />
        <FAQSection />
        <FinalCTASection />
      </main>

      <Footer variant="full" />
    </div>
  );
}
