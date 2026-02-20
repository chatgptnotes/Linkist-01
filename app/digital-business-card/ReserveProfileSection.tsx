'use client';

import { useState } from 'react';

export default function ReserveProfileSection() {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <section className="bg-black relative overflow-hidden">
      {/* Top Curved Gradient */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[300px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(255, 58, 41, 0.3) 0%, rgba(0, 0, 0, 0) 70%)',
          maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)'
        }}
      />

      <div className="w-full lg:w-[75vw] max-w-4xl mx-auto px-6 py-16 md:py-24 flex flex-col items-center text-center relative z-10">
        
        {/* Quote */}
        <p 
          className="text-white text-2xl md:text-3xl mb-8"
          style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic' }}
        >
          &ldquo;History favour&apos;s the bold.&rdquo;
        </p>

        {/* Red Separator Line */}
        <div 
          className="w-[120px] h-[2px] bg-[#FF3A29] mb-8"
          style={{
            boxShadow: '0 0 10px rgba(255, 58, 41, 0.5)'
          }}
        />

        {/* Description */}
        <p className="text-[#A3A3A3] text-sm md:text-lg leading-relaxed max-w-2xl mb-16">
          Limited spots available for the initial release. Secure your position in the network before the public launch.
        </p>

        {/* Main Glass Card */}
        <div 
          className="w-full max-w-2xl lg:max-w-lg rounded-3xl p-8 md:p-12 lg:p-8"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderTop: '1px solid rgba(255, 255, 255, 0.2)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
          }}
        >
          {/* Card Header */}
          <h3 className="text-2xl md:text-4xl font-bold text-white mb-4">
            Join the Linkist community
          </h3>
          <p className="text-[#A3A3A3] text-base md:text-lg mb-8">
            Early members don&apos;t just get a card, they help shape how Linkist evolves and get access to Linkist and partner community events.
          </p>

          {/* Inner Glass Box with Logo */}
          <div 
            className="rounded-2xl p-8 md:p-12 lg:p-6 mb-8"
            style={{
              background: 'linear-gradient(to bottom, rgba(255, 58, 41, 0.1) 0%, rgba(255, 58, 41, 0.05) 100%)',
              border: '1px solid rgba(255, 58, 41, 0.2)'
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/Linkist-Brand-Mark-SVG.svg"
              alt="Linkist Logo"
              className="w-24 h-24 md:w-32 md:h-32 lg:w-20 lg:h-20 mx-auto mb-6 lg:mb-3"
              style={{
                filter: 'drop-shadow(0 0 20px rgba(255, 58, 41, 0.5))'
              }}
            />
            <p className="text-white text-xl md:text-2xl lg:text-lg font-semibold mb-2">
              Get your Linkist NFC card
            </p>
            <p className="text-[#A3A3A3] text-sm md:text-base lg:text-sm">
              (includes early access to the linkist app)
            </p>
          </div>

          {/* Reserve Button */}
          <div className="lg:flex lg:justify-center">
            <a
              href="https://www.linkist.ai/choose-plan"
              className="block w-full lg:w-auto lg:inline-block bg-[#FF3A29] hover:bg-[#ff4d3a] text-white font-bold text-lg md:text-xl lg:text-base py-4 md:py-5 lg:py-3 px-8 lg:px-12 rounded-xl lg:rounded-full transition-all duration-300"
              style={{
                boxShadow: isHovering 
                  ? '0 0 30px rgba(255, 58, 41, 0.6), 0 0 60px rgba(255, 58, 41, 0.4)' 
                  : '0 0 20px rgba(255, 58, 41, 0.5)'
              }}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              Reserve
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
