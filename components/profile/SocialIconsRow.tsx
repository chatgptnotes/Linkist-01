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

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
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
    <div className="flex flex-wrap items-center gap-3 mb-6">
      {links.map((link) => {
        const Icon = ICON_MAP[link.type];
        if (!Icon) return null;
        return (
          <a
            key={link.type}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 transition-all active:scale-90 hover:scale-105"
            title={link.label}
          >
            <Icon style={{ width: '36px', height: '36px', color: '#DC2626' }} />
          </a>
        );
      })}
    </div>
  );
}
