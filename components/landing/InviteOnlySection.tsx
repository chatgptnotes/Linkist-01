import { motion } from 'framer-motion';
import Image from 'next/image';

export default function InviteOnlySection() {
    const cards = [
        {
            icon: '/icons/name.png',
            title: 'The Name',
            description: "Secure the cleanest version of your URL. Once it's taken, it's for life.",
            iconSize: 28
        },
        {
            icon: '/icons/card.png',
            title: 'The Card',
            description: 'Get the Black Premium NFC card, available only to Founding Members during the invite-only pre-launch.',
            iconSize: 28
        },
        {
            icon: '/icons/badge.png',
            title: 'The Badge',
            description: 'Your profile permanently carries the Founding Member status. A visible signal and recognition for early adoption.',
            iconSize: 28
        },
        {
            icon: '/icons/value.png',
            title: 'The Value',
            description: "You get 1 year of Linkist Pro and $50 in AI credits with no expiry, on terms others won't get at public launch.",
            iconSize: 48
        },
        {
            icon: '/icons/recognition.png',
            title: 'The Recognition',
            description: 'Entry is by personal invite and approval only, limited to a small founding cohort.',
            iconSize: 28
        },
        {
            icon: '/icons/reward.png',
            title: 'The Rewards',
            description: 'Expect occasional surprise gifts and early perks directly from the founders.',
            iconSize: 28
        }
    ];

    return (
        <section className="relative py-24 bg-[#050505]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="inline-block px-5 py-2 rounded-full border border-[#E02424]/30 bg-[#E02424]/10 text-[#E02424] text-xs font-semibold tracking-wider uppercase mb-12"
                >
                    The Founding Member Offer
                </motion.div>

                <motion.h2
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-white mb-20 text-center"
                    style={{
                        fontFamily: 'Poppins, sans-serif',
                        fontWeight: 500,
                        fontSize: '32px',
                        lineHeight: '44px',
                        letterSpacing: '-0.02em'
                    }}
                >
                    This Isn't Early Access.<br />
                    It's an invite Only.
                </motion.h2>

                {/* Grid of Cards */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 justify-items-center">
                    {cards.map((card, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-[#1A1A1A] rounded-[24px] p-6 pt-8 text-left flex flex-col items-start w-[350px] h-[306px]"
                        >
                            <div className="w-[56px] h-[56px] rounded-[12px] bg-[#FF3A29] flex items-center justify-center mb-5 overflow-hidden flex-shrink-0">
                                <Image
                                    src={card.icon}
                                    alt={card.title}
                                    width={card.iconSize}
                                    height={card.iconSize}
                                    className="object-contain"
                                />
                            </div>

                            <h3
                                className="text-white mb-3 text-left"
                                style={{
                                    fontFamily: 'Poppins, sans-serif',
                                    fontWeight: 600,
                                    fontSize: '24px',
                                    lineHeight: '32px',
                                    letterSpacing: '0%'
                                }}
                            >
                                {card.title}
                            </h3>
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

            </div>
        </section>
    );
}
