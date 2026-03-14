'use client';

interface AboutSectionProps {
  summary?: string;
}

export default function AboutSection({ summary }: AboutSectionProps) {
  if (!summary) return null;

  return (
    <div className="mb-6">
      {/* Fading dotted separator — thick on left, fades to right */}
      <div
        className="mb-5 h-[2px]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,1) 1.5px, transparent 1.5px)',
          backgroundSize: '8px 2px',
          backgroundRepeat: 'repeat-x',
          maskImage: 'linear-gradient(to right, white 0%, transparent 85%)',
          WebkitMaskImage: 'linear-gradient(to right, white 0%, transparent 85%)',
        }}
      />
      <h3
        className="text-white mb-3"
        style={{
          fontFamily: 'var(--font-inter), Inter, sans-serif',
          fontWeight: 600,
          fontSize: '20.37px',
          lineHeight: '24.44px',
          letterSpacing: '0%',
        }}
      >
        About Me
      </h3>
      <p
        className="text-white/75"
        style={{
          fontFamily: 'var(--font-inter), Inter, sans-serif',
          fontWeight: 400,
          fontSize: '16.29px',
          lineHeight: '26.48px',
          letterSpacing: '1%',
        }}
      >
        {summary}
      </p>
    </div>
  );
}
