'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

type Feature = {
  text: string;
  included: boolean;
};

type Plan = {
  name: string;
  price: string;
  description: string;
  features: Feature[];
  badge: string | null;
  cta: string;
  href: string;
};

export default function PricingSection() {
  const [foundersPrice, setFoundersPrice] = useState<number | null>(null);
  const [foundersDescription, setFoundersDescription] = useState<string>('Built for the first believers.');
  const [foundersFeatures, setFoundersFeatures] = useState<Feature[]>([
    { text: 'Lifetime Linkist Pro App subscription', included: true },
    { text: 'Linkist Digital Profile', included: true },
    { text: 'AI Credits worth $50 (no expiry)', included: true },
    { text: 'Premium Metal NFC Card', included: true },
    { text: 'Up to 3 Founding Club referral invites', included: true },
    { text: 'Access to exclusive Linkist partner privileges', included: true }
  ]);

  useEffect(() => {
    // Fetch Founders Club pricing from API
    const fetchFoundersPricing = async () => {
      try {
        const response = await fetch('/api/founders/pricing');
        const data = await response.json();
        if (data.success && data.founders_total_price) {
          setFoundersPrice(data.founders_total_price);

          // Update description and features from API if available
          if (data.plan?.description) {
            setFoundersDescription(data.plan.description);
          }
          if (data.plan?.features && Array.isArray(data.plan.features) && data.plan.features.length > 0) {
            setFoundersFeatures(data.plan.features.map((f: string) => ({ text: f, included: true })));
          }
        }
      } catch (error) {
        console.error('Error fetching founders pricing:', error);
      }
    };
    fetchFoundersPricing();
  }, []);

  const plans: Plan[] = [
    {
      name: 'Starter',
      price: '$0',
      description: 'A simple digital identity to get you started.',
      features: [
        { text: 'Linkist Digital Profile', included: true },
        { text: 'Personalised Linkist ID (yours for life)', included: true },
        { text: 'Easy sharing via link & QR', included: true }
      ],
      badge: null,
      cta: 'Get Started',
      href: '/choose-plan'
    },
    {
      name: 'Personal',
      price: '$69',
      description: 'Your digital profile, powered by a physical touchpoint.',
      features: [
        { text: 'Everything in Starter and more', included: true },
        { text: 'Linkist branded NFC card', included: true },
        { text: 'No Founding Member tag', included: false },
        { text: 'No Linkist Pro App subscription', included: false }
      ],
      badge: null,
      cta: 'Get Started',
      href: '/choose-plan'
    },
    {
      name: "Founder's Club",
      price: foundersPrice ? `$${foundersPrice}` : '...',
      description: foundersDescription,
      features: foundersFeatures,
      badge: 'Most Exclusive',
      cta: 'Know More',
      href: '/product-selection'
    }
  ];

  return (
    <section className="relative py-20 md:py-24 bg-[#050505] overflow-visible">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="inline-block px-5 py-2 rounded-full border border-[#E02424]/30 bg-[#E02424]/10 text-[#E02424] text-xs font-semibold tracking-wider uppercase mb-6"
        >
          Pricing Plan
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-6 text-center"
          style={{
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 500,
            fontSize: '32px',
            lineHeight: '43px',
            letterSpacing: '-0.02em',
            background: 'linear-gradient(180deg, #FFFFFF 25.5%, #999999 118.5%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Select the right plan for your needs
        </motion.h2>

        <p className="text-[#888] text-sm md:text-base max-w-2xl mx-auto mb-20 leading-relaxed font-body">
          Select the plan that best suits your needs, whether you're just getting started or need advanced features and support for your business.
        </p>

        {/* Pricing Cards Grid */}
        <div className="grid lg:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="relative rounded-[32px] p-8 text-left bg-[#0F0F0F] border border-[#1A1A1A] flex flex-col"
            >
              {/* Header with title and badge */}
              <div className="flex items-center justify-between mb-4">
                <h3
                  style={{
                    fontFamily: 'Poppins, sans-serif',
                    fontWeight: 500,
                    fontSize: '24px',
                    lineHeight: '32px',
                    letterSpacing: '0',
                    color: '#FFFFFF',
                  }}
                >
                  {plan.name}
                </h3>
                {plan.badge && (
                  <span className="px-4 py-1.5 rounded-full text-xs font-medium bg-[#3D1515] text-[#E85454] border border-[#5C2020]">
                    {plan.badge}
                  </span>
                )}
              </div>

              {/* Description */}
              <p
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 400,
                  fontSize: '16px',
                  lineHeight: '26px',
                  letterSpacing: '0',
                  color: 'rgba(189, 189, 189, 1)',
                }}
                className="mb-6"
              >
                {plan.description}
              </p>

              {/* Divider */}
              <div className="w-full h-px bg-[#222] mb-8" />

              {/* Price */}
              <div className="mb-8">
                <span
                  style={{
                    fontFamily: 'Poppins, sans-serif',
                    fontWeight: 500,
                    fontSize: '80px',
                    lineHeight: '88px',
                    letterSpacing: '-0.04em',
                    color: 'rgba(255, 255, 255, 1)',
                  }}
                >
                  {plan.price}
                </span>
              </div>

              {/* Features */}
              <div className="space-y-5 flex-grow mb-8">
                {plan.features.map((feature, fIdx) => (
                  <div key={fIdx} className="flex items-start gap-3">
                    {feature.included ? (
                      <svg
                        className="w-5 h-5 mt-0.5 flex-shrink-0 text-[#888]"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9 12l2 2 4-4" />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5 mt-0.5 flex-shrink-0 text-[#555]"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M15 9l-6 6M9 9l6 6" />
                      </svg>
                    )}
                    <span
                      style={{
                        fontFamily: 'Poppins, sans-serif',
                        fontWeight: 400,
                        fontSize: '16px',
                        lineHeight: '26px',
                        letterSpacing: '0',
                        color: feature.included ? 'rgba(245, 245, 245, 1)' : 'rgba(102, 102, 102, 1)',
                      }}
                    >
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <Link
                href={plan.href}
                className="w-full py-4 rounded-full font-medium text-sm text-white bg-transparent border border-[#333] hover:border-[#444] hover:bg-[#111] transition-all text-center block"
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}