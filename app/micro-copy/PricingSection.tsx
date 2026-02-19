'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// --- Types & Data ---

interface PricingCard {
  name: string;
  subtitle: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
}

const PRICING_CARDS: PricingCard[] = [
  {
    name: 'Starter',
    subtitle: 'Best for getting started with a digital identity',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      'Linkist Digital Profile',
      'Claim a personalised Linkist ID (yours for life)',
      'Share your profile instantly via link or QR'
    ]
  },
  {
    name: 'Next (Student Edition)',
    subtitle: 'Best for students and early professionals',
    monthlyPrice: 6.9,
    yearlyPrice: 69,
    features: [
      'Everything in Starter',
      'Access to Linkist Pro App features',
      '1-year Linkist Pro App subscription (worth $59)',
      'AI credits worth $50 (1-year validity)'
    ]
  },
  {
    name: 'Pro',
    subtitle: 'Best for professionals who network in the real world',
    monthlyPrice: 9.9,
    yearlyPrice: 99,
    features: [
      'Linkist Digital Profile',
      'Claim a personalised Linkist ID (yours for life)',
      'Share your profile instantly via link or QR',
      '1-year Linkist Pro App subscription (worth $59)',
      'AI credits worth $50 (1-year validity)'
    ]
  },
  {
    name: 'Signature',
    subtitle: 'Best for personal branding',
    monthlyPrice: 12.9,
    yearlyPrice: 129,
    features: [
      'Everything in Pro',
      'Smart card customisation (name, design, finish)'
    ]
  },
  {
    name: "Founder's Circle",
    subtitle: 'Invite-only, lifetime premium access',
    monthlyPrice: 14.9,
    yearlyPrice: 149,
    features: [
      'Everything in Signature',
      'AI credits worth $50 (available post app launch)',
      'Up to 3 Founding Member referral invites',
      'Access to Linkist partner privileges'
    ]
  }
];

// --- Components ---

export default function PricingSection() {
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('yearly');
  
  // Refs for DOM manipulation (performance optimization)
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const requestRef = useRef<number>();
  
  // Interaction State Refs (avoiding state re-renders for loop)
  const isHoveringRef = useRef(false);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const mouseRelXRef = useRef(0); // Mouse position relative to container center

  // --- Scroll & Center Logic ---

  const centerCard = useCallback((index: number, behavior: ScrollBehavior = 'smooth') => {
    const container = scrollContainerRef.current;
    const card = cardRefs.current[index];
    if (!container || !card) return;

    isHoveringRef.current = false; // Pause auto-scroll when clicking
    
    // Calculate precise center based on container and card dimensions
    const containerWidth = container.offsetWidth;
    const cardLeft = card.offsetLeft;
    const cardWidth = card.offsetWidth;
    
    // The CSS padding handles the offset visually, but we need the scroll position
    const centerPos = cardLeft - (containerWidth / 2) + (cardWidth / 2);
    
    container.scrollTo({
      left: centerPos,
      behavior: behavior
    });
  }, []);

  // --- Animation Loop (3D Transforms) ---

  const animate = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // 1. Handle Auto-Scroll (Desktop Hover)
    if (isHoveringRef.current && !isDraggingRef.current && window.innerWidth >= 1024) {
        const rect = container.getBoundingClientRect();
        const center = rect.width / 2;
        // dist -1 to 1 based on mouse position relative to center
        const dist = mouseRelXRef.current / center; 
        
        // Dead zone in middle 20%
        if (Math.abs(dist) > 0.2) {
             const speed = Math.sign(dist) * Math.pow(Math.abs(dist), 2) * 10;
             container.scrollLeft += speed;
        }
    }

    // 2. 3D Transforms Logic
    const containerRect = container.getBoundingClientRect();
    const containerCenter = containerRect.left + containerRect.width / 2;

    PRICING_CARDS.forEach((_, index) => {
      const card = cardRefs.current[index];
      if (!card) return;

      const cardRect = card.getBoundingClientRect();
      const cardCenter = cardRect.left + cardRect.width / 2;
      const dist = cardCenter - containerCenter;
      const absDist = Math.abs(dist);

      // --- Math from Source Code ---
      
      // Scale: max(0.85, 1.05 - (absDist/500) * 0.25)
      // Scales down as it moves away from center
      const scale = Math.max(0.85, 1.05 - (absDist / 500) * 0.25);

      // Opacity: max(0.5, 1 - (absDist/500))
      // Fades out as it moves away
      const opacity = Math.max(0.5, 1 - (absDist / 500));

      // X Offset: -dist * 0.20
      // Creates the visual "stacking" effect
      const xOffset = -dist * 0.20;

      // Z-Index
      const zIndex = 100 - Math.round(absDist / 5);

      // Apply styles directly
      card.style.transform = `translateX(${xOffset}px) scale(${scale})`;
      card.style.opacity = `${opacity}`;
      card.style.zIndex = `${zIndex}`;

      // Active Class styling logic (manual class manipulation for perf)
      const headerBg = card.querySelector('.card-header-bg') as HTMLElement;
      const btn = card.querySelector('.card-btn') as HTMLElement;

      if (absDist < 100) {
        // Active State
        card.classList.add('active');
        card.style.borderColor = 'rgba(255, 0, 0, 0.5)';
        card.style.boxShadow = '0 30px 60px -10px rgba(0, 0, 0, 0.9)';
        if (headerBg) headerBg.style.opacity = '1';
        if (btn) {
            btn.style.background = '#ff0000';
            btn.style.borderColor = '#ff0000';
            btn.style.boxShadow = '0 4px 20px rgba(255, 0, 0, 0.3)';
        }
      } else {
        // Inactive State
        card.classList.remove('active');
        card.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        card.style.boxShadow = 'none';
        if (headerBg) headerBg.style.opacity = '0';
        if (btn) {
            btn.style.background = 'transparent';
            btn.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            btn.style.boxShadow = 'none';
        }
      }
    });

    requestRef.current = requestAnimationFrame(animate);
  }, []);

  // --- Event Listeners & Lifecycle ---

  useEffect(() => {
    // Start Animation Loop
    requestRef.current = requestAnimationFrame(animate);

    // Initial Scroll to Pro Card (Index 2)
    // We use 'auto' (instant) behavior so it appears centered by default on load
    const timer = setTimeout(() => {
        centerCard(2, 'auto');
    }, 100);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      clearTimeout(timer);
    };
  }, [animate, centerCard]);

  // Mouse/Touch Event Handlers
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
        if (window.innerWidth >= 1024) {
            isHoveringRef.current = true;
            const rect = container.getBoundingClientRect();
            // Store relative X from center for the auto-scroll logic
            mouseRelXRef.current = e.clientX - (rect.left + rect.width / 2);
        }
    };

    const handleMouseLeave = () => {
        isHoveringRef.current = false;
        mouseRelXRef.current = 0;
        isDraggingRef.current = false;
        container.style.cursor = 'grab';
        container.style.scrollSnapType = 'x mandatory';
    };

    const handleMouseDown = (e: MouseEvent) => {
        isDraggingRef.current = true;
        startXRef.current = e.pageX - container.offsetLeft;
        scrollLeftRef.current = container.scrollLeft;
        container.style.cursor = 'grabbing';
        container.style.scrollSnapType = 'none';
    };

    const handleMouseUp = () => {
        isDraggingRef.current = false;
        container.style.cursor = 'grab';
        container.style.scrollSnapType = 'x mandatory';
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
        if (!isDraggingRef.current) return;
        e.preventDefault();
        const x = e.pageX - container.offsetLeft;
        const walk = (x - startXRef.current) * 1.5; // Drag speed multiplier
        container.scrollLeft = scrollLeftRef.current - walk;
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', handleGlobalMouseMove);

    return () => {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseleave', handleMouseLeave);
        container.removeEventListener('mousedown', handleMouseDown);
        container.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, []);


  return (
    <section id="pricing" className="w-full bg-black py-16 text-white overflow-hidden font-sans">
      {/* Import Font manually and define responsive classes to replace inline media queries */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
        
        .font-poppins {
            font-family: 'Poppins', sans-serif;
        }
        body {
            font-family: 'Poppins', sans-serif;
        }

        /* Default (Mobile) Pricing Card & Container Styles */
        .pricing-scroll-container {
            padding: 50px calc(50% - 140px) 70px calc(50% - 140px);
            scroll-snap-type: x mandatory;
            scrollbar-width: none;
            -ms-overflow-style: none;
        }

        .pricing-card-responsive {
            width: 280px;
            height: 520px;
            padding: 24px;
        }

        /* Tablet/Desktop Overrides */
        @media (min-width: 768px) {
            .pricing-scroll-container {
                padding: 50px calc(50% - 160px) 70px calc(50% - 160px);
            }
            .pricing-card-responsive {
                width: 320px;
                height: 540px;
                padding: 32px;
            }
        }

        /* Check icon styles */
        .check-icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            border: 1.5px solid rgba(255,255,255,0.4);
            font-size: 10px;
            color: rgba(255,255,255,0.6);
            flex-shrink: 0;
            margin-top: 2px;
        }
        .pricing-card-responsive.active .check-icon {
            border-color: rgba(255,255,255,0.8);
            color: rgba(255,255,255,0.9);
        }
      `}} />
      
      <div className="max-w-[1400px] mx-auto">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 px-4 relative z-20">
          <div className="mb-6 flex justify-center">
            <span className="text-[#ff0000] text-sm md:text-base font-medium">
              Pricing Plan
            </span>
          </div>
          <h2 className="text-[32px] md:text-[56px] font-bold text-white tracking-tight leading-[1.1] mb-6">
            Linkist Pricing Plans
          </h2>
          <p className="text-gray-400 text-sm md:text-lg leading-relaxed max-w-md md:max-w-xl mx-auto lg:mx-0">
            Select the plan that best suits your needs.
          </p>
        </div>

        {/* Toggle Switch */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center bg-[#1A1A1A] p-1 rounded-full border border-white/10 relative z-20">
            <button
              onClick={() => setPeriod('monthly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                period === 'monthly'
                  ? 'bg-[#ff0000] text-white shadow-[0_4px_10px_rgba(255,0,0,0.3)]'
                  : 'text-gray-400 hover:text-white bg-transparent'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setPeriod('yearly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                period === 'yearly'
                  ? 'bg-[#ff0000] text-white shadow-[0_4px_10px_rgba(255,0,0,0.3)]'
                  : 'text-gray-400 hover:text-white bg-transparent'
              }`}
            >
              Yearly
            </button>
          </div>
        </div>

        {/* Scroll Container */}
        <div className="w-full relative perspective-[1200px]">
          <div
            ref={scrollContainerRef}
            className="pricing-scroll-container flex overflow-x-auto items-center gap-0 cursor-grab no-scrollbar"
          >
            {PRICING_CARDS.map((card, index) => (
              <div
                key={index}
                ref={(el) => { cardRefs.current[index] = el; }}
                onClick={() => centerCard(index)}
                className="pricing-card-responsive relative flex flex-col flex-shrink-0 bg-[#0D0D0D] border border-white/10 rounded-[32px] overflow-hidden snap-center transition-colors duration-200 will-change-transform"
                style={{
                  opacity: 0.5,
                  transformOrigin: 'center center',
                }}
              >
                {/* Card Header Gradient Overlay */}
                <div
                  className="card-header-bg absolute top-0 left-0 w-full h-[180px] pointer-events-none transition-opacity duration-400 opacity-0 z-0"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,0,0,0.9) 0%, rgba(255,0,0,0) 100%)'
                  }}
                />

                {/* Card Content */}
                <div className="relative z-10 flex flex-col h-full">
                  <h3 className="text-xl font-semibold text-white mb-2 font-poppins">
                    {card.name}
                  </h3>
                  <p className="text-gray-400 text-xs mb-4 h-10 leading-snug">
                    {card.subtitle}
                  </p>

                  <div className="mb-6">
                    <span className="text-5xl font-medium text-white tracking-tight">
                      ${period === 'monthly' ? card.monthlyPrice : card.yearlyPrice}
                    </span>
                    <span className="text-gray-400 text-sm ml-1">
                      /{period === 'monthly' ? 'month' : 'year'}
                    </span>
                  </div>

                  <div className="flex-grow">
                    <h4 className="text-[10px] font-bold text-gray-500 tracking-wider uppercase mb-3">
                      FEATURES
                    </h4>
                    <ul className="space-y-3 mb-6">
                      {card.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="check-icon">✓</span>
                          <span className="text-gray-300 text-sm">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <a
                    href="https://www.linkist.ai/choose-plan"
                    className="card-btn w-full py-[14px] px-4 rounded-full border border-white/30 bg-transparent text-white text-center font-medium transition-all duration-300 mt-auto block no-underline"
                  >
                    Get Started
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
