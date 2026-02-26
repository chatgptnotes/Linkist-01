'use client';

import { overlayStyles } from './overlay-tokens';

interface OverlaySkillsSectionProps {
  skills: string[];
}

export default function OverlaySkillsSection({ skills }: OverlaySkillsSectionProps) {
  if (skills.length === 0) return null;

  return (
    <div className="mb-6">
      <h3
        className="text-center mb-4"
        style={{
          fontFamily: 'var(--font-playfair), Playfair Display, serif',
          fontWeight: 600,
          fontSize: '22px',
          lineHeight: '28px',
          color: '#ffffff',
        }}
      >
        Skills
      </h3>
      <div className="flex flex-wrap justify-center gap-2.5">
        {skills.map((skill, index) => (
          <span
            key={index}
            className="px-4 py-2 text-sm text-white/80 font-medium"
            style={overlayStyles.frostedPill}
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
}
