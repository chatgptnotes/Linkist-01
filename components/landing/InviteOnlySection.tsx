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
                        <div className="bg-[#E63929] px-6 pt-6 pb-5 flex flex-col text-left" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            <h3 className="text-white font-bold text-2xl md:text-3xl mb-1">
                                Founding Member Pricing
                            </h3>
                            <p className="text-white italic text-sm mb-1">
                                Lock in your rate for life.
                            </p>
                            <p className="text-white text-xs leading-snug">
                                Join before June 2026 to keep this founding price forever.
                            </p>
                        </div>
                        {/* Bottom: Darker red pricing rows */}
                        <div className="bg-[#CC2B1C] px-6 py-4 flex flex-col" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            {/* Row 1: Year 1 - Free */}
                            <div className="flex items-center justify-between py-3 border-b border-white/20">
                                <div className="border-l-2 border-white/40 pl-3">
                                    <span className="text-white text-sm">Year 1</span>
                                </div>
                                <span className="text-white font-bold text-2xl">Free</span>
                            </div>
                            {/* Row 2: Year 2 onward - $69/year */}
                            <div className="flex items-center justify-between py-3 border-b border-white/20">
                                <div className="border-l-2 border-white/40 pl-3">
                                    <span className="text-white text-sm">Year 2 onward</span>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-white font-bold text-2xl">$69</span>
                                    <span className="text-white/90 text-xs">/year</span>
                                </div>
                            </div>
                            {/* Row 3: Regular price - $99/year strikethrough */}
                            <div className="flex items-center justify-between py-3">
                                <div className="pl-3">
                                    <span className="text-white/70 text-sm">Regular price</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-white/70 font-bold text-2xl line-through">$99</span>
                                        <span className="text-white/70 text-xs">/year</span>
                                    </div>
                                    <span className="text-white/60 text-xs">from year 1</span>
                                </div>
                            </div>
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
