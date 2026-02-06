'use client';

interface AboutSectionProps {
  summary?: string;
}

export default function AboutSection({ summary }: AboutSectionProps) {
  if (!summary) return null;

  return (
    <div className="mb-6">
      {/* Dotted separator */}
      <div className="border-t border-dashed border-white/20 mb-5" />
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
