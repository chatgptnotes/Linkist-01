'use client';

import { useEffect } from 'react';
import HeroSection from './HeroSection';
import FeaturesSection from './FeaturesSection';
import SignUpSection from './SignUpSection';
import PricingSection from './PricingSection';
import FoundingMembersSection from './FoundingMembersSection';
import ReserveProfileSection from './ReserveProfileSection';

export default function MicroCopyPage() {
  useEffect(() => {
    // Force scroll to top, overriding any hash anchoring
    window.scrollTo(0, 0);
    // Also clear any hash from the URL without triggering navigation
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }
    // Delayed scroll to ensure it fires after child component mount effects
    const timer = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white font-[Inter,sans-serif]">
      {/* Global Styles */}
      <style jsx global>{`
        .text-gradient-subtitle {
          background: linear-gradient(180deg, #A3A3A3 0%, #525252 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          padding-bottom: 0.4em;
          display: inline-block;
        }

        #card-stack-container {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform-origin: bottom center;
          width: 600px;
          height: 900px;
          cursor: pointer;
          will-change: transform;
          transform-style: preserve-3d;
          -webkit-transform-style: preserve-3d;
          transform: translate3d(0, 0, 0);
        }

        #stack-wrapper {
          will-change: height;
          perspective: 1500px;
          -webkit-perspective: 1500px;
          transform: translateZ(0);
        }

        .cs-layer {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 50px;
          height: 350px;
          background-size: contain;
          background-position: center;
          background-repeat: no-repeat;
          will-change: transform;
          transform: translate3d(0, 0, 0);
          -webkit-transform: translate3d(0, 0, 0);
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }

        @media (min-width: 1024px) {
          .cs-layer {
            filter: drop-shadow(0 4px 4px rgba(0, 0, 0, 0.2));
          }
          .cs-layer::after {
            content: "";
            position: absolute;
            inset: 0;
            background: radial-gradient(
              400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
              rgba(255, 255, 255, 0.2),
              transparent 50%
            );
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
            -webkit-mask-image: var(--bg-image);
            mask-image: var(--bg-image);
            -webkit-mask-size: contain;
            mask-size: contain;
            -webkit-mask-position: center;
            mask-position: center;
            -webkit-mask-repeat: no-repeat;
            mask-repeat: no-repeat;
          }
          #card-stack-container.expand-active .cs-layer::after {
            opacity: 1;
          }
        }

        .layer-4 {
          --bg-image: url('/04.png');
          background-image: var(--bg-image);
          z-index: 1;
        }
        .layer-3 {
          --bg-image: url('/03.png');
          background-image: var(--bg-image);
          z-index: 2;
        }
        .layer-2 {
          --bg-image: url('/02.png');
          background-image: var(--bg-image);
          z-index: 3;
        }
        .layer-1 {
          --bg-image: url('/01.png');
          background-image: var(--bg-image);
          z-index: 4;
        }

        .closed-view {
          --bg-image: url('/Closed.png');
          background-image: var(--bg-image);
          z-index: 10;
          opacity: 1 !important;
          transition: opacity 0.15s linear;
          transform: translate3d(0, 0, 0);
          -webkit-transform: translate3d(0, 0, 0);
        }

        @media (min-width: 1024px) {
          .closed-view {
            filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.25));
          }
        }

        #card-stack-container.expand-active .closed-view {
          opacity: 0 !important;
          pointer-events: none;
        }

        /* Pricing Carousel Styles */
        .pricing-scroll-container {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .pricing-scroll-container::-webkit-scrollbar {
          display: none;
        }

        .pricing-card-new {
          background: #111111;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 1rem;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .pricing-card-new.active {
          border-color: rgba(255, 58, 41, 0.4);
        }

        .card-header-bg {
          background: linear-gradient(to bottom, #1a1a1a 0%, #111111 100%);
        }

        .card-content {
          background: #111111;
        }

        .card-btn {
          background: #FF3A29;
          color: white;
          font-weight: 500;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          text-align: center;
          transition: all 0.3s ease;
        }

        .card-btn:hover {
          background: #ff4d3a;
          box-shadow: 0 0 20px rgba(255, 58, 41, 0.5);
        }
      `}</style>

      {/* Sections */}
      <HeroSection />
      <FeaturesSection />
      <SignUpSection />
      <PricingSection />
      <FoundingMembersSection />
      <ReserveProfileSection />
    </div>
  );
}
