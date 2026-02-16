import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

export default function StatsSection() {
    const stats = [
        {
            value: '88%',
            description: 'business cards end up in the trash within a week.'
        },
        {
            value: '60%',
            description: 'professionals forget the context of a conversation in just 7 days.'
        },
        {
            value: '70%',
            description: 'leads die simply because the followup was too slow.'
        }
    ];

    return (
        <section className="relative pt-16 pb-16 md:pt-20 md:pb-20 bg-[#050505]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">

                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="inline-block text-[#E02424] text-xs font-semibold tracking-wider uppercase mb-6"
                >
                    THE FACTS
                </motion.div>

                <motion.h2
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-6 max-w-5xl mx-auto text-center text-[28px] leading-[36px] min-[390px]:text-[32px] min-[390px]:leading-[43px] md:text-[56px] md:leading-[72px] font-inter font-medium tracking-[-0.04em]"
                    style={{
                        background: 'linear-gradient(180deg, #FFFFFF 25.5%, #999999 118.5%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                    }}
                >
                    The "Nice to meet you" is where most leads die.
                </motion.h2>

                <p className="text-[#888] max-w-2xl mx-auto mb-8 font-body" style={{ fontSize: '16px', lineHeight: '26px' }}>
                    The stats don’t lie. The moment the handshake ends, the clock starts ticking against you.
                </p>

                {/* Stats Grid */}
                <div className="grid md:grid-cols-3 gap-8 justify-items-center">
                    {stats.map((stat, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.2 }}
                            className="flex flex-col items-center w-[350px]"
                        >
                            <div
                                className="text-white text-center"
                                style={{
                                    fontFamily: 'Poppins, sans-serif',
                                    fontWeight: 500,
                                    fontSize: '56px',
                                    lineHeight: '72px',
                                    letterSpacing: '-0.04em'
                                }}
                            >
                                {stat.value}
                            </div>
                            <p
                                className="text-[#888] text-center"
                                style={{
                                    fontFamily: 'Poppins, sans-serif',
                                    fontWeight: 400,
                                    fontSize: '20px',
                                    lineHeight: '32px',
                                    letterSpacing: '0%'
                                }}
                            >
                                {stat.description}
                            </p>
                        </motion.div>
                    ))}
                </div>

            </div>
        </section>
    );
}
