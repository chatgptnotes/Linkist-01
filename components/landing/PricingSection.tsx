import { motion } from 'framer-motion';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

export default function PricingSection() {
  const plans = [
    {
      name: 'Free',
      price: '$ 0',
      description: 'Starter (Digital Profile Only)',
      features: [
        'Create your profile in minutes',
        'Life-long digital profile (Free for life)',
        'Basic analytics',
        'Profile customization',
        'Upgrade Anytime'
      ],
      highlight: false
    },
    {
      name: 'Personal',
      price: '$ 59',
      description: 'Supercharged AI tools. Personalized guidance. Market insights.',
      features: [
        'All Starter plan features included and more',
        'Advanced analytics dashboard',
        'One-year Linkist App access (worth $120)',
        'Smart reminders & follow-ups'
      ],
      highlight: true
    },
    {
      name: 'Business',
      price: '$ 69',
      description: 'Supercharged AI tools. Personalized guidance. Market insights.',
      features: [
        'All Personal plan features included and more',
        'Advanced analytics dashboard',
        'Premium NFC business card',
        'Instant tap-to-share convenience',
        'Custom branding & design'
      ],
      highlight: false
    }
  ];

  return (
    <section className="relative py-32 bg-[#050505] overflow-visible">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="inline-block px-5 py-2 rounded-full border border-[#E02424]/30 bg-[#E02424]/10 text-[#E02424] text-xs font-semibold tracking-wider uppercase mb-8"
        >
          Pricing Plan
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-bold text-white mb-6"
        >
          Select the Right Plan for Your Needs
        </motion.h2>

        <p className="text-[#888] text-sm md:text-base max-w-2xl mx-auto mb-20 leading-relaxed">
          Select the plan that best suits your needs, whether you're just getting started or need advanced features and support for your business.
        </p>

        {/* Pricing Cards Grid */}
        <div className="grid lg:grid-cols-3 gap-8 items-center">
          {plans.map((plan, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className={`
                                relative rounded-[32px] p-8 text-left border transition-transform duration-300 flex flex-col h-full
                                ${plan.highlight
                  ? 'bg-gradient-to-b from-[#C41C1C] to-[#0A0A0A] border-[#FF4D4D]/20 scale-105 z-10 shadow-[0_0_60px_rgba(196,28,28,0.2)]'
                  : 'bg-[#0A0A0A] border-[#222] hover:border-[#333]'
                }
                            `}
            >
              {plan.highlight && (
                <div className="absolute top-6 right-6 bg-black/30 backdrop-blur px-3 py-1 rounded-full text-[10px] font-medium border border-white/10 text-white">
                  Most popular
                </div>
              )}

              {/* Circle Icon */}
              <div className={`w-12 h-12 rounded-full mb-6 shadow-lg ${plan.highlight ? 'bg-[#FF4D4D]' : 'bg-gradient-to-br from-[#FFE5E5] to-[#999]'}`} />

              <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
              <p className="text-[#ccc] text-xs leading-relaxed mb-8 min-h-[40px] opacity-80">
                {plan.description}
              </p>

              <div className="text-3xl font-bold text-white mb-8">
                {plan.price} <span className="text-sm font-normal text-[#ccc]/70">/month</span>
              </div>

              <button className={`w-full py-3 rounded-full font-medium text-xs tracking-wide transition-all mb-8 border border-[#333] ${plan.highlight ? 'bg-[#0A0A0A]/50 text-white hover:bg-black' : 'bg-transparent text-white hover:bg-[#111]'}`}>
                Get Started
              </button>

              <div className="space-y-4 pt-6 border-t border-white/5 flex-grow">
                <div className="text-[10px] text-[#666] uppercase tracking-wider font-semibold mb-4">
                  TURQUOISE TREK +
                </div>

                {plan.features.map((feature, fIdx) => (
                  <div key={fIdx} className="flex items-start gap-3">
                    <CheckCircleOutlineIcon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.highlight ? 'text-white' : 'text-[#555]'}`} />
                    <div className="flex-1 flex items-center justify-between">
                      <span className={`text-xs ${plan.highlight ? 'text-white' : 'text-[#888]'}`}>{feature}</span>

                      {/* AI Badge Logic */}
                      {((plan.name === 'Personal' && feature.includes('Advanced analytics')) ||
                        (plan.name === 'Business' && feature.includes('Premium NFC'))) && (
                          <span className="flex-shrink-0 flex items-center gap-1 bg-black/40 border border-white/10 px-2 py-0.5 rounded-full text-[9px] text-white">
                            <AutoAwesomeIcon style={{ fontSize: 9 }} /> AI-based
                          </span>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}