'use client';

import { useEffect, useState, useRef } from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  useAnimation,
  useDragControls,
  type PanInfo,
} from 'framer-motion';
import DragIndicator from './DragIndicator';
import { neuStyles } from './neumorphic';

interface BottomSheetCardProps {
  children: React.ReactNode;
}

export default function BottomSheetCard({ children }: BottomSheetCardProps) {
  const controls = useAnimation();
  const dragControls = useDragControls();
  const scrollRef = useRef<HTMLDivElement>(null);
  const isExpandedRef = useRef(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [windowHeight, setWindowHeight] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setWindowHeight(window.innerHeight);
    setMounted(true);
    const handleResize = () => setWindowHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Snap positions (y offset from top of viewport)
  const collapsedY = windowHeight * 0.48;
  const expandedY = windowHeight * 0.06;

  const y = useMotionValue(windowHeight);

  // Trigger initial slide-up animation once mounted and dimensions are ready
  useEffect(() => {
    if (mounted && windowHeight > 0) {
      controls.start({
        y: collapsedY,
        transition: { type: 'spring', damping: 30, stiffness: 200, delay: 0.3 },
      });
    }
  }, [mounted, windowHeight, collapsedY, controls]);

  // Background overlay opacity increases as sheet goes up
  const overlayOpacity = useTransform(y, [expandedY, collapsedY], [0.4, 0]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const currentY = y.get();
    const velocity = info.velocity.y;
    const midpoint = (collapsedY + expandedY) / 2;
    const spring = { type: 'spring' as const, damping: 30, stiffness: 300 };

    if (velocity < -500) {
      controls.start({ y: expandedY, transition: spring });
      isExpandedRef.current = true;
      setIsExpanded(true);
    } else if (velocity > 500) {
      controls.start({ y: collapsedY, transition: spring });
      isExpandedRef.current = false;
      setIsExpanded(false);
    } else if (currentY < midpoint) {
      controls.start({ y: expandedY, transition: spring });
      isExpandedRef.current = true;
      setIsExpanded(true);
    } else {
      controls.start({ y: collapsedY, transition: spring });
      isExpandedRef.current = false;
      setIsExpanded(false);
    }
  };

  const expandSheet = () => {
    if (!isExpandedRef.current) {
      const spring = { type: 'spring' as const, damping: 30, stiffness: 300 };
      controls.start({ y: expandedY, transition: spring });
      isExpandedRef.current = true;
      setIsExpanded(true);
    }
  };

  const collapseSheet = () => {
    if (isExpandedRef.current) {
      const spring = { type: 'spring' as const, damping: 30, stiffness: 300 };
      controls.start({ y: collapsedY, transition: spring });
      isExpandedRef.current = false;
      setIsExpanded(false);
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }
  };

  const toggleExpand = () => {
    if (isExpanded) {
      collapseSheet();
    } else {
      expandSheet();
    }
  };

  // Handle wheel/scroll events on the content area
  const handleContentWheel = (e: React.WheelEvent) => {
    if (!isExpandedRef.current) {
      // Collapsed: any scroll should expand the sheet, not scroll content
      e.preventDefault();
      expandSheet();
    }
  };

  if (!mounted) return null;

  return (
    <>
      {/* Background overlay */}
      <motion.div
        className="fixed inset-0 bg-black pointer-events-none z-10 md:absolute"
        style={{ opacity: overlayOpacity }}
      />

      {/* Draggable sheet - glassmorphism */}
      <motion.div
        className="fixed left-0 right-0 z-20 md:absolute"
        style={{
          y,
          height: windowHeight * 1.2,
          ...neuStyles.sheet,
        }}
        drag="y"
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: expandedY, bottom: collapsedY }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        animate={controls}
        initial={false}
      >
        {/* Drag handle area - always draggable */}
        <motion.div
          onPointerDown={(e) => dragControls.start(e)}
          className="touch-none"
        >
          <DragIndicator isExpanded={isExpanded} onClick={toggleExpand} />
        </motion.div>

        {/* Scrollable content */}
        <div
          ref={scrollRef}
          className={`px-5 pb-24 ${isExpanded ? 'overflow-y-auto' : 'overflow-hidden'}`}
          onPointerDown={(e) => {
            // When collapsed, click-drag anywhere to expand
            if (!isExpanded) {
              dragControls.start(e);
            }
          }}
          onWheel={handleContentWheel}
          style={{
            maxHeight: windowHeight * 0.86,
            touchAction: isExpanded ? 'pan-y' : 'none',
            overscrollBehavior: 'contain',
          }}
        >
          {children}
        </div>
      </motion.div>
    </>
  );
}
