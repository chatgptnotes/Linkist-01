'use client';

import { overlayStyles } from './overlay-tokens';

interface OverlayBackgroundProps {
  profilePhoto?: string | null;
  backgroundImage?: string | null;
  firstName?: string;
  lastName?: string;
}

export default function OverlayBackground({
  profilePhoto,
  backgroundImage,
  firstName,
  lastName,
}: OverlayBackgroundProps) {
  const imageUrl = profilePhoto || backgroundImage;

  return (
    <div
      className="fixed top-0 left-0 w-full z-0 bg-black overflow-hidden md:absolute md:inset-0 md:h-auto"
      style={{ height: '100lvh' }}
    >
      {/* Full-screen photo */}
      <div className="absolute inset-0">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Profile"
            className="w-full h-full object-cover object-center"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-600 via-blue-500 to-teal-400 flex items-center justify-center">
            <span className="text-8xl font-bold text-white/30">
              {firstName?.[0]}{lastName?.[0]}
            </span>
          </div>
        )}
      </div>

      {/* Heavy red-to-dark gradient overlay from bottom */}
      <div className="absolute inset-0" style={overlayStyles.gradient} />
    </div>
  );
}
