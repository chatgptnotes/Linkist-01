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
    <div className="fixed inset-0 z-0">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="Profile"
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-purple-600 via-blue-500 to-teal-400 flex items-center justify-center">
          <span className="text-8xl font-bold text-white/30">
            {firstName?.[0]}{lastName?.[0]}
          </span>
        </div>
      )}
      {/* Gradient fade at bottom to blend with white sheet */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/20 to-transparent" />
    </div>
  );
}
