import { motion } from 'framer-motion';
import Link from 'next/link';

export default function RealityCheckSection() {
    return (
        <section className="relative py-12 md:py-16 bg-[#050505] overflow-hidden">
            <div className="max-w-[1306px] mx-auto px-4 sm:px-6 md:px-[100px] relative z-10">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
                    <div className="space-y-4 md:space-y-5 text-left">
                        {/* Badge */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="inline-block px-4 py-1.5 rounded-full border border-[#8B2020] bg-[#1a0a0a] text-[#E02424] text-xs font-medium"
                        >
                            The Reality Check
                        </motion.div>

                        {/* Heading */}
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight"
                        >
                            Your Brain isn't Built for 5,000 Connections.<br />
                            <span className="text-[#888]">Linkist is.</span>
                        </motion.h2>

                        <div className="space-y-3 md:space-y-4 pt-1 md:pt-2">
                            <p className="text-xl md:text-2xl text-[#E1E1E1]">Let's be honest about "networking."</p>
                            <p className="text-base md:text-lg text-[#888] leading-relaxed max-w-xl">
                                You don't lose opportunities because you ran out of paper business cards.
                                You lose them because you lost the <span className="text-[#E1E1E1]">context</span>, the <span className="text-[#E1E1E1]">timing</span>, and the <span className="text-[#E1E1E1]">moment</span>.
                            </p>
                            <p className="text-base md:text-lg text-[#888] leading-relaxed">
                                The handshake is easy. The memory is the hard part.
                            </p>

                            <div className="pt-1 md:pt-2">
                                <button className="px-6 py-2 rounded-full border-2 border-[#E02424] text-[#E02424] text-sm font-medium hover:bg-[#E02424] hover:text-white transition-all">
                                    Don't miss out !
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Image Column - Hidden on mobile */}
                    <div className="hidden md:flex relative z-10 order-first md:order-last items-center justify-center md:justify-end">
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="relative md:scale-[2.625] md:origin-right md:translate-x-[80%] md:translate-y-[10%]"
                        >
                            <img
                                src="/features_receipt.png"
                                alt="Linkist Context"
                                className="w-full md:w-auto md:h-[600px] lg:h-[700px] relative z-10 object-contain"
                            />
                        </motion.div>
                    </div>

                    {/* Decorative Grid Line or Empty Space (Screenshot shows grid lines) */}
                    <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-1/3 h-full bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 -z-10" />
                </div>

            </div>
        </section>
    );
}
