import { motion } from 'framer-motion';
import Link from 'next/link';

export default function FinalCTASection() {
    return (
        <section className="relative py-40 overflow-hidden bg-[#050505]">

            {/* Red bottom gradient background */}
            <div className="absolute bottom-0 left-0 right-0 h-[500px] bg-gradient-to-t from-[#8a0000] via-[#4d0000] to-transparent opacity-80 pointer-events-none" />
            <div className="absolute -bottom-[20%] left-1/2 -translate-x-1/2 w-[120%] h-[300px] bg-[#FF0000] blur-[150px] opacity-40 rounded-[100%]" />

            <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">

                <motion.h2
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tight"
                >
                    History Favours the First.
                </motion.h2>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="text-xl text-[#ccc] mb-16"
                >
                    This Isn’t Early Access. It’s invite-only, scarce digital territory.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                >
                    <Link href="/choose-plan" className="group inline-flex items-center gap-3 px-8 py-4 bg-[#1a0505] border border-[#330a0a] rounded-full hover:border-[#E02424] hover:bg-[#2a0505] transition-all shadow-2xl">
                        <img src="/logo_linkist.png" alt="Linkist" className="h-6 w-auto brightness-0 invert" style={{ filter: 'brightness(0) saturate(100%) invert(20%) sepia(93%) saturate(3078%) hue-rotate(349deg) brightness(88%) contrast(92%)' }} />
                        <span className="text-white font-bold tracking-wide">JOIN LINKIST</span>
                    </Link>
                </motion.div>

            </div>
        </section>
    );
}
