'use client';

import type { NormalizedProfileData } from '../types';
import type { ThemeId } from './index';
import ProfileBackground from '../ProfileBackground';
import BottomSheetCard from '../BottomSheetCard';
import ProfileHeader from '../ProfileHeader';
import ActionButtons from '../ActionButtons';
import SocialIconsRow from '../SocialIconsRow';
import AboutSection from '../AboutSection';
import ContactInfoSection from '../ContactInfoSection';
import SkillsSection from '../SkillsSection';
import OverlayProfile from './overlay/OverlayProfile';

interface ThemeRendererProps {
  data: NormalizedProfileData;
  themeId: ThemeId;
  onShare: () => void;
  onSaveContact: () => void;
  extraActions?: Array<{ label: string; icon: React.ComponentType<{ className?: string }>; onClick: () => void }>;
  children?: React.ReactNode;
}

export default function ThemeRenderer({
  data,
  themeId,
  onShare,
  onSaveContact,
  extraActions,
  children,
}: ThemeRendererProps) {
  if (themeId === 'overlay') {
    return (
      <OverlayProfile
        data={data}
        onShare={onShare}
        onSaveContact={onSaveContact}
        extraActions={extraActions}
      >
        {children}
      </OverlayProfile>
    );
  }

  // Default: bottom-sheet theme (Theme 1)
  return (
    <>
      <ProfileBackground
        profilePhoto={data.profilePhoto}
        backgroundImage={data.backgroundImage}
        firstName={data.firstName}
        lastName={data.lastName}
      />

      <BottomSheetCard>
        {/* Action buttons right-aligned, then name below */}
        <div className="flex justify-end mb-3">
          <ActionButtons onShare={onShare} onSaveContact={onSaveContact} extraActions={extraActions} />
        </div>
        <ProfileHeader data={data} />
        <SocialIconsRow links={data.socialLinks} />
        <AboutSection summary={data.professionalSummary} />
        <ContactInfoSection items={data.contactItems} />
        <SkillsSection skills={data.skills} />
        {children}
      </BottomSheetCard>
    </>
  );
}
