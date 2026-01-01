import { motion } from 'framer-motion';

export default function SuperpowerSection() {
    // Screenshot 5 shows 3 cards with grey circles
    const cards = [
        {
            title: 'Context at your fingertips',
            description: 'Stop wondering "Who introduced us?" Linkist captures where you met, what you discussed, and why it mattered so you can re-engage with clarity.'
        },
        {
            title: 'To Silence the Noise',
            description: 'Stop managing a messy contact list. Linkist identifies who matters right now based on fit and relevance, separating the signal from the noise.'
        },
        {
            title: 'Momentum That Doesn’t Fade',
            description: 'Smart nudges show who to reconnect with and when, so your follow-ups are timely and deliberate, not random.'
        }
    ];

    return (
        <section className="relative py-24 bg-[#050505] overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">

                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="inline-block px-4 py-1.5 rounded-full border border-[#E02424]/30 bg-[#E02424]/10 text-[#E02424] text-xs font-semibold tracking-wider uppercase mb-8"
                >
                    The Superpower
                </motion.div>

                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight"
                >
                    Stop Hoarding Contacts. Start Building Leverage.
                </motion.h2>

                <p className="text-[#888] max-w-2xl mx-auto mb-20 text-sm md:text-base">
                    Most tools are digital graveyards for phone numbers. Linkist turns your contact list into working relationship intelligence.
                </p>

                {/* 3 Column Grid */}
                <div className="grid md:grid-cols-3 gap-8">
                    {cards.map((card, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.2 }}
                            className="bg-[#111] border border-[#222] rounded-3xl p-8 hover:border-[#333] transition-colors"
                        >
                            {/* Circle Placeholder Icon (Grey Circle with Glow) */}
                            <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-b from-[#444] to-[#222] p-[1px] mb-8 relative shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                                <div className="w-full h-full rounded-full bg-gradient-to-b from-[#333] to-[#111] border-[4px] border-[#2a2a2a]" />
                            </div>

                            <h3 className="text-xl font-bold text-white mb-4">{card.title}</h3>
                            <p className="text-[#888] text-sm leading-relaxed">
                                {card.description}
                            </p>
                        </motion.div>
                    ))}
                </div>

                {/* Receipt Visual Mockup */}


            </div>
        </section>
    );
}
