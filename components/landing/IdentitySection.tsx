import { motion } from 'framer-motion';

export default function IdentitySection() {
    return (
        <section className="relative py-16 bg-[#050505] overflow-hidden text-center">
            <div className="max-w-7xl mx-auto px-4 relative z-10">

                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="inline-block px-5 py-2 rounded-full border border-[#E02424]/30 bg-[#E02424]/10 text-[#E02424] text-xs font-semibold tracking-wider uppercase mb-12"
                >
                    The Hardware
                </motion.div>

                <motion.h2
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="mb-8 text-center"
                    style={{
                        fontFamily: 'Poppins, sans-serif',
                        fontWeight: 500,
                        fontSize: '32px',
                        lineHeight: '44px',
                        letterSpacing: '-0.02em',
                        background: 'linear-gradient(180deg, #FFFFFF 25.5%, #999999 118.5%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                    }}
                >
                    The Key to your New Identity.
                </motion.h2>

                <p className="text-[#888] text-lg max-w-2xl mx-auto mb-12 leading-relaxed font-body">
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
