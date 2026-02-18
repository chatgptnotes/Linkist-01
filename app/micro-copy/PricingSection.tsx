'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

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

export default function PricingSection() {
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('yearly');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [isHovering, setIsHovering] = useState(false);
  const [mouseX, setMouseX] = useState(0);
  const animationFrameRef = useRef<number>();
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  const centerCard = useCallback((cardElement: HTMLElement) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const cardRect = cardElement.getBoundingClientRect();
    const scrollOffset = cardElement.offsetLeft - container.offsetLeft - (containerRect.width / 2) + (cardRect.width / 2);
    container.scrollTo({ left: scrollOffset, behavior: 'smooth' });
  }, []);

  // Initial scroll to Pro card (index 2)
  useEffect(() => {
    const timeout = setTimeout(() => {
      const container = scrollContainerRef.current;
      if (!container) return;
      const cards = container.querySelectorAll('.pricing-card-new');
      const proCard = cards[2] as HTMLElement;
      if (proCard) {
        const containerRect = container.getBoundingClientRect();
        const cardRect = proCard.getBoundingClientRect();
        const scrollOffset = proCard.offsetLeft - container.offsetLeft - (containerRect.width / 2) + (cardRect.width / 2);
        container.scrollTo({ left: scrollOffset, behavior: 'smooth' });
      }
    }, 100);

    return () => clearTimeout(timeout);
  }, []);

  // Mouse hover and drag handlers
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isHovering || isDraggingRef.current) return;
      
      const rect = container.getBoundingClientRect();
      const relX = e.clientX - rect.left - rect.width / 2;
      setMouseX(relX);
    };

    const handleMouseEnter = () => setIsHovering(true);
    const handleMouseLeave = () => {
      setIsHovering(false);
      setMouseX(0);
    };

    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      startXRef.current = e.pageX - container.offsetLeft;
      scrollLeftRef.current = container.scrollLeft;
      container.style.cursor = 'grabbing';
      container.style.scrollSnapType = 'none';
    };

    const handleMouseMoveGlobal = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      const walk = (x - startXRef.current) * 2;
      container.scrollLeft = scrollLeftRef.current - walk;
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      container.style.cursor = 'grab';
      container.style.scrollSnapType = 'x mandatory';
    };

    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMoveGlobal);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMoveGlobal);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isHovering]);

  // Animation loop for 3D transforms
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const animate = () => {
      const cards = container.querySelectorAll('.pricing-card-new');
      const containerRect = container.getBoundingClientRect();
      const containerCenter = containerRect.left + containerRect.width / 2;

      // Auto-scroll based on mouse position (desktop only)
      if (isHovering && !isDraggingRef.current && window.innerWidth >= 1024) {
        const deadZone = 0.2;
        const relativePos = mouseX / (containerRect.width / 2);
        
        if (Math.abs(relativePos) > deadZone) {
          const direction = Math.sign(relativePos);
          const intensity = Math.pow(Math.abs(relativePos), 2);
          const scrollSpeed = direction * intensity * 10;
          container.scrollLeft += scrollSpeed;
        }
      }

      cards.forEach((card) => {
        const cardRect = card.getBoundingClientRect();
        const cardCenter = cardRect.left + cardRect.width / 2;
        const dist = cardCenter - containerCenter;
        const absDist = Math.abs(dist);

        // Scale: max(0.85, 1.05 - (absDist/500) * 0.25)
        const scale = Math.max(0.85, 1.05 - (absDist / 500) * 0.25);
        
        // Opacity: max(0.5, 1 - (absDist/500))
        const opacity = Math.max(0.5, 1 - (absDist / 500));

        // X offset for stacking: -dist * 0.20
        const xOffset = -dist * 0.20;

        // Z-index: 100 - round(absDist/5)
        const zIndex = 100 - Math.round(absDist / 5);

        (card as HTMLElement).style.transform = `translateX(${xOffset}px) scale(${scale})`;
        (card as HTMLElement).style.opacity = `${opacity}`;
        (card as HTMLElement).style.zIndex = `${zIndex}`;

        // Active class if absDist < 100
        if (absDist < 100) {
          card.classList.add('active');
        } else {
          card.classList.remove('active');
        }
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isHovering, mouseX]);

  return (
    <section id="pricing" className="bg-black py-16 md:py-24">
      <div className="w-full lg:w-[70vw] mx-auto px-6">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-12">
          <p className="text-[#ff0000] text-sm font-medium uppercase tracking-wider mb-3">
            Pricing Plan
          </p>
          <h2 className="text-[32px] md:text-[56px] font-bold text-white mb-4">
            Linkist Pricing Plans
          </h2>
          <p className="text-gray-400 text-base md:text-lg">
            Select the plan that best suits your needs.
          </p>
        </div>

        {/* Period Toggle */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-[#1A1A1A] p-1 rounded-full border border-white/10">
            <button
              onClick={() => setPeriod('monthly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                period === 'monthly'
                  ? 'bg-[#ff0000] text-white shadow-[0_4px_10px_rgba(255,0,0,0.3)]'
                  : 'text-gray-400 bg-transparent'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setPeriod('yearly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                period === 'yearly'
                  ? 'bg-[#ff0000] text-white shadow-[0_4px_10px_rgba(255,0,0,0.3)]'
                  : 'text-gray-400 bg-transparent'
              }`}
            >
              Yearly
            </button>
          </div>
        </div>

        {/* Pricing Carousel */}
        <div
          ref={scrollContainerRef}
          className="pricing-scroll-container flex overflow-x-auto items-center gap-0 cursor-grab"
          style={{
            scrollSnapType: 'x mandatory',
            padding: '50px calc(50% - 140px) 70px calc(50% - 140px)',
            msOverflowStyle: 'none',
            scrollbarWidth: 'none'
          }}
        >
          {PRICING_CARDS.map((card, index) => (
            <div
              key={index}
              ref={el => { cardRefs.current[index] = el; }}
              className="pricing-card-new relative flex flex-col bg-[#0D0D0D] border border-white/10 rounded-[32px] overflow-hidden"
              style={{
                flex: '0 0 280px',
                width: '280px',
                height: '520px',
                padding: '24px',
                opacity: 0.5,
                scrollSnapAlign: 'center',
                transition: 'border-color 0.4s ease'
              }}
              onClick={(e) => {
                e.currentTarget.classList.contains('active') || centerCard(e.currentTarget);
              }}
            >
              {/* Card Header Gradient Overlay */}
              <div 
                className="card-header-bg absolute top-0 left-0 w-full h-[180px] pointer-events-none opacity-0 transition-opacity duration-400"
                style={{
                  background: 'linear-gradient(180deg, rgba(255,0,0,0.9) 0%, rgba(255,0,0,0) 100%)'
                }}
              />

              {/* Card Content */}
              <div className="card-content relative z-10 flex flex-col h-full">
                <h3 className="text-xl font-semibold text-white mb-2">
                  {card.name}
                </h3>
                <p className="text-gray-400 text-xs mb-4 h-10 leading-snug">
                  {card.subtitle}
                </p>
                
                {/* Price */}
                <div className="mb-6">
                  <span className="text-5xl font-medium text-white tracking-tight price-amount">
                    ${period === 'monthly' ? card.monthlyPrice : card.yearlyPrice}
                  </span>
                  <span className="text-gray-400 text-sm price-period">
                    /{period === 'monthly' ? 'month' : 'year'}
                  </span>
                </div>

                {/* Features */}
                <div className="flex-grow">
                  <h4 className="text-[10px] font-bold text-gray-500 tracking-wider uppercase mb-3">
                    FEATURES
                  </h4>
                  <ul className="space-y-3 mb-6">
                    {card.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <svg
                          className="flex-shrink-0 w-[18px] h-[18px] text-white mt-0.5"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                        <span className="text-gray-300 text-sm">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Button */}
                <a
                  href="https://www.linkist.ai/choose-plan"
                  className="card-btn w-full py-[14px] px-4 rounded-full border border-white/30 bg-transparent text-white text-center font-medium transition-all duration-300"
                  style={{ marginTop: 'auto' }}
                >
                  Get Started
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Inline Styles for Active Card State */}
      <style jsx>{`
        @media (min-width: 768px) {
          .pricing-card-new {
            flex: 0 0 320px !important;
            width: 320px !important;
            height: 540px !important;
            padding: 32px !important;
          }
          .pricing-scroll-container {
            padding: 50px calc(50% - 160px) 70px calc(50% - 160px) !important;
          }
        }

        .pricing-scroll-container::-webkit-scrollbar {
          display: none;
        }

        .pricing-card-new.active {
          opacity: 1 !important;
          border-color: rgba(255, 0, 0, 0.5) !important;
          box-shadow: 0 30px 60px -10px rgba(0, 0, 0, 0.9);
        }

        .pricing-card-new.active .card-header-bg {
          opacity: 1 !important;
        }

        .pricing-card-new.active .card-btn {
          background: #ff0000 !important;
          border-color: #ff0000 !important;
          box-shadow: 0 4px 20px rgba(255, 0, 0, 0.3);
        }
      `}</style>
    </section>
  );
}
