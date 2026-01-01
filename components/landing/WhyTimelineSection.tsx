import { motion } from 'framer-motion';
import HandshakeIcon from '@mui/icons-material/Handshake';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CycloneIcon from '@mui/icons-material/Cyclone';

export default function WhyTimelineSection() {
    const timelineEvents = [
        {
            id: '01',
            icon: HandshakeIcon,
            title: 'Day 1: You meet.',
            description: 'Over Coffee and discuss what your bring to their business.'
        },
        {
            id: '02',
            icon: HelpOutlineIcon,
            title: 'Day 7: You forget what made them relevant.',
            description: 'How you had ideas that would take the business to the next level.'
        },
        {
            id: '03',
            icon: CycloneIcon,
            title: 'Day 30: The lead goes cold after a generic, low-context follow-up.',
            description: 'Lost all connection because action didnt take place at the right time in the right context.'
        }
    ];

    return (
        <section className="relative py-16 md:py-24 bg-[#050505] overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Mobile Layout */}
                <div className="lg:hidden">
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-block px-4 py-1.5 rounded-full border border-[#E02424]/30 bg-[#E02424]/10 text-[#E02424] text-xs font-semibold tracking-wider uppercase mb-6"
                    >
                        How It Works
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl sm:text-4xl font-bold text-white mb-12 leading-tight"
                    >
                        The handshake is easy.<br />
                        Remembering is hard.
                    </motion.h2>

                    {/* Mobile Timeline */}
                    <div className="relative pl-8">
                        <div className="absolute left-[23px] top-4 bottom-4 w-[2px] bg-[#E02424]" />

                        <div className="space-y-16">
                            {timelineEvents.map((event, idx) => (
                                <motion.div
                                    key={event.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.15 }}
                                    className="relative flex items-start gap-6"
                                >
                                    {/* Circle Number */}
                                    <div className="relative z-10 flex-shrink-0 w-12 h-12 rounded-full bg-[#E02424] flex items-center justify-center text-white font-bold text-base border-4 border-[#050505]">
                                        {event.id}
                                    </div>

                                    {/* Content */}
                                    <div className="pt-1">
                                        <div className="mb-2 text-white">
                                            <event.icon className="w-6 h-6 opacity-90" />
                                        </div>
                                        <h3 className="text-lg font-bold text-white leading-snug">{event.title}</h3>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Mobile CTA */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mt-16 text-center"
                    >
                        <button className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-semibold text-sm">
                            <svg className="w-5 h-5 text-[#E02424]" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                            </svg>
                            JOIN LINKIST
                        </button>
                    </motion.div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden lg:grid lg:grid-cols-2 gap-16 items-start">
                    {/* Left Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="sticky top-24"
                    >
                        {/* Badge */}
                        <div className="inline-block px-4 py-1.5 rounded-full border border-[#E02424]/30 bg-[#E02424]/10 text-[#E02424] text-xs font-semibold tracking-wider uppercase mb-8">
                            How It Works
                        </div>

                        <h2 className="text-5xl md:text-6xl font-bold text-white mb-8 leading-tight">
                            The handshake is <br />
                            easy. Remembering <br />
                            is hard.
                        </h2>

                        <p className="text-[#888] leading-relaxed max-w-md">
                            You don't lose opportunities because you run out of business cards You lose them when you lose context, timing, and recall.
                        </p>
                    </motion.div>

                    {/* Right Timeline Visual */}
                    <div className="relative">
                        <div className="absolute left-[27px] top-4 bottom-4 w-[2px] bg-[#E02424]" />

                        <div className="space-y-12">
                            {timelineEvents.map((event, idx) => (
                                <motion.div
                                    key={event.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.2 }}
                                    className="relative flex items-start gap-8"
                                >
                                    {/* Circle Number */}
                                    <div className="relative z-10 flex-shrink-0 w-14 h-14 rounded-full bg-[#E02424] flex items-center justify-center text-white font-bold text-lg border-4 border-[#050505]">
                                        {event.id}
                                    </div>

                                    {/* Content */}
                                    <div className="pt-2">
                                        <div className="mb-2 text-white">
                                            <event.icon className="w-8 h-8 opacity-90" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">{event.title}</h3>
                                        <p className="text-[#888] leading-relaxed">
                                            {event.description}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}
