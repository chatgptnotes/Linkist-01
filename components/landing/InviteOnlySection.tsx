import { motion } from 'framer-motion';
import BadgeIcon from '@mui/icons-material/Badge'; // Placeholder for 'The Name'
import CreditCardIcon from '@mui/icons-material/CreditCard'; // Placeholder for 'The Card'
import VerifiedIcon from '@mui/icons-material/Verified'; // Placeholder for 'The Badge'
import StarIcon from '@mui/icons-material/Star'; // Placeholder for 'The Value'
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium'; // Placeholder for 'The Recognition'
import RedeemIcon from '@mui/icons-material/Redeem'; // Placeholder for 'The Rewards'

export default function InviteOnlySection() {
    const cards = [
        {
            icon: BadgeIcon,
            title: 'The Name',
            description: 'Secure the cleanest version of your URL. Once it’s taken, it’s for life.'
        },
        {
            icon: CreditCardIcon, // Fallback/Type safety
            image: '/card_black_iso.png',
            title: 'The Card',
            description: 'Get the Black Premium NFC card, available only to Founding Members during the invite-only pre-launch.'
        },
        {
            icon: VerifiedIcon,
            title: 'The Badge',
            description: 'Your profile permanently carries the Founding Member status. A visible signal and recognition for early adoption.'
        },
        {
            icon: StarIcon,
            title: 'The Value',
            description: 'You get 1 year of Linkist Pro and $50 in AI credits with no expiry, on terms others won’t get at public launch.'
        },
        {
            icon: WorkspacePremiumIcon,
            title: 'The Recognition',
            description: 'Entry is by personal invite and approval only, limited to a small founding cohort.'
        },
        {
            icon: RedeemIcon,
            title: 'The Rewards',
            description: 'Expect occasional surprise gifts and early perks directly from the founders.'
        }
    ];

    return (
        <section className="relative py-24 bg-[#050505]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="inline-block px-5 py-2 rounded-full border border-[#E02424]/30 bg-[#E02424]/10 text-[#E02424] text-xs font-semibold tracking-wider uppercase mb-12"
                >
                    The Founding Member Offer
                </motion.div>

                <motion.h2
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-4xl md:text-6xl font-bold text-white mb-20 leading-tight"
                >
                    This Isn’t Early Access. It’s an Invite Only.
                </motion.h2>

                {/* Grid of Cards */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cards.map((card, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-[#111] rounded-[32px] p-10 text-left border border-[#222] hover:border-[#333] transition-colors flex flex-col items-start min-h-[340px]"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-[#FF0000] flex items-center justify-center mb-8 shadow-[0_0_20px_rgba(255,0,0,0.3)] overflow-hidden">
                                {card.image ? (
                                    <img src={card.image} alt={card.title} className="w-full h-full object-cover" />
                                ) : (
                                    <card.icon className="text-white w-8 h-8" />
                                )}
                            </div>

                            <h3 className="text-2xl font-bold text-white mb-4">{card.title}</h3>
                            <p className="text-[#888] leading-relaxed">
                                {card.description}
                            </p>
                        </motion.div>
                    ))}
                </div>

            </div>
        </section>
    );
}
