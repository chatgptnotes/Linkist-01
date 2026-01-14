import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

interface FeatureCardProps {
    iconSrc: string;
    title: string;
    description: string;
    delay?: number;
}

const FeatureCard = ({ iconSrc, title, description, delay = 0 }: FeatureCardProps) => (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay }}
        className="relative w-full max-w-[350px] min-h-[456px] rounded-[40px] border border-[#222] bg-[rgba(74,74,74,0.4)] px-8 py-10 text-center"
    >
        {/* Icon - 170x170 container, 140x140 inner */}
        <div className="mx-auto mb-[12px] flex h-[170px] w-[170px] items-center justify-center">
            <Image
                src={iconSrc}
                alt=""
                width={140}
                height={140}
                className="object-contain"
            />
        </div>

        {/* Title - Poppins SemiBold 24px/32px */}
        <h3
            className="mb-6 text-white text-center"
            style={{
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
                fontSize: '24px',
                lineHeight: '32px',
                letterSpacing: '0%'
            }}
        >
            {title}
        </h3>

        {/* Description - Poppins Regular 16px/26px */}
        <p
            className="text-[#888] text-center"
            style={{
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 400,
                fontSize: '16px',
                lineHeight: '26px',
                letterSpacing: '0%'
            }}
        >
            {description}
        </p>
    </motion.div>
);

const featureCardsData = [
    {
        iconSrc: "/icons/Group 1437253611.png",
        title: "Context at your fingertips",
        description: "Stop wondering \"Who introduced us?\" Linkist captures where you met, what you discussed, and why it mattered so you can re-engage with clarity."
    },
    {
        iconSrc: "/icons/Group 1437253611 (1).png",
        title: "Silence the noise",
        description: "Stop managing a messy contact list. Linkist identifies who matters right now based on fit and relevance, separating the signal from the noise."
    },
    {
        iconSrc: "/icons/Group 1437253611 (2).png",
        title: "Momentum that doesn't fade",
        description: "Smart nudges show who to reconnect with and when, so your follow-ups are timely and deliberate, not random."
    }
];

export default function SuperpowerSection() {
    return (
        <section className="relative pt-12 pb-12 bg-[#050505] overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">

                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="inline-block px-4 py-1.5 rounded-full border border-[#E02424]/30 bg-[#E02424]/10 text-[#E02424] text-xs font-semibold tracking-wider uppercase mb-6"
                >
                    TURNING CONTACTS INTO LEVERAGE
                </motion.div>

                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-6 text-center text-[28px] leading-[34px] min-[390px]:text-[32px] min-[390px]:leading-[38px] md:text-[56px] md:leading-[72px] font-inter font-medium tracking-[-0.04em]"
                    style={{
                        background: 'linear-gradient(180deg, #FFFFFF 25.5%, #999999 118.5%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                    }}
                >
                    Stop hoarding contacts. Start building leverage.
                </motion.h2>

                <p
                    className="text-[#888] max-w-2xl mx-auto mb-8 text-center"
                    style={{
                        fontFamily: 'Poppins, sans-serif',
                        fontWeight: 400,
                        fontSize: '16px',
                        lineHeight: '26px',
                        letterSpacing: '0%'
                    }}
                >
                    Most tools are digital graveyards for phone numbers. Linkist turns your contact list into working relationship intelligence.
                </p>

                {/* 3 Column Grid */}
                <div className="grid md:grid-cols-3 gap-6 justify-items-center px-4 md:px-0">
                    {featureCardsData.map((card, idx) => (
                        <FeatureCard
                            key={idx}
                            iconSrc={card.iconSrc}
                            title={card.title}
                            description={card.description}
                            delay={idx * 0.2}
                        />
                    ))}
                </div>

                {/* CTA Button */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-[42px] flex justify-center"
                >
                    <Link href="/choose-plan" className="transition-transform hover:scale-105 active:scale-95">
                        <Image
                            src="/joinbutton.png"
                            alt="Join Linkist"
                            width={200}
                            height={52}
                            className="w-auto h-[48px] object-contain"
                        />
                    </Link>
                </motion.div>

            </div>
        </section>
    );
}
