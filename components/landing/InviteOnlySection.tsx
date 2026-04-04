import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

export default function InviteOnlySection() {
    const cards = [
        {
            icon: '/icons/name.png',
            title: 'Unique ID',
            description: "Get a memorable linkist.ai URL that's yours forever.",
            iconSize: 28
        },
        {
            icon: '/icons/card.png',
            title: 'Smart Card',
            description: 'Premium NFC card with instant tap-to-share technology.',
            iconSize: 28
        },
        {
            icon: '/icons/badge.png',
            title: 'Recognition',
            description: 'Special badge showing you are a founding member.',
            iconSize: 28
        },
        {
            icon: '/icons/value.png',
            title: 'Pro App with AI',
            description: "Early access to AI-powered relationship intelligence.",
            iconSize: 48
        },
        {
            icon: '/icons/reward.png',
            title: 'Rewards',
            description: 'Exclusive perks and lifetime benefits for early supporters.',
            iconSize: 28
        }
    ];

    return (
        <section className="relative pt-16 pb-16 md:pt-20 md:pb-20 bg-[#050505]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="inline-block text-[#E02424] text-xs font-semibold tracking-wider uppercase mb-6"
                >
                    The Founding Member Offer
                </motion.div>

                <motion.h2
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-6 text-center text-[28px] leading-[38px] min-[390px]:text-[32px] min-[390px]:leading-[44px] md:text-[56px] md:leading-[72px] font-inter font-medium tracking-[-0.04em]"
                    style={{
                        background: 'linear-gradient(180deg, #FFFFFF 25.5%, #999999 118.5%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                    }}
                >
                    Limited-time offer
                </motion.h2>

                {/* Grid of Cards */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 justify-items-center px-4 md:px-0">
                    
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0 }}
                        className="rounded-[24px] overflow-hidden flex flex-col w-full max-w-[350px] transition-transform duration-300 hover:-translate-y-1 relative"
                    >
                        {/* Top: Red header */}
                        <div className="bg-[#E63929] px-6 pt-6 pb-4 flex flex-col text-left relative">
                            {/* Left arrow */}
                            <span
                                aria-hidden="true"
                                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-white text-xl leading-none select-none"
                                style={{ background: 'rgba(0,0,0,0.3)' }}
                            >
                                &#8249;
                            </span>
                            {/* Right arrow */}
                            <span
                                aria-hidden="true"
                                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-white text-xl leading-none select-none"
                                style={{ background: 'rgba(0,0,0,0.3)' }}
                            >
                                &#8250;
                            </span>
                            <h3 className="text-white font-bold text-xl md:text-2xl mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                Founding Member Rate
                            </h3>
                            <p className="text-white text-sm leading-snug" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                <span className="italic font-bold block mb-1">Locked in for life.</span>
                                Subscribe now and keep this discounted rate forever! Limited period offer until June 2026.
                            </p>
                        </div>
                        {/* Bottom: Darker red pricing */}
                        <div className="bg-[#CC2B1C] px-6 py-5 flex flex-col text-left gap-3">
                            {/* Pricing row */}
                            <div className="flex items-center justify-between" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                {/* Left: 1st year free + $69/year after */}
                                <div className="flex flex-col">
                                    <span className="text-white font-bold text-xl md:text-2xl leading-tight">1st year free</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-white font-normal text-sm">+</span>
                                        <span className="text-white font-bold text-3xl md:text-4xl leading-tight">$69</span>
                                        <span className="text-white/90 text-sm font-medium">/year after</span>
                                    </div>
                                </div>
                                {/* Center Vs */}
                                <span className="text-white/60 text-base font-medium px-2">Vs</span>
                                {/* Right: $99 strikethrough */}
                                <div className="flex flex-col items-end">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-white/60 text-2xl font-bold line-through">$99</span>
                                        <span className="text-white/60 text-xs">/year</span>
                                    </div>
                                    <span className="text-white/60 text-xs">from 1st year</span>
                                </div>
                            </div>
                            {/* Savings */}
                            <p className="text-white/90 text-sm text-center font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                Savings of <strong>$129</strong> in 2 years
                            </p>
                        </div>
                    </motion.div>

                    {/* Original Feature Cards */}
                    {cards.map((card, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: (idx + 1) * 0.1 }} // Staggered delays after the promo card
                            className="bg-[#1A1A1A] rounded-[24px] p-6 text-left flex flex-col w-full max-w-[350px] transition-transform duration-300 hover:-translate-y-1"
                        >
                            {/* Header row with icon + title */}
                            <div className="flex items-center mb-4">
                                <div className="w-[48px] h-[48px] rounded-[12px] bg-[#FF3A29] flex items-center justify-center overflow-hidden flex-shrink-0">
                                    <img
                                        src={card.icon}
                                        alt={card.title}
                                        width={card.iconSize}
                                        height={card.iconSize}
                                        className="object-contain"
                                    />
                                </div>
                                <h3
                                    className="text-white ml-4"
                                    style={{
                                        fontFamily: 'Poppins, sans-serif',
                                        fontWeight: 600,
                                        fontSize: '20px',
                                        lineHeight: '28px',
                                        letterSpacing: '0%'
                                    }}
                                >
                                    {card.title}
                                </h3>
                            </div>
                            <p
                                className="text-[#888] text-left"
                                style={{
                                    fontFamily: 'Poppins, sans-serif',
                                    fontWeight: 400,
                                    fontSize: '16px',
                                    lineHeight: '26px',
                                    letterSpacing: '0%'
                                }}
                            >
                                {card.description}
                            </p>
                        </motion.div>
                    ))}
                </div>

                {/* CTA Button */}
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-[42px] flex justify-center">
                    <Link href="https://linkist.ai/digital-business-card" className="transition-transform hover:scale-105 active:scale-95">
                        <Image src="/Claim-Your-Founding-Member-Access.png" alt="Claim Your Founding Member Access" width={276} height={62} className="w-auto h-[48px] object-contain" />
                    </Link>
                </motion.div>

            </div>
        </section>
    );
}
