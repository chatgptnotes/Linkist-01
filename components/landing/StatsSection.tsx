import { motion } from 'framer-motion';
import Link from 'next/link';

export default function StatsSection() {
    const stats = [
        {
            value: '88%',
            description: 'paper cards end up in the trash within a week.'
        },
        {
            value: '60%',
            description: 'professionals forget the context of a conversation in just 7 days.'
        },
        {
            value: '70%',
            description: 'leads die simply because the follow-up was too slow.'
        }
    ];

    return (
        <section className="relative py-32 bg-[#050505]">
            {/* Floating CTA matches image 6 */}
            <div className="absolute top-0 left-0 w-full flex justify-center -translate-y-1/2 z-20">
                <Link href="/choose-plan" className="group flex items-center gap-2 px-6 py-3 bg-[#111] border border-[#333] rounded-full hover:border-[#E02424] transition-colors shadow-2xl">
                    <svg className="w-5 h-5 text-[#E02424] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                    <span className="text-white font-medium tracking-wide text-sm">JOIN LINKIST</span>
                </Link>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">

                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="inline-block px-5 py-2 rounded-full border border-[#E02424]/30 bg-[#E02424]/10 text-[#E02424] text-xs font-semibold tracking-wider uppercase mb-12"
                >
                    Reality
                </motion.div>

                <motion.h2
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-4xl md:text-6xl font-bold text-white mb-12 leading-tight max-w-5xl mx-auto"
                >
                    The "Nice to Meet You" Is Where Most Deals Die.
                </motion.h2>

                <p className="text-[#888] text-lg max-w-2xl mx-auto mb-24 leading-relaxed">
                    The stats don’t lie. The moment the handshake ends, the clock starts ticking against you.
                </p>

                {/* Stats Grid */}
                <div className="grid md:grid-cols-3 gap-16">
                    {stats.map((stat, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.2 }}
                            className="flex flex-col items-center"
                        >
                            <div className="text-6xl md:text-8xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-[#E02424] to-[#601010] mb-6 drop-shadow-[0_10px_20px_rgba(224,36,36,0.3)]">
                                {stat.value}
                            </div>
                            <p className="text-[#A0A0A0] text-lg leading-relaxed max-w-xs">
                                {stat.description}
                            </p>
                        </motion.div>
                    ))}
                </div>

            </div>
        </section>
    );
}
