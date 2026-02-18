'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface PricingPlan {
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
}

const PRICING_PLANS: PricingPlan[] = [
  {
    name: 'Starter',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      'Basic NFC Card',
      'Simple Profile',
      'Limited Features'
    ]
  },
  {
    name: 'Next Student Edition',
    monthlyPrice: 6.9,
    yearlyPrice: 69,
    features: [
      'Student Discount',
      'Full Profile Access',
      'AI Features',
      'Priority Support'
    ]
  },
  {
    name: 'Pro',
    monthlyPrice: 9.9,
    yearlyPrice: 99,
    features: [
      'Premium NFC Card',
      'Full AI Features'
    ]
  },
  {
    name: 'Signature',
    monthlyPrice: 12.9,
    yearlyPrice: 129,
    features: [
      'Signature Card Design',
      'Advanced Analytics'
    ]
  },
  {
    name: "Founder's Circle",
    monthlyPrice: 14.9,
    yearlyPrice: 149,
    features: [
      'Exclusive Access',
      'Early Features',
      'Direct Support',
      'Community Benefits'
    ]
  }
];

export default function PricingSection() {
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [mouseX, setMouseX] = useState(0);
  const animationFrameRef = useRef<number>();
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  const centerCard = useCallback((index: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const cards = container.querySelectorAll('.pricing-card-new');
    const card = cards[index] as HTMLElement;
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, []);

  useEffect(() => {
    // Initial scroll to Pro card (index 2) after a short delay
    const timeout = setTimeout(() => {
      centerCard(2);
    }, 100);

    return () => clearTimeout(timeout);
  }, [centerCard]);

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

    // Manual drag functionality
    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      startXRef.current = e.pageX - container.offsetLeft;
      scrollLeftRef.current = container.scrollLeft;
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

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const animate = () => {
      const cards = container.querySelectorAll('.pricing-card-new');
      const containerRect = container.getBoundingClientRect();
      const centerX = containerRect.left + containerRect.width / 2;

      // Auto-scroll based on mouse position
      if (isHovering && !isDraggingRef.current) {
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
        const cardCenterX = cardRect.left + cardRect.width / 2;
        const distance = cardCenterX - centerX;
        const absDistance = Math.abs(distance);

        // Scale: 0.85 to 1.05
        const scale = 1.05 - Math.min(absDistance / 300, 0.2);
        
        // Opacity: 0.5 to 1
        const opacity = 1 - Math.min(absDistance / 400, 0.5);

        // X offset for 3D effect
        const xOffset = -distance * 0.2;

        // Z-index
        const zIndex = 100 - Math.floor(absDistance / 5);

        (card as HTMLElement).style.transform = `scale(${scale}) translateX(${xOffset}px)`;
        (card as HTMLElement).style.opacity = `${opacity}`;
        (card as HTMLElement).style.zIndex = `${zIndex}`;

        // Active class
        if (absDistance < 100) {
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
    <section id="pricing" className="bg-black">
      <div className="w-full lg:w-[75vw] mx-auto px-6 py-16 md:py-24">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-12 md:mb-16">
          <h2 className="text-[32px] md:text-[56px] font-bold text-white tracking-tight leading-[1.1] mb-8">
            Choose Your Plan
          </h2>

          {/* Period Toggle */}
          <div className="flex items-center gap-3 bg-[#111111] rounded-full p-2">
            <button
              onClick={() => setPeriod('monthly')}
              className={`px-6 py-2 rounded-full text-sm md:text-base font-medium transition-all duration-300 ${
                period === 'monthly'
                  ? 'bg-[#ff0000] text-white shadow-[0_0_20px_rgba(255,0,0,0.5)]'
                  : 'text-[#A3A3A3] hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setPeriod('yearly')}
              className={`px-6 py-2 rounded-full text-sm md:text-base font-medium transition-all duration-300 ${
                period === 'yearly'
                  ? 'bg-[#ff0000] text-white shadow-[0_0_20px_rgba(255,0,0,0.5)]'
                  : 'text-[#A3A3A3] hover:text-white'
              }`}
            >
              Yearly
            </button>
          </div>
        </div>

        {/* Pricing Carousel */}
        <div
          ref={scrollContainerRef}
          className="pricing-scroll-container"
          style={{
            perspective: '1200px',
            display: 'flex',
            gap: '2rem',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            padding: '3rem 2rem',
            cursor: 'grab'
          }}
        >
          {PRICING_PLANS.map((plan, index) => (
            <div
              key={index}
              className="pricing-card-new"
              style={{
                flex: '0 0 320px',
                scrollSnapAlign: 'center',
                transition: 'transform 0.3s ease, opacity 0.3s ease'
              }}
            >
              <div className="card-header-bg bg-gradient-to-b from-[#1a1a1a] to-[#111111] rounded-t-2xl p-6 border-b border-white/10">
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="text-4xl font-bold text-white">
                  ${period === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}
                  <span className="text-lg text-[#A3A3A3] font-normal">
                    /{period === 'monthly' ? 'mo' : 'yr'}
                  </span>
                </div>
              </div>
              
              <div className="card-content bg-[#111111] rounded-b-2xl p-6">
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3 text-[#A3A3A3]">
                      <svg
                        className="w-5 h-5 text-[#FF3A29] flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <a
                  href="https://linkist.ai"
                  className="card-btn block w-full bg-[#FF3A29] hover:bg-[#ff4d3a] text-white font-medium py-3 px-6 rounded-lg text-center transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,58,41,0.5)]"
                >
                  Get Started
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
