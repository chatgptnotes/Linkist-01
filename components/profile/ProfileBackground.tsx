'use client';

interface ProfileBackgroundProps {
  profilePhoto?: string | null;
  backgroundImage?: string | null;
  firstName?: string;
  lastName?: string;
}

export default function ProfileBackground({
  profilePhoto,
  backgroundImage,
  firstName,
  lastName,
}: ProfileBackgroundProps) {
  const imageUrl = profilePhoto || backgroundImage;

  return (
    <div className="fixed inset-0 z-0 bg-black md:absolute">
      {/* Full-screen hero image — face stays visible above sheet */}
      <div className="absolute inset-0">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Profile"
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-600 via-blue-500 to-teal-400 flex items-center justify-center">
            <span className="text-8xl font-bold text-white/30">
              {firstName?.[0]}{lastName?.[0]}
            </span>
          </div>
        )}
        {/* Subtle vignette at bottom for readability */}
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      </div>
    </div>
  );
}
