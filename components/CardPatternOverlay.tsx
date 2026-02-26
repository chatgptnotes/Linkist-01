'use client';

import React from 'react';

interface CardPatternOverlayProps {
  patternKey: string | null;
  colour?: string;
  className?: string;
}

interface PatternThumbnailProps {
  patternKey: string;
  isSelected: boolean;
  baseColor?: string;
  colour?: string;
}

// Map option_key to image filename in /public/
const PATTERN_IMAGES: Record<string, string> = {
  geometric: '/pattern-geometric.png',
  waves: '/pattern-waves.png',
  crystal: '/pattern-crystal.png',
};

// Separate images for dark backgrounds (black, cherry)
const PATTERN_IMAGES_DARK: Record<string, string> = {
  geometric: '/geometric_black.png',
  waves: '/waves_black.png',
  crystal: '/Crystal_black.png',
};

const DARK_COLOURS = ['black'];
const LIGHT_COLOURS = ['white', 'birch'];

function getPatternSrc(patternKey: string, colour?: string) {
  if (colour && DARK_COLOURS.includes(colour)) return PATTERN_IMAGES_DARK[patternKey];
  return PATTERN_IMAGES[patternKey];
}

function getBlendClass(colour?: string) {
  if (colour && DARK_COLOURS.includes(colour)) return 'opacity-60';
  if (colour && LIGHT_COLOURS.includes(colour)) return 'mix-blend-multiply opacity-40';
  return 'mix-blend-overlay opacity-60';
}

/* ------------------------------------------------------------------ */
/*  Full-size overlay for card preview                                */
/* ------------------------------------------------------------------ */

export function CardPatternOverlay({ patternKey, colour, className = '' }: CardPatternOverlayProps) {
  if (!patternKey || patternKey === 'none') return null;

  const src = getPatternSrc(patternKey, colour);
  if (!src) return null;

  return (
    <img
      src={src}
      alt=""
      className={`absolute inset-0 w-full h-full object-cover pointer-events-none ${getBlendClass(colour)} ${className}`}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Thumbnail for the pattern selection grid                          */
/* ------------------------------------------------------------------ */

export function PatternThumbnail({ patternKey, isSelected, baseColor, colour }: PatternThumbnailProps) {
  const bg = baseColor || '#374151';

  if (patternKey === 'none') {
    return (
      <div
        className="aspect-square rounded-lg flex items-center justify-center"
        style={{ backgroundColor: bg }}
      >
        <span className="text-white/60 text-xs font-medium">None</span>
      </div>
    );
  }

  const src = getPatternSrc(patternKey, colour);

  return (
    <div className="aspect-square rounded-lg overflow-hidden relative" style={{ backgroundColor: bg }}>
      {src && (
        <img
          src={src}
          alt=""
          className={`absolute inset-0 w-full h-full object-cover ${getBlendClass(colour)}`}
        />
      )}
    </div>
  );
}
