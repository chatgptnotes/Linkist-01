'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function MicroCopyPage() {
  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#2a0a0a] via-[#1a1a1a] to-[#1a1a1a]" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 lg:px-20 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Left - Text Content */}
            <div className="space-y-8">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Start with the{' '}
                <span className="block">best</span>
                <span className="block">smart card now.</span>
                <span className="block text-gray-500">Grow into</span>
                <span className="block text-gray-500">relationship</span>
                <span className="block text-gray-500">intelligence.</span>
              </h1>

              <p className="text-gray-400 text-lg max-w-lg">
                The Linkist Smart Card is your entry into the Linkist PRM
                ecosystem. Start with a unique personal URL, smart profile
                and NFC business card today. Grow into personal
                relationship intelligence over time.
              </p>

              <div className="flex items-center gap-6">
                <Link
                  href="#know-more"
                  className="text-red-500 hover:text-red-400 font-medium transition-colors"
                >
                  Know More
                </Link>
                <button
                  className="inline-flex items-center gap-3 bg-[#2a2a2a] hover:bg-[#333] border border-gray-700 rounded-full px-6 py-3 font-medium transition-colors cursor-default"
                >
                  <Image
                    src="/linkist-logo.png"
                    alt="Linkist"
                    width={24}
                    height={24}
                    className="rounded"
                  />
                  Join Now
                </button>
              </div>
            </div>

            {/* Right - Card Image */}
            <div className="flex justify-center md:justify-end">
              <div className="relative w-[400px] h-[300px] md:w-[500px] md:h-[350px]">
                {/* Placeholder for smart card image */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-[350px] h-[220px] md:w-[420px] md:h-[260px] bg-gradient-to-br from-[#3a3a3a] via-[#2a2a2a] to-[#1a1a1a] rounded-2xl shadow-2xl transform rotate-[-10deg] border border-gray-700/50 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto mb-2 rounded-lg bg-red-600/20 flex items-center justify-center">
                        <Image
                          src="/linkist-logo.png"
                          alt="Linkist"
                          width={32}
                          height={32}
                          className="rounded"
                        />
                      </div>
                      <p className="text-gray-500 text-sm">Smart Card</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2 - Features (placeholder) */}
      <section id="know-more" className="py-20 px-6 md:px-12 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Why Linkist?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Smart NFC Card',
                description: 'Share your profile with a single tap. Works with all modern smartphones.',
              },
              {
                title: 'Personal URL',
                description: 'Get your unique linkist.ai/yourname URL to share anywhere, anytime.',
              },
              {
                title: 'Relationship Intelligence',
                description: 'Track connections, follow-ups, and grow your professional network.',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="bg-[#222] border border-gray-800 rounded-2xl p-8 hover:border-red-500/30 transition-colors"
              >
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3 - How It Works (placeholder) */}
      <section className="py-20 px-6 md:px-12 lg:px-20 bg-[#111]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Get Your Card', description: 'Order your personalized Linkist Smart Card.' },
              { step: '02', title: 'Set Up Profile', description: 'Create your digital profile with all your links and info.' },
              { step: '03', title: 'Tap & Share', description: 'Tap your card on any phone to instantly share your profile.' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="text-5xl font-bold text-red-500/20 mb-4">{item.step}</div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4 - CTA (placeholder) */}
      <section className="py-20 px-6 md:px-12 lg:px-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to get started?
          </h2>
          <p className="text-gray-400 text-lg mb-10">
            Join the Linkist community and transform how you network.
          </p>
          <button
            className="inline-flex items-center gap-3 bg-red-600 hover:bg-red-700 rounded-full px-8 py-4 font-semibold text-lg transition-colors cursor-default"
          >
            <Image
              src="/linkist-logo.png"
              alt="Linkist"
              width={24}
              height={24}
              className="rounded"
            />
            Join Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 px-6 md:px-12 lg:px-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Image
              src="/linkist-logo.png"
              alt="Linkist"
              width={24}
              height={24}
              className="rounded"
            />
            <span className="font-semibold">Linkist</span>
          </div>
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Linkist. All rights reserved.
          </p>
          <div className="flex gap-6 text-gray-400 text-sm">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
