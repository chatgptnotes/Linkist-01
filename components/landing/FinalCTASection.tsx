import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

export default function FinalCTASection() {
    return (
        <section className="relative pt-16 pb-16 md:pt-20 md:pb-20 overflow-hidden bg-[#050505]">

            {/* Red ellipse arc at top */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full md:hidden">
                <Image
                    src="/Ellipse 115.png"
                    alt=""
                    width={800}
                    height={200}
                    className="w-full max-w-[600px] mx-auto object-contain"
                />
            </div>

            {/* Desktop Hero-style Glow Effects - replaces the ellipse image on PC */}
            <div className="absolute top-0 left-0 w-full h-full hidden md:block">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#E02424]/20 blur-[150px] rounded-full mix-blend-screen" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#E02424]/10 blur-[150px] rounded-full mix-blend-screen" />
            </div>

            <div className="max-w-7xl mx-auto px-4 relative z-10 text-center pt-16">

                <motion.h2
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="font-inter font-medium text-[40px] leading-[48px] md:text-[56px] md:leading-[72px] tracking-[-0.04em] text-center text-white mb-6"
                >
                    History favors<br />the first
                </motion.h2>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="font-poppins font-normal text-[20px] leading-[32px] tracking-normal text-center text-white mb-[42px]"
                >
                    This isn't early access. It's invite-<br className="md:hidden" />only, scarce digital territory.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                >
                    <Link
                        href="https://www.linkist.ai/choose-plan"
                        className="inline-block transition-transform hover:scale-105 active:scale-95"
                    >
                        <Image
                            src="/product-hunt-label-2.png"
                            alt="Sign Up Today!"
                            width={276}
                            height={62}
                            className="w-auto h-[48px] object-contain"
                        />
                    </Link>
                </motion.div>

            </div>
        </section>
    );
}
