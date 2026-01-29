import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

export default function HeroSection() {
  return (
    <section className="relative min-h-[799px] md:min-h-screen flex flex-col bg-black overflow-hidden max-w-[100vw]">
      {/* Background - curved light lines (mobile only) */}
      <div className="absolute inset-0 top-[10%] md:hidden max-w-full">
        <img
          src="/Homepage (Mobile Version).png"
          alt=""
          className="w-full h-full object-cover opacity-60"
          style={{ maxWidth: '100%' }}
        />
      </div>

      {/* Desktop Glow Effects */}
      <div className="absolute top-0 left-0 w-full h-full hidden md:block">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#E02424]/20 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#E02424]/10 blur-[150px] rounded-full mix-blend-screen" />
      </div>

      {/* Mobile Phone Mockups - positioned relative to full section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.8 }}
        className="absolute z-20 md:hidden pointer-events-none"
        style={{
          width: 'min(90vw, 763px)',
          maxWidth: '100%',
          height: 'auto',
          aspectRatio: '763 / 508',
          top: '360px',
          left: '50%',
          marginLeft: 'calc(-1 * min(90vw, 763px) / 2)',
          transform: 'rotate(12.16deg)',
        }}
      >
        <img
          src="/Scene-3-Recovered.png"
          alt="Linkist App"
          className="w-full h-full object-contain"
          style={{ display: 'block' }}
        />
      </motion.div>

      {/* Mobile Layout */}
      <div className="md:hidden relative z-10 flex flex-col min-h-[799px] w-full max-w-[100vw] mx-auto px-4">
        {/* Globe - Layer 1 (absolute at bottom of entire section) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="absolute -bottom-[30%] left-1/2 -translate-x-1/2 z-10 w-full pointer-events-none"
          style={{ maxWidth: 'min(140%, 100vw)' }}
        >
          <img
            src="/globe.png"
            alt=""
            className="w-full h-auto"
            style={{ maxWidth: '100%' }}
          />
        </motion.div>

        {/* Text Section */}
        <div className="pt-16 px-5 text-center relative z-20 mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-[36px] leading-[36px] min-[450px]:text-[35px] min-[450px]:leading-[38px] font-semibold tracking-[-0.04em] text-center hero-title-gradient mb-8 mt-4"
          >
            Your network<br />
            isn't the problem.<br />
            Recall is.<br />
          </motion.h2>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-[16px] leading-[16px] font-light tracking-normal text-center hero-subtitle-gradient max-w-[400px] mx-auto"
          >
           Join Linkist. World's first <b>Personal Relationship Manager (PRM)</b> that helps you remember every contact, capture context & keep relationships alive  with relevant actionable insights.
          </motion.h1>
        <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-[12px] leading-[16px] font-light tracking-normal text-center hero-subtitle-gradient max-w-[400px] mx-auto"
          >
           <br />Not a CRM. Not a reminder app. A relationship memory layer for people who build business through conversations.
          </motion.p>
        </div>

        {/* Join Linkist Button - positioned at bottom */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="absolute bottom-2 left-0 right-0 z-30 px-5 flex flex-col items-center"
        >
          <a href="#human-limit" className="transition-transform hover:scale-105 active:scale-95">
            <Image
              src="/see-how-it-works.png"
              alt="See how it works"
              width={276}
              height={62}
              className="w-auto h-[48px] sm:h-[56px] object-contain"
            />
          </a>
          <p className="text-[#666666] text-[12px] mt-3 text-center font-body">
            Includes 1-Year Pro Access + $50 AI Credits *
          </p>
        </motion.div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex relative z-10 max-w-7xl mx-auto px-4 sm:px-6 text-center pt-16 md:pt-20 flex-col justify-center items-center flex-1">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-6 md:mb-8 bg-clip-text text-transparent"
          style={{
            backgroundImage: 'linear-gradient(170.76deg, #09090B -49.89%, #F2F2FC 93.32%)'
          }}
        >
          Your network<br />
            isn't the problem.<br />
            Recall is.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-lg sm:text-xl md:text-2xl text-[#888888] max-w-2xl mx-auto mb-8 md:mb-12 px-2 font-body"
        >
         Join Linkist. World's first <b>Personal Relationship Manager (PRM)</b> that helps you remember every contact, capture context & keep relationships alive with relevant actionable insights.
        </motion.p>

        <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-[14px] leading-[16px] font-light tracking-normal text-center hero-subtitle-gradient max-w-[400px] mx-auto"
          >
           Not a CRM. Not a reminder app. A relationship memory layer for people who build business through conversations.
          </motion.p>

        {/* Hero Visual - Dashboard Mockup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="relative mx-auto w-full max-w-6xl mt-8 md:mt-12 px-0 sm:px-0 flex justify-center"
        >
          <div className="relative z-10 flex justify-center w-full">
            <img
              src="/new_hero.png"
              alt="Linkist Dashboard"
              className="w-full h-auto drop-shadow-2xl mx-auto"
            />
          </div>

          {/* Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[#E02424]/10 blur-[120px] rounded-full -z-10" />
        </motion.div>
      </div>
    </section>
  );
}
