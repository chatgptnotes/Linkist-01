'use client';

import { overlayStyles } from './overlay-tokens';

interface OverlayAboutSectionProps {
  summary?: string;
}

export default function OverlayAboutSection({ summary }: OverlayAboutSectionProps) {
  if (!summary) return null;

  return (
    <div className="mb-6">
      {/* Dashed divider */}
      <div className="border-t border-dashed border-white/20 mb-5" />

      <h3
        className="text-center mb-3"
        style={{
          fontFamily: 'var(--font-playfair), Playfair Display, serif',
          fontWeight: 600,
          fontSize: '22px',
          lineHeight: '28px',
          color: '#ffffff',
        }}
      >
        About Me
      </h3>
      <p
        className="text-white/75 text-center"
        style={{
          fontFamily: 'var(--font-inter), Inter, sans-serif',
          fontWeight: 400,
          fontSize: '15px',
          lineHeight: '24px',
          letterSpacing: '0.3px',
        }}
      >
        {summary}
      </p>
    </div>
  );
}
