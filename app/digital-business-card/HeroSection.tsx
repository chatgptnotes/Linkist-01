'use client';

import { useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

export default function HeroSection() {
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

    const progress = 1 - Math.abs(distance) / (range / 2);
    return Math.max(0, Math.min(1, progress));
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    const wrapper = wrapperRef.current;
    if (!scene || !wrapper) return;

    resizeScene();
    const resizeTimeout = setTimeout(resizeScene, 100);

    window.addEventListener('resize', resizeScene);

    const handleMouseEnter = () => { isHoveringRef.current = true; };
    const handleMouseLeave = () => { isHoveringRef.current = false; };
    scene.addEventListener('mouseenter', handleMouseEnter);
    scene.addEventListener('mouseleave', handleMouseLeave);

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
    <section className="min-h-screen flex items-center justify-center relative overflow-visible">
      {/* Background */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
        {/* Mobile background image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/new-bg-micro-mobile.jpg"
          alt=""
          className="block lg:hidden w-full h-full object-cover"
        />
        {/* Desktop background gradient (restored) */}
        <div
          className="hidden lg:block w-full h-full absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(255,58,41,0.35) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 20% 80%, rgba(255,58,41,0.15) 0%, transparent 50%)',
          }}
        />
      </div>

      {/* Main Content Grid */}
      <div className="relative z-10 w-full lg:w-[75vw] lg:max-w-none mx-auto px-6 py-0">
        <div className="grid grid-cols-1 lg:grid-cols-[65%_35%] gap-12 lg:gap-8 items-center">
          {/* LEFT COLUMN */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-5 relative z-20">

            {/* Mobile H1 */}
            <h1
              className="lg:hidden text-[36px] leading-[36px] min-[450px]:text-[35px] min-[450px]:leading-[38px] font-semibold tracking-[-0.04em] hero-title-gradient"
            >
              Tap the smartest<br />
              card now.<br />
              <span className="block mt-1">and unlock tomorrow!</span>
            </h1>

            {/* Desktop H1 */}
            <h1
              className="hidden lg:block text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight"
              style={{
                backgroundImage: 'linear-gradient(170.76deg, #09090B -49.89%, #F2F2FC 93.32%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Tap the smartest <br />
              card now.
              <span className="block mt-1 pb-2">
                and unlock tomorrow!
              </span>
            </h1>

            <p className="text-[16px] md:text-[20px] text-[#A3A3A3] leading-relaxed max-w-md md:max-w-xl mx-auto lg:mx-0">
              The Linkist Smart Card is your entry into the Linkist PRM ecosystem. Start
              with a unique personal URL, smart profile and NFC business card today. Grow
              into personal relationship intelligence over time.
            </p>
            <div className="flex flex-row items-center justify-center lg:justify-start gap-6 w-full relative z-20">
              <Link
                href="#pricing"
                className="text-[#FF3A29] text-sm md:text-base font-medium underline underline-offset-4 hover:text-white transition-colors"
                style={{ color: '#FF3A29' }}
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
  );
}
