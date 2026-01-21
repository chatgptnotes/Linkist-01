import { motion } from 'framer-motion';

export default function IdentitySection() {
    return (
        <section className="relative pt-12 pb-12 bg-[#050505] overflow-hidden text-center">
            <div className="max-w-7xl mx-auto px-4 relative z-10">

                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="inline-block text-[#E02424] text-xs font-semibold tracking-wider uppercase mb-6"
                >
                    THE ENTRY POINT
                </motion.div>

                <motion.h2
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="mb-6 text-center text-[28px] leading-[38px] min-[390px]:text-[32px] min-[390px]:leading-[44px] md:text-[56px] md:leading-[72px] font-inter font-medium tracking-[-0.04em]"
                    style={{
                        background: 'linear-gradient(180deg, #FFFFFF 25.5%, #999999 118.5%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                    }}
                >
                    The key to your <br className="md:hidden" />New Identity.
                </motion.h2>

                <p className="text-[#888] max-w-2xl mx-auto mb-12 font-body" style={{ fontSize: '16px', lineHeight: '26px' }}>
                    The NFC card isn't what you're buying. It's the trigger that moves a handshake into your Linkist PRM ecosystem in one tap.
                </p>

                {/* Card Layers Visual */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="relative w-full max-w-xs mx-auto"
                >
                    {/* Card Layers Image - includes oval background */}
                    <img
                        src="/coinzy-logo.png"
                        alt="NFC Card Layers"
                        className="w-full h-auto drop-shadow-2xl"
                    />
                </motion.div>

                {/* Bottom Text */}
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="text-[#666] text-sm max-w-sm mx-auto mt-12 font-body"
                >
                    Once this limited run is over, this exact Black Founding Member card will not be issued again.
                </motion.p>

            </div>
        </section>
    );
}
