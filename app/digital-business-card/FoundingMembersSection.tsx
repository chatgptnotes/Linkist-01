'use client';

export default function FoundingMembersSection() {
  return (
    <section className="bg-black">
      <div className="w-full lg:w-[75vw] mx-auto px-4 md:px-6 py-12 md:py-24">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-12 md:mb-16">
          <div className="mb-6">
            <span className="text-[#FF3A29] text-sm md:text-base font-medium">
              THE FOUNDING MEMBER OFFER
            </span>
          </div>
          <h2
            className="font-inter font-medium text-[28px] leading-[34px] min-[390px]:text-[32px] min-[390px]:leading-[38px] md:text-[52px] md:leading-[66px] tracking-[-0.04em] text-center md:text-center mb-6"
            style={{
              backgroundImage: 'linear-gradient(180deg, #FFFFFF 25.5%, #999999 118.5%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Limited-time offer
          </h2>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          
          {/* Promo Card */}
          <div className="rounded-3xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1">
            <div className="bg-[#E63929] px-6 py-8 md:px-8 md:py-9 flex flex-col">
              <h3 className="text-white font-bold text-3xl leading-tight md:text-[38px] md:leading-[44px] mb-3">
                Founding Member Pricing
              </h3>
              <p className="text-white italic text-sm md:text-base mb-3">
                Lock in your rate for life.
              </p>
              <p className="text-white/90 text-sm md:text-base leading-relaxed">
                Join before June 2026 to keep this founding member price for PRM App forever.
              </p>

              <div className="border-t border-white/20 mt-6" />

              <div className="border-t border-white/20 py-4 flex items-center justify-between">
                <span className="border-l-2 border-blue-400 pl-3 text-white font-medium text-sm md:text-base">Year 1</span>
                <span className="text-white font-bold text-xl md:text-2xl">Free</span>
              </div>

              <div className="border-t border-white/20 py-4 flex items-center justify-between">
                <span className="border-l-2 border-blue-400 pl-3 text-white font-medium text-sm md:text-base">Year 2 onward</span>
                <div className="flex items-end gap-1">
                  <span className="text-white font-bold text-2xl md:text-3xl">$69</span>
                  <span className="text-white text-sm mb-0.5">/year</span>
                </div>
              </div>

              <div className="border-t border-white/20 pt-4 flex items-start justify-between">
                <span className="text-white/60 font-medium text-sm md:text-base">Regular price</span>
                <div className="flex flex-col items-end">
                  <span className="line-through text-white/50 text-base md:text-lg">$99 /year</span>
                  <span className="text-white/50 text-xs">from year 1</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 1: Unique ID (Restored) */}
          <div className="bg-[#111111] border border-white/[0.12] rounded-3xl md:rounded-[32px] p-6 md:p-8 flex flex-row md:flex-col items-center md:items-start gap-4 md:gap-6 transition-all duration-300 hover:border-white/30 hover:-translate-y-1">
            <div className="flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/Layer-15.png"
                alt="Unique ID"
                className="w-12 h-12 md:w-[72px] md:h-[72px] object-contain"
              />
            </div>
            <div className="flex flex-col">
              <h3 className="text-white font-medium text-lg md:text-2xl mb-2">
                Unique ID
              </h3>
              <p className="text-[#A3A3A3] text-sm md:text-base">
                Get a memorable linkist.ai URL that&apos;s yours forever
              </p>
            </div>
          </div>

          {/* Card 2: Smart Card */}
          <div className="bg-[#111111] border border-white/[0.12] rounded-3xl md:rounded-[32px] p-6 md:p-8 flex flex-row md:flex-col items-center md:items-start gap-4 md:gap-6 transition-all duration-300 hover:border-white/30 hover:-translate-y-1">
            <div className="flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/Layer-16.png"
                alt="Smart Card"
                className="w-12 h-12 md:w-[72px] md:h-[72px] object-contain"
              />
            </div>
            <div className="flex flex-col">
              <h3 className="text-white font-medium text-lg md:text-2xl mb-2">
                Smart Card
              </h3>
              <p className="text-[#A3A3A3] text-sm md:text-base">
                Premium NFC card with instant tap-to-share technology
              </p>
            </div>
          </div>

          {/* Card 3: Recognition */}
          <div className="bg-[#111111] border border-white/[0.12] rounded-3xl md:rounded-[32px] p-6 md:p-8 flex flex-row md:flex-col items-center md:items-start gap-4 md:gap-6 transition-all duration-300 hover:border-white/30 hover:-translate-y-1">
            <div className="flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/Layer-19.png"
                alt="Recognition"
                className="w-12 h-12 md:w-[72px] md:h-[72px] object-contain"
              />
            </div>
            <div className="flex flex-col">
              <h3 className="text-white font-medium text-lg md:text-2xl mb-2">
                Recognition
              </h3>
              <p className="text-[#A3A3A3] text-sm md:text-base">
                Special badge showing you&apos;re a founding member
              </p>
            </div>
          </div>

          {/* Card 4: Pro App with AI */}
          <div className="bg-[#111111] border border-white/[0.12] rounded-3xl md:rounded-[32px] p-6 md:p-8 flex flex-row md:flex-col items-center md:items-start gap-4 md:gap-6 transition-all duration-300 hover:border-white/30 hover:-translate-y-1">
            <div className="flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/Layer-17.png"
                alt="Pro App with AI"
                className="w-12 h-12 md:w-[72px] md:h-[72px] object-contain"
              />
            </div>
            <div className="flex flex-col">
              <h3 className="text-white font-medium text-lg md:text-2xl mb-2">
                Pro App with AI
              </h3>
              <p className="text-[#A3A3A3] text-sm md:text-base">
                Early access to AI-powered relationship intelligence
              </p>
            </div>
          </div>

          {/* Card 5: Rewards */}
          <div className="bg-[#111111] border border-white/[0.12] rounded-3xl md:rounded-[32px] p-6 md:p-8 flex flex-row md:flex-col items-center md:items-start gap-4 md:gap-6 transition-all duration-300 hover:border-white/30 hover:-translate-y-1">
            <div className="flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/Layer-22.png"
                alt="Rewards"
                className="w-12 h-12 md:w-[72px] md:h-[72px] object-contain"
              />
            </div>
            <div className="flex flex-col">
              <h3 className="text-white font-medium text-lg md:text-2xl mb-2">
                Rewards
              </h3>
              <p className="text-[#A3A3A3] text-sm md:text-base">
                Exclusive perks and lifetime benefits for early supporters
              </p>
            </div>
          </div>

        </div>

        {/* CTA Button */}
        <div className="flex justify-center mt-10 md:mt-14">
          <a
            href="/choose-plan"
            className="inline-block bg-[#FF3A29] hover:bg-[#e8321f] text-white font-bold text-sm md:text-base py-4 px-8 rounded-full transition-all duration-300"
            style={{ boxShadow: '0 4px 20px rgba(255,58,41,0.3)' }}
          >
            Claim Your Founding Member Access
          </a>
        </div>
      </div>
    </section>
  );
}
