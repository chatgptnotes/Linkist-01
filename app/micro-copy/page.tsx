'use client';

import { useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function MicroCopyPage() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isHoveringRef = useRef(false);
  const currentSeparationRef = useRef(0);
  const lastSeparationRef = useRef(-1);
  const closedHeightRef = useRef(380);
  const openHeightRef = useRef(850);
  const animationFrameRef = useRef<number>();

  const resizeScene = useCallback(() => {
    const scene = sceneRef.current;
    const wrapper = wrapperRef.current;
    if (!scene || !wrapper) return;

    const parentWidth = wrapper.clientWidth;
    const sceneWidth = 600;
    const scale = Math.min(parentWidth / sceneWidth, 1);

    scene.style.transform = `translateX(-50%) scale(${scale}) rotateZ(0deg)`;
    closedHeightRef.current = 380 * scale;
    openHeightRef.current = 850 * scale;
  }, []);

  const getScrollProgress = useCallback(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return 0;

    const rect = wrapper.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const elementCenter = rect.top + rect.height / 2;
    const viewportCenter = windowHeight / 2;
    const distance = viewportCenter - elementCenter;
    const range = windowHeight / 1.1;

    let progress = 1 - Math.abs(distance) / (range / 2);
    return Math.max(0, Math.min(1, progress));
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    const wrapper = wrapperRef.current;
    if (!scene || !wrapper) return;

    // Initial resize
    resizeScene();
    const resizeTimeout = setTimeout(resizeScene, 100);

    // Resize listener
    window.addEventListener('resize', resizeScene);

    // Hover listeners
    const handleMouseEnter = () => { isHoveringRef.current = true; };
    const handleMouseLeave = () => { isHoveringRef.current = false; };
    scene.addEventListener('mouseenter', handleMouseEnter);
    scene.addEventListener('mouseleave', handleMouseLeave);

    // Mouse move for glare
    const handleMouseMove = (e: MouseEvent) => {
      if (window.innerWidth < 1024) return;
      const rect = scene.getBoundingClientRect();
      const scaleMatch = scene.style.transform.match(/scale\(([^)]+)\)/);
      const scale = scaleMatch ? parseFloat(scaleMatch[1]) : 1;

      const relX = (e.clientX - rect.left) / scale;
      const relY = (e.clientY - (rect.top + (rect.height * scale - (350 + 50) * scale))) / scale;

      const layers = scene.querySelectorAll('.cs-layer');
      layers.forEach((layer) => {
        (layer as HTMLElement).style.setProperty('--mouse-x', `${relX}px`);
        (layer as HTMLElement).style.setProperty('--mouse-y', `${relY}px`);
      });
    };
    document.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor;
    const lerpFactor = 0.12;

    const animate = () => {
      let targetSeparation = 0;

      if (window.innerWidth >= 1024) {
        targetSeparation = isHoveringRef.current ? 1 : 0;
      } else {
        targetSeparation = getScrollProgress();
      }

      currentSeparationRef.current = lerp(currentSeparationRef.current, targetSeparation, lerpFactor);

      if (Math.abs(currentSeparationRef.current - lastSeparationRef.current) > 0.001) {
        const sep = currentSeparationRef.current;

        if (sep > 0.01) scene.classList.add('expand-active');
        else scene.classList.remove('expand-active');

        if (wrapper) {
          const currentHeight = lerp(closedHeightRef.current, openHeightRef.current, sep);
          wrapper.style.height = `${currentHeight}px`;
        }

        const layer1 = scene.querySelector('.layer-1') as HTMLElement;
        const layer2 = scene.querySelector('.layer-2') as HTMLElement;
        const layer3 = scene.querySelector('.layer-3') as HTMLElement;
        const layer4 = scene.querySelector('.layer-4') as HTMLElement;

        if (layer1) layer1.style.transform = `translate3d(0, ${-440 * sep}px, 0)`;
        if (layer2) layer2.style.transform = `translate3d(0, ${-300 * sep}px, 0)`;
        if (layer3) layer3.style.transform = `translate3d(0, ${-150 * sep}px, 0)`;
        if (layer4) layer4.style.transform = `translate3d(0, 0, 0)`;

        lastSeparationRef.current = sep;
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', resizeScene);
      scene.removeEventListener('mouseenter', handleMouseEnter);
      scene.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [resizeScene, getScrollProgress]);

  return (
    <div className="min-h-screen bg-black text-white font-[Inter,sans-serif]">
      {/* ===== SCOPED STYLES ===== */}
      <style jsx global>{`
        .text-gradient-subtitle {
          background: linear-gradient(180deg, #A3A3A3 0%, #525252 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          padding-bottom: 0.4em;
          display: inline-block;
        }

        #card-stack-container {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform-origin: bottom center;
          width: 600px;
          height: 900px;
          cursor: pointer;
          will-change: transform;
          transform-style: preserve-3d;
          -webkit-transform-style: preserve-3d;
          transform: translate3d(0, 0, 0);
        }

        #stack-wrapper {
          will-change: height;
          perspective: 1500px;
          -webkit-perspective: 1500px;
          transform: translateZ(0);
        }

        .cs-layer {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 50px;
          height: 350px;
          background-size: contain;
          background-position: center;
          background-repeat: no-repeat;
          will-change: transform;
          transform: translate3d(0, 0, 0);
          -webkit-transform: translate3d(0, 0, 0);
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }

        @media (min-width: 1024px) {
          .cs-layer {
            filter: drop-shadow(0 4px 4px rgba(0, 0, 0, 0.2));
          }
          .cs-layer::after {
            content: "";
            position: absolute;
            inset: 0;
            background: radial-gradient(
              400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
              rgba(255, 255, 255, 0.2),
              transparent 50%
            );
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
            -webkit-mask-image: var(--bg-image);
            mask-image: var(--bg-image);
            -webkit-mask-size: contain;
            mask-size: contain;
            -webkit-mask-position: center;
            mask-position: center;
            -webkit-mask-repeat: no-repeat;
            mask-repeat: no-repeat;
          }
          #card-stack-container.expand-active .cs-layer::after {
            opacity: 1;
          }
        }

        .layer-4 {
          --bg-image: url('/04.png');
          background-image: var(--bg-image);
          z-index: 1;
        }
        .layer-3 {
          --bg-image: url('/03.png');
          background-image: var(--bg-image);
          z-index: 2;
        }
        .layer-2 {
          --bg-image: url('/02.png');
          background-image: var(--bg-image);
          z-index: 3;
        }
        .layer-1 {
          --bg-image: url('/01.png');
          background-image: var(--bg-image);
          z-index: 4;
        }

        .closed-view {
          --bg-image: url('/Closed.png');
          background-image: var(--bg-image);
          z-index: 10;
          opacity: 1 !important;
          transition: opacity 0.15s linear;
          transform: translate3d(0, 0, 0);
          -webkit-transform: translate3d(0, 0, 0);
        }

        @media (min-width: 1024px) {
          .closed-view {
            filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.25));
          }
        }

        #card-stack-container.expand-active .closed-view {
          opacity: 0 !important;
          pointer-events: none;
        }
      `}</style>

      {/* ===== HERO SECTION ===== */}
      <section className="lg:min-h-[75vh] flex items-center justify-center relative overflow-visible">
        {/* Background Overlay/Gradient */}
        <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
          {/* Mobile Image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/Homepage (Mobile Version).png"
            className="w-full h-[600px] object-cover object-top opacity-100 lg:hidden"
            alt="Background Glow"
          />
          {/* Desktop CSS Gradient */}
          <div
            className="hidden lg:block w-full h-full absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 90% 70% at 50% -10%, rgba(255, 58, 41, 0.45) 0%, rgba(0, 0, 0, 0) 80%)',
            }}
          />
        </div>

        {/* Main Content Grid */}
        <div className="relative z-10 w-full lg:w-[75vw] lg:max-w-none mx-auto px-6 pt-12 pb-0 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            {/* LEFT COLUMN */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-8">
              <h1 className="text-[45px] md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.15]">
                <br />
                <span className="text-white block">
                  Start with the best <br className="hidden md:block" />
                  smart card now.
                </span>
                <span className="text-gradient-subtitle block mt-1 pb-2">
                  Grow into relationship intelligence.
                </span>
              </h1>
              <p className="text-[#A3A3A3] text-sm md:text-lg leading-relaxed max-w-md md:max-w-xl mx-auto lg:mx-0">
                The Linkist Smart Card is your entry into the Linkist PRM ecosystem. Start
                with a unique personal URL, smart profile and NFC business card today. Grow
                into personal relationship intelligence over time.
              </p>
              <div className="flex flex-col items-center lg:items-start gap-6 w-full">
                <Link
                  href="#pricing"
                  className="text-[#FF3A29] text-sm md:text-base font-medium underline underline-offset-4 hover:text-white transition-colors"
                >
                  Know More
                </Link>
                <Link
                  href="https://www.linkist.ai/choose-plan"
                  className="inline-block transition-transform hover:-translate-y-1 hover:opacity-90"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/product-hunt-v-label-1.png"
                    alt="Join Now"
                    className="h-12 md:h-14 w-auto object-contain"
                  />
                </Link>
              </div>
            </div>

            {/* RIGHT COLUMN: Card Stack */}
            <div
              id="stack-wrapper"
              ref={wrapperRef}
              className="w-full lg:max-w-md lg:mx-auto mt-8 lg:mt-0 relative"
              style={{ overflow: 'visible' }}
            >
              <div id="card-stack-container" ref={sceneRef}>
                <div className="cs-layer layer-4" />
                <div className="cs-layer layer-3" />
                <div className="cs-layer layer-2" />
                <div className="cs-layer layer-1" />
                <div className="cs-layer closed-view" />
              </div>
              {/* Bottom fade */}
              <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-black to-transparent pointer-events-none z-20" />
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section className="bg-black">
        <div className="w-full lg:w-[75vw] mx-auto px-6 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* Left Column: Image */}
            <div className="flex justify-center order-2 lg:order-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/Micro-site-Scene-1.png"
                alt="Features Illustration"
                className="w-full h-auto object-contain max-w-md"
              />
            </div>

            {/* Right Column: Content */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left order-1 lg:order-2">

              {/* Top Badge: Text Link */}
              <div className="mb-8 md:mb-10">
                <Link
                  href="#pricing"
                  className="text-[#FF3A29] text-sm md:text-base font-medium hover:text-white transition-colors"
                >
                  The Entry Point
                </Link>
              </div>

              {/* Headline */}
              <h2 className="text-[32px] md:text-[56px] font-bold text-white tracking-tight leading-[1.1] mb-6">
                What do you get today?
              </h2>

              {/* Subtitle */}
              <p className="text-[#A3A3A3] text-sm md:text-lg leading-relaxed max-w-md md:max-w-xl mx-auto lg:mx-0">
                A simple tap instantly shares your contact details and profile via NFC, QR,
                or link - no app required for the other person.
              </p>

              {/* Features List */}
              <div className="w-fit mx-auto lg:w-full lg:mx-0 space-y-8 md:space-y-10 mt-10">

                {/* Item 1 */}
                <div className="flex items-center gap-6 md:gap-8 justify-start text-left transition-transform duration-300 hover:translate-x-[5px]">
                  <div className="flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/Dot.png"
                      alt="Bullet"
                      className="w-14 h-14 md:w-[60px] md:h-[60px] object-contain"
                    />
                  </div>
                  <div className="flex flex-col justify-center">
                    <h3 className="text-white font-medium text-[18px] md:text-[26px] leading-tight">
                      Works on any phone
                    </h3>
                    <p className="text-[#A3A3A3] text-[12px] md:text-[17px] leading-[1.4] md:leading-[1.6] font-normal">
                      Universal compatibility.
                    </p>
                  </div>
                </div>

                {/* Item 2 */}
                <div className="flex items-center gap-6 md:gap-8 justify-start text-left transition-transform duration-300 hover:translate-x-[5px]">
                  <div className="flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/Dot.png"
                      alt="Bullet"
                      className="w-14 h-14 md:w-[60px] md:h-[60px] object-contain"
                    />
                  </div>
                  <div className="flex flex-col justify-center">
                    <h3 className="text-white font-medium text-[18px] md:text-[26px] leading-tight">
                      Always updatable profile
                    </h3>
                    <p className="text-[#A3A3A3] text-[12px] md:text-[17px] leading-[1.4] md:leading-[1.6] font-normal">
                      Update instantly, anywhere.
                    </p>
                  </div>
                </div>

                {/* Item 3 */}
                <div className="flex items-center gap-6 md:gap-8 justify-start text-left transition-transform duration-300 hover:translate-x-[5px]">
                  <div className="flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/Dot.png"
                      alt="Bullet"
                      className="w-14 h-14 md:w-[60px] md:h-[60px] object-contain"
                    />
                  </div>
                  <div className="flex flex-col justify-center">
                    <h3 className="text-white font-medium text-[18px] md:text-[26px] leading-tight">
                      Professional and minimal
                    </h3>
                    <p className="text-[#A3A3A3] text-[12px] md:text-[17px] leading-[1.4] md:leading-[1.6] font-normal">
                      Clean design that converts.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>
      {/* ===== SIGN UP SECTION ===== */}
      <section className="bg-black">
        <div className="w-full lg:w-[75vw] mx-auto px-6 py-16 md:py-24 flex flex-col items-center">

          {/* Header Section */}
          <div className="flex flex-col items-center text-center max-w-3xl mb-16 md:mb-20">

            {/* Top Icon */}
            <div className="mb-8 relative">
              <div
                className="absolute inset-0 transform scale-150"
                style={{
                  background:
                    'radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, rgba(0, 0, 0, 0) 70%)',
                }}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/Icon-11.png"
                alt="User Icon"
                className="relative w-40 h-40 md:w-48 md:h-48 object-contain"
              />
            </div>

            {/* Headline */}
            <h2 className="text-[32px] md:text-[56px] font-bold text-white tracking-tight leading-[1.1] mb-6">
              What are you signing up for?
            </h2>

            {/* Description */}
            <p className="text-[#A3A3A3] text-sm md:text-lg leading-relaxed max-w-md md:max-w-xl mx-auto lg:mx-0">
              The Linkist app and PRM eco-system. This is where networking becomes
              intelligent.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">

            {/* Item 1: Capture Context */}
            <div className="bg-[#111111] border border-white/10 rounded-3xl flex items-center p-6 gap-5 h-full transition-all duration-300 hover:border-[rgba(255,58,41,0.4)] hover:-translate-y-1">
              <div className="flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/Layer-26.png"
                  alt="Check Icon"
                  className="w-12 h-12 md:w-14 md:h-14 object-contain"
                />
              </div>
              <div className="flex flex-col justify-center">
                <h3 className="text-white font-medium text-[18px] md:text-[26px] leading-tight">
                  Capture context<br />not just contacts
                </h3>
              </div>
            </div>

            {/* Item 2: Remember Who */}
            <div className="bg-[#111111] border border-white/10 rounded-3xl flex items-center p-6 gap-5 h-full transition-all duration-300 hover:border-[rgba(255,58,41,0.4)] hover:-translate-y-1">
              <div className="flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/Layer-26.png"
                  alt="Check Icon"
                  className="w-12 h-12 md:w-14 md:h-14 object-contain"
                />
              </div>
              <div className="flex flex-col justify-center">
                <h3 className="text-white font-medium text-[18px] md:text-[26px] leading-tight">
                  Remember who<br />you met
                </h3>
              </div>
            </div>

            {/* Item 3: Get Nudges */}
            <div className="bg-[#111111] border border-white/10 rounded-3xl flex items-center p-6 gap-5 h-full transition-all duration-300 hover:border-[rgba(255,58,41,0.4)] hover:-translate-y-1">
              <div className="flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/Layer-26.png"
                  alt="Check Icon"
                  className="w-12 h-12 md:w-14 md:h-14 object-contain"
                />
              </div>
              <div className="flex flex-col justify-center">
                <h3 className="text-white font-medium text-[18px] md:text-[26px] leading-tight">
                  Get nudges on<br />who to follow up
                </h3>
              </div>
            </div>

          </div>
        </div>
      </section>
