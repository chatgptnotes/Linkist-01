'use client';

import CodeIcon from '@mui/icons-material/Code';
import SportsFootballIcon from '@mui/icons-material/SportsSoccer';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import BrushIcon from '@mui/icons-material/Brush';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import { overlayStyles } from './overlay-tokens';

// Predefined positions for floating badges (percentage-based)
const BADGE_POSITIONS = [
  { top: '8%', left: '5%', rotate: '-3deg' },
  { top: '5%', right: '8%', rotate: '2deg' },
  { top: '28%', right: '3%', rotate: '4deg' },
  { top: '38%', left: '50%', transform: 'translateX(-50%)', rotate: '0deg' },
  { top: '18%', left: '2%', rotate: '-2deg' },
  { top: '15%', right: '5%', rotate: '3deg' },
];

// Map common skill keywords to icons
const SKILL_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  coding: CodeIcon,
  code: CodeIcon,
  programming: CodeIcon,
  development: CodeIcon,
  developer: CodeIcon,
  football: SportsFootballIcon,
  soccer: SportsFootballIcon,
  sports: SportsFootballIcon,
  gaming: SportsEsportsIcon,
  games: SportsEsportsIcon,
  singing: MusicNoteIcon,
  music: MusicNoteIcon,
  art: BrushIcon,
  design: BrushIcon,
  photography: CameraAltIcon,
  fitness: FitnessCenterIcon,
  gym: FitnessCenterIcon,
  reading: AutoStoriesIcon,
  writing: AutoStoriesIcon,
};

function getSkillIcon(skill: string): React.ComponentType<{ className?: string }> | null {
  const lower = skill.toLowerCase();
  for (const [keyword, icon] of Object.entries(SKILL_ICON_MAP)) {
    if (lower.includes(keyword)) return icon;
  }
  return null;
}

interface OverlaySkillBadgesProps {
  skills: string[];
}

export default function OverlaySkillBadges({ skills }: OverlaySkillBadgesProps) {
  if (skills.length === 0) return null;

  // Show max 6 floating badges
  const visibleSkills = skills.slice(0, Math.min(skills.length, BADGE_POSITIONS.length));

  return (
    <div className="absolute inset-0 z-10 pointer-events-none" style={{ height: '55vh' }}>
      {visibleSkills.map((skill, index) => {
        const pos = BADGE_POSITIONS[index];
        const Icon = getSkillIcon(skill);
        const { rotate, transform: extraTransform, ...positionStyles } = pos;

        return (
          <div
            key={index}
            className="absolute pointer-events-auto"
            style={{
              ...positionStyles,
              transform: `rotate(${rotate})${extraTransform ? ` ${extraTransform}` : ''}`,
            }}
          >
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 text-white text-sm font-medium"
              style={overlayStyles.frostedPill}
            >
              {Icon && <Icon className="w-4 h-4 text-white" />}
              <span>{skill}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
