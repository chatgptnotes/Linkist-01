'use client';

import type { NormalizedProfileData } from '../../types';
import OverlayBackground from './OverlayBackground';
import OverlayHeader from './OverlayHeader';
import OverlaySocialIcons from './OverlaySocialIcons';
import OverlayAboutSection from './OverlayAboutSection';
import OverlayContactSection from './OverlayContactSection';
import OverlaySkillsSection from './OverlaySkillsSection';
import ActionButtons from '../../ActionButtons';

interface OverlayProfileProps {
  data: NormalizedProfileData;
  onShare: () => void;
  onSaveContact: () => void;
  extraActions?: Array<{ label: string; icon: React.ComponentType<{ className?: string }>; onClick: () => void }>;
  children?: React.ReactNode;
}

export default function OverlayProfile({
  data,
  onShare,
  onSaveContact,
  extraActions,
  children,
}: OverlayProfileProps) {
  return (
    <>
      {/* Full-screen background with red gradient */}
      <OverlayBackground
        profilePhoto={data.profilePhoto}
        backgroundImage={data.backgroundImage}
        firstName={data.firstName}
        lastName={data.lastName}
      />

      {/* Main scrollable content area */}
      <div className="relative z-20 min-h-screen flex flex-col">
        {/* Spacer to push content below the photo visible area — kept transparent so photo shows through */}
        <div className="flex-shrink-0" style={{ height: '42vh' }} />

        {/* Action buttons (top right, floating) */}
        <div className="absolute top-4 right-4 z-30">
          <ActionButtons onShare={onShare} onSaveContact={onSaveContact} extraActions={extraActions} />
        </div>

        {/* Content — solid dark background so glass cards blur against dark, not the white body */}
        <div className="px-5 pb-24" style={{ backgroundColor: 'rgb(25, 0, 0)' }}>
          <OverlayHeader data={data} />
          <OverlaySocialIcons links={data.socialLinks} />
          <OverlayAboutSection summary={data.professionalSummary} />
          <OverlayContactSection items={data.contactItems} />
          <OverlaySkillsSection skills={data.skills} />

          {/* Page-specific content (certifications, services, etc.) */}
          {children}
        </div>
      </div>
    </>
  );
}
