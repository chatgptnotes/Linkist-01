'use client';

import Link from 'next/link';

export default function FeaturesSection() {
  return (
    <section className="bg-black">
      <div className="w-full lg:w-[75vw] mx-auto px-6 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Left Column: Image (hidden on mobile, shown on desktop) */}
          <div className="hidden lg:flex justify-center lg:order-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/new-image.png"
              alt="Features Illustration"
              className="w-full h-auto object-contain max-w-sm"
            />
          </div>

          {/* Right Column: Content */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left lg:order-2">

            {/* Top Badge: Text Link */}
            <div className="mb-6">
              <Link
                href="#pricing"
                className="text-[#FF3A29] text-sm md:text-base font-medium hover:text-white transition-colors"
                style={{ color: '#FF3A29' }}
              >
                THE ENTRY POINT
              </Link>
            </div>

            {/* Headline */}
            <h2
              className="font-inter font-medium text-[28px] leading-[34px] min-[390px]:text-[32px] min-[390px]:leading-[38px] md:text-[52px] md:leading-[66px] tracking-[-0.04em] text-center md:text-left mb-6"
              style={{
                backgroundImage: 'linear-gradient(180deg, #FFFFFF 25.5%, #999999 118.5%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              What do you get today?
            </h2>

            {/* Subtitle */}
            <p className="text-[#A3A3A3] text-sm md:text-lg leading-relaxed max-w-md md:max-w-xl mx-auto lg:mx-0 mb-6">
              A simple tap instantly shares your contact details and profile via NFC, QR,
              or link - no app required for the other person.
            </p>

            {/* Mobile-only Image (between subtitle and features) */}
            <div className="flex lg:hidden justify-center my-10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/new-image.png"
                alt="Features Illustration"
                className="w-full h-auto object-contain max-w-[260px]"
              />
            </div>

            {/* Features List */}
            <div className="w-fit mx-auto lg:w-full lg:mx-0 space-y-8 md:space-y-10 lg:mt-10">

              {/* Item 1 */}
              <div className="flex items-center gap-6 md:gap-8 justify-start text-left transition-transform duration-300 hover:translate-x-[5px]">
                <div className="flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/Dot.png"
                    alt="Bullet"
                    className="w-14 h-14 md:w-[60px] md:h-[60px] object-contain"
                  />
                </div>
                <div className="flex flex-col justify-center">
                  <h3 className="text-white font-medium text-[18px] md:text-[26px] leading-tight">
                    Smart NFC Card
                  </h3>
                  <p className="text-[#A3A3A3] text-[12px] md:text-[17px] leading-[1.4] md:leading-[1.6] font-normal">
                    Tap to share
                  </p>
                </div>
              </div>

              {/* Item 2 */}
              <div className="flex items-center gap-6 md:gap-8 justify-start text-left transition-transform duration-300 hover:translate-x-[5px]">
                <div className="flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/Dot.png"
                    alt="Bullet"
                    className="w-14 h-14 md:w-[60px] md:h-[60px] object-contain"
                  />
                </div>
                <div className="flex flex-col justify-center">
                  <h3 className="text-white font-medium text-[18px] md:text-[26px] leading-tight">
                    Unique Linkist ID
                  </h3>
                  <p className="text-[#A3A3A3] text-[12px] md:text-[17px] leading-[1.4] md:leading-[1.6] font-normal">
                    Your link. Forever.
                  </p>
                </div>
              </div>

              {/* Item 3 */}
              <div className="flex items-center gap-6 md:gap-8 justify-start text-left transition-transform duration-300 hover:translate-x-[5px]">
                <div className="flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/Dot.png"
                    alt="Bullet"
                    className="w-14 h-14 md:w-[60px] md:h-[60px] object-contain"
                  />
                </div>
                <div className="flex flex-col justify-center">
                  <h3 className="text-white font-medium text-[18px] md:text-[26px] leading-tight">
                    Digital Profile
                  </h3>
                  <p className="text-[#A3A3A3] text-[12px] md:text-[17px] leading-[1.4] md:leading-[1.6] font-normal">
                    Your smart identity
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
