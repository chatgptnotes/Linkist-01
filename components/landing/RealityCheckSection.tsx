import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

export default function RealityCheckSection() {
    return (
        <section id="human-limit" className="relative pt-16 pb-16 md:pt-20 md:pb-20 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">

                    {/* Image Column - First on desktop (left), hidden on mobile (separate mobile image below) */}
                    <div className="hidden md:flex relative z-10 items-center justify-center md:justify-start">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="relative w-full flex justify-center"
                        >
                            <img
                                src="/Distraction.png"
                                alt="Linkist Context"
                                className="w-full max-w-[380px] h-auto relative z-10 object-contain"
                            />
                        </motion.div>
                    </div>

                    {/* Content Column - First on mobile, second on desktop (right) */}
                    <div className="space-y-2 md:space-y-5 text-center md:text-left">
                        {/* Badge */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="flex justify-center md:justify-start mb-6"
                        >
                            <span className="inline-block text-[#E02424] text-xs font-medium">
                                THE HUMAN LIMIT
                            </span>
                        </motion.div>

                        {/* Heading */}
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="font-inter font-medium text-[28px] leading-[34px] min-[390px]:text-[32px] min-[390px]:leading-[38px] md:text-[52px] md:leading-[66px] tracking-[-0.04em] text-center md:text-left mb-6 bg-clip-text text-transparent"
                            style={{
                                backgroundImage: 'linear-gradient(180deg, #FFFFFF 25.5%, #999999 118.5%)'
                            }}
                        >
                            Your brain isn't built<br />
                            <span className="md:whitespace-nowrap">for 5,000 connections.</span><br />
                            Linkist is.
                        </motion.h2>

                        <div className="space-y-1 md:space-y-4 pt-0 md:pt-2">
                            <p className="text-[18px] md:text-[29px] text-[#888] font-poppins font-normal">Let's be honest about "networking."</p>
                            <p className="text-[16px] md:text-[22px] text-[#888] leading-snug max-w-xl mx-auto md:mx-0 font-poppins font-normal">
                                You don't lose opportunities because you ran out{' '}
                                <br className="hidden md:inline" />
                                of business cards. You lose them because{' '}
                                <br className="hidden md:inline" />
                                you lost the context, the timing, and the&nbsp;moment.
                            </p>

                            {/* Mobile Image - shown between description and button */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6 }}
                                className="md:hidden flex justify-center py-4"
                            >
                                <img
                                    src="/Distraction.png"
                                    alt="Linkist Context"
                                    className="w-full max-w-[280px] h-auto object-contain"
                                />
                            </motion.div>

                            {/* Join Linkist Button */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.8, duration: 0.6 }}
                                className="flex flex-col items-center md:items-start mt-6 md:mt-8"
                            >
                                <Link href="https://linkist.ai/smart-card" className="transition-transform hover:scale-105 active:scale-95">
                                    <Image
                                        src="/product-hunt-label-2.png"
                                        alt="Join Linkist"
                                        width={276}
                                        height={62}
                                        className="w-auto h-[48px] sm:h-[56px] object-contain"
                                    />
                                </Link>
                            </motion.div>
                        </div>
                    </div>

                    {/* Decorative Grid Line or Empty Space */}
                    <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-1/3 h-full bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 -z-10" />
                </div>

            </div>
        </section>
    );
}
