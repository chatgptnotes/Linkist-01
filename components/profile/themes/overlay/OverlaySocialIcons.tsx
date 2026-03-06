'use client';

import LinkedInIcon from '@mui/icons-material/LinkedIn';
import InstagramIcon from '@mui/icons-material/Instagram';
import FacebookIcon from '@mui/icons-material/Facebook';
import XIcon from '@mui/icons-material/X';
import GitHubIcon from '@mui/icons-material/GitHub';
import YouTubeIcon from '@mui/icons-material/YouTube';
import BrushIcon from '@mui/icons-material/Brush';
import SportsBasketballIcon from '@mui/icons-material/SportsBasketball';
import type { SocialLink } from '../../types';
import { overlayStyles } from './overlay-tokens';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  linkedin: LinkedInIcon,
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  twitter: XIcon,
  github: GitHubIcon,
  youtube: YouTubeIcon,
  behance: BrushIcon,
  dribbble: SportsBasketballIcon,
};

interface OverlaySocialIconsProps {
  links: SocialLink[];
}

export default function OverlaySocialIcons({ links }: OverlaySocialIconsProps) {
  if (links.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
      {links.map((link) => {
        const Icon = ICON_MAP[link.type];
        if (!Icon) return null;
        return (
          <a
            key={link.type}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 transition-transform active:scale-90"
            style={overlayStyles.frostedSquare}
            title={link.label}
          >
            <Icon className="w-6 h-6 text-white" />
          </a>
        );
      })}
    </div>
  );
}
