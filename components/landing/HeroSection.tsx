import { motion } from 'framer-motion';

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center items-center bg-[#050505] overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#E02424]/20 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#E02424]/10 blur-[150px] rounded-full mix-blend-screen" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 text-center pt-16 md:pt-20">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-6 md:mb-8 text-[#E1E1E1]"
        >
          The Worlds First <br />
          <span className="text-[#A0A0A0]">Personal Relationship</span> <br />
          <span className="text-[#E1E1E1]">Management Tool</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-lg sm:text-xl md:text-2xl text-[#888888] max-w-2xl mx-auto mb-8 md:mb-12 px-2"
        >
          Linkist gives you the tools to strategically track, nurture, and leverage every key relationship.
        </motion.p>

        {/* Hero Visual - Dashboard Mockup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="relative mx-auto w-full max-w-6xl mt-8 md:mt-12 px-0 sm:px-0"
        >
          <div className="relative z-10">
            <img
              src="/hero_dashboard_hand.png"
              alt="Linkist Dashboard"
              className="w-full h-auto drop-shadow-2xl"
            />

          </div>

          {/* Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[#E02424]/10 blur-[120px] rounded-full -z-10" />
        </motion.div>
      </div>
    </section>
  );
}