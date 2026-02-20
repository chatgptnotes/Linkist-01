'use client';

export default function SignUpSection() {
  return (
    <section className="bg-black">
      <div className="w-full lg:w-[75vw] mx-auto px-6 py-16 md:py-24 flex flex-col items-center">

        {/* Header Section */}
        <div className="flex flex-col items-center text-center max-w-3xl mb-16 md:mb-20">

          {/* Top Icon */}
          <div className="mb-8 relative">
            <div
              className="absolute inset-0 transform scale-150"
              style={{
                background:
                  'radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, rgba(0, 0, 0, 0) 70%)',
              }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/Icon-11.png"
              alt="User Icon"
              className="relative w-40 h-40 md:w-48 md:h-48 object-contain"
            />
          </div>

          {/* Headline */}
          <h2 className="text-[32px] md:text-[56px] font-bold text-white tracking-tight leading-[1.1] mb-6">
            What are you signing up for?
          </h2>

          {/* Description */}
          <p className="text-[#A3A3A3] text-sm md:text-lg leading-relaxed max-w-md md:max-w-xl mx-auto lg:mx-0">
            The Linkist app and PRM eco-system. This is where networking becomes
            intelligent.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">

          {/* Item 1: Capture Context */}
          <div className="bg-[#111111] border border-white/10 rounded-3xl flex items-center p-6 gap-5 h-full transition-all duration-300 hover:border-[rgba(255,58,41,0.4)] hover:-translate-y-1">
            <div className="flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/Layer-26.png"
                alt="Check Icon"
                className="w-12 h-12 md:w-14 md:h-14 object-contain"
              />
            </div>
            <div className="flex flex-col justify-center">
              <h3 className="text-white font-medium text-[18px] md:text-[26px] leading-tight">
                Capture context<br />not just contacts
              </h3>
            </div>
          </div>

          {/* Item 2: Remember Who */}
          <div className="bg-[#111111] border border-white/10 rounded-3xl flex items-center p-6 gap-5 h-full transition-all duration-300 hover:border-[rgba(255,58,41,0.4)] hover:-translate-y-1">
            <div className="flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/Layer-26.png"
                alt="Check Icon"
                className="w-12 h-12 md:w-14 md:h-14 object-contain"
              />
            </div>
            <div className="flex flex-col justify-center">
              <h3 className="text-white font-medium text-[18px] md:text-[26px] leading-tight">
                Remember who<br />you met
              </h3>
            </div>
          </div>

          {/* Item 3: Get Nudges */}
          <div className="bg-[#111111] border border-white/10 rounded-3xl flex items-center p-6 gap-5 h-full transition-all duration-300 hover:border-[rgba(255,58,41,0.4)] hover:-translate-y-1">
            <div className="flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/Layer-26.png"
                alt="Check Icon"
                className="w-12 h-12 md:w-14 md:h-14 object-contain"
              />
            </div>
            <div className="flex flex-col justify-center">
              <h3 className="text-white font-medium text-[18px] md:text-[26px] leading-tight">
                Get nudges on<br />who to follow up
              </h3>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
