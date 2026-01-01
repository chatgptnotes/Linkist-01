import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const questions = [
    "What does Linkist do that my phone or CRM doesn’t?",
    "What happens after the first year? Do I lose my URL?",
    "Do I need an NFC card to use Linkist?",
    "Is Linkist just a digital business card?",
    "Why does the unique URL linkist.ai/YourName matter?",
    "Who can become a Founding Member right now?"
  ];

  return (
    <section className="relative py-32 bg-[#050505]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="inline-block px-5 py-2 rounded-full border border-[#E02424]/30 bg-[#E02424]/10 text-[#E02424] text-xs font-semibold tracking-wider uppercase mb-12"
        >
          FAQ
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-bold text-white mb-20 leading-tight"
        >
          Find Quick Answers to Common <br /> Linkist Questions.
        </motion.h2>

        <div className="space-y-4">
          {questions.map((q, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full bg-[#111] hover:bg-[#161616] p-6 rounded-2xl flex items-center justify-between text-left transition-colors border border-transparent hover:border-[#333]"
              >
                <span className="text-base md:text-lg text-gray-200 font-medium">{q}</span>
                {/* Plus Icon logic */}
              </button>
              {/* Simplified for view, expansion logic standard */}
            </motion.div>
          ))}
        </div>

        <div className="mt-12">
          <button className="px-8 py-3 rounded-full border border-[#333] text-[#888] text-sm hover:text-white hover:border-white transition-colors">
            Load More
          </button>
        </div>

      </div>
    </section>
  );
}