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
            Limited-time invite only offer
          </h2>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          
          {/* Promo Card (Standardized to match others) */}
          <div className="rounded-3xl md:rounded-[32px] overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1">
            <div className="bg-[#E63929] p-6 md:p-8 flex flex-col flex-1">
              <h3 className="text-white font-bold text-lg md:text-2xl mb-4">
                Founding Member Rate
              </h3>
              <p className="text-white/95 text-sm md:text-base leading-relaxed">
                <span className="italic font-bold block mb-3">Locked in for life.</span>
                Subscribe now and keep this discounted rate forever! Limited period offer until June 2026.
              </p>
            </div>
            <div className="bg-[#CC2B1C] p-6 md:px-8 md:py-6 flex flex-col">
              <div className="flex items-baseline gap-2 flex-wrap mb-1">
                <span className="text-white font-bold text-2xl md:text-3xl">$69</span>
                <span className="text-white/90 text-sm md:text-base font-medium">/year</span>
                <span className="text-white/60 text-sm md:text-base font-medium line-through ml-1">vs $99 /year</span>
              </div>
              <p className="text-white/80 text-xs md:text-sm font-medium">
                (First year free; Chargeable from second year onwards)
              </p>
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
      </div>
    </section>
  );
}
