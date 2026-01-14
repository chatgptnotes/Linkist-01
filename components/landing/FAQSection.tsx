'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "What does Linkist do that my phone or CRM doesn't?",
      answer: "Your phone stores numbers without any prioritization and scoring of contacts based on your business goals. Linkist keeps people in focus: who you met, where, what you discussed, why they matter, and when to reconnect."
    },
    {
      question: "What happens after the first year? Do I lose my URL?",
      answer: "You keep your chosen URL for life. After year one, you can stay on a free plan or upgrade/continue with Pro; your identity remains yours."
    },
    {
      question: "Do I need an NFC card to use Linkist?",
      answer: "No. You can use Linkist in digital-only mode. The NFC card simply makes it easier to pull new contacts into your PRM with one tap."
    },
    {
      question: "Is Linkist just a digital business card?",
      answer: "No. Linkist is a Personal Relationship Manager (PRM). The card is only an entry point; the real value is how it helps you remember people and follow up and build relationship with your contacts."
    },
    {
      question: "Why does the unique URL linkist.ai/YourName matter?",
      answer: "It becomes your long-term identity and shareable profile. Early access lets you claim a clean, rare version of your name before it's taken."
    },
    {
      question: "Who can become a Founding Member right now?",
      answer: "Founding Member status is invite-only and limited. Approved members get a clean URL, the Black Premium card, 1-year Pro, AI credits, and permanent \"Founding Member\" recognition. We also actively listen to our founding members and use their feedback to shape new features."
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="relative pt-12 pb-12 bg-[#050505]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="flex justify-center mb-6"
        >
          <span className="inline-block px-5 py-2 rounded-full border border-[#E02424]/40 bg-[#E02424]/10 text-[#E02424] text-xs font-semibold tracking-wider uppercase">
            FAQ
          </span>
        </motion.div>

        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-[32px] md:text-[56px] md:leading-[72px] font-inter font-medium text-center mb-12 md:mb-16 tracking-[-0.04em]"
          style={{
            lineHeight: '43px',
            background: 'linear-gradient(180deg, #FFFFFF 25.5%, #999999 118.5%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          About Linkist
        </motion.h2>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <motion.div
              key={idx}

              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08 }}
              className="overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(idx)}
                className={`w-full bg-[rgba(74,74,74,0.7)] border border-[#333] px-5 py-4 md:px-6 md:py-5 rounded-2xl flex items-center justify-between transition-all duration-300 ${
                  openIndex === idx ? 'rounded-b-none border-b-0' : ''
                }`}
              >
                <span className="text-sm md:text-base text-white font-medium font-body text-left">
                  {faq.question}
                </span>
                <svg
                  className={`w-5 h-5 text-white flex-shrink-0 ml-4 transition-transform duration-300 ${
                    openIndex === idx ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Content */}
              <AnimatePresence>
                {openIndex === idx && faq.answer && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="bg-transparent border border-t-0 border-[#333] px-5 md:px-6 pb-4 md:pb-5 pt-3 rounded-b-2xl">
                      <p className="text-[#888] text-sm leading-relaxed font-body text-center">
                        {faq.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
