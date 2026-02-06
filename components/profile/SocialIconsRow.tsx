'use client';

import LinkedInIcon from '@mui/icons-material/LinkedIn';
import InstagramIcon from '@mui/icons-material/Instagram';
import FacebookIcon from '@mui/icons-material/Facebook';
import XIcon from '@mui/icons-material/X';
import GitHubIcon from '@mui/icons-material/GitHub';
import YouTubeIcon from '@mui/icons-material/YouTube';
import BrushIcon from '@mui/icons-material/Brush';
import SportsBasketballIcon from '@mui/icons-material/SportsBasketball';
import type { SocialLink } from './types';
import { neuStyles } from './neumorphic';

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

interface SocialIconsRowProps {
  links: SocialLink[];
}

export default function SocialIconsRow({ links }: SocialIconsRowProps) {
  if (links.length === 0) return null;

  return (
    <div className="flex items-center gap-3 mb-6">
      {links.map((link) => {
        const Icon = ICON_MAP[link.type];
        if (!Icon) return null;
        return (
          <a
            key={link.type}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-transform active:scale-90"
            style={neuStyles.redIconCircle}
            title={link.label}
          >
            <Icon className="w-5 h-5 text-white" />
          </a>
        );
      })}
    </div>
  );
}
