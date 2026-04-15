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
      {/* Full-screen background */}
      <OverlayBackground
        profilePhoto={data.profilePhoto}
        backgroundImage={data.backgroundImage}
        firstName={data.firstName}
        lastName={data.lastName}
      />

      {/* Glass fade layer — starts from bottom, fades to 0 at 50% height */}
      <div
        className="fixed inset-0 z-10 pointer-events-none md:absolute"
        style={{
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          background: 'linear-gradient(to top, rgba(10,0,0,0.4) 0%, transparent 50%)',
          WebkitMaskImage: 'linear-gradient(to top, black 0%, transparent 50%)',
          maskImage: 'linear-gradient(to top, black 0%, transparent 50%)',
        }}
      />

      {/* Main scrollable content area — no background, sits above the glass layer */}
      <div className="relative z-20 min-h-screen flex flex-col">
        {/* Spacer so photo is visible above content */}
        <div className="flex-shrink-0" style={{ height: '42vh' }} />

        {/* Action buttons (top right, floating) */}
        <div className="absolute top-4 right-4 z-30">
          <ActionButtons onShare={onShare} onSaveContact={onSaveContact} extraActions={extraActions} />
        </div>

        {/* Content — no background, glass layer behind handles the effect */}
        <div className="px-5 pb-24">
          <OverlayHeader data={data} />
          <OverlaySocialIcons links={data.socialLinks} />
          <OverlayAboutSection summary={data.professionalSummary} />
          <OverlayContactSection items={data.contactItems} />
          <OverlaySkillsSection skills={data.skills} />

          {children}
        </div>
      </div>
    </>
  );
}
