import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

export default function FinalCTASection() {
    return (
        <section className="relative pt-12 pb-12 overflow-hidden bg-[#050505]">

            {/* Red ellipse arc at top */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full">
                <Image
                    src="/Ellipse 115.png"
                    alt=""
                    width={800}
                    height={200}
                    className="w-full max-w-[600px] mx-auto object-contain"
                />
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
                        href="/choose-plan"
                        className="inline-flex items-center justify-center w-[172px] h-[40px] py-[12px] px-[20px] gap-[12px] rounded-[80px] bg-[#E02424] text-white font-medium transition-transform hover:scale-105 active:scale-95"
                    >
                        Sign Up Today!
                    </Link>
                </motion.div>

            </div>
        </section>
    );
}
