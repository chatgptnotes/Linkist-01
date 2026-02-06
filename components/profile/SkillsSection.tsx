'use client';

import { neuStyles } from './neumorphic';

interface SkillsSectionProps {
  skills: string[];
}

export default function SkillsSection({ skills }: SkillsSectionProps) {
  if (skills.length === 0) return null;

  return (
    <div className="mb-6">
      <h3
        className="text-white mb-4"
        style={{
          fontFamily: 'var(--font-inter), Inter, sans-serif',
          fontWeight: 600,
          fontSize: '20.37px',
          lineHeight: '24.44px',
          letterSpacing: '0%',
        }}
      >
        Skills and Expertise
      </h3>
      <div className="flex flex-wrap gap-2.5">
        {skills.map((skill, index) => (
          <span
            key={index}
            className="px-4 py-2 text-sm text-white/80 font-medium"
            style={neuStyles.skillTag}
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
}
