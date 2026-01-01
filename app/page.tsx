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
import PricingSection from '@/components/landing/PricingSection';
import FAQSection from '@/components/landing/FAQSection';
import FinalCTASection from '@/components/landing/FinalCTASection';

export default function HomePage() {
  return (
    <div className="bg-[#050505] text-[#F5F7FA] min-h-screen font-sans">
      <Navbar /> {/* Reusing existing Navbar for now, might need update */}

      <main>
        <HeroSection />
        <RealityCheckSection />
        <WhyTimelineSection />
        <SuperpowerSection />
        <StatsSection />
        <InviteOnlySection />
        <IdentitySection />
        <PricingSection />
        <FAQSection />
        <FinalCTASection />
      </main>

      <Footer />
    </div>
  );
}
